---
title: IO-Link Master and Port Configuration: IEC 61131-9 Guide
slug: io-link-master-port-configuration-iec-61131-9-guide
type: BLOG
category: industrial-networking
author: edward
tags: Instrumentation and signals, IIoT
publishedAt: 2026-11-28T02:46:00Z
excerpt: IO-Link is a point-to-point digital link from one master port to exactly one device, so almost every commissioning problem is a port configuration problem rather than a network problem. This guide covers the three baud rates, the 400 microsecond transmission floor, the 20 metre unshielded cable limit, port class A versus B, and what the data storage mechanism does when a sensor is swapped.
seoTitle: IO-Link Master Port Configuration and Cycle Time
seoDescription: Configure IO-Link ports properly: COM1 to COM3 rates, the 400 microsecond floor, the 20 metre cable limit, port class A vs B and data storage on swap.
coverImage: /media/2026/11/cover-io-link-master-port-configuration-iec-61131-9-guide.jpg
coverAlt: Technical editorial illustration of an IO-Link master with four ports each connected point to point to one sensor, with cycle time and parameter storage annotated
coverCaption: IO-Link is not a fieldbus. Every port owns exactly one device, and that changes how you troubleshoot it.
---
IO-Link is a short-distance, bidirectional, digital, point-to-point link between one master port and exactly one device, standardised as IEC 61131-9 and maintained by PROFIBUS and PROFINET International. Because the topology has no shared medium, there is no addressing, no bus arbitration and no baud-rate negotiation between devices: the master port is configured deliberately, and the device obeys. Almost every "IO-Link problem" reported on a running machine is therefore a port configuration or a parameter-storage problem, not a network problem, which is why a competent technician fixes them in minutes while a fieldbus mindset keeps looking for the wrong fault.

This guide covers the parts that actually decide whether a port comes up: the three transmission rates, the cycle-time budget, the cable limit, port class A versus B, and the data storage behaviour that makes a sensor swap painless or catastrophic.

## What IO-Link actually is, and where it stops

An IO-Link system is a master plus one or more devices. The master is the interface to the higher-level controller - a PLC over PROFINET, EtherNet/IP, EtherCAT or a simpler fieldbus - and each master port talks to one device only. A port can also host a hub that concentrates conventional switching sensors, but the hub is still a single IO-Link device on that port.

The standard defines four data types on the link: process data, value status, device data and event data. Process data is the cyclic payload the PLC actually uses; everything else exists to make that payload trustworthy - a value status bit tells the PLC whether the process value is valid, device data carries parameters, and events carry diagnostics.

Three practical consequences follow, and each of them breaks a habit carried over from fieldbus work:

- **There is no device address to set.** The physical port is the address. Moving a device to another port means re-addressing it in the PLC, not on the device.
- **Devices are not hot-swap identical until the master writes parameters.** A replacement sensor of the same type comes up with factory defaults, and its measuring range, switching points or filter settings may not match the one it replaced.
- **A port failure is isolated.** One dead device costs one port. This is the main engineering reason to prefer IO-Link over an analogue 4-20 mA channel: an analogue channel that drifts cannot tell you it drifted, while IO-Link carries the value status with the value.

## The three baud rates and the 400 microsecond floor

IO-Link runs at one of three fixed transmission rates, selected per port by the master:

![Diagram of an IO-Link master with four ports: port one a photo sensor at COM2 with a 2 millisecond cycle, port two a pressure switch at COM2 with 3 milliseconds, port three a class B valve at COM3 set to 1 millisecond which is below its 2.4 millisecond minimum and flagged as an error, port four an IO hub at COM1 with 5 milliseconds, alongside notes on the 400 microsecond transmission floor and the 20 metre cable limit](/media/2026/11/diagram-io-link-master-port-configuration-iec-61131-9-guide.png "Figure 1: Port 3 is configured below its device minimum. The port still reports data; what it does not report is that it is retrying.")

| Rate | Bit rate | Typical use | Practical consequence |
| --- | --- | --- | --- |
| COM1 | 4.8 kbaud | Long cable, electrically noisy cabinets | Slowest cycle, most tolerant |
| COM2 | 38.4 kbaud | Default for most digital sensors | Balanced |
| COM3 | 230.4 kbaud | Fast sensors, short cycle requirements | 400 µs minimum transmission time |

