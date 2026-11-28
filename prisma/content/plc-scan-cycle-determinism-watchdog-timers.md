---
title: PLC Scan Cycle Explained: Execution Order, Determinism, Interrupts and Watchdog Timers
slug: plc-scan-cycle-determinism-watchdog-timers
type: BLOG
category: plc-controllers
author: edward
tags: PLC programming, IEC 61131-3, Ladder Logic, Structured Text, Control system architecture
publishedAt: 2026-11-10T09:00:00Z
excerpt: Every PLC program runs inside a deterministic scan loop that reads inputs, executes logic and updates outputs. Understanding synchronous vs asynchronous I/O, task scheduling, hardware interrupts and watchdog timers prevents subtle timing bugs and surprise CPU faults.
seoTitle: PLC Scan Cycle Explained: Determinism, Tasks & Watchdogs
seoDescription: Deep dive into the PLC scan cycle: input/output image tables, synchronous vs asynchronous I/O, periodic tasks, hardware interrupts and watchdog timer sizing.
coverImage: /media/2026/11/cover-plc-scan-cycle-determinism-watchdog-timers.jpg
coverAlt: Illustration of a modular DIN-rail PLC chassis and deterministic cyclic scan timing loop
coverCaption: Understanding scan phases, task preemption, and watchdog limits prevents intermittent machine timing defects.
---
Software engineers coming from general-purpose computing are often surprised by their first week programming a PLC. A PLC does not wait for a user click and exit when `main()` returns; it runs an endless, time-bounded loop — the **PLC scan cycle** — designed to guarantee **determinism**: given an input change on a sensor, the controller must evaluate logic and drive the corresponding output within a predictable upper time bound, every single time.

Misunderstanding how the scan cycle interacts with I/O image tables, multitasking schedulers and watchdog timers is behind some of the hardest-to-reproduce bugs on the factory floor: missed high-speed part sensors, race conditions between rungs, and intermittent CPU watchdog trips during HMI bursts or recipe loads.

## The four phases of a classic PLC scan

In a traditional single-task cyclic PLC scan, the operating system repeats four distinct phases continuously:

1. **Input scan (read inputs into the process image):** The CPU copies the physical state of local and remote field inputs into a memory buffer called the **Process Image Input (PII)** table.
2. **Program execution:** The CPU executes your [IEC 61131-3](/blog/iec-61131-3-programming-languages-explained) user logic — Ladder Diagram rungs top-to-bottom, left-to-right, or Structured Text / FBD / SFC routines in configured order — reading from the input image and writing to the **Process Image Output (PIQ)** table.
3. **Output scan (write outputs to hardware):** At the end of logic execution, the CPU transfers the output image table to physical output cards and remote fieldbus devices.
4. **System housekeeping and communications:** The CPU services HMI/SCADA polling, engineering tool online monitoring, OPC UA subscriptions, diagnostics and background memory checks.

```
+-------------------+     +---------------------+     +--------------------+     +-----------------------+
| 1. Read Physical  | --> | 2. Execute User     | --> | 3. Write Output    | --> | 4. Comms, Diagnostics |
|    Inputs -> PII  |     |    Logic (PII->PIQ) |     |    Image -> Field  |     |    & Housekeeping     |
+-------------------+     +---------------------+     +--------------------+     +-----------------------+
          ^                                                                                  |
          +---------------------------------- Repeat Cycle ----------------------------------+
```

### Why process image tables matter

Reading and writing through a frozen snapshot (PII/PIQ) instead of hitting physical I/O mid-scan ensures **logical consistency**: if `PartSensor` is `TRUE` on Rung 1, it is guaranteed to still be `TRUE` on Rung 240 of the same scan.

However, **not all modern PLCs behave strictly synchronously**:

| Platform Family | Default I/O Update Behavior | Practical Implication for Programmers |
|---|---|---|
| **Siemens S7-1200 / S7-1500** | Synchronous to OB1 (or assigned PIP — Process Image Partition for cyclic/isochronous OBs) | Inputs remain consistent throughout the OB unless you explicitly use peripheral direct access (`:P`) |
| **Rockwell ControlLogix / CompactLogix** | **Asynchronous** to the continuous task (I/O updates at each module's RPI independently of logic execution) | An input tag *can* change state halfway through a routine! Best practice: buffer inputs into internal tags at the start of the task and map outputs at the end |
| **Beckhoff TwinCAT / CODESYS** | Synchronous per task (each real-time task has its own cycle and mapped EtherCAT/fieldbus process image) | Deterministic per-task snapshots; cross-task shared variables need care to avoid torn reads/writes |

Ignoring asynchronous I/O on a Logix controller is a classic trap: if Rung 10 checks `XIC StartButton` and Rung 85 checks `XIO StartButton` expecting mutual exclusion within one scan, an asynchronous RPI update landing between those rungs can make both branches true — or both false — in the same scan.

## Calculating worst-case response time (the 2× scan rule)

Suppose a PLC has a **10 ms** scan time and a photoelectric sensor detects a bottle passing at high speed. What is the worst-case delay between the sensor turning ON and a pneumatic reject valve energizing?

![PLC timing diagram showing four scan phases (Input Read, Logic Solve, Output Write, Comms), worst-case 2x scan I/O latency, interrupt preemption, and watchdog timeout boundary](/media/2026/11/diagram-plc-scan-cycle-determinism-watchdog-timers.png "Figure 1: Worst-case I/O latency approaches 2x scan time plus hardware filter delays; watchdog timers halt execution to a safe state if logic stalls.")

1. The sensor turns ON **1 microsecond after** the Input Scan finishes (so the CPU misses it on Scan 1) → wait almost **1 full scan (10 ms)**.
2. Scan 2 reads the input, runs logic and updates the output at the end of Scan 2 → another **1 full scan (10 ms)**.
3. Add **hardware input filter delay** (often 1–5 ms configurable), **fieldbus cycle time** (e.g., 2–8 ms on [PROFINET or EtherNet/IP](/blog/profinet-vs-ethernet-ip-vs-ethercat)) and **actuator mechanical response** (e.g., 15 ms solenoid valve).

Thus, the controller's own worst-case I/O latency is roughly **`2 × Scan Time` + I/O filter + fieldbus latency**. Furthermore, to guarantee a pulse from a moving part is *never* missed in normal cyclic logic, the pulse duration must exceed **at least `1 × worst-case scan time + input filter time`** (in practice, leave a 2× safety factor).

## Modern multitasking: continuous, periodic and event tasks

Modern PACs and soft-PLCs rarely dump everything into one giant continuous loop. Instead, engineers split code into **prioritized tasks**:

- **Isochronous / high-priority cyclic tasks (0.5–4 ms):** Motion control, closed-loop fast [PID control](/blog/pid-controller-tuning-practical-guide) (pressure, tension, flow), high-speed registration and servo coordination.
- **Standard periodic tasks (10–50 ms):** General machine sequencing, conveyors, interlocks, valve actuation and PackML state machines.
- **Slow periodic tasks (100–500 ms):** Temperature loops, tank level scaling, HMI data aggregation, OEE counters and diagnostics.
- **Event / hardware interrupt tasks:** Triggered immediately by a digital input rising edge, high-speed counter match or fieldbus alarm — bypassing normal scan latency for microsecond-level reactions.

### The golden rule of periodic vs continuous tasks

Use **periodic tasks** for PID loops, totalizers and velocity calculations so the time step `Δt` is deterministic and known. Running a PID instruction inside a free-running continuous task whose cycle fluctuates between 4 ms and 22 ms depending on recipe branches causes integral and derivative gain distortion.

Keep total CPU utilization across all real-time tasks safely below **60%–70%** so communication bursts, online code edits and diagnostic logging never starve lower-priority tasks or cause periodic **task overruns**.

## Watchdog timers: what they protect and why they trip

Every PLC monitors execution time with a **watchdog timer** (typically defaulted to **100–500 ms**, configurable per task). If a scan fails to complete before the watchdog expires, the CPU assumes software has locked up, immediately transitions to **STOP / Major Fault**, and drives outputs to their safe fallback state.

### Five common causes of watchdog faults in production

1. **Unbounded `WHILE` or `REPEAT` loops in Structured Text:** Waiting inside a loop for a field sensor to change (`WHILE NOT ValveOpen DO ... END_WHILE;`) freezes the scan completely — the PLC can never reach the next Input Scan to see `ValveOpen` become true! Never block inside PLC code; always advance state machines one scan at a time.
2. **Array/recipe search spikes:** Sorting or scanning a 10,000-element array in one scan during a rare batch lookup pushes one scan past the watchdog limit. Spread heavy loops across multiple scans (chunking 100 items per scan).
3. **Excessive indirect addressing or recursive calls:** Deep function calls or malformed pointer indexes that loop unexpectedly.
4. **Communication time-slice starvation:** On controllers where system communications share the scan budget (such as poorly tuned continuous-task overhead percentages), heavy SCADA/OPC UA browsing or simultaneous HMI screens can stretch cycle times unexpectedly.
5. **Forgetting to separate safety from scan timing:** Never rely on a standard PLC watchdog alone for personnel safety — functional safety functions belong in certified safety PLCs with dedicated dual-channel watchdogs and [ISO 13849 / IEC 62061](/blog/functional-safety-iso-13849-vs-iec-62061-guide) architectures.

## Commissioning checklist for deterministic PLC timing

Before signing off Factory Acceptance Testing (FAT), capture and document these five metrics in the PLC diagnostics buffer:

1. **Current, average and maximum scan time** for every task under full simulated production load (including active SCADA, historian and HMI polling).
2. **Worst-case jitter** on periodic motion and PID tasks — confirm zero task overruns over a 24-hour soak test.
3. **Input debounce filter times** matched to the fastest sensor pulses on the machine (or moved to a hardware high-speed counter module when pulse rates exceed ~200 Hz).
4. **Explicit I/O buffering routines** if deploying on an asynchronous-I/O controller family.
5. **Watchdog threshold and fault-handler behavior** verified so outputs fail to their documented safe states on a fault.

For hands-on field triage separating PLC watchdog stops from backplane faults, 24V power sag, and PROFINET remote I/O station dropouts on Siemens S7 and FANUC systems, review Vibocnc's guide to [troubleshooting PLC scan-cycle watchdog faults and remote I/O dropouts](https://vibocnc.com/blog/plc-scan-cycle-io-module-profinet-diagnostics-guide).

=== takeaways
A classic PLC scan repeats four phases — reading inputs into an image table, executing user logic, updating outputs and servicing communications — to guarantee deterministic response times.
Worst-case controller latency is approximately twice the scan time plus hardware input filtering and fieldbus cycle delays, so fast sensor pulses shorter than the worst-case scan require hardware interrupts or high-speed counter modules.
Rockwell Logix controllers update I/O asynchronously to the continuous task, making explicit input/output buffering essential to avoid mid-scan state changes.
Splitting code into prioritized periodic tasks gives PID and motion loops a fixed time base while keeping total CPU utilization below 60%–70%.
Watchdog timers trip the CPU to a safe STOP state when a scan exceeds its time limit — most commonly caused by blocking WHILE loops in Structured Text or unchunked large array operations.

=== faqs
Q: What is a typical PLC scan time in industrial automation?
A: Typical general-purpose PLC scan times range from 1 ms to 20 ms for discrete machine control, 0.25 ms to 2 ms for dedicated motion or high-speed cyclic tasks, and 50 ms to 250 ms for large continuous process control routines.

Q: Why should you never wait for an input inside a WHILE loop in a PLC?
A: Because most PLCs only refresh the physical input image table between scans. A WHILE loop waiting for an input bit prevents the current scan from finishing, so the input never updates and the CPU trips on a watchdog timeout fault.

Q: What is the difference between synchronous and asynchronous PLC I/O?
A: In synchronous I/O (such as Siemens S7 OB1), physical inputs are copied to an image table before logic starts and remain frozen for the entire scan. In asynchronous I/O (such as Rockwell ControlLogix), I/O modules update controller tags independently at their Requested Packet Interval (RPI), so an input value can change mid-scan unless buffered into internal tags.

Q: When do I need a high-speed counter (HSC) or hardware interrupt instead of normal PLC inputs?
A: Whenever a signal pulse is shorter than your worst-case PLC scan time plus input filter delay — for example, rotary encoders, flowmeter pulse outputs or fast bottling line sensors operating above roughly 100–200 Hz.

=== sources
IEC 61131-3: Programmable controllers — Part 3: Programming languages (International Electrotechnical Commission)
PLCopen — Coding Guidelines and Software Architecture | https://www.plcopen.org/
Rockwell Automation — Logix 5000 Controllers Tasks, Programs, and Routines Reference Manual | https://literature.rockwellautomation.com/
Siemens — SIMATIC S7-1500 Cycle and Response Times Function Manual | https://support.industry.siemens.com/
Vibocnc — Troubleshooting PLC Scan-Cycle Watchdog Faults, Remote I/O Dropouts, and Industrial Ethernet Latency | https://vibocnc.com/blog/plc-scan-cycle-io-module-profinet-diagnostics-guide
