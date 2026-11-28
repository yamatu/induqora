---
title: Rust Async Modbus Gateways: TCP, RTU and RS-485 Timing
slug: rust-modbus-tokio-async-rs485-gateway-guide
type: BLOG
category: iiot-edge
author: edward
tags: Modbus TCP, IIoT, Motion control
publishedAt: 2026-11-28T02:21:00Z
excerpt: Writing a Modbus client is easy; writing one that survives a real RS-485 bus is not. This guide covers half-duplex turnaround timing, per-slave serialisation, word-order decoding and reconnect behaviour using tokio-modbus 0.17 with the signatures verified against the crate source.
seoTitle: Rust Modbus TCP and RS-485 Async Gateways
seoDescription: Build a tokio-modbus gateway that handles RS-485 turnaround delay, per-slave serialisation, ABCD word order and watchdog reconnects with real Rust code.
coverImage: /media/2026/11/cover-rust-modbus-tokio-async-rs485-gateway-guide.jpg
coverAlt: Technical editorial illustration of a Rust Modbus gateway polling several RS-485 slaves through a single serialised request queue
coverCaption: A Modbus gateway is not a protocol translator. It is a scheduler that owns one wire.
---
A Modbus gateway written in Rust is a three-line program in a tutorial and a scheduling problem in a plant. The protocol is simple enough that almost anyone can parse a frame; the failures that stop production are queue collisions on a half-duplex wire, word-order mistakes on 32-bit values, and a reconnect path that silently dies after the first CRC error. `tokio-modbus` 0.17 gives you the framing, the CRC and the async plumbing. It does not give you the scheduler, and that is where the engineering lives.

This guide works through the parts that decide whether a gateway survives a year on a machine tool network. Every function signature below was taken from the published crate source, not from memory.

## What tokio-modbus actually provides

The crate splits into a client, a server and a codec layer. For a gateway you want the client, and in 0.17 the entry points are concrete functions rather than the trait-object style older tutorials show:

| What you need | Function | Signature |
| --- | --- | --- |
| Modbus TCP, unit id 1 | `tcp::connect_slave` | `async fn(SocketAddr, Slave) -> io::Result<Context>` |
| Modbus TCP, any unit id | `tcp::connect` | `async fn(SocketAddr) -> io::Result<Context>` |
| RTU over an existing serial stream | `rtu::attach_slave` | `fn(T, Slave) -> Context` |
| RTU over any transport | `rtu::attach` | `fn(T) -> Context` |

The read/write methods come from the `Reader` and `Writer` traits, which the prelude re-exports:

```rust
async fn read_input_registers(&mut self, addr: Address, cnt: Quantity)
    -> Result<Vec<Word>>;
async fn read_holding_registers(&mut self, addr: Address, cnt: Quantity)
    -> Result<Vec<Word>>;
```

`Address`, `Quantity` and `Word` are all `u16`, so a register count larger than 125 is rejected by the protocol rather than by your code — worth knowing before you write a helper that requests 500 registers at once and wonders why the slave answers with an exception.

## The RTU half-duplex problem nobody mentions in the README

RS-485 is a two-wire bus. Every device shares one pair, and a transceiver can talk or listen but not both. On a USB-to-RS-485 adapter the driver raises RTS to enable the transmitter, sends, and drops RTS to release the line. The gap between the last stop bit leaving the wire and the line actually being released is the turnaround time, and it is measured in hundreds of microseconds on cheap adapters — not nanoseconds.

![Diagram of a Modbus RS-485 gateway: three pollers for a flow meter at 200 milliseconds, a drive at 500 milliseconds and an energy meter at 2 seconds feeding a bounded mpsc queue, consumed by a single owner task that opens the port, attaches the slave, reads with a 500 millisecond cap and sleeps for the 3.5 character silent interval, connected to a half-duplex RS-485 segment with a practical ceiling of 60 requests per second](/media/2026/11/diagram-rust-modbus-tokio-async-rs485-gateway-guide.png "Figure 1: The queue is what turns a dead slave into a timeout instead of a stalled bus. Two tasks writing one port lose both frames.")

Two consequences follow, and both cause production bugs:

- **You cannot pipeline requests.** If slave 3 takes 40 ms to answer and you fire a request at slave 4 after 10 ms, both replies collide. Every request to a given port must be serialised, regardless of how many slaves exist.
- **The inter-frame silent interval is a protocol requirement.** Modbus RTU requires at least 3.5 character times of silence between frames. At 9600 baud with 11 bits per character that is about 4 ms; at 115200 it rounds up to roughly 1.75 ms because the specification sets a fixed floor for speeds above 19200.

