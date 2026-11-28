---
title: SCADA Historian Architecture: Compression, Store-and-Forward and DMZ Mirroring
slug: scada-historian-architecture-compression-buffering-guide
type: BLOG
category: scada-hmi
author: edward
tags: SCADA, HMI, Alarm management, Control system architecture, OPC UA
publishedAt: 2026-11-26T03:00:00Z
excerpt: Storing millions of sub-second plant tags in a general-purpose SQL database quickly degrades queries and loses data during network outages. Here is how industrial SCADA historians use Swinging Door compression, store-and-forward edge buffering, and DMZ mirroring to preserve reliable process history.
seoTitle: SCADA Historians Explained: Compression & Buffering
seoDescription: Design SCADA historians for plant telemetry: Swinging Door compression tuning, store-and-forward sizing, DMZ mirroring, and time-series trade-offs.
coverImage: /media/2026/11/cover-scada-historian-architecture-compression-buffering-guide.jpg
coverAlt: Technical editorial illustration of a SCADA historian console displaying high-frequency process trends, Swinging Door compression tolerances, and mirrored storage tiers
coverCaption: Two-stage exception/Swinging Door compression, local store-and-forward queues, and outbound DMZ mirroring keep plant history accurate and secure.
---
Every continuous process plant and high-speed discrete factory depends on historical process data — to investigate a reactor excursion, prove FDA 21 CFR Part 11 batch compliance, tune [PID control loops](/blog/pid-controller-tuning-practical-guide), audit [OEE production losses](/blog/oee-calculation-losses-plc-data-collection-guide), or correlate nuisance trips during an [ISA-18.2 alarm rationalization](/blog/alarm-management-isa-18-2-iec-62682-guide).

Yet teams regularly underestimate the write throughput, storage growth, and security constraints of industrial telemetry. Polling just **25,000 tags at 1-second resolution** produces **2.16 billion raw data points per day**. Dropping that stream naively into an untuned relational SQL table leads to bloated disks, multi-minute trend load times on operator screens, and permanent data gaps whenever a switch reboots. Purpose-built **SCADA historians** — and properly architected modern time-series platforms — solve these challenges through specialized ingestion, lossy/lossless compression, edge buffering, and secure multi-tier replication.

## Why general-purpose relational databases struggle with raw OT telemetry

Comparing a traditional OLTP database (SQL Server, PostgreSQL without time-series partitioning) against an industrial historian reveals why the underlying storage engine matters:

- **Append-only write storms:** Industrial collectors write continuous streams of `(TagID, Timestamp, Value, Quality)` tuples with almost zero in-place updates. Standard B-tree indexes fragment rapidly under tens of thousands of inserts per second.
- **Range-scan and interpolation queries:** Operators on an [ISA-101 high-performance HMI](/blog/high-performance-hmi-design-isa-101-guide) rarely ask for an exact millisecond row; they request 8-hour trends, 1-minute averages, time-weighted totals, or stepped interpolation across 50 tags simultaneously.
- **Data quality flags:** Industrial values are meaningless without an **OPC UA / SCADA quality code** (`Good`, `Bad_CommFailure`, `Uncertain_SubNormal`, `Substituted`) so engineers can distinguish a flat zero pressure reading from a broken transmitter.

## Exception reporting vs. Swinging Door Trending (SDT) compression

The secret behind industrial historians storing 10+ years of plant data on modest disk arrays is a **two-stage data reduction pipeline**:

### Stage 1: Exception reporting (Deadband at the collector)

Exception filtering runs at the **interface or edge collector** before data even crosses the network to the historian server:

- **`ExcDev` (Exception Deviation):** A new sample is forwarded only if it differs from the last sent value by more than the configured deadband (commonly `0.5×` to `1×` instrument repeatability, e.g., ±0.05 °C on a thermocouple).
- **`ExcMax` (Maximum Exception Time):** Forces a heartbeat sample after a timeout (e.g., 10 minutes) even if the value is completely flat, confirming the interface is still alive.

### Stage 2: Swinging Door Trending (SDT) at the historian archive

Once exception events reach the historian, **Swinging Door Trending (SDT)** — pioneered in industrial historians such as AVEVA PI and widely implemented across SCADA engines — discards intermediate points that fall inside a linear tolerance corridor (`CompDev`):

1. Store the last archived anchor point `P0`.
2. When the next point `P1` arrives, open two bounding rays ("pivoting doors") from `P0` through `P1 + CompDev` and `P1 - CompDev`.
3. For each subsequent point `Pk`, tighten the upper and lower slopes so all intermediate points stay within `±CompDev` of a straight line from `P0`.
4. As soon as a new point forces the upper and lower doors to cross (meaning a single straight line can no longer approximate the curve within `±CompDev`), archive the **previous point `P(k-1)`** as the new anchor and restart the doors.

