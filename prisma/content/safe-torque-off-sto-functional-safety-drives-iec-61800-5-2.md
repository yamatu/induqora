---
title: Safe Torque Off (STO), SS1 and SLS Explained: Drive-Integrated Safety Under IEC 61800-5-2
slug: safe-torque-off-sto-functional-safety-drives-iec-61800-5-2
type: BLOG
category: motion-control-drives
author: edward
tags: Functional safety, Machine safety, Servo drives, VFDs, Motion control, PROFINET, EtherCAT
publishedAt: 2026-10-18T09:00:00Z
excerpt: Drive-integrated safety functions defined in IEC 61800-5-2 let VFDs and servo drives replace bulky dual safety contactors, cut restart times and allow safe low-speed maintenance. Learn how STO, SS1, SS2, SOS and SLS work — and where STO alone is not enough.
seoTitle: Safe Torque Off (STO), SS1 & SLS Explained (IEC 61800-5-2)
seoDescription: Engineering guide to IEC 61800-5-2 drive safety: STO, SS1, SS2, SOS, SLS and SBC, dual-channel wiring vs PROFIsafe/CIP Safety/FSoE, and vertical-load traps.
coverImage: /media/2026/11/cover-safe-torque-off-sto-functional-safety-drives-iec-61800-5-2.jpg
coverAlt: Technical schematic of dual-channel Safe Torque Off gate-driver cutoff inside an industrial servo drive
coverCaption: Drive-integrated safety functions eliminate electromechanical main contactors while achieving SIL 3 / PL e stopping performance.
---
Twenty years ago, making a motor safe when an operator opened a guard door meant wiring **two oversized electromechanical safety contactors in series** between the mains supply and the VFD or servo drive. Every emergency stop or guard opening slammed the contactors open, dumped the DC bus capacitors, triggered inrush currents on restart, wore out contactor contacts and forced multi-second drive reboot delays before production could resume.

Today, almost every industrial [VFD and servo drive](/blog/vfd-vs-servo-drive-selection-guide) integrates certified functional safety functions standardized under **IEC 61800-5-2** (*Adjustable speed electrical power drive systems — Safety requirements — Functional*). Understanding how **STO, SS1, SS2, SOS and SLS** work — and their critical limitations — produces safer, cleaner and far more productive machines.

## How Safe Torque Off (STO) works inside a drive

**Safe Torque Off (STO)** is the foundational drive safety function, equivalent to an uncontrolled **Stop Category 0** under **IEC 60204-1**.

Instead of interrupting high-current mains power upstream of the drive, STO acts directly on the **gate-drive power supply or pulse-enable circuits of the output IGBT bridge** via two independent hardware channels (`STO_A` and `STO_B`):

- When both 24 V DC safety inputs drop to 0 V (or a safety telegram commands STO), the drive physically removes the switching energy needed to turn on the output transistors.
- With the IGBT gate pulses blocked, the motor **cannot generate electromagnetic torque or rotate**, even if a single semiconductor or microprocessor fails — achieving up to **SIL 3 (IEC 61508/62061)** and **PL e / Category 3 or 4 (ISO 13849-1)**.
- Because mains power stays connected to the drive's control electronics and DC bus, fieldbus diagnostics, encoder position tracking and cabinet status remain online, allowing **instant recovery** once the safety circuit resets.

### Three things STO does NOT do (common design traps)

1. **STO does NOT actively brake the motor.** Once torque is removed, a high-inertia fan, saw blade or heavy conveyor will **coast freely** to a stop. If an operator can open a guard door and reach a spinning blade before it stops, you need **SS1** (controlled braking) and/or a **guard-locking interlock**.
2. **STO does NOT hold a suspended vertical load.** Removing torque from a vertical Z-axis or hoist lets gravity pull the load straight down! Vertical axes require a certified fail-safe mechanical holding brake controlled via **Safe Brake Control (SBC)** — or mechanical fall protection.
3. **STO is NOT electrical isolation (Lockout/Tagout).** Mains voltage remains present on the DC bus and motor terminals during STO. Technicians servicing a motor or wiring must still open and lock out an upstream physical disconnect switch per IEC 60204-1 / NFPA 79.

## Core IEC 61800-5-2 drive safety functions compared

