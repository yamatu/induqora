---
title: HART on a 4-20 mA Loop: Commissioning and Fault Signalling
slug: hart-protocol-4-20ma-loop-commissioning-guide
type: BLOG
category: process-automation-dcs
author: edward
tags: Instrumentation and signals, Process control
publishedAt: 2026-11-28T02:47:00Z
excerpt: HART overlays a digital signal on an existing 4-20 mA current loop, which means one pair of wires carries both the process value and the diagnostics. This guide covers Bell 202 frequency-shift keying, point-to-point versus multidrop behaviour, the fixed 4 mA in multidrop, address ranges by revision, and the under-range and over-range bands that decide whether a DCS sees a fault or a plausible lie.
seoTitle: HART on 4-20 mA Loops: Commissioning Guide
seoDescription: Commission HART transmitters on 4-20 mA loops: Bell 202 FSK overlay, point-to-point vs multidrop 4 mA, address ranges by revision and 3.8/20.5 mA fault bands.
coverImage: /media/2026/11/cover-hart-protocol-4-20ma-loop-commissioning-guide.jpg
coverAlt: Technical editorial illustration of a two-wire 4-20 mA current loop carrying a superimposed HART frequency shift keyed digital signal
coverCaption: One pair of wires carries the measurement and the confession. Reading both is the whole point of HART.
---
HART is a hybrid analog-plus-digital protocol: a frequency-shift keyed digital signal is superimposed on a conventional 4-20 mA current loop, sharing the same pair of wires that carries the process value. On the OSI model it occupies layer 7, with Bell 202 as the physical layer, and layers 3 through 6 are unused. That architecture explains both why HART is the most widely deployed industrial protocol in process plants and why it is so often commissioned badly: the analogue signal works perfectly while the digital channel is misconfigured, so nothing appears broken until someone needs a diagnostic or a second variable.

This guide covers the decisions that decide whether a HART loop is trustworthy: point-to-point versus multidrop, address configuration by revision, fault signalling bands, and the loop-resistance budget that limits cable length and hand-held communicator placement.

## What the loop actually carries

In point-to-point mode, the digital signal is overlaid on the 4-20 mA current and both are valid simultaneously. The transmitter's polling address is 0, only one instrument may sit on that signal pair, and the analogue current represents the primary measured variable while everything else - secondary variables, device status, calibration data - travels digitally.

That combination is the reason HART survives. A plant with thousands of 4-20 mA loops can add device diagnostics without rewiring, because the analogue path stays available if the digital path is lost. It also creates a specific failure mode that technicians misread: an analogue value that looks correct tells you nothing about the state of the digital channel. A transmitter can be reporting a perfect 12.00 mA while its digital identity, its range settings and its diagnostic flags are unreadable.

The practical test is simple and almost never performed at commissioning: read the device's identity and one diagnostic parameter over HART, at the same time as reading the analogue current, and confirm that both agree about the measured variable.

## Point-to-point versus multidrop

The two modes are not a preference, they are different instruments:

![Diagram of a HART loop from a two-wire transmitter through a cable pair and a 250 ohm sense resistor to an analogue input and a HART modem, with fault bands at 3.8 milliamps and 20.5 milliamps marked outside the live 4 to 20 milliamp range, and multidrop address ranges by HART revision](/media/2026/11/diagram-hart-protocol-4-20ma-loop-commissioning-guide.png "Figure 1: The analogue band is self-monitoring only if the input block flags 3.8 and 20.5 mA instead of clamping to 0 and 100 percent.")

| Aspect | Point-to-point | Multidrop |
| --- | --- | --- |
| Analogue current | Carries the primary variable | Fixed at 4 mA |
| Devices per pair | One | Several, each with a unique address |
| Primary variable | Analogue and digital | Digital only |
| Loop scan rate | Fast, independent per loop | Shared; polling all devices takes time |
| Typical use | Continuous control, trending | Monitoring, diagnostics, non-control points |

Multidrop mode fixes the loop current at 4 mA and allows more than one instrument per pair, with each device requiring a unique address. The fixed 4 mA is not a fault indication - it is the mode. A DCS configured to treat 4 mA as a valid low-end measurement will read every multidropped transmitter as sitting exactly at the bottom of its range, which is a plausible lie rather than an alarm.