A purely asynchronous design that spawns one task per slave looks elegant and fails the first time two tasks write to the same port. The fix is a single owner task per physical port with an `mpsc` channel in front of it:

```rust
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_serial::SerialStream;
use tokio_modbus::prelude::*;

struct PollRequest {
    // Slave is a newtype over u8 with From<u8>, so callers can pass 3.into().
    slave: Slave,
    addr: u16,
    count: u16,
    reply: tokio::sync::oneshot::Sender<Result<Vec<u16>, String>>,
}

/// One task owns the wire. Nothing else may touch the port.
async fn rtu_owner(
    port: String,
    mut rx: mpsc::Receiver<PollRequest>,
    frame_gap: Duration,
) {
    // SerialStream must be configured 8E1 (or 8N1) with the adapter's own
    // turnaround handled by the driver, not by sleeping after every write.
    let builder = tokio_serial::new(&port, 19200);

    loop {
        let Some(req) = rx.recv().await else { break };

        // Reconnect lazily: an unplugged adapter must not kill the task.
        let stream = match SerialStream::open(&builder) {
            Ok(s) => s,
            Err(e) => {
                let _ = req.reply.send(Err(format!("open {port}: {e}")));
                tokio::time::sleep(Duration::from_secs(1)).await;
                continue;
            }
        };

        // attach_slave takes the transport by value and the Slave newtype.
        let mut ctx = rtu::attach_slave(stream, req.slave);
        let result = tokio::time::timeout(
            Duration::from_millis(500),
            ctx.read_holding_registers(req.addr, req.count),
        )
        .await;

        let mapped = match result {
            Ok(Ok(words)) => Ok(words),
            Ok(Err(e)) => Err(format!("slave {}: {e}", req.slave)),
            Err(_) => Err(format!("slave {} timed out", req.slave)),
        };
        let _ = req.reply.send(mapped);

        // Honour the 3.5-character silent interval before the next frame.
        tokio::time::sleep(frame_gap).await;
    }
}
```

Two details in that sketch matter more than the code. First, the port is reopened per request. That looks wasteful, but it means a USB adapter that re-enumerates after an ESD event recovers without restarting the process — and at 19200 baud the open cost is invisible next to the frame time. Second, the timeout wraps the request, not the whole task, so one dead slave returns an error to its caller instead of stalling the queue.

If you prefer to hold the port open, keep the same single-owner structure and only reopen on `Err` from the context. Either works; the invariant that must not break is *one writer per port*.

## Word order: the bug that survives every test

A 32-bit value occupies two Modbus registers. Which register comes first is not defined by the protocol — the device manual defines it, and vendors disagree. The four common layouts are usually named after the byte sequence of a 32-bit float:

| Name | Register order | Byte order in each register |
| --- | --- | --- |
| ABCD | high word first | big endian |
| CDAB | low word first | big endian |
| BADC | high word first | little endian |
| DCBA | low word first | little endian |

The failure mode is nasty because it is silent. A value of 1234.5 read with the wrong order does not error; it produces a plausible-looking number, and the trend graph looks fine until someone compares it against the local display.

Do not leave this to a runtime flag. Encode it in the type that reads the register pair, so the compiler forces you to state the layout at every call site:

```rust
#[derive(Clone, Copy)]
enum WordOrder { Abcd, Cdab, Badc, Dcba }

fn f32_from(regs: &[u16], order: WordOrder) -> f32 {
    let (a, b) = (regs[0], regs[1]);
    let bytes = match order {
        WordOrder::Abcd => [a >> 8, a & 0xff, b >> 8, b & 0xff],
        WordOrder::Cdab => [b >> 8, b & 0xff, a >> 8, a & 0xff],
        WordOrder::Badc => [a as u8, a >> 8, b as u8, b >> 8],
        WordOrder::Dcba => [b as u8, b >> 8, a as u8, a >> 8],
    };
    f32::from_be_bytes(bytes)
}
```

For energy meters and drives, the same problem appears on 64-bit totals: four registers, 24 possible permutations, and a documented order in a manual that nobody reads until the billing report is wrong by a factor of 65536.

## Scheduling a bus with mixed response times

Real RS-485 segments contain devices that all answer at different speeds. A flow meter replies in 8 ms; a 1990s drive replies in 120 ms. If you poll them round-robin, the fast device is stuck behind the slow one and its data arrives at the slow device's rate.

The practical arrangement is to schedule by deadline rather than by rotation. Each tag carries a period, the scheduler keeps a min-heap of due times, and the owner task requests work from that heap:

- Give fast-changing values (flow, position) a 200 ms period.
- Give slow process values (temperature, tank level) a 2 s period.
- Never give anything a period shorter than its own round-trip time plus the frame gap, or the queue grows without bound.

On a 19200 baud segment a 12-register read costs roughly 15 ms of wire time including turnaround. That puts a practical ceiling near 60 requests per second on the segment, which is the number to design against — not the throughput of your CPU.

One further trap: many gateways report a communications failure by returning the last known value. That is defensible for a trend, indefensible for a control decision. Mark every value with a quality flag and a timestamp taken at the moment of the reply, and let the consumer decide whether stale data is acceptable.

## Health and reconnection

The gateway will spend its life on a network where devices are switched off, cables are cut and adapters are unplugged. Three counters tell you more than any log line:

| Counter | Meaning | Action threshold |
| --- | --- | --- |
| Timeout rate per slave | No reply within the configured window | Sustained > 1 % means a wiring or address problem |
| CRC / framing errors | Electrical noise or wrong baud/parity | Any steady rate is a fault, not a statistic |
| Exception responses | Slave rejected the request | Illegal data address usually means a wrong register map |

Expose them over your own interface — a small HTTP endpoint, MQTT, or an OPC UA node set — and alarm on rate rather than on absolute count. A single timeout after a plant-wide power dip is normal. Ten per minute on one slave is a cable.

## Where this design does not belong

A gateway that owns a wire and polls on a schedule is a supervisory tool. It is not a safety function and it is not a substitute for deterministic fieldbus: safety devices belong on a certified network with a certified protocol, and interlock logic belongs in a safety controller, not in a Rust task with a timeout. If a machine's protection depends on a value arriving, the value must not travel through an application-level poll.

`tokio-modbus` is also the wrong layer for anything that needs sub-millisecond jitter. Modbus RTU at 19200 baud has a frame time measured in milliseconds; if your control loop needs better than that, you are using the wrong protocol, and no amount of Rust will change the wire.

=== takeaways
A Modbus gateway's hard problem is ownership of a half-duplex wire, not frame parsing — one task per port with an mpsc channel in front of it is the structure that survives.
tokio-modbus 0.17 exposes tcp::connect_slave, rtu::attach_slave and the Reader/Writer traits; register counts above 125 are rejected by the protocol itself.
The 3.5-character silent interval and the adapter's turnaround delay dominate timing at 19200 baud, where a 12-register read costs about 15 ms of wire time.
Word order is defined per device, not by the protocol: encode ABCD/CDAB/BADC/DCBA in the type that reads the pair so the compiler forces a decision at every call site.
Schedule by deadline rather than round-robin when a segment mixes an 8 ms flow meter with a 120 ms legacy drive.
Sustained timeout rate, CRC errors and exception responses are the three counters worth alarming on; a single timeout after a power dip is not a fault.

=== faqs
Q: Is tokio-modbus production-ready for a plant gateway?
A: The framing and codec layers are mature and the API is stable at 0.17. What you own is the scheduling, the reconnect policy and the data quality model, which the crate deliberately does not provide. Treat it as a protocol library, not a gateway.

Q: Should I open the serial port once or per request?
A: Either works if one task owns the port. Reopening per request costs almost nothing at 19200 baud and recovers automatically from USB adapters that re-enumerate after an electrical disturbance; holding it open is faster and needs an explicit reopen path on error.

Q: Why do my float values come out wrong on one device but not another?
A: Word order. The Modbus specification does not define whether the high or low register of a 32-bit value comes first, so each vendor chooses. Check the manual for the register pair and encode the order in your decoding type rather than in a global flag.

Q: Can I poll 30 slaves on one RS-485 segment?
A: You can address 247, but the wire is the limit. At 19200 baud, with turnaround and the silent interval, a segment realistically carries about 60 short requests per second. Split the segment or raise the baud rate before adding slaves.

Q: How do I know a value is fresh?
A: Timestamp it when the reply arrives and attach a quality flag. Never let a gateway return the last known value without marking it stale; a trend can tolerate that, a control decision cannot.

Q: Can this replace a safety-rated network?
A: No. Safety functions require certified devices and protocols with defined failure behaviour. An application-level poll over Modbus has no safety integrity claim and must never carry an interlock.

=== sources
Modbus Organization, *Modbus Application Protocol Specification V1.1b3*, 2012.
Modbus Organization, *Modbus over Serial Line Specification and Implementation Guide V1.02*, 2006.
tokio-modbus 0.17.0 source, docs.rs and crates.io.
TIA-485-A, *Electrical Characteristics of Generators and Receivers for Use in Balanced Digital Multipoint Systems*.