### Parameter tuning mistakes that ruin plant forensics

Bad compression defaults silently destroy diagnostic value:

- **Never apply SDT compression to discrete states, batch IDs, totalizer resets, or alarm counters:** Set `Step = ON` and `CompDev = 0` so every state transition is captured verbatim as a square step, never linearly interpolated.
- **Do not over-compress fast PID or vibration signals:** Setting `CompDev = 2%` of span on a 0–100 bar header masks ±2 bar valve hunting during loop tuning. For control-loop tags, keep `CompDev` near sensor resolution (0.1%–0.25% of span) or disable compression during tuning campaigns.
- **Always configure `CompMax` (e.g., 1–8 hours):** Ensures long steady periods still drop periodic archive points, keeping time-range queries fast without scanning days backward to find the previous anchor.

## Designing Store-and-Forward buffering for zero data loss

Plant networks experience switch upgrades, firewall maintenance, and WAN link drops. Without **Store-and-Forward (S&F)** buffering at the edge collector or local [SCADA server](/blog/scada-vs-dcs-differences), any disconnect permanently punches a hole in regulatory and OEE records.

![Engineering diagram illustrating edge collector exception filtering and Store-and-Forward SSD buffering into a Tier 1 OT historian, outbound DMZ mirror, and Swinging Door Trending compression corridor](/media/2026/11/diagram-scada-historian-architecture-compression-buffering-guide.png "Figure 1: End-to-end SCADA historian pipeline from PLC/OPC UA edge collection with Store-and-Forward buffering to outbound DMZ mirroring, alongside Swinging Door Trending (SDT) compression mechanics.")

A deterministic S&F buffer must be sized mathematically, not guessed:

```text
Required Disk Buffer (Bytes) = Tag_Count × Avg_Events_per_Sec × Bytes_per_Event × Outage_Seconds × Safety_Factor
```

**Worked sizing example:**

- **Tag count:** 10,000 tags at one collector
- **Post-exception event rate:** 0.25 events/tag/sec average (2,500 events/sec total)
- **Serialized disk footprint:** ~32 bytes per buffered event (tag ID, 8-byte timestamp, 8-byte value, quality, checksum/overhead)
- **Target outage coverage:** 72 hours (259,200 seconds) for a weekend WAN or central server outage
- **Raw size:** `2,500 × 32 × 259,200 ≈ 20.7 GB`
- **With 2× safety margin (for upset storms where every tag changes every second):** allocate at least **45–50 GB** of industrial-grade endurance SSD (TLC/pSLC with power-loss protection) exclusively for the local S&F queue, separate from the OS partition so a full buffer never crashes the collector operating system.

When connectivity returns, verify that your collector **throttles backfill bandwidth** (e.g., capping historical drain to 30% of link capacity) while simultaneously streaming **live values** so control-room screens do not freeze during multi-hour catch-up.

## Secure two-tier DMZ mirroring architecture

Corporate analysts, ERP systems, and machine-learning teams constantly ask for live plant historian access — yet connecting business users directly to the OT historian violates [IEC 62443 zones and conduits](/blog/iec-62443-zones-and-conduits-ot-segmentation-guide).

The proven industrial pattern is **two-tier historian mirroring across the Industrial DMZ (IDMZ)**:

1. **Tier 1 (OT Control Historian — Level 3):** Collects data from PLCs/DCS/SCADA via OPC UA, native PLC drivers, or [MQTT Sparkplug B](/blog/mqtt-sparkplug-b-architecture-industrial-iiot-guide). Serves control-room operators and local engineers exclusively. Accepts **zero inbound connections** from the corporate network.
2. **Outbound-Only Replication Conduit (Level 3 → IDMZ):** The Tier 1 historian initiates an outbound TLS-encrypted replication stream (or passes through a hardware unidirectional data diode) to a **Tier 2 Mirror Historian** located in the IDMZ.
3. **Tier 2 (Enterprise / DMZ Mirror):** Serves corporate Power BI, SAP/MES batch reporting, and cloud data-lake pipelines (Parquet/Kafka/S3). Even if an analyst runs an unindexed 5-year query that spikes CPU to 100%, the plant's Tier 1 operational historian remains completely unaffected.

## Traditional commercial historians vs. modern open time-series stacks

Engineering leaders frequently weigh incumbent industrial historians (AVEVA PI System, GE Proficy, AspenTech IP.21, Ignition Tag Historian) against modern time-series databases (TimescaleDB, InfluxDB, QuestDB, ClickHouse + Parquet):

