---
title: MQTT Sparkplug B Explained: Architecture, Topics and Edge Deployment
slug: mqtt-sparkplug-b-architecture-industrial-iiot-guide
type: BLOG
category: iiot-edge
author: edward
tags: Sparkplug, MQTT, IIoT, Unified Namespace, Edge computing
publishedAt: 2026-11-26T01:00:00Z
excerpt: Plain MQTT gives industrial teams lightweight publish-subscribe transport, but leaves topic naming, payload structure, and disconnect state undefined. Eclipse Sparkplug B (ISO/IEC 20237) closes those gaps with a deterministic namespace, Protobuf payloads, and birth/death session state.
seoTitle: MQTT Sparkplug B Explained: Architecture & Edge Guide
seoDescription: Guide to Eclipse Sparkplug B (ISO/IEC 20237): topic namespace, NBIRTH/NDEATH state management, Protobuf payloads, RBE savings, and UNS edge setup.
coverImage: /media/2026/11/cover-mqtt-sparkplug-b-architecture-industrial-iiot-guide.jpg
coverAlt: Technical editorial illustration of an MQTT Sparkplug B publish-subscribe broker connecting industrial edge gateways, PLCs, and SCADA host applications
coverCaption: Eclipse Sparkplug B turns stateless MQTT into a self-describing, state-aware industrial bus using birth/death certificates and binary Protobuf payloads.
---
Standard MQTT (version 3.1.1 and 5.0) was built as a minimalist publish-subscribe transport, not an industrial data model. That simplicity is a gift for constrained networks, but on a factory floor it immediately creates three integration headaches: every integrator invents a different topic hierarchy, payloads devolve into ad-hoc JSON blobs with inconsistent timestamps and types, and downstream SCADA or analytics clients have no reliable way to tell whether a quiet sensor is simply unchanged or physically powered off.

**Eclipse Sparkplug B** — standardized as **ISO/IEC 20237** with the Sparkplug 3.0 specification — solves these exact problems without abandoning standard MQTT brokers. It defines an interoperable topic namespace, a compact binary payload encoding based on Google Protocol Buffers, and strict **state-aware session semantics** built around Birth and Death certificates.

## Why plain MQTT breaks down in plant-wide OT deployments

Engineers evaluating [OPC UA vs MQTT](/blog/opc-ua-vs-mqtt) quickly notice that MQTT decouples producers from consumers through a broker, eliminating brittle point-to-point polling. Yet unconstrained MQTT deployments regularly fail when scaled beyond a single pilot line:

- **No self-describing tag discovery:** A subscriber receiving `{"t": 72.4}` on `line4/oven/temp` cannot tell the engineering unit, data type (Float vs Int32), scaling factor, or whether more tags exist on that PLC until someone shares a spreadsheet.
- **Ambiguous silence:** Because MQTT works best with **Report by Exception (RBE)** — publishing only when values change — an hour of silence on a tank-level topic could mean steady operation or a severed Ethernet cable.
- **No authoritative state synchronization:** If an [industrial edge gateway](/blog/industrial-edge-gateways-selection-deployment-guide) drops offline and reconnects while a primary SCADA server is rebooting, stale retained messages can overwrite live operational state.

Sparkplug B overlays a strict contract on top of standard MQTT 3.1.1 (and optionally MQTT 5.0) brokers so any compliant edge node, SCADA server, historian, or cloud consumer can interoperate out of the box.

## The Sparkplug B topic namespace and message types

Every Sparkplug B message follows a fixed five-segment topic structure:

```text
spBv1.0/{group_id}/{message_type}/{edge_node_id}[/{device_id}]
```

Each segment carries an explicit architectural role:

- **`spBv1.0`** identifies the Sparkplug B namespace and payload version.
- **`group_id`** groups edge nodes logically — commonly by site, plant area, or business unit (for example `plant_ohio` or `packaging_east`).
- **`message_type`** specifies lifecycle and data semantics (detailed below).
- **`edge_node_id`** uniquely identifies an **Edge of Network (EoN) Node** — typically an edge gateway, PLC with native Sparkplug firmware, or IPC running a protocol bridge.
- **`device_id`** (optional) identifies a physical or logical downstream asset connected behind the EoN node, such as a serial Modbus flow meter or a legacy PLC polled over Ethernet.

