---
title: Rust EtherCAT on PREEMPT_RT Linux: Jitter and DC Sync
slug: rust-ethercat-preempt-rt-linux-jitter-guide
type: BLOG
category: motion-control-drives
author: edward
tags: EtherCAT, Motion control, Industrial Ethernet
publishedAt: 2026-11-28T02:23:00Z
excerpt: A software EtherCAT master on general-purpose Linux is a latency engineering problem before it is a Rust problem. This guide covers cycle jitter on PREEMPT_RT versus stock kernels, core isolation and interrupt affinity, zero-allocation cycle loops with mlockall, and distributed-clock drift on SYNC0.
seoTitle: Rust EtherCAT on PREEMPT_RT: Jitter and DC Sync
seoDescription: Measure and reduce EtherCAT cycle jitter on PREEMPT_RT Linux: core isolation, interrupt affinity, mlockall zero-allocation loops and distributed clock sync.
coverImage: /media/2026/11/cover-rust-ethercat-preempt-rt-linux-jitter-guide.jpg
coverAlt: Technical editorial illustration of EtherCAT cycle jitter on a real-time Linux kernel with nuclear clock and servo waveform motifs
coverCaption: A software master does not fail on the average cycle. It fails on the worst one in a million.
---
An EtherCAT master implemented in userspace is a hard real-time problem with a soft real-time operating system underneath it. The fieldbus itself is deterministic: frames pass through every slave in a few microseconds and the working counter tells you exactly what was processed. What is not deterministic is when your process gets scheduled to send the next frame. On a stock kernel that moment can move by hundreds of microseconds; on a correctly configured PREEMPT_RT kernel it can be held to single-digit microseconds, and the difference decides whether a servo drive sees a smooth profile or a stutter.

This guide is about the Linux side. The Rust side — `ethercrab` and its zero-allocation cycle loop — is comparatively easy once the platform behaves.

## What the numbers actually look like

The figures below are the ranges observed on x86 industrial PCs with an Intel i210 or i219 NIC, running a 1 ms EtherCAT cycle with `ethercrab`. They are representative, not guarantees: your board, your BIOS and your NIC firmware will move them.

![Histogram of EtherCAT cycle jitter in microseconds on a 1 millisecond cycle comparing a tuned PREEMPT_RT kernel concentrated below 40 microseconds with a stock kernel having a long tail beyond 200 microseconds, a dashed servo tolerance line at 25 microseconds, and a six-step tuning ladder from isolcpus through mlockall to zero-allocation loops and NIC offload settings](/media/2026/11/diagram-rust-ethercat-preempt-rt-linux-jitter-guide.png "Figure 1: The mean is identical. The tail is what stalls a drive, and only the kernel configuration moves it.")

| Platform | Typical jitter (p99) | Worst case observed | Suitability |
| --- | --- | --- | --- |
| Stock kernel, no tuning | 200–1500 µs | Several ms | Not usable for a master |
| Stock kernel, `isolcpus` + RT priority | 60–250 µs | ~1 ms | Bench and slow I/O only |
| PREEMPT_RT, `isolcpus` + `mlockall` | 5–20 µs | 30–60 µs | Servo motion at 1 ms |
| PREEMPT_RT + tuning + NIC tuning | 3–10 µs | 15–25 µs | Servo motion at 250–500 µs |

The important column is not the typical value. A drive tolerates a late frame; it does not tolerate one that arrives after the next frame, because that produces a velocity discontinuity the current loop cannot absorb. That is why the worst case, not the average, is the design number.

## Core isolation and interrupt affinity

The single biggest improvement comes from getting the cycle thread away from everything else. Three kernel parameters do most of the work:

```
isolcpus=2,3 nohz_full=2,3 rcu_nocbs=2,3
```

- `isolcpus` removes the listed cores from the general scheduler so nothing else is placed there.
- `nohz_full` stops the tick on those cores when a single task is running, removing a periodic interrupt that would otherwise land in the middle of a cycle.
- `rcu_nocbs` moves RCU callbacks off the isolated cores.

Isolation only helps if the NIC interrupt is also moved. On a system where the EtherCAT NIC shares a core with the cycle thread, every frame triggers an interrupt on the core that is trying to send the next frame:

```bash
# Find the IRQ for the EtherCAT NIC
grep eth1 /proc/interrupts

# Move it to a housekeeping core (core 0 here), away from isolated 2,3
echo 1 > /proc/irq/<irq>/smp_affinity_list
```

