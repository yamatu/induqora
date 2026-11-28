---
title: EtherNet/IP and CIP Networking: RPI Sizing, Implicit I/O and Switch Tuning
slug: ethernet-ip-cip-implicit-io-rpi-switch-configuration-guide
type: BLOG
category: industrial-networking
author: edward
tags: EtherNet/IP, Industrial Ethernet, PLC programming, Control system architecture, PLC maintenance
publishedAt: 2026-11-26T04:00:00Z
excerpt: EtherNet/IP runs on standard Ethernet hardware, which tempts teams to plug PLCs, VFDs, and remote I/O into unmanaged switches with default RPIs. Master Explicit vs Implicit CIP messaging, packet-per-second math, IGMP snooping, QoS DSCP, and DLR ring diagnostics to eliminate intermittent I/O timeouts.
seoTitle: EtherNet/IP & CIP Guide: RPI, Implicit I/O & Switches
seoDescription: Practical EtherNet/IP guide: Explicit TCP 44818 vs Implicit UDP 2222 I/O, RPI packet math, IGMP snooping, QoS DSCP, DLR rings, and timeout debugging.
coverImage: /media/2026/11/cover-ethernet-ip-cip-implicit-io-rpi-switch-configuration-guide.jpg
coverAlt: Technical editorial illustration of an EtherNet/IP Device Level Ring industrial Ethernet topology with CIP cyclic I/O frames and managed switch QoS indicators
coverCaption: Matching RPI to physical machine dynamics and enabling IGMP Querier plus ODVA DSCP QoS prevents intermittent EtherNet/IP 0x0203 I/O timeouts.
---
Because **EtherNet/IP** (Ethernet Industrial Protocol, maintained by ODVA) uses standard IEEE 802.3 Ethernet frames and unmodified TCP/UDP/IP stacks, it is often described as "easy to deploy on off-the-shelf switches." That convenience is also the number-one cause of intermittent **Error `16#0203` (Connection Timed Out)** faults on production lines: teams plug dozens of VFDs, remote I/O racks, HMIs, and vision cameras into unmanaged switches, leave every module at a default **Requested Packet Interval (RPI)**, and wonder why drives trip randomly whenever an engineer goes online with a laptop.

Building a rock-solid EtherNet/IP machine or plant network requires understanding how the **Common Industrial Protocol (CIP)** splits traffic between Explicit and Implicit channels, how RPI drives real packet-per-second (PPS) load, and which managed-switch features are mandatory rather than optional.

## How CIP maps Explicit and Implicit messaging onto TCP/IP

Unlike [PROFINET RT/IRT or EtherCAT](/blog/profinet-vs-ethernet-ip-vs-ethercat), which bypass IP routing for cyclic I/O, EtherNet/IP encapsulates **CIP** objects over standard IPv4/IPv6 using two completely separate transport paths:

| Messaging Class | Transport & Port | Trigger & Determinism | Typical Uses |
|---|---|---|---|
| **Explicit Messaging** | **TCP Port 44818** (Unconnected or Class 3 Connected) | Request/Response on demand; non-deterministic | HMI reads/writes, PLC `MSG` instructions, parameter uploads, drive diagnostics, engineering software |
| **Implicit (I/O) Messaging** | **UDP Port 2222** (Class 1 Connected) | Cyclic at configured **RPI** (or Change-of-State); low-jitter | Remote I/O racks, VFD speed/torque assemblies, robot I/O, CIP Safety, Produced/Consumed PLC tags |

A critical architectural detail: **every Implicit UDP Class 1 connection is first negotiated over Explicit TCP 44818** using a CIP `Forward_Open` request (which establishes Connection IDs, assembly sizes, RPI, and timeout multiplier). Once open, real-time cyclic data flows strictly over **UDP 2222** carrying almost zero protocol overhead — just the Sequence Count and raw Input/Output Assembly bytes.

By default, an EtherNet/IP connection declares a **Connection Timeout** after **4× the RPI** without receiving a valid packet (for example, a 10 ms RPI connection faults after 40 ms of missed UDP frames). That tight timeout window is why micro-bursts from unmanaged broadcast traffic or Spanning Tree topology recalculations immediately trip machines.

