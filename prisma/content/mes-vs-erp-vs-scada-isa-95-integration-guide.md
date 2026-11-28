---
title: MES vs ERP vs SCADA: How ISA-95 Defines Manufacturing Systems and Data Flows
slug: mes-vs-erp-vs-scada-isa-95-integration-guide
type: BLOG
category: smart-manufacturing
author: edward
tags: ISA-95, SCADA, Smart manufacturing, OEE, Unified Namespace, Control system architecture
publishedAt: 2026-11-01T09:00:00Z
excerpt: ERP plans the business, MES orchestrates plant-floor execution and SCADA supervises equipment in real time — yet overlapping software features routinely cause costly boundary mistakes. Learn how ISA-95 separates MES, ERP and SCADA and how they exchange data cleanly.
seoTitle: MES vs ERP vs SCADA: ISA-95 Architecture & Data Flows
seoDescription: Clear engineering comparison of ERP, MES and SCADA under ISA-95 (IEC 62264): functional boundaries, timescales, common pitfalls and UNS/API data flows.
coverImage: /media/2026/11/cover-mes-vs-erp-vs-scada-isa-95-integration-guide.jpg
coverAlt: ISA-95 manufacturing pyramid graphic connecting Level 4 ERP business planning, Level 3 MES execution, and Level 2 SCADA supervision
coverCaption: Clear ISA-95 boundaries keep business scheduling in ERP, work-order execution in MES, and real-time control in SCADA and PLCs.
---
Ask three vendors where **SCADA** ends, where **MES** begins, and what should live inside **ERP**, and you will get three contradictory diagrams — each conveniently expanding the boundary of whichever software license that vendor sells. When a manufacturer buys overlapping tools without a clear functional architecture, the result is familiar: operators re-typing batch numbers into three screens, conflicting scrap totals between Finance and Production, and fragile custom scripts gluing everything together.

**ANSI/ISA-95** (published internationally as **IEC 62264**, *Enterprise-Control System Integration*) provides a vendor-neutral blueprint that cleanly separates business planning, manufacturing operations management and real-time equipment control.

## The ISA-95 functional hierarchy in one table

| Dimension | ERP (Level 4 — Business Planning) | MES / MOM (Level 3 — Operations Execution) | SCADA / DCS (Level 2 — Supervisory Control) | PLC / Field (Level 0–1 — Control) |
|---|---|---|---|---|
| **Core question answered** | *What should we make, buy and ship — and what did it cost?* | *How are we executing today's orders on the shop floor right now?* | *Are the machines running safely and within process limits?* | *Turn valve/motor ON/OFF deterministically now* |
| **Time horizon** | Months, weeks, days (shifts) | Shifts, hours, minutes (real-time work orders) | Seconds to sub-second | Milliseconds to microseconds |
| **Primary unit of work** | Sales orders, purchase orders, inventory valuation, BOMs | Work orders, serial/lot genealogy, quality checks, OEE, operator SOPs | Equipment states, alarms, setpoints, real-time trends | Digital/analog I/O, PID loops, motion axes |
| **Primary users** | Supply chain, finance, planners, purchasing | Plant managers, production supervisors, QA, operators | Control-room operators, controls/maintenance engineers | Controls engineers, maintenance technicians |
| **Outage tolerance** | Plant can run for hours or days if ERP is offline | Plant runs short term; dispatch & traceability degrade quickly | Immediate blind spot for operators; continuous processes risk shutdown | Machine stops immediately |

## What each system owns best

### ERP: the financial and supply-chain system of record

Enterprise Resource Planning (SAP, Oracle, Microsoft Dynamics, NetSuite, Infor) excels at **multi-site commercial coordination**: customer orders, master production schedules, material requirements planning (MRP), procurement, warehouse valuation, shipping invoices and financial ledgers.

**Where ERP breaks if pushed down to the shop floor:** ERP is transactional and slow. Asking ERP to track individual serialized parts every two seconds, enforce poka-yoke torque-wrench verification before releasing a fixture, or calculate sub-minute [OEE minor stops](/blog/oee-calculation-losses-plc-data-collection-guide) produces clumsy custom ABAP/plugin code and brings production to a halt during ERP maintenance weekends.