Beyond basic STO, modern servo drives and advanced VFDs offer certified stopping, standstill and motion-monitoring functions:

![Three-panel velocity versus time diagram comparing Safe Torque Off coast-to-stop, Safe Stop 1 controlled ramp before torque cutoff, and Safely-Limited Speed ceiling monitoring](/media/2026/11/diagram-safe-torque-off-sto-functional-safety-drives-iec-61800-5-2.png "Figure 1: STO removes motor torque immediately (uncontrolled coast), SS1 brakes under drive control before engaging STO, and SLS enforces a safe speed envelope during setup.")

| Function | Full Name | IEC 60204-1 Stop Cat. | What It Does | Typical Machine Use Case |
|---|---|---|---|---|
| **STO** | Safe Torque Off | Category 0 | Immediately cuts torque-generating power to motor; load coasts | Low-inertia axes, E-stop after mechanical brake engages, final state after SS1 |
| **SS1** | Safe Stop 1 | Category 1 | Initiates controlled electrical deceleration to zero speed, then triggers **STO** after a safe time delay or zero-speed check | High-inertia spindles, conveyors, saws, packaging drums needing fast active braking |
| **SS2** | Safe Stop 2 | Category 2 | Initiates controlled deceleration, then holds motor under active servo position control via **SOS** (no power removal) | Machine tools and indexers needing rapid restart without losing servo hold or homing |
| **SOS** | Safe Operating Stop | — | Monitors that motor stays within a narrow standstill tolerance window; triggers STO if position drifts | Safe workpiece loading or automated tool changes while servo holds position |
| **SLS** | Safely Limited Speed | — | Monitors motor speed against a safe maximum limit (e.g., 250 mm/s); trips to STO/SS1 if exceeded | Operator teaching, setup, jog-mode web threading, [collaborative robot SSM cells](/blog/industrial-robots-vs-cobots-engineering-comparison) |
| **SDI** | Safe Direction | — | Ensures axis moves only in the permitted direction (positive or negative) | Clearing jams safely away from nip points |
| **SBC** | Safe Brake Control | — | Provides a dual-channel certified output to engage/release a mechanical holding brake in coordination with STO/SS1 | Vertical Z-axes, hoists, inclined conveyors |

## Hardwired safety terminals vs Safety over Industrial Ethernet

For simple machines with 1–4 drives requiring only STO, **hardwired dual-channel 24 V DC** wiring from a safety relay or safety PLC output card to each drive's `STO_A / STO_B` terminals is economical and easy to troubleshoot.

Once a line grows to 6–40 axes — or requires dynamic mode switching such as **SLS during setup**, **zone-by-zone SS1**, or **independent safety zones per machine section** — **networked functional safety** (often called **Black Channel** safety) wins decisively:

- **PROFIsafe** over PROFINET
- **CIP Safety** over EtherNet/IP
- **FSoE (FailSafe over EtherCAT)** over EtherCAT

Because the safety protocol runs over the *same* Ethernet cable as standard cyclic motion data — using sequence counters, watchdogs, unique addresses and CRC checks to detect lost, delayed, corrupted or reordered frames — it eliminates hundreds of safety wires, removes external safety-relay terminal blocks and reports exact channel-level diagnostics directly to the HMI.

### Don't forget cybersecurity for networked drive safety

Under the upcoming [EU Machinery Regulation (EU) 2023/1230](/news/eu-machinery-regulation-2023-1230-january-2027) (effective January 20, 2027), safety-related control parameters — including SLS speed limits, SS1 ramp times and STO wiring configurations inside a drive — must be **protected against accidental or intentional corruption**. Always enable the drive's **safety parameter password/checksum lock**, record the verified safety CRC signature in your machine validation dossier, and restrict engineering access on the drive network in line with [IEC 62443](/blog/iec-62443-explained).

## Verification and validation checklist for drive safety

Before signing off a safety function using [ISO 13849-1 or IEC 62061](/blog/functional-safety-iso-13849-vs-iec-62061-guide):