Disable the interrupt-coalescing features that were designed for throughput and add latency on a real-time link:

```bash
ethtool -K eth1 gro off gso off tso off lro off
ethtool -C eth1 rx-usecs 0 tx-usecs 0
```

Then pin the cycle thread, raise its priority, and lock its memory so a page fault can never occur mid-cycle:

```rust
// Run once, before the cycle starts.
unsafe {
    let mut set = std::mem::zeroed::<libc::cpu_set_t>();
    libc::CPU_SET(2, &mut set);
    if libc::sched_setaffinity(0, std::mem::size_of::<libc::cpu_set_t>(), &set) != 0 {
        anyhow::bail!("sched_setaffinity failed");
    }
    let param = libc::sched_param { sched_priority: 80 };
    if libc::sched_setscheduler(0, libc::SCHED_FIFO, &param) != 0 {
        anyhow::bail!("sched_setscheduler failed");
    }
    if libc::mlockall(libc::MCL_CURRENT | libc::MCL_FUTURE) != 0 {
        anyhow::bail!("mlockall failed");
    }
}
```

`MCL_FUTURE` is the part people forget. Without it, the heap is locked at the moment of the call but every later allocation can still fault — and a fault on an isolated core under `SCHED_FIFO` is a multi-millisecond stall.

## The zero-allocation cycle loop

`ethercrab` is written for a `no_std` target and sized at compile time: subdevice count and PDI length are const generics, and the process data image is a fixed array. That design is what makes it usable in a cycle loop, but only if your code around it follows the same rule.

```rust
use ethercrab::{MainDevice, MainDeviceConfig, PduStorage, Timeouts, std::ethercat_now};
use std::time::Duration;

// All sizes are compile-time: the PDU storage lives in a static, and the
// process data image is a fixed array. Nothing here allocates.
const MAX_SUBDEVICES: usize = 16;
const MAX_PDU_DATA: usize = PduStorage::element_size(1100);
const MAX_FRAMES: usize = 16;
const PDI_LEN: usize = 64;

static PDU_STORAGE: PduStorage<MAX_FRAMES, MAX_PDU_DATA> = PduStorage::new();

let (tx, rx, pdu_loop) = PDU_STORAGE.try_split().expect("can only split once");

// Timeouts is passed to MainDevice::new, not to MainDeviceConfig.
let maindevice = MainDevice::new(
    pdu_loop,
    Timeouts {
        wait_loop_delay: Duration::from_millis(2),
        mailbox_response: Duration::from_millis(1000),
        ..Default::default()
    },
    MainDeviceConfig::default(),
);

// The TX/RX task owns the NIC; spawn it before init.
smol::spawn(ethercrab::std::tx_rx_task(&interface, tx, rx).expect("spawn TX/RX task")).detach();

let group = maindevice
    .init_single_group::<MAX_SUBDEVICES, PDI_LEN>(ethercat_now)
    .await
    .expect("init");

let group = group.into_op(&maindevice).await.expect("PRE-OP to OP");

let mut tick = smol::Timer::interval(Duration::from_micros(1000));
let mut misses: u64 = 0;

// Cycle body: no allocation, no blocking, no logging.
loop {
    group.tx_rx(&maindevice).await.expect("TX/RX");

    for subdevice in group.iter(&maindevice) {
        let inputs = subdevice.inputs_raw();
        let mut outputs = subdevice.outputs_raw_mut();
        // Fixed-size copies only; no Vec, no format!, no println!.
        if inputs.len() == outputs.len() {
            outputs.copy_from_slice(inputs);
        }
    }

    // Count a late deadline instead of logging inside the cycle.
    if tick.next().await.is_none() {
        misses += 1;
    }
}
```

Three rules make the difference between a working loop and a mystery:

- **No `println!`, no `format!`, no `dbg!`** in the cycle. Formatting allocates, and allocation can fault. Buffer diagnostics into a fixed array and flush them from a non-real-time task.
- **No `.await` that is not the bus exchange.** A timer or channel await inside the cycle introduces a scheduler dependency you cannot bound.
- **Count deadline misses instead of logging them.** A single miss after a heavy network event is information; a log line per miss turns a 5 % problem into a 100 % outage.

## Distributed clocks and SYNC0 drift

Distributed clocks (DC) let every slave derive its local clock from a reference slave, so all devices latch inputs at the same instant regardless of frame arrival time. On a software master the reference clock is also used to schedule SYNC0, the synchronisation pulse that triggers output latching.

