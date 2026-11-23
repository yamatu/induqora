---
title: Modbus RTU vs Modbus TCP: Architecture, Addressing, Limitations and Migration Guide
slug: modbus-rtu-vs-modbus-tcp-industrial-guide
type: BLOG
category: industrial-networking
author: edword
tags: Modbus TCP, Industrial Ethernet, OPC UA, PROFINET, OT security
publishedAt: 2026-10-15T09:00:00Z
excerpt: Nearly fifty years after its invention, Modbus remains everywhere on the factory floor — on power meters, VFDs, temperature controllers and gateways. Compare Modbus RTU over RS-485 and Modbus TCP over Ethernet, fix classic addressing and byte-order traps, and know when to migrate.
seoTitle: Modbus RTU vs Modbus TCP: Addressing, Limits & Security
seoDescription: Compare Modbus RTU (RS-485) and Modbus TCP (port 502): framing, 0-based vs 1-based addressing, 32-bit float byte order, security gaps and migration tips.
---
First published by Modicon in **1979**, **Modbus** has outlived almost every competing fieldbus of its era. Walk into a modern plant running cutting-edge [PROFINET, EtherNet/IP or EtherCAT](/blog/profinet-vs-ethernet-ip-vs-ethercat) on its primary production lines, and you will still find Modbus everywhere around the edges: sub-metering power analyzers, VFDs, chillers, boiler controllers, level transmitters and legacy PLC skids.

Its endurance comes from radical simplicity — the protocol is royalty-free, fits in a few kilobytes of microcontroller flash and can be debugged with a laptop and a basic packet capture. Yet that very simplicity hides recurring commissioning headaches: 0-based vs 1-based register offsets, inconsistent 32-bit float byte ordering, RS-485 bus wiring mistakes and a **total absence of built-in security**.

## Modbus RTU vs Modbus TCP: side-by-side comparison

Both variants share the exact same **Protocol Data Unit (PDU)** — a 1-byte **Function Code** plus payload data — wrapped inside different transport frames:

| Feature | Modbus RTU (Serial) | Modbus TCP (Ethernet) |
|---|---|---|
| **Physical / transport layer** | RS-485 (2-wire half-duplex, most common) or RS-232 | Standard Ethernet TCP/IP (default **TCP port 502**) |
| **Framing & error check** | Binary frame delimited by **3.5 character silent intervals** + **CRC-16** | **7-byte MBAP header** (Transaction ID, Protocol ID, Length, Unit ID) + TCP checksum |
| **Device addressing** | 1-byte Slave / Server ID (`1–247`; `0` = broadcast) | IP address (plus 1-byte **Unit ID** used when routing through TCP-to-RTU gateways) |
| **Typical data rate** | 9,600 – 115,200 bps (19,200 bps most common) | 100 Mbps / 1 Gbps Ethernet |
| **Maximum cable distance** | Up to ~1,200 m (4,000 ft) at low baud rates on RS-485 | 100 m per copper hop; kilometers over fiber / switched Ethernet |
| **Concurrency** | **Strictly one master/client polling one device at a time** | Multiple simultaneous TCP clients supported by most modern servers |
| **Maximum nodes** | Up to 32 standard unit loads per RS-485 segment (up to 247 with repeaters / fractional-load transceivers) | Limited only by IP subnetting and server connection slots |
| **Built-in security** | None | None in standard TCP port 502 (optional **Modbus/TCP Security** uses TLS on port 802, rarely deployed on legacy gear) |

## The four Modbus data tables and function codes

Every Modbus server exposes data through four conceptual address areas (though some devices overlap coils/registers internally):