## Requested Packet Interval (RPI) sizing and packet-per-second math

Every cyclic I/O connection consumes both **bandwidth** and — far more critically — **CPU packet-processing capacity (Packets Per Second, PPS)** on the PLC communication module (such as a ControlLogix EN2T/EN4TR or embedded CompactLogix port). Small Ethernet frames carry high per-packet interrupt overhead regardless of whether the wire is 100 Mbps or 1 Gbps.

![EtherNet/IP architecture diagram showing Explicit TCP 44818 Forward_Open handshake, Implicit UDP 2222 cyclic I/O at 4x RPI timeout, PPS load reduction chart, and ODVA DSCP QoS queue mapping](/media/2026/11/diagram-ethernet-ip-cip-implicit-io-rpi-switch-configuration-guide.png "Figure 1: EtherNet/IP Explicit vs. Implicit transport paths, 92% packet-per-second reduction from tiered RPI sizing on a 40-device cell, and mandatory managed-switch QoS/IGMP queues.")

Calculate the bidirectional PPS load for each cyclic connection with a simple formula:

```text
Connection PPS = 2 × (1,000 ms / RPI_ms)
```

(The factor of `2` reflects full-duplex cyclic packets: Originator → Target output assembly plus Target → Originator input assembly.)

**Worked example — why "set everything to 2 ms" breaks controllers:**

- Suppose a packaging cell has **40 EtherNet/IP devices** (20 remote I/O blocks, 12 VFDs, 4 servo/safety adapters, 4 vision/barcode units).
- If an integrator leaves all 40 connections at **RPI = 2 ms**: `40 × 2 × (1000 / 2) = 40,000 PPS`! Many mid-range PLC Ethernet ports saturate around **10,000–25,000 PPS**, causing erratic scan jitter and random I/O drops when HMI traffic joins the link.
- Instead, match RPI to physical process dynamics and [PLC scan cycle timing](/blog/plc-scan-cycle-determinism-watchdog-timers):

| Device Type | Recommended RPI Range | Engineering Rationale |
|---|---|---|
| **CIP Motion / Synchronized Servo Axes** | **0.5 – 2 ms** | Requires IEEE 1588 PTP (`CIP Sync`) and dedicated managed switches |
| **High-Speed Discrete I/O & CIP Safety** | **5 – 10 ms** | Fast sensors, light curtains, and emergency stop interlocks |
| **Standard Conveyors, Solenoids & VFDs** | **20 – 50 ms** | Mechanical valve/motor inertia is 20–100+ ms; faster RPI wastes CPU |
| **Analog Process Sensors (Temp, Level, Flow)** | **100 – 250 ms** | Slow thermal/fluid time constants; zero benefit from 10 ms updates |
| **Produced/Consumed Inter-PLC Handshakes** | **50 – 100 ms** | Non-motion line coordination and status interlocks |

Using tiered RPIs on that exact same 40-device cell drops network load from **40,000 PPS** down to roughly **3,200 PPS** — a **92% reduction** in PLC communication module utilization with zero impact on machine cycle time.

## Unicast vs. Multicast and mandatory IGMP Snooping configuration

Historically, EtherNet/IP relied heavily on **IP Multicast** (`239.192.x.x`) for Target-to-Originator input assemblies and Produced/Consumed tags. On an unmanaged switch — or a managed switch without **IGMP Snooping** enabled — Ethernet treats multicast frames identically to **broadcasts**, flooding every I/O packet out of every port on the VLAN.

That flood overwhelms low-CPU embedded NICs on VFDs, weigh scales, and barcode scanners, causing them to drop their own CIP keep-alive packets and trip the line.

### Rules for clean multicast and unicast operation