### MES: the execution and traceability bridge (Level 3)

A **Manufacturing Execution System (MES)** — increasingly framed under the broader ISA-95 term **MOM (Manufacturing Operations Management)** — turns ERP's weekly production schedule into verified, step-by-step shop-floor execution across four core ISA-95 activity domains:

1. **Production operations:** Dispatching work orders to specific lines/cells, downloading SKU recipes/parameters to machines, tracking work-in-progress (WIP) and reporting actual good/scrap consumption back to ERP.
2. **Quality operations:** In-process statistical process control (SPC), automated vision/test-stand pass-fail gating, electronic work instructions, non-conformance holds and full **as-built genealogy** (linking every finished serial number to exact raw-material lots, torque values, cure temperatures and operator IDs — mandatory in automotive, aerospace, medical device and food/pharma recalls).
3. **Inventory / material movement:** Line-side staging, lot consumption verification (blocking production if an operator scans the wrong material reel) and finished-goods labeling.
4. **Maintenance coordination:** Surfacing equipment breakdown codes and runtime hours to CMMS and [predictive maintenance](/blog/predictive-maintenance-vibration-motor-current-analysis) workflows.

### SCADA: real-time machine supervision and control (Level 2)

As detailed in our comparison of [SCADA vs DCS](/blog/scada-vs-dcs-differences), SCADA connects directly to Level 1 PLCs and RTUs to give operators real-time visibility, setpoint control, [ISA-101 High-Performance HMI screens](/blog/high-performance-hmi-design-isa-101-guide), [ISA-18.2 alarm management](/blog/alarm-management-isa-18-2-iec-62682-guide) and high-resolution process historization.

**Where SCADA breaks if stretched into an MES:** Modern SCADA platforms (Ignition, WinCC OA, AVEVA System Platform) can build simple OEE dashboards and recipe selectors very effectively — which is often the right pragmatic step for smaller plants. However, building full ERP order reconciliation, multi-stage serialized genealogy, electronic batch records (21 CFR Part 11), warehouse lot control and rework routing from scratch inside SCADA scripting eventually creates an unmaintainable custom MES.

## How data flows across ERP, MES and SCADA

In a clean ISA-95 integration, data moves along two distinct loops:

![ISA-95 five-level pyramid diagram showing Level 4 ERP (days/months), Level 3 MES (shifts/orders), Level 2 SCADA/HMI (seconds/minutes), Level 1 PLC/DCS (milliseconds), and Level 0 field devices with downward order dispatch and upward genealogy/OEE feedback arrows](/media/2026/11/diagram-mes-vs-erp-vs-scada-isa-95-integration-guide.png "Figure 1: Orders, recipes, and BOMs flow downward from ERP through MES to the shop floor; actual counts, quality status, and material genealogy flow upward.")

### Downward loop (Planning → Execution → Control)

1. **ERP → MES:** Releases production order (`WO-10492`), product SKU, target quantity, bill of materials (BOM), lot allocations and due date (via REST/OData API, message queue or ISA-95 B2MML XML/JSON).
2. **MES → SCADA / PLC:** Dispatches active work order to Line 2, verifies scanned raw material lots match the BOM, and sends validated recipe parameters (e.g., target fill weight, line speed, temperature profile) to the PLC/SCADA — with PLC handshake confirmation before start.

### Upward loop (Control → Execution → Planning)

1. **PLC / SCADA → MES:** Streams machine states (PackML), monotonic good/reject counts, first-out fault codes, process quality readings (torque, weld current, pasteurization hold time) and cycle completions.
2. **MES → ERP:** Aggregates shift or order-completion totals — actual finished goods produced, scrap by reason code, actual raw material consumed by lot, and labor/machine hours — posting clean transactional confirmations into ERP once per order or shift rather than flooding ERP with per-second PLC events.

## Modern integration: combining ISA-95 models with a Unified Namespace