| Table Name | Object Type | Access | Common "Modicon" Reference | Core Function Codes |
|---|---|---|---|---|
| **Coils** | 1-bit discrete output | Read / Write | `00001 – 09999` (or `0xxxx`) | `FC 01` (Read), `FC 05` (Write Single), `FC 15` (Write Multiple) |
| **Discrete Inputs** | 1-bit discrete input | Read-only | `10001 – 19999` (or `1xxxx`) | `FC 02` (Read) |
| **Input Registers** | 16-bit word | Read-only | `30001 – 39999` (or `3xxxx`) | `FC 04` (Read) |
| **Holding Registers** | 16-bit word | Read / Write | `40001 – 49999` (or `4xxxx`) | `FC 03` (Read), `FC 06` (Write Single), `FC 16` (Write Multiple) |

## The three classic Modbus commissioning traps

If you have spent an afternoon staring at garbage readings from a new energy meter or VFD, odds are you hit one of these three issues:

### 1. The off-by-one addressing trap (`40001` vs `0`)

Human-readable vendor manuals often use **1-based Modicon notation** where the first Holding Register is called `40001`. On the wire, however, Modbus protocol frames transmit **0-based offsets** (`0x0000` for `40001`).

- Leading prefix `4` is **not transmitted on the wire** — it simply tells the engineer to use Function Code `03` (or `06`/`16`).
- Some vendors list register maps in **0-based hex** (`0x0000`), others in **1-based decimal** (`1`), and others in **5-digit or 6-digit Modicon format** (`40001` or `400001`).
- **Quick check:** Read a known constant register (such as nominal line frequency `50`/`60` or firmware version). If the value shows up in register `N-1` or `N+1`, you have a 1-based vs 0-based mismatch.

### 2. 32-bit float and `DINT` byte/word order (endianness)

Modbus natively defines only **16-bit big-endian registers**. The core specification never standardized how to pack 32-bit IEEE 754 floating-point numbers or 32-bit integers across two consecutive 16-bit registers (`AB` and `CD`). As a result, four incompatible orders exist across real field devices:

- **Big-Endian (`ABCD`):** High word first, high byte first.
- **Word-Swapped Big-Endian (`CDAB`):** Low 16-bit register first, big-endian bytes inside each register (extremely common in Schneider, Modicon and many power meters).
- **Little-Endian (`DCBA`):** Fully reversed byte order.
- **Byte-Swapped (`BADC`):** Less common, seen on niche embedded controllers.

Always test a known non-zero analog reading (like `230.0 V` or `25.0 °C`) during bench testing and document the verified byte/word swap setting directly in your edge-gateway mapping table.

### 3. RS-485 physical layer mistakes on Modbus RTU

Half of all Modbus RTU timeouts are electrical, not software:

- **Swapped `A`/`B` (`D+`/`D-`) polarity:** Manufacturers disagree on whether `A` is `+` or `-`! Swapping the pair will not damage RS-485 transceivers — it simply stops communication dead.
- **Missing or misplaced termination resistors:** Place **120 Ω** termination resistors **only at the two physical ends** of a daisy-chain bus (never in the middle, and avoid star wiring topologies).
- **Missing common signal reference:** RS-485 is differential, *not* magically ground-free; without a common ground/shield reference (or isolated repeaters between panels with different ground potentials), common-mode voltage exceeds the transceiver's `-7 V to +12 V` limit and corrupts frames.
- **Slow polling budgets:** On a 9,600 bps bus with 20 power meters and 100 ms per request/turnaround, a single poll sweep takes 2+ seconds — group contiguous registers into block reads (up to 125 registers per `FC 03` request) instead of polling one tag at a time.

## The security reality of Modbus

Neither Modbus RTU nor standard Modbus TCP has **authentication, authorization or encryption**. Any host able to reach TCP port 502 on a PLC or RTU can send `FC 06` or `FC 16` to overwrite setpoints or `FC 05` to toggle outputs — with zero credentials required.

If you must keep Modbus TCP running on your plant floor:

1. **Never expose TCP port 502 to corporate IT or the internet.** Restrict Modbus TCP strictly inside an [IEC 62443 control zone](/blog/iec-62443-explained) with firewall allow-lists permitting only the exact IP address of the authorized master/gateway.
2. **Use deep-packet-inspection (DPI) OT firewalls** where telemetry crosses zone boundaries — allowing only read function codes (`FC 01–04`) toward historians or [IIoT edge gateways](/blog/industrial-edge-gateways-selection-deployment-guide) while explicitly blocking write codes (`FC 05, 06, 15, 16`).
3. **Disable unused Modbus TCP server interfaces** on PLCs that already communicate over PROFINET, EtherNet/IP or OPC UA.

## When to keep Modbus — and when to migrate

**Keep Modbus** for low-speed auxiliary monitoring (sub-meters, chillers, HVAC, simple VFDs) behind a local [edge gateway](/blog/industrial-edge-gateways-selection-deployment-guide) that converts Modbus into authenticated **OPC UA** or **MQTT/Sparkplug** northbound — see [OPC UA vs MQTT](/blog/opc-ua-vs-mqtt).

**Migrate away from Modbus** when you need:

- Deterministic high-speed I/O or synchronized motion (use **PROFINET, EtherNet/IP or EtherCAT**).
- Self-describing structured tags, timestamps and engineering units without manual register maps (use **OPC UA**).
- Functional safety over the network (Modbus has no safety profile — use **PROFIsafe, CIP Safety or FSoE**).
- Built-in certificate-based authentication and encryption for EU Cyber Resilience Act or NIS2 environments.

=== takeaways
Modbus RTU runs over serial RS-485 using 3.5-character frame gaps and CRC-16 checks, while Modbus TCP wraps the same function codes in a 7-byte MBAP header over Ethernet TCP port 502.
The most common Modbus commissioning faults are 1-based vs 0-based register offsets, mismatched 32-bit float byte/word ordering (ABCD vs CDAB) and RS-485 polarity, grounding or termination errors.
Standard Modbus TCP includes zero authentication or encryption, meaning any host reaching port 502 can issue write commands unless blocked by OT firewall allow-lists and function-code inspection.
Modbus remains practical for auxiliary monitoring behind an edge gateway, but high-speed deterministic control, self-describing data models, functional safety and built-in security require modern Ethernet protocols or OPC UA.

=== faqs
Q: What is the main difference between Modbus RTU and Modbus TCP?
A: Modbus RTU is a serial protocol typically running over 2-wire RS-485 with one master polling devices sequentially using CRC-16 error checking. Modbus TCP runs over standard Ethernet TCP/IP on port 502, supports multiple concurrent clients and higher speeds, and replaces the CRC with TCP error checking plus a 7-byte MBAP header.

Q: Why are my Modbus Holding Register values off by one address?
A: Vendor documentation frequently uses 1-based Modicon numbering (starting at 40001), whereas Modbus protocol frames use 0-based register offsets (starting at 0). Checking a known constant register and subtracting or adding 1 resolves the offset mismatch.

Q: Why do 32-bit floating-point numbers read as nonsense over Modbus?
A: Modbus registers are 16 bits wide and the core specification does not mandate how 32-bit IEEE 754 floats are split across two registers. Different vendors use ABCD (big-endian), CDAB (word-swapped), DCBA (little-endian) or BADC ordering, so the client must match the device's byte/word swap setting.

Q: Is Modbus TCP secure for modern factories?
A: Standard Modbus TCP on port 502 has no authentication or encryption. Operators should isolate it inside segmented IEC 62443 OT zones, restrict source IPs, use OT firewalls to block write function codes on read-only telemetry paths, and translate data to OPC UA or TLS-secured MQTT at the edge.

=== sources
Modbus Organization — Modbus Application Protocol Specification V1.1b3 & Messaging on TCP/IP Implementation Guide | https://modbus.org/specs.php
Modbus Organization — Modbus/TCP Security Protocol Specification | https://modbus.org/docs/MB-TCP-Security-v21_2018-07-24.pdf
NIST SP 800-82 Rev. 3: Guide to Operational Technology (OT) Security | https://csrc.nist.gov/pubs/sp/800/82/r3/final
IEC 61158: Industrial communication networks — Fieldbus specifications