| Evaluation Criterion | Commercial OT Historian (PI / Proficy / Ignition) | Modern Open Time-Series Stack (TimescaleDB / QuestDB + Edge) |
|---|---|---|
| **Native OT Protocol & Quality Support** | Turnkey OPC UA/DA, Siemens/Rockwell collectors, built-in quality flags | Requires edge collector (Ignition Edge, Kepware, Node-RED, Telegraf) |
| **Swinging Door Compression & Interpolation** | Native, mature, battle-tested for decades | Usually relies on columnar/delta/gorilla compression; SDT must be built at edge |
| **Regulatory Validation (FDA 21 CFR Part 11)** | Pre-documented audit trails, e-signatures, validated workflows | Requires custom governance and validation effort |
| **Licensing & Cloud Analytics Economics** | Often licensed per tag count; expensive at >500k enterprise tags | Capacity/compute licensing; native SQL, Python, and Parquet lakehouse export |
| **Typical Sweet Spot** | Regulated pharma/chemical/power plants and fast turnkey SCADA | Multi-site IIoT analytics, high-tag-count smart manufacturing, UNS data lakes |

Many enterprises successfully run a **hybrid architecture**: keeping a validated OT historian at Level 3 for operators and compliance, while streaming summarized or raw streams via Sparkplug B / OPC UA PubSub into a cloud time-series lakehouse for enterprise analytics.

## Time synchronization and operational health checklist

A historian is only as trustworthy as its timestamps. Before handing a historian deployment over to operations, verify these five fundamentals:

1. **Single authoritative plant time source (NTP/PTP):** Synchronize PLCs, SCADA servers, edge collectors, and historians to an internal GPS-disciplined Stratum 1/2 NTP server inside the OT network. Clock skew of even 3 seconds between an alarm server and a historian makes root-cause sequence-of-events analysis impossible.
2. **Store timestamps in UTC exclusively:** Never record local daylight-saving time inside archive files; convert to local plant time only at the visualization layer so autumn DST fall-back hours never overlap or drop an hour of batch history.
3. **Monitor collector queue depth as a SCADA alarm:** Create a heartbeat tag monitoring each edge collector's Store-and-Forward buffer fill percentage and last successful write timestamp — silent buffer overflows discovered months later are a classic compliance failure.
4. **Separate archive storage from OS and backup targets:** Keep active hot archives on fast local RAID/NVMe storage and replicate closed historical archive partitions nightly to immutable off-box backups.
5. **Audit tag quality ratios monthly:** Track the percentage of tags sitting in `Bad` or `Stale` state; dead tags left behind after equipment retrofits waste license capacity and clutter operator trends.

=== takeaways
Naive relational SQL tables degrade rapidly under continuous industrial telemetry; purpose-built historians rely on append-only time-series storage, OPC quality codes, and two-stage data reduction.
Pair edge Exception Deadbands with Swinging Door Trending (SDT) for analog signals, but always disable SDT (Step = ON, CompDev = 0) on discrete states, batch IDs, and counters.
Size Store-and-Forward edge disks mathematically for 72-hour outages with a 2x upset-storm margin, and isolate the buffer on its own endurance SSD partition.
Always decouple corporate reporting from plant operations via an outbound-only Tier 1 (OT) to Tier 2 (IDMZ) mirrored historian architecture synchronized to a single UTC NTP time source.

=== faqs
Q: What is the difference between Exception Reporting and Compression in a SCADA historian?
A: Exception Reporting runs at the edge collector before data crosses the network, suppressing noisy readings within an instrument deadband. Compression (such as Swinging Door Trending) runs at the historian server before writing to disk, removing redundant intermediate points that lie along a straight line within a defined slope tolerance.

Q: Should timestamps be generated at the PLC, the edge collector, or the historian server?
A: Timestamp as close to the physical process as possible — ideally at the PLC or RTU (source timestamping) when sub-second sequence-of-events accuracy is needed, or at the local edge collector otherwise. Server-side timestamping breaks completely during Store-and-Forward buffering because delayed records would receive arrival time instead of true occurrence time.

Q: How long should an industrial plant retain raw high-resolution historian data?
A: Most plants retain full compressed resolution online for 3 to 7 years (and 7 to 10+ years in regulated pharmaceutical, food safety, or power generation industries) because compressed industrial archives consume surprisingly little disk — often under 100 GB per year for 25,000 active tags.

Q: Can a historian replace an alarm and event (A&E) server?
A: No. Historians are optimized for continuous time-series tag values, whereas ISA-18.2 alarm management requires dedicated Alarm & Event journals capturing operator acknowledgments, shelving actions, priority changes, and state transitions. Both should share the same UTC NTP clock so trends and alarm logs align to the millisecond.

=== sources
OPC Foundation — OPC UA Part 11: Historical Access Specification | https://reference.opcfoundation.org/Core/Part11/
ISA-18.2 / IEC 62682 — Management of Alarm Systems for the Process Industries | https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa18
NIST SP 800-82 Rev. 3 — Guide to Operational Technology (OT) Security (DMZ Historian Patterns) | https://csrc.nist.gov/pubs/sp/800/82/r3/final