Address ranges depend on the HART revision in use:

| Revision | Address range in multidrop |
| --- | --- |
| Revisions 3 to 5 | 1 to 15 |
| Revision 6 | 1 to 63 |
| Revision 7 | 0 to 63 |

The consequence for a mixed plant: a revision 5 transmitter cannot be given an address above 15, and a revision 7 master may legitimately use address 0 while a revision 5 device on the same segment interprets 0 as point-to-point. Before commissioning a multidrop segment, list the revision of every device on it. Mixing revisions on one pair is legal, but the address plan has to satisfy the oldest device.

## Fault signalling: the 3.8 and 20.5 mA bands

A current loop is self-monitoring in a way that a voltage signal is not: currents below 3.8 mA or above 20.5 mA are taken to indicate a fault rather than a measurement. This under-range and over-range convention is what allows a DCS to distinguish "the process is at the bottom of its range" from "the transmitter has died or the wire is broken".

The engineering task is to make the PLC or DCS agree with that convention:

1. **Configure the analogue input block to flag under-range below 3.8 mA and over-range above 20.5 mA**, rather than clamping silently to 0 percent and 100 percent.
2. **Map those flags to an alarm** that names the loop, not a generic "analogue input fault" on the rack.
3. **Verify with a loop calibrator at commissioning**: drive 3.6 mA and 21.0 mA and confirm the alarm appears, then drive 4.0 and 20.0 mA and confirm it clears.

Step 3 takes two minutes per loop and is the only way to know the alarm path works. Plants that skip it discover during an incident that the fault flag was disabled to stop nuisance alarms years earlier, and nobody remembers.

A related trap is the split-range or stacked transmitter: a device whose configured range does not match the range configured in the control system. The analogue value is then perfectly linear and perfectly wrong, and no fault band catches it. That is why the commissioning record must contain the device's configured lower and upper range values, read back over HART, not copied from the datasheet.

## Loop resistance, cable length and communicator placement

The current loop tolerates long cables, but only within the resistance allowed by the supply voltage. Every element in the loop drops voltage: the transmitter itself, the receiving input resistance, any barrier, and the cable. A 250 ohm sense resistor at 20 mA drops 5 V on its own, which is a quarter of a 24 V supply before anything else is counted.

Two practical rules follow:

- **Compute the budget, do not estimate it.** Sum the sense resistance, the barrier resistance and the cable resistance (loop length times conductor resistance per metre), multiply by 20 mA, and confirm that the remainder still exceeds the transmitter's minimum operating voltage at its terminals.
- **HART communication needs a defined load.** A hand-held communicator requires enough loop impedance to develop a readable signal and must be connected across the loop, not in series. On very low-impedance loops the communicator fails to connect while the analogue signal is fine, which reads as "the transmitter has no HART" when the loop simply has no load.

The same budget explains why intrinsic safety barriers and HART sometimes disagree: the barrier adds resistance that helps the digital signal and hurts the voltage margin. Both effects are real, and only the arithmetic tells you which one wins.

## A commissioning sequence that catches the real faults

Per loop, in order:

1. Read the device identity, revision and configured range over HART; record the range as read, not as specified.
2. Confirm the analogue value and the digital primary variable agree within the loop's stated accuracy.
3. Confirm the polling address matches the intended mode: 0 for point-to-point, unique and revision-compatible for multidrop.
4. Verify multidrop loops are configured in the control system to ignore the fixed 4 mA as a measurement.
5. Drive 3.6 and 21.0 mA with a calibrator and confirm the under-range and over-range alarms appear and are attributed to this loop.
6. Check the loop resistance budget and the communicator's ability to connect at the worst-case loop impedance.
7. Record diagnostics baseline: device status bytes, and any non-zero counters, so a future change is visible.

Step 7 is the one that pays off years later. A transmitter whose status bytes were already non-zero at commissioning is not a new failure; it is a pre-existing condition that someone finally noticed.

## Where HART fits and where it does not