1. **Default to Unicast for 1-to-1 I/O connections:** Modern EtherNet/IP adapters (Revision 18+ on Rockwell ecosystems and current ODVA-certified devices) support **Unicast** for point-to-point PLC-to-device I/O. Enable Unicast whenever only one controller consumes that adapter's inputs.
2. **Use Multicast only where genuine 1-to-many sharing exists** (such as one PLC producing status tags consumed by three downstream PLCs, or input-only listen connections).
3. **Whenever Multicast exists on a VLAN, enable BOTH IGMP Snooping AND exactly one IGMP Querier:** A notorious field mistake is turning on IGMP Snooping across all switches without configuring an **IGMP Querier** (typically on the core Layer 2/3 switch). Without a Querier sending periodic membership queries, switches time out multicast group entries after ~260 seconds and either black-hole I/O traffic completely or fall back to flooding every port!

## QoS (DSCP) prioritization and switch settings that actually matter

Managed industrial Ethernet switches (Cisco IE, Stratix, Hirschmann, Moxa, Siemens SCALANCE) support **Differentiated Services Code Point (DSCP)** QoS markings defined by ODVA so cyclic I/O and time synchronization jump ahead of bulky HMI graphics, camera images, or Windows updates during momentary micro-bursts:

| Traffic Class | ODVA Recommended DSCP | Queue Priority | Purpose |
|---|---|---|---|
| **CIP Sync (IEEE 1588 PTP Event)** | **59** | Strict Highest | Sub-microsecond clock sync for CIP Motion |
| **CIP Sync (PTP General) & Urgent Safety** | **47** | High | CIP Safety & PTP announce/follow-up |
| **CIP Scheduled / Implicit Cyclic I/O** | **43** | High | Real-time UDP 2222 I/O assemblies |
| **CIP Explicit Messaging** | **27** | Medium | HMI polling, `MSG` instructions, engineering |
| **Best-Effort IT / Cameras / File Transfers** | **0 (Default)** | Low | FTP, HTTP, vision image uploads, backups |

Alongside QoS and IGMP, apply four defensive Layer 2 controls on every EtherNet/IP access switch:

- **Enable Storm Control (Broadcast/Multicast/Unknown Unicast caps, e.g., 5–10%):** Stops a misbehaving NIC or accidental cabling loop from taking down the PLC.
- **Configure PortFast / Edge-Port + BPDU Guard on device access ports:** Without PortFast, Rapid Spanning Tree (RSTP) blocks a newly plugged-in VFD or PLC port for 2–30 seconds while checking for loops, causing startup I/O faults.
- **Keep Auto-Negotiation ON (100/1000 Full Duplex):** Do not hardcode one end to `100-Full` while leaving the device on `Auto` — IEEE 802.3 duplex mismatch forces the auto end to `Half Duplex`, creating late collisions and intermittent Error `0x0203` timeouts that intensify under load.
- **Isolate GigE Vision cameras and corporate traffic onto separate VLANs:** High-burst jumbo-frame camera streams sharing an access switch with 2 ms motion I/O will inject switch-buffer jitter even with QoS active.

## Device Level Ring (DLR) vs. Star topology for machine resilience

Many EtherNet/IP machines use **Device Level Ring (DLR)** — an ODVA Layer 2 ring protocol running natively on dual-port embedded switch chips inside PLCs, VFDs, and remote I/O blocks — to survive a single cut cable with **under 3 ms ring reconvergence** (faster than typical 4× RPI connection timeouts).

DLR is economical and eliminates separate field switches along long conveyors, but it has strict engineering limits:

- **Maximum 50 nodes per ring** (in practice, keep rings under **20–30 devices** to limit cumulative store-and-forward switch latency across daisy-chained ports).
- **Configure an Active Ring Supervisor** (plus an optional Backup Supervisor with higher precedence value) and monitor the DLR diagnostic object (`Class 0x47`) in your PLC/HMI so a broken ring triggers a maintenance alarm immediately — otherwise the plant runs unknowingly on a linear chain until a second cable breaks and stops the entire line.
- **Never connect two DLR rings together without a proper switch/gateway or mix unmanaged switches inside a DLR ring:** Unmanaged switches do not forward DLR Beacon frames properly and break sub-3 ms recovery.

## Rapid troubleshooting workflow for EtherNet/IP I/O timeouts (`0x0203`)

When a production line throws intermittent `16#0203 Connection Timed Out` faults, skip random cable swapping and check five concrete counters in order:

1. **Inspect switch and adapter Ethernet Counters (CIP Ethernet Link Object `Class 0xF6`):** Look for **FCS/CRC errors** (bad cable, loose M12 connector, or VFD PWM EMI noise — especially near unshielded motor cables), **Alignment/Late Collisions** (duplex mismatch), or **Output Discards** (switch port congestion/missing QoS).
2. **Check PLC Ethernet Module Web Diagnostics:** Verify CPU utilization (<70%), active CIP connections vs. module limit, and current PPS vs. rated PPS.
3. **Verify IGMP Querier status:** Confirm every switch reports a valid Querier IP on the OT VLAN and zero unsolicited multicast flooding on access ports.
4. **Check DLR Ring Fault Count (`Class 0x47`):** Rapidly incrementing ring-fault counters reveal an intermittent vibration-damaged patch cord or failing VFD port long before total failure.
5. **Capture a SPAN port trace in Wireshark (`cip || enip`):** Filter for `enip.command == 0x006f` (`Forward_Open` retries) and plot UDP 2222 inter-packet delta time (`frame.time_delta_displayed`) to pinpoint whether the PLC stopped sending, the switch delayed the frame, or the field adapter failed to reply.

=== takeaways
EtherNet/IP splits traffic into Explicit TCP 44818 (configuration, HMI, Forward_Open setup) and Implicit UDP 2222 (cyclic I/O), with connections timing out by default after 4x RPI.
Size RPIs to match physical process speed (20–50 ms for VFDs/valves, 100–250 ms for slow analogs) rather than leaving every module at 2 ms, which rapidly saturates PLC packet-per-second (PPS) limits.
Prefer Unicast for 1-to-1 I/O connections; wherever Multicast is used, configure both IGMP Snooping and exactly one IGMP Querier per VLAN to prevent broadcast flooding or 260-second dropouts.
Pair ODVA DSCP QoS markings (59/47/43/27), PortFast on edge ports, and monitored DLR Ring Supervisors to keep cyclic I/O deterministic and diagnose Error 0x0203 faults via CIP Ethernet Link counters.

=== faqs
Q: Can I run EtherNet/IP on unmanaged industrial switches?
A: Only on tiny, isolated standalone skids with a handful of unicast devices and no HMIs, cameras, or plant-network uplinks. Any multi-device production cell benefits decisively from managed switches providing IGMP Snooping/Querier, DSCP QoS, PortFast, storm control, and per-port CRC/error diagnostics.

Q: Why does a CIP connection keep working for 4 minutes after booting and then suddenly drop?
A: That is the classic signature of IGMP Snooping enabled on switches without an active IGMP Querier on the VLAN. Switches learn multicast memberships initially, then age them out after roughly 260 seconds when no Querier refreshes group membership, cutting off multicast I/O traffic.

Q: Is 1 Gbps Ethernet always faster than 100 Mbps for EtherNet/IP I/O?
A: Bandwidth rarely bottlenecks EtherNet/IP — packet rate (PPS) does. Upgrading switch uplinks to 1 Gbps prevents congestion when HMIs, historians, and cameras share a trunk, but PLC communication modules are still bounded by their rated PPS and CIP connection count regardless of link speed.

Q: What is the difference between EtherNet/IP and standard Ethernet/IP (TCP/IP)?
A: Standard Ethernet/IP refers generically to running IP over Ethernet. EtherNet/IP (capital N, slash IP) is ODVA's industrial protocol where "IP" stands for "Industrial Protocol" — specifically encapsulating the Common Industrial Protocol (CIP) over TCP 44818 and UDP 2222 for deterministic industrial control.

=== sources
ODVA — EtherNet/IP Technology Overview & CIP Specification | https://www.odva.org/technology-standards/key-technologies/ethernet-ip/
ODVA — Recommended IP Addressing, QoS (DSCP) and Multicast Guidelines for EtherNet/IP | https://www.odva.org/wp-content/uploads/2020/05/PUB00138R6_Tech-Series-EtherNetIP-Infrastructure-Guide.pdf
IEEE 1588-2019 — Precision Clock Synchronization Protocol for Networked Measurement and Control Systems (PTP) | https://standards.ieee.org/ieee/1588/6825/