The 230.4 kbaud rate has a minimum transmission time of 400 microseconds, which is the physical floor of the link - not the cycle time of your application. The configured cycle time is always longer, because it must also accommodate the master's processing and the device's response time, and the device datasheet states the minimum cycle time it can support. A common commissioning mistake is to set a 1 ms cycle on a device whose minimum is 2.4 ms: the master accepts the setting, the port reports data, and the diagnostics quietly show retries.

Choose the rate from the device's minimum cycle time and the cable length, not from ambition:

```text
Port cycle budget (per port, not per master)
  = master processing
  + device minimum cycle time (datasheet)
  + margin for retries on a noisy segment
```

If a device reports a minimum cycle time of 2 ms at COM3, setting 2 ms leaves zero margin for a single retry and produces intermittent events under load. Set 3 to 4 ms and the port becomes boring, which is what a production port should be.

## Port classes, connectors and the 20 metre limit

Cabling is unshielded, three or five conductor, and not longer than 20 metres. The connector is standardised - M5, M8 or M12 depending on port class - and the pin assignment follows IEC 60947-5-2.

| Port class | Connector | Pins | Extra conductor | When to use |
| --- | --- | --- | --- | --- |
| Class A | M5, M8 or M12 | Up to 4 | None | Standard sensors and actuators |
| Class B | M12 only | 5 | Additional supply for high-current devices | Valves, actuators, devices needing galvanically separated auxiliary power |

Class B exists because a device may need more current than a class A port can deliver, or may need its auxiliary supply separated from the communication supply so that switching a valve does not disturb the link. Using a class B device on a class A port is not a configuration error that the master can always detect; it simply fails, often intermittently, under load.

The 20 metre limit is not conservative marketing. The link is unshielded by design, so the limit is an EMC claim: within 20 metres in an industrial cabinet the signal survives the switching noise the standard assumes. Running 35 metres "because it works on the bench" produces a port that fails when a neighbouring VFD starts. If the distance is longer, put the master closer and run the fieldbus or industrial Ethernet the longer distance instead - those are shielded and designed for it.

## IODD, parameter data and the data storage mechanism

Every device type is described by an IODD - an IO Device Description in XML - which the engineering tool uses to present parameters with names, ranges and units instead of raw indices. The IODD is not installed on the device; it lives in the engineering tool and the master. A device that is not in the IODD catalogue can still be used, but commissioning it means writing raw parameter indices by hand, which is where transcription errors enter.

Data storage is the mechanism that makes a sensor swap safe. When enabled, the master keeps a copy of the device's parameters. On replacement, the master detects a device with the same identity but factory-default parameters and writes the stored set back, so the sensor behaves like the one it replaced. Two conditions break it:

1. **The replacement is a different order code.** The master compares the device identity; a functionally similar but differently ordered sensor will not receive the stored parameters, and the port comes up in a default state.
2. **Data storage was disabled on the port.** Many masters ship with it configurable per port. If it was disabled during initial commissioning "to avoid surprises", the first sensor failure after two years will produce a machine that runs with the wrong measuring range.

Enable data storage at commissioning, verify it by pulling one sensor and watching the port log, and record the order codes in the maintenance documentation. That single test at commissioning is worth more than any spare part stocked later.

## Commissioning sequence that survives a device swap

A repeatable sequence, in order, for each port:

1. Confirm the device's minimum cycle time from its datasheet, then set the port cycle time at least one millisecond above it.
2. Set the transmission rate to the lowest rate that satisfies the cycle requirement - COM2 unless there is a reason.
3. Load the correct IODD in the engineering tool and check that the parameter names resolve, not just the indices.
4. Write parameters, then read them back from the device rather than trusting the tool's cache.
5. Enable data storage on the port and verify it by swapping one device while the master is live.
6. Map the value status bit into the PLC alongside the process value, and alarm on it - a value without its status is an analogue channel with extra steps.
7. Record order codes, cycle time, rate and parameter set in the machine documentation.

Step 6 is the one most often skipped, and it defeats the main advantage of the standard. If the PLC ignores value status, an invalid process value enters a calculation or a trend and the plant cannot tell whether a number was measured or invented. IO-Link gives you the flag for free; not wiring it is a choice to lose it.