HART is excellent for what it was designed for: extracting diagnostics and secondary variables from an installed analogue base without rewiring. It is a poor choice for anything that needs speed - a multidropped segment polled device by device is slow by construction - and it has no place in a control loop that closes faster than its update rate allows.

It also does not replace a digital fieldbus where the device data is the point. Plants that install a HART multiplexer to read diagnostics from four hundred transmitters are using it correctly; plants that try to run control over a multidropped segment discover why the analogue path existed.

For the digital alternatives at the sensor level, see the [IO-Link master and port configuration guide](/blog/io-link-master-port-configuration-iec-61131-9-guide). For the temperature sensor whose resistance is being converted to that current, see [Pt100 lead resistance](/blog/pt100-rtd-2-3-4-wire-lead-resistance-error-guide). For the layer where these loops are terminated and historised, see [SCADA historian architecture](/blog/scada-historian-architecture-compression-buffering-guide).

=== takeaways
HART overlays Bell 202 frequency-shift keying on the 4-20 mA current, so one pair carries the process value and the diagnostics; a good analogue value says nothing about the digital channel.
Point-to-point uses address 0 with a live analogue signal; multidrop fixes current at 4 mA and carries the primary variable digitally only.
Multidrop addresses are 1-15 for revisions 3 to 5, 1-63 for revision 6, and 0-63 for revision 7, so the address plan must satisfy the oldest device on the segment.
Currents below 3.8 mA or above 20.5 mA indicate a fault; configure the analogue input to flag those bands instead of clamping silently.
Verify the fault path with a loop calibrator at 3.6 and 21.0 mA per loop, at commissioning, or the alarm exists only on paper.
HART needs loop impedance to communicate; a communicator that will not connect on a low-impedance loop is a load problem, not a dead transmitter.
Record the device range as read back over HART, because a range mismatch produces a perfectly linear, perfectly wrong value that no fault band detects.

=== faqs
Q: Can I use HART and 4-20 mA at the same time?
A: Yes, in point-to-point mode. The digital FSK signal is superimposed on the analogue current and both are valid. That is the entire design premise of HART and the reason it could be retrofitted to existing loops.

Q: Why does my multidropped transmitter always read 4 mA?
A: Because multidrop mode fixes the loop current at 4 mA and carries the primary variable digitally. The control system must be configured to take the value from HART, not from the analogue input.

Q: What current indicates a fault?
A: Below 3.8 mA or above 20.5 mA. Configure the analogue input block to flag those bands as under-range and over-range; clamping them silently to 0 and 100 percent throws away the only self-diagnostic the loop has.

Q: Why can my communicator not connect when the signal reads fine?
A: HART needs loop impedance to develop a readable signal. On a very low-impedance loop the analogue value is fine and the digital link fails. Add or check the sense resistor and connect across the loop.

Q: Can I control a process over HART?
A: Slow supervisory functions, yes. Anything closing a loop needs an update rate HART does not guarantee, and a multidropped segment polls devices one at a time. Use it for diagnostics and monitoring.

Q: Does HART need a separate cable for configuration?
A: No. Configuration and diagnostics travel on the same pair. A hand-held communicator connects across the existing loop, which is why HART commissioning can be done on a running plant without rewiring.

Q: How do I know the transmitter range matches the control system?
A: Read it back over HART and record it. A mismatch between the device range and the configured range produces a linear but wrong value that no fault band will catch.

=== sources
Highway Addressable Remote Transducer Protocol, Wikipedia (hybrid analog and digital protocol, Bell 202 physical layer, OSI layer 7, point-to-point address 0, multidrop fixed 4 mA, address ranges by revision), https://en.wikipedia.org/wiki/Highway_Addressable_Remote_Transducer_Protocol
Current loop, Wikipedia (4-20 mA loop-powered transmitters, fault indication below 3.8 mA and above 20.5 mA), https://en.wikipedia.org/wiki/Current_loop
NAMUR, Wikipedia (association history and its role in 4-20 mA current loop and NAMUR sensor standards), https://en.wikipedia.org/wiki/NAMUR
IEC 61158, *Industrial communication networks - Fieldbus specifications*.