Historically, ISA-95 integrations were built as rigid point-to-point middleware queues (ERP ↔ MES ↔ SCADA). Today, many manufacturers preserve **ISA-95's functional boundaries and data models** while moving real-time transport onto a [Unified Namespace (UNS)](/blog/unified-namespace-uns-architecture-practical-guide):

- SCADA and edge gateways publish normalized machine state and production counts into the UNS (`enterprise/site/area/line/cell/...`).
- MES subscribes to those exact events to advance work orders, record genealogy and trigger quality holds — and publishes active work-order context back into the same UNS branch so SCADA HMIs and OEE screens display live order progress automatically.
- ERP exchanges asynchronous commercial transactions (orders in, inventory/consumption confirmations out) with MES through an IDMZ API gateway, keeping business networks securely separated from [Level 1–3 OT zones](/blog/purdue-model-vs-zero-trust-ot-network-segmentation).

## Common architecture mistakes to avoid

1. **Letting ERP talk directly to PLCs:** Never wire ERP directly to shop-floor controllers. If ERP upgrades, slows down or restarts for maintenance, production lines must keep running autonomously via local MES/SCADA buffering.
2. **Buying a monolithic MES before fixing shop-floor data:** An expensive MES fed by manual barcode typing and inaccurate PLC counters just automates bad data. Standardize PLC PackML states, monotonic counters and clean [edge gateway connectivity](/blog/industrial-edge-gateways-selection-deployment-guide) first.
3. **Leaving "gray-zone" ownership undefined:** Explicitly document in a one-page RACI matrix who owns **recipes** (master limits in MES/PLM, execution setpoints in PLC), **OEE** (raw counts in PLC, shift/SKU logic in MES or SCADA) and **inventory** (line-side WIP in MES, financial stock in ERP).

=== takeaways
ISA-95 (IEC 62264) cleanly separates ERP (Level 4 business planning), MES/MOM (Level 3 shop-floor execution and traceability), SCADA/DCS (Level 2 real-time supervision) and PLCs (Level 1 deterministic control).
ERP operates on days-to-months commercial cycles and should never communicate directly with shop-floor PLCs; MES buffers execution so factories keep running during ERP outages.
MES owns work-order dispatch, recipe verification, serialized/lot genealogy, quality gating and order-level reporting back to ERP, while SCADA owns real-time operator visualization, alarming and high-frequency process telemetry.
Modern architectures keep ISA-95's functional responsibilities and semantic hierarchy while using a Unified Namespace (UNS) and IDMZ APIs to replace brittle point-to-point middleware.

=== faqs
Q: What is the main difference between MES and SCADA?
A: SCADA focuses on real-time equipment supervision, operator HMIs, alarms and process telemetry at the machine and control-room level (seconds). MES focuses on manufacturing execution — work orders, part genealogy, material lot verification, quality workflows and ERP reconciliation (minutes to shifts).

Q: Can an ERP system replace an MES?
A: Rarely in automated discrete or process plants. ERP systems excel at supply-chain planning and accounting but are not designed for sub-second machine integration, line-side poka-yoke verification, automated recipe downloads or continuous operation during ERP maintenance windows.

Q: Do small or mid-sized factories always need a full standalone MES?
A: Not immediately. Smaller plants often start by collecting automated PLC OEE, downtime reasons and basic work-order tracking using a modern SCADA platform or lightweight UNS-connected execution modules, adding full MES genealogy and quality enforcement as regulatory or customer traceability requirements grow.

Q: How does ISA-95 relate to Industry 4.0 and Unified Namespace?
A: ISA-95 provides the standard enterprise-site-area-line-cell physical hierarchy and functional vocabulary that most Unified Namespace deployments adopt for their MQTT topic tree and payload structures, combining ISA-95's semantic discipline with modern event-driven messaging.

=== sources
ANSI/ISA-95 / IEC 62264: Enterprise-Control System Integration | https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62264-series-of-standards
MESA International — Manufacturing Execution Systems & Smart Manufacturing Resources | https://mesa.org/
ISO 22400: Automation systems and integration — KPIs for manufacturing operations management | https://www.iso.org/standard/54497.html
