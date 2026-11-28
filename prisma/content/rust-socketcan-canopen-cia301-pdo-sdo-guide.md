---
title: Rust SocketCAN for CANopen CiA 301 Controllers
slug: rust-socketcan-canopen-cia301-pdo-sdo-guide
type: BLOG
category: industrial-networking
author: edward
tags: Motion control, Industrial Ethernet, PLC programming
publishedAt: 2026-11-28T02:24:00Z
excerpt: CANopen looks simple until PDO mapping, heartbeat timing and SDO transfers collide on the same 250 kbit bus. This guide covers NMT state handling, TPDO/RPDO mapping arithmetic, SYNC-driven cycle timing, bus load limits and how to drive it all from Rust with socketcan.
seoTitle: Rust SocketCAN and CANopen CiA 301 Guide
seoDescription: Drive CANopen CiA 301 devices from Rust: NMT state handling, PDO mapping, SYNC timing, SDO transfers and bus load limits with socketcan.
coverImage: /media/2026/11/cover-rust-socketcan-canopen-cia301-pdo-sdo-guide.jpg
coverAlt: Technical editorial illustration of a CANopen bus with SYNC frames, PDO process data and a separate SDO configuration channel
coverCaption: PDOs carry the process. SDOs carry configuration. Confusing them is how a drive stops mid-cycle.
---
CANopen is a small protocol riding on a small bus, and both facts are why it is used on machines that must run for twenty years. It is also why it fails in ways that look like hardware faults: a drive that drops out of operational state, a torque command that arrives one cycle late, a parameter write that blocks the bus for 40 ms in the middle of a move. All three are configuration and scheduling problems, and all three are visible from a Rust program with `socketcan`.

This guide works through CiA 301 from the point of view of a controller that must keep a bus alive, not from the point of view of a protocol explanation.

## The two channels and why they must never mix

Every CANopen device exposes an object dictionary — a table of parameters indexed by a 16-bit index and an 8-bit sub-index. Two protocols read and write that table:

| Channel | Purpose | Identifier | Timing |
| --- | --- | --- | --- |
| SDO | Read/write any object by index | 0x600 + node / 0x580 + node | Request-response, can block |
| PDO | Exchange mapped process data | 0x180 + node / 0x200 + node (defaults) | Cyclic, synchronous or event-driven |
| NMT | Change device state | 0x000 | Broadcast or node-specific |
| SYNC | Trigger synchronous PDO exchange | 0x080 | Fixed period |
| Heartbeat | Prove the node is alive | 0x700 + node | Fixed period |

The rule that prevents most production incidents: **SDO traffic must not share a cycle with time-critical PDO traffic.** An SDO write of a large object uses segmented transfer, which is a sequence of request-response pairs, each of which waits for the device. On a 250 kbit bus a multi-segment SDO can occupy tens of milliseconds. If the drive is expecting PDOs at 2 ms during that window, it will either miss setpoints or trigger a communication watchdog.

Configure the device offline, or in pre-operational state, and never from the running cycle.

## Mapping arithmetic that decides your bus load

PDO mapping determines which objects are packed into each frame. The constraint is 8 bytes per CAN frame — classic CAN, not CAN FD — and that is a hard budget.

![CANopen bus load budget diagram: twelve nodes with three PDOs in each direction produce 72 frames per cycle occupying about 33 milliseconds of wire time at 250 kbit against a 2 millisecond cycle budget of four frame slots, marked as an arithmetic impossibility, with a panel showing the PDO and SDO channel split on one wire, the NMT state machine of pre-operational, operational and stopped, and the heartbeat rule that consumer timeout must be at least three producer periods](/media/2026/11/diagram-rust-socketcan-canopen-cia301-pdo-sdo-guide.png "Figure 1: No amount of Rust, priority tuning or driver work makes 33 ms of frames fit in a 2 ms slot. The mapping changes, or the cycle does.")

A typical drive with three RPDOs:

| PDO | Content | Bytes |
| --- | --- | --- |
| RPDO1 | Controlword (0x6040), target velocity (0x60FF) | 2 + 4 = 6 |
| RPDO2 | Modes of operation (0x6060), target torque (0x6071) | 1 + 2 = 3 |
| RPDO3 | Digital outputs (0x60FE sub 1) | 4 |