## What IO-Link cannot do

Setting expectations prevents architecture mistakes:

- **It does not replace safety functions.** Safety over IO-Link exists through a separate certified mechanism, and a standard port carries no safety integrity claim. Interlocks belong on safety-rated hardware, not on a standard port.
- **It does not span long distances.** Twenty metres is the documented limit; it is a cabinet-and-machine link, not a plant backbone.
- **It does not offer determinism comparable to a motion bus.** Cycle time is per port and configured, but nothing in the standard claims the jitter behaviour of EtherCAT for closing a fast loop.
- **It does not eliminate engineering.** The IODD makes parameters visible, not correct. Choosing the switching point, the filter constant and the measuring range is still an instrument engineering task.

Used for what it is - a short, single-device, diagnostic-rich link at the sensor level - IO-Link removes an entire class of analogue troubleshooting. Used as a fieldbus replacement, it produces a master with thirty ports that all need individual engineering and a technician who cannot find the fault because they are still looking for the bus.

For the layer above, see [EtherNet/IP and CIP networking](/blog/ethernet-ip-cip-implicit-io-rpi-switch-configuration-guide) and the [industrial edge gateway selection guide](/blog/industrial-edge-gateways-selection-deployment-guide). For the analogue signal it replaces, see [HART on a 4-20 mA loop](/blog/hart-protocol-4-20ma-loop-commissioning-guide) and [Pt100 lead resistance](/blog/pt100-rtd-2-3-4-wire-lead-resistance-error-guide).

=== takeaways
IO-Link is point-to-point: one master port, one device, no address to configure. Troubleshooting starts at the port, not the network.
The three rates are 4.8, 38.4 and 230.4 kbaud, and 230.4 kbaud has a 400 microsecond minimum transmission time that is a physical floor, not a usable cycle time.
Set the port cycle time at least 1 ms above the device's datasheet minimum cycle time, or you are configuring silent retries.
Cable is unshielded and limited to 20 metres; exceeding it works on the bench and fails when a nearby drive starts.
Port class B exists for high-current or separated auxiliary supply devices and will not work reliably on a class A port.
Enable data storage at commissioning and prove it by swapping a device live; keep order codes identical for replacements.
Map the value status bit into the PLC, otherwise IO-Link gives you no diagnostic advantage over an analogue channel.

=== faqs
Q: Is IO-Link a fieldbus?
A: No. It is a point-to-point link between one master port and one device. The master connects upward to a fieldbus or industrial Ethernet. That is why there are no device addresses and no bus arbitration to troubleshoot.

Q: Why is my device's cycle time slower than the value I configured?
A: The port cycle cannot be shorter than the device's minimum cycle time from its datasheet, and the master also adds processing time. A setting below the device minimum results in retries and diagnostics, not more samples.

Q: What happens when I replace a sensor with data storage enabled?
A: The master detects a device of the same identity with factory-default parameters and restores the stored parameter set, so the replacement behaves like the original. If the order code differs, the restore does not happen and the port comes up at defaults.

Q: Can I run IO-Link cable 30 metres?
A: Not within the standard. The limit is 20 metres of unshielded three or five conductor cable. It may appear to work on a quiet bench and fail intermittently once switching noise is present. Move the master closer instead.

Q: Do I need the IODD to use a device?
A: You can commission without it by writing raw parameter indices, but you lose parameter names, valid ranges and units. That is how transcription errors get into a machine that then behaves oddly for years.

Q: Is IO-Link suitable for safety functions?
A: Not a standard port. Safety over IO-Link requires the specific certified mechanism and devices, and carries its own integrity claims. A standard port must never carry an interlock.

=== sources
IO-Link, Wikipedia (IEC 61131-9, transmission rates, 400 microsecond minimum transmission time, 20 metre unshielded cable, port class A and B, IODD), https://en.wikipedia.org/wiki/IO-Link
IEC 61131-9, *Programmable controllers - Part 9: Single-drop digital communication interface for small sensors and actuators (SDCI)*.
IEC 60947-5-2, *Low-voltage switchgear and controlgear - Part 5-2: Control circuit devices and switching elements - Proximity switches*.
PROFIBUS and PROFINET International, *IO-Link Interface and System Specification*.