| Message Type | Direction | Purpose | QoS |
|---|---|---|---|
| **`NBIRTH`** | EoN → Broker | Announces Edge Node online and publishes its **complete** metric list, types, aliases, and current values | 0 |
| **`NDEATH`** | Broker → Subscribers | Registered as the MQTT Last Will & Testament (LWT); published automatically by the broker on abrupt disconnect | 0 (or 1) |
| **`DBIRTH`** | EoN → Broker | Announces a downstream device online behind the EoN node with its full tag schema and initial values | 0 |
| **`DDEATH`** | EoN → Broker | Published by the EoN node when a polled downstream PLC/sensor stops responding while the EoN stays connected | 0 |
| **`NDATA` / `DDATA`** | EoN → Broker | Report-by-Exception updates containing **only changed metrics** (referenced by integer alias to shrink payloads) | 0 |
| **`NCMD` / `DCMD`** | Host → EoN | Command messages from an authorized host application (e.g., write a setpoint or request `Node Control/Rebirth`) | 0 |
| **`STATE`** | Host → Broker | Retained JSON health message (`spBv1.0/STATE/{host_id}`) announcing whether the Primary Host Application is `ONLINE` or `OFFLINE` | 1 (Retained) |

Notice an important detail that often surprises newcomers: Sparkplug explicitly **prohibits the MQTT Retain flag on data and birth/death topics** (`NBIRTH`, `NDATA`, `DBIRTH`, `DDATA`). Only the host `STATE` topic uses MQTT retained delivery. Why? Because stale retained tag values from days ago are dangerous in industrial control; instead, fresh state is guaranteed through controlled Rebirth handshakes.

## State management: NBIRTH, NDEATH, bdSeq and Primary Host

Sparkplug B turns stateless MQTT into a **continuously state-aware industrial bus** using three interlocking mechanisms:

![Engineering diagram of Eclipse Sparkplug B topic hierarchy, NBIRTH and NDEATH Last Will session lifecycle with bdSeq tracking, and bandwidth comparison against polled JSON](/media/2026/11/diagram-mqtt-sparkplug-b-architecture-industrial-iiot-guide.png "Figure 1: Sparkplug B topic hierarchy, state-aware NBIRTH/NDEATH handshake bound to bdSeq, and Report-by-Exception Protobuf bandwidth savings.")

1. **Last Will and Testament (`NDEATH`) bound to `bdSeq`:** Before opening its TCP/TLS session, the EoN node constructs an `NDEATH` payload carrying a Birth/Death sequence number (`bdSeq`, 0–255) and registers it with the broker inside the MQTT `CONNECT` packet. Immediately after connecting, the node publishes `NBIRTH` with the **exact same `bdSeq`**. If the network cable is cut or the gateway loses power, the broker detects the missed MQTT keep-alive and automatically emits `NDEATH` to every subscriber, which marks all child tags **STALE / BAD QUALITY** immediately.
2. **Per-message sequence counter (`seq`):** Every `NBIRTH`, `DBIRTH`, `NDATA`, `DDATA`, and `DDEATH` increments a rolling `seq` counter (0–255). If a SCADA host receives `seq=42` followed by `seq=44`, it detects a dropped packet and issues an `NCMD` with `Node Control/Rebirth = true`, forcing the edge node to re-publish a fresh `NBIRTH`/`DBIRTH` snapshot.
3. **Primary Host Application (`STATE`):** In mission-critical setups, one SCADA or historian acts as the **Primary Host Application**. Edge nodes subscribe to `spBv1.0/STATE/{primary_host_id}`. Under Sparkplug 3.0, an edge node waits until `STATE` reports `{"online": true, "timestamp": ...}` before issuing `NBIRTH`, and if the Primary Host goes `OFFLINE`, edge nodes can buffer telemetry locally in store-and-forward queues until the host returns online — ensuring zero data loss during SCADA maintenance windows.

## Protobuf payloads, metric aliases and Report by Exception bandwidth