The practical behaviour to know:

- **DC compensates frame-arrival jitter, not master jitter.** If the master's cycle drifts by 100 µs, the slaves still latching together does not help — motion becomes uneven because the whole set of setpoints moves.
- **SYNC0 period must match the cycle period exactly.** A 1 ms cycle with a 2 ms SYNC0 period gives every device a fresh setpoint only every other cycle, which shows up as a 500 Hz excitation.
- **Correction of the drift is progressive.** After a master restart the slaves need a few hundred cycles to re-converge; expect a transient and do not start motion during it.
- **Do not enable DC on slaves that do not support it.** A single device without DC support can prevent the drift compensation of an entire group.

The check that exposes most DC problems is to log, on one diagnostic cycle per second, the difference between the master's scheduled send time and the actual send time, plus the DC time offset reported for one servo. If the DC offset wanders by more than a few microseconds while the send jitter stays low, the problem is in the DC configuration. If both wander together, the problem is the kernel.

## When to stop tuning software and buy hardware

A userspace master on PREEMPT_RT is a legitimate engineering choice for machines with 250 µs to 1 ms cycles and moderate axis counts. It stops being the right choice when:

- You need cycle times below 250 µs with hard guarantees.
- Your worst case must be bounded in the low microseconds regardless of system load.
- The machine has a safety function riding on the same bus, expecting the SHWE (safety over EtherCAT) processing in the master.
- You have no control over the BIOS, the NIC or the OS image in the field.

In those cases the honest answer is a commercial master or a dedicated motion controller. A software master is a good tool; it is not a substitute for hardware determinism, and the marketing material for userspace real-time stacks tends to quote the typical case rather than the worst one.

=== takeaways
Worst-case cycle jitter, not average, decides whether a userspace EtherCAT master can drive servo motion; stock kernels land in the hundreds of microseconds to milliseconds.
isolcpus, nohz_full and rcu_nocbs remove the scheduler and the tick from the cycle cores, but only if the NIC interrupt is also moved to a housekeeping core.
mlockall with MCL_FUTURE is required: locking only current pages leaves every later allocation able to fault inside the cycle.
ethercrab sizes subdevices and the process data image at compile time; keep the cycle body free of formatting, allocation and any await other than the bus exchange.
Distributed clocks compensate frame-arrival jitter, not master cycle drift, and SYNC0 must match the cycle period exactly.
Below roughly 250 µs with a hard worst-case bound, a commercial master or dedicated motion controller is the correct answer.

=== faqs
Q: Can I run an EtherCAT master on a stock Ubuntu kernel for a bench test?
A: Yes, for development and slow I/O. Expect jitter in the hundreds of microseconds with occasional multi-millisecond outliers, which is enough to stall a servo drive but fine for verifying slave detection, PDO mapping and DC configuration.

Q: Why does moving the NIC interrupt matter so much?
A: If the EtherCAT NIC raises an interrupt on the same core running the cycle thread, the interrupt preempts the send. Affinity moves both to different cores, which typically removes the largest single source of jitter.

Q: Do I need PREEMPT_RT or is a low-latency kernel enough?
A: A low-latency kernel reduces but does not bound latency. For a 1 ms cycle driving servos, PREEMPT_RT is the practical minimum; the low-latency patch leaves worst cases in the hundreds of microseconds.

Q: What does mlockall with MCL_FUTURE protect against?
A: Page faults. Any allocation after the call can fault, and a fault inside a SCHED_FIFO loop on an isolated core stalls for milliseconds. MCL_FUTURE keeps all future pages resident.

Q: Why does my motion look uneven if the slaves are synchronised?
A: Distributed clocks synchronise when slaves latch, not when the master sends. If the master cycle drifts, the entire set of setpoints moves even though the slaves latch together, and the motion profile inherits the drift.

Q: Is a userspace master safe for a machine with safety functions?
A: No. Safety over EtherCAT processing and safety-rated stops belong in certified hardware. A userspace master can carry the standard process data; it must not be part of a safety function.

=== sources
ETG.1000, *EtherCAT Specification*, EtherCAT Technology Group.
ETG.1020, *EtherCAT Protocol Enhancements*, distributed clocks chapter.
ethercrab 0.7.1 crate source and documentation (Advanced Motion Lab).
Linux kernel documentation, *PREEMPT_RT* and *NO_HZ* configuration.