Each frame carries about 47 bits of overhead at standard arbitration, so an 8-byte payload occupies roughly 111 bits of bus time. At 250 kbit that is about 0.44 ms per frame including inter-frame space. A 12-node network with 3 PDOs each in both directions is 72 frames per cycle, which needs about 32 ms of bus time — so a 2 ms cycle on that configuration is arithmetic impossibility, not a tuning problem.

The bus load budget to design against:

| Bitrate | Bit time | 8-byte frame time | Frames per 10 ms at 50 % load |
| --- | --- | --- | --- |
| 1 Mbit | 1 µs | ~0.13 ms | ~38 |
| 500 kbit | 2 µs | ~0.25 ms | ~19 |
| 250 kbit | 4 µs | ~0.46 ms | ~10 |
| 125 kbit | 8 µs | ~0.9 ms | ~5 |

Keep sustained bus load below about 50 % and you retain headroom for SDO diagnostics, heartbeat and error frames. Above 70 %, error frames from a single faulty node can push the bus into error-passive behaviour and the whole network degrades at once.

## NMT and the state machine that stops machines

Every device follows the same state machine: Initialising, Pre-operational, Operational, Stopped. The transitions matter:

- **Pre-operational**: SDO works, PDO does not. This is where configuration belongs.
- **Operational**: PDO works. Configuration can still be done, but should not be.
- **Stopped**: only NMT and heartbeat work.

A device that silently returns to Pre-operational stops accepting PDOs and, depending on the drive, may drop its output stage. The usual cause is a heartbeat or node-guarding timeout: the controller stopped sending heartbeats for longer than the consumer's timeout, and the consumer decided the network was dead.

Two design decisions follow:

1. **Heartbeat producer period and consumer timeout must satisfy `timeout ≥ 3 × producer period`.** A 100 ms producer with a 300 ms timeout survives two lost frames. A 100 ms producer with a 100 ms timeout fails on the first lost frame, which happens on every bus with any EMI.
2. **Startup must be sequenced.** Sending NMT Start to all nodes at once floods the bus with boot-up messages and the transition responses collide. Start nodes one at a time with a short delay, or use a staggered schedule.

## Driving it from Rust

The `socketcan` crate 4.0 exposes the raw CAN interface; CANopen framing is your code. That is appropriate, because the CiA 301 frame layouts are short and stable.

```rust
use socketcan::{CanFrame, StandardId, EmbeddedFrame};

/// NMT: set one node to operational. Payload is [command, node id].
fn nmt_start(node: u8) -> CanFrame {
    // StandardId::new returns Option<StandardId>; 0x000 is always valid.
    let id = StandardId::new(0x000).expect("valid 11-bit id");
    CanFrame::new(id, &[0x01, node]).expect("2-byte payload fits")
}

/// SYNC: zero-length frame on COB-ID 0x080.
fn sync() -> CanFrame {
    CanFrame::new(StandardId::new(0x080).unwrap(), &[]).expect("empty payload")
}

/// Decode a statusword (0x6041) from TPDO1 — little endian per CiA 301.
fn statusword(frame: &CanFrame) -> Option<u16> {
    let d = frame.data();
    (d.len() >= 2).then(|| u16::from_le_bytes([d[0], d[1]]))
}

// The tokio wrapper implements Stream for received frames and write_frame for TX.
// socket_tx.write_frame(sync()).await?;
```

With `socketcan::tokio::CanSocket` the cycle becomes a select over the socket and a timer, and the same zero-allocation discipline applies as on any real-time bus: no formatting, no logging and no `Vec` growth in the cycle body.

Two practical notes from the crate source that save debugging time:

- `CanSocket::open("can0")` takes the interface name; the interface must already be up and configured at the right bitrate with `ip link set can0 type can bitrate 250000`.
- Received frames carry a timestamp from the kernel. Use it for jitter measurement rather than calling the clock after the read, because the read may be delayed by the scheduler.

## Heartbeat, node guarding and the choice between them

Heartbeat and node guarding solve the same problem in different ways, and mixing them on one network is a reliable way to produce confusion:

| Mechanism | Direction | Failure detection | Notes |
| --- | --- | --- | --- |
| Heartbeat | Producer → consumer(s) | Consumer timeout | One frame per period, any number of consumers |
| Node guarding | Master polls each node | Response timeout | One request-response per node per period |

Node guarding costs two frames per node per period and scales badly: 20 nodes at 100 ms is 400 frames per second of pure overhead. Heartbeat costs one frame per node per period and should be the default on any new design. Set consumer timeouts to at least three producer periods.

## Commissioning checks worth automating

Four checks catch most CANopen integration problems before they reach a machine:

- **Bus load measurement at the intended cycle.** `candump -ta` with a frame count over ten seconds, then compare against the table above. If it exceeds 50 %, change the mapping or the bitrate before anything else.
- **Per-node heartbeat monitoring from cold start.** Log the time from power-on to first heartbeat for each node; a node that takes 4 seconds while others take 400 ms will make your startup sequence look intermittent.
- **Error counter monitoring.** Read the CAN controller error counters (`ip -details -statistics link show can0`). A rising error counter is cabling, termination or a baud mismatch — never a software problem.
- **SDO round-trip timing per node.** A node that answers in 5 ms is healthy; one that answers in 80 ms will block your configuration sequence and hints at a firmware problem.

=== takeaways
CANopen runs two channels on one wire: PDOs carry cyclic process data and SDOs carry configuration; mixing them in a live cycle blocks the bus for tens of milliseconds.
An 8-byte CAN frame occupies about 0.46 ms at 250 kbit, so 72 frames per cycle needs about 32 ms of bus time — a 2 ms cycle on that network is arithmetic impossibility.
Keep sustained bus load below 50 % to leave headroom for heartbeat, diagnostics and error frames from a single faulty node.
NMT state matters more than frame content: a device that drops to Pre-operational stops accepting PDOs, usually because of a heartbeat timeout set shorter than three producer periods.
Heartbeat costs one frame per node per period and scales; node guarding costs two and should not be used on new designs.
socketcan 4.0 gives the raw CAN interface and the kernel timestamp; CANopen framing and the state machine are application code that must stay allocation-free in the cycle.

=== faqs
Q: Can I run SDO configuration while the machine is moving?
A: Technically yes on a lightly loaded bus, practically no. A segmented SDO transfer can occupy the bus for tens of milliseconds, during which synchronous PDOs are delayed and watchdog timeouts become likely. Configure in Pre-operational state.

Q: Why do my drives drop out of operational state randomly?
A: Most often a heartbeat timeout shorter than three producer periods. A single lost frame then triggers a state change. Check the consumer timeout against the heartbeat period on every node.

Q: Does CANopen need CAN FD?
A: For classic CiA 301 process data, no: 8 bytes per PDO is usually enough and the installed base is classic CAN. CAN FD helps with large SDO payloads and with CiA 402 drives exchanging more than 8 bytes of process data.

Q: How do I calculate whether my cycle time is achievable?
A: Multiply the number of frames per cycle by roughly 0.46 ms at 250 kbit (0.25 ms at 500 kbit) and keep the result under half your cycle time. If it does not fit, reduce PDO count, raise the bitrate or lengthen the cycle.

Q: Why does my node take seconds to appear after power-on?
A: Boot time varies by firmware. Measure time-to-first-heartbeat per node from cold start; a node taking seconds is either doing a self-test or waiting for a supply rail, and your startup sequence must accommodate it rather than assume it failed.

Q: Is CANopen suitable for safety functions?
A: Not by itself. Safety requires a safety-rated protocol layer such as CANopen Safety (EN 50325-5) with certified devices and a validated architecture. Standard CiA 301 PDOs carry no safety integrity.

=== sources
CiA 301, *CANopen Application Layer and Communication Profile*, Version 4.2.0, CAN in Automation.
CiA 402, *CANopen Device Profile for Drives and Motion Control*.
ISO 11898-1:2015, *Road vehicles — Controller area network (CAN) — Data link layer and physical signalling*.
socketcan 4.0.0 crate source, docs.rs and crates.io.