Where raw JSON repeats tag names, keys, braces, and ASCII digits on every message, Sparkplug B serializes payloads with **Google Protocol Buffers (`Payload`)**. Each payload carries a UTC millisecond `timestamp`, `seq`, and an array of strongly typed `Metric` objects supporting `Int8`–`Int64`, `UInt8`–`UInt64`, `Float`, `Double`, `Boolean`, `String`, `DateTime`, `DataSet` (tabular structures), and reusable `Template` (UDT) definitions.

Two features dramatically reduce cellular, satellite, and WAN bandwidth consumption:

- **Integer metric aliases:** During `NBIRTH` or `DBIRTH`, the edge node assigns a compact integer `alias` (e.g., `alias = 17`) to a verbose tag path such as `Line03/Extruder/BarrelZone2/TemperaturePV`. Subsequent `DDATA` updates omit the name string completely and transmit only `alias: 17`, a 64-bit millisecond timestamp, and a 4-byte IEEE 754 float.
- **Report by Exception (RBE) with deadband filtering:** Instead of polling and transmitting 500 tags every second (500 values/sec even when a line is idle), the edge node samples the PLC locally and publishes only metrics that changed beyond a configured absolute or percentage deadband.

| Transmission Pattern (500 Tags, 1 s Scan) | Typical Wire Payload | Approx. Monthly WAN Data (per Node) |
|---|---|---|
| **Poll-all JSON over MQTT (every 1 s)** | ~28 KB/s uncompressed | **~72 GB / month** |
| **Sparkplug B RBE (10% tags change/s, full names)** | ~2.4 KB/s | **~6.2 GB / month** |
| **Sparkplug B RBE + Integer Aliases (10% change/s)** | ~0.9 KB/s | **~2.3 GB / month** |

Across remote pump stations, oilfields, and distributed cold-storage plants running on LTE/5G links, switching from polled JSON or Modbus-over-VPN to aliased Sparkplug B routinely cuts cellular data traffic by **85% to 95%** while preserving sub-second change visibility.

## Sparkplug B vs. plain MQTT JSON vs. OPC UA in a Unified Namespace

Architects building a [Unified Namespace (UNS)](/blog/unified-namespace-uns-architecture-practical-guide) often ask whether Sparkplug B replaces ISA-95 topic trees or OPC UA entirely. In practice, each technology fits a distinct layer:

| Dimension | Plain MQTT (JSON / ISA-95 Topics) | Eclipse Sparkplug B (ISO/IEC 20237) | OPC UA (Client/Server & PubSub) |
|---|---|---|---|
| **Topic Structure** | Flexible (`Enterprise/Site/Area/Line/Cell`) | Rigid (`spBv1.0/group/type/eon/device`) | Address Space Nodes (not topic-based in C/S) |
| **State & Disconnect Awareness** | Manual (custom LWT per project) | Built-in (`NBIRTH`/`NDEATH`, `bdSeq`, `STATE`) | Built-in session keep-alive & subscriptions |
| **Payload Format** | Human-readable JSON | Compact binary Protobuf | Binary UA / JSON |
| **UDT / Complex Models** | Unstandardized JSON nesting | Templates & DataSets | Rich Companion Specifications (PackML, Euromap) |
| **Best Fit in Plant Architecture** | Enterprise event bus, MES/ERP context, analytics | OT telemetry ingestion from edge gateways, remote RTUs, SCADA | Machine-to-machine, high-context PLC/OEM interfaces |

Because Sparkplug's rigid `spBv1.0/{group_id}/{message_type}/{edge_node_id}/{device_id}` topic path cannot directly encode a five-level ISA-95 hierarchy at the topic level, mature UNS implementations follow a two-tier convention: ingest raw OT tags reliably via **Sparkplug B** at the edge (gaining automatic discovery, birth/death quality, and store-and-forward), and place deep ISA-95 path context inside metric folder names (`Area1/Packaging/Filler02/SpeedRPM`) or enrich streams into an ISA-95 enterprise namespace inside the broker/historian tier.

## Edge deployment and OT cybersecurity checklist

Deploying Sparkplug B across production networks requires careful attention to broker resilience and [IEC 62443 OT cybersecurity](/blog/iec-62443-explained):