1. **Check safe-encoder requirements:** Functions like **SOS** and **SLS** require a **safety-rated feedback system** (certified dual-channel or Sin/Cos/safe-protocol encoder) — or certified sensorless safety evaluation for compatible VFDs. A standard incremental encoder alone cannot support PL d/e SLS.
2. **Measure real stopping time and stopping distance** at maximum load and maximum speed, not empty-machine dry runs. Use the measured stopping time to calculate safety light-curtain placement distances per ISO 13855.
3. **Test fault injection:** Verify single-channel wire breaks, cross-channel shorts (`STO_A` to `STO_B`) and OSSD test-pulse compatibility between the safety output card and the drive's STO input filters.
4. **Verify vertical-axis brake timing:** Confirm `SBC` engages the mechanical brake *before* `STO` releases motor holding torque so a heavy vertical head never drops a few millimeters on every E-stop.
5. **Archive the drive safety checksum report** (such as Siemens Safety Acceptance Test log or Rockwell Safety Signature) in the machine's permanent technical file.

When swapping a replacement CNC servo amplifier in the field and troubleshooting persistent Not-Ready states, EDM feedback faults, or missing factory bypass plugs, consult Vcocnc's practical [Safe Torque Off (STO) CNC servo drive wiring and replacement checklist](https://www.vcocncspare.com/news/safe-torque-off-sto-cnc-servo-drive-wiring-replacement-checklist).

=== takeaways
IEC 61800-5-2 defines drive-integrated functional safety functions — led by Safe Torque Off (STO), Safe Stop 1/2 (SS1/SS2), Safe Operating Stop (SOS), Safely Limited Speed (SLS) and Safe Brake Control (SBC).
STO removes switching energy from the drive's IGBT gate circuits via redundant channels to achieve up to SIL 3 / PL e without bulky series mains contactors, keeping diagnostics online for rapid restart.
STO does not actively brake spinning inertia, does not hold vertical suspended loads and does not provide electrical Lockout/Tagout isolation for maintenance work.
High-inertia machines need SS1 active braking, vertical axes need Safe Brake Control (SBC), and setup/teaching operations benefit from Safely Limited Speed (SLS) paired with safety-rated encoders.
For multi-axis lines, networked safety protocols (PROFIsafe, CIP Safety, FSoE) eliminate heavy safety wiring while enabling per-zone SS1 and dynamic SLS modes.

=== faqs
Q: Does Safe Torque Off (STO) replace an upstream main disconnect switch for electrical maintenance?
A: No. STO only prevents the drive from generating motor torque by blocking IGBT gate pulses; hazardous AC mains and DC bus voltages remain inside the drive and potentially at the motor terminals. Electrical Lockout/Tagout still requires opening and locking a physical disconnect switch per IEC 60204-1 or NFPA 79.

Q: What is the difference between STO and SS1?
A: STO (Safe Torque Off) cuts motor torque immediately, allowing the load to coast to a stop (Stop Category 0). SS1 (Safe Stop 1) commands the drive to actively decelerate the motor along a controlled braking ramp to zero speed and then activates STO (Stop Category 1), dramatically reducing stopping time on high-inertia axes.

Q: Can Safe Torque Off be used alone on a vertical axis or hoist?
A: No. Removing torque from a vertical load allows gravity to drop the load unless a fail-safe mechanical holding brake is engaged. Vertical axes require Safe Brake Control (SBC) coordinated with SS1/STO, or independent mechanical arrest mechanisms, verified by risk assessment.

Q: Do I need a special encoder to use Safely Limited Speed (SLS) or Safe Operating Stop (SOS)?
A: Yes, in most servo applications achieving PL d/e or SIL 2/3, motion-monitoring functions such as SLS and SOS require a certified safety-rated encoder (or dual independent feedback channels) so speed and position measurements cannot fail silently.

=== sources
IEC 61800-5-2: Adjustable speed electrical power drive systems — Part 5-2: Safety requirements — Functional (International Electrotechnical Commission) | https://webstore.iec.ch/
IEC 60204-1: Safety of machinery — Electrical equipment of machines — Part 1: General requirements
ISO 13849-1:2023: Safety of machinery — Safety-related parts of control systems | https://www.iso.org/standard/73481.html
Regulation (EU) 2023/1230 on Machinery, Official Journal of the European Union | https://eur-lex.europa.eu/eli/reg/2023/1230/oj
Vcocnc — Safe Torque Off (STO) on CNC Servo Drives: Wiring Verification and Replacement Checklist | https://www.vcocncspare.com/news/safe-torque-off-sto-cnc-servo-drive-wiring-replacement-checklist