1. **Always enforce TLS 1.2/1.3 (port 8883) with mutual certificates or per-node credentials:** Never run cleartext MQTT on port 1883 outside an isolated lab bench. Issue unique client certificates per EoN node so revoking a compromised gateway never disrupts the rest of the plant.
2. **Restrict `NCMD`/`DCMD` ACLs strictly at the broker:** A read-only analytics subscriber should only have `SUBSCRIBE` permission on `spBv1.0/+/NBIRTH/#`, `DBIRTH/#`, `NDATA/#`, `DDATA/#`, and `NDEATH/#`. Only authorized SCADA hosts should hold `PUBLISH` rights on `NCMD` and `DCMD` — and disable write-back completely at the edge node when monitoring-only integration is intended.
3. **Separate Sparkplug brokers across zones via bridging:** Place a local OT broker inside the control or DMZ zone so local SCADA keeps running if WAN connectivity drops, and bridge outbound-only TLS streams to enterprise/cloud brokers.
4. **Right-size MQTT Keep-Alive and deadbands:** Setting Keep-Alive too short (e.g., 5 seconds) over cellular links triggers spurious `NDEATH`/Rebirth storms; 30–60 seconds is typical for WAN links and 10–15 seconds for plant LANs. Apply realistic deadbands to noisy analog signals (4–20 mA pressure or vibration transmitters) so quantization jitter does not defeat Report by Exception.
5. **Verify store-and-forward ordering:** Confirm your edge node tags buffered records with the `is_historical = true` flag inside Sparkplug metrics when draining offline queues, so real-time SCADA displays and [alarm management](/blog/alarm-management-isa-18-2-iec-62682-guide) engines do not fire false real-time alarms on hours-old catch-up data.

=== takeaways
Eclipse Sparkplug B (ISO/IEC 20237) standardizes MQTT for industrial OT by fixing the topic namespace, encoding payloads in Google Protocol Buffers, and enforcing birth/death session state.
NBIRTH/DBIRTH certificates make every edge gateway and downstream PLC self-describing, while MQTT Last Will (NDEATH) and sequence numbers guarantee immediate stale-data detection on disconnect.
Combining Report by Exception (RBE) with integer metric aliases typically cuts industrial WAN and cellular telemetry traffic by 85% to 95% compared to polled JSON.
Never enable MQTT Retain on Sparkplug data topics, lock down NCMD/DCMD broker ACLs to prevent unauthorized PLC writes, and mark store-and-forward catch-up payloads with is_historical = true.

=== faqs
Q: Does Sparkplug B require a specialized proprietary MQTT broker?
A: No. Sparkplug B runs on any standard MQTT 3.1.1 or MQTT 5.0 compliant broker (such as EMQX, HiveMQ, Mosquitto, or Ignition Distributor), provided the broker supports standard Last Will and Testament (LWT), QoS 0/1, and retained messages for the host STATE topic.

Q: Why does Sparkplug forbid retained messages on NBIRTH and NDATA topics?
A: Retained messages in plain MQTT can deliver outdated process values when an edge node is offline or during broker failover. Sparkplug instead uses live NBIRTH/DBIRTH snapshots coordinated with Primary Host STATE and Rebirth commands so subscribers always know whether tag values are current or stale.

Q: Can Sparkplug B be used for real-time closed-loop PLC control?
A: No. Like standard MQTT over TCP/IP, Sparkplug B is not deterministic and should never replace fieldbuses such as PROFINET, EtherNet/IP, or EtherCAT for closed-loop machine control or safety interlocks. It is designed for supervisory SCADA, historian ingestion, IIoT telemetry, and Unified Namespace integration.

Q: What is the difference between Sparkplug B 2.2 and Sparkplug 3.0 (ISO/IEC 20237)?
A: Sparkplug 3.0 clarified ambiguities from 2.2 to pass ISO/IEC standardization: it formalized the JSON format of the Primary Host STATE payload (with online boolean and UTC timestamp), tightened bdSeq/Rebirth ordering rules, defined strict Compliance Test Kit (TCK) verification profiles, and clarified MQTT 5.0 compatibility.

=== sources
Eclipse Foundation — Sparkplug Specification 3.0.0 | https://sparkplug.eclipse.org/specification/
ISO/IEC 20237:2023 — Information technology — Sparkplug specification | https://www.iso.org/standard/85999.html
OASIS — MQTT Version 5.0 Standard | https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html
