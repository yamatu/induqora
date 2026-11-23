---
title: OEE in Manufacturing Explained: Formulas, Six Big Losses and Automated PLC Data Collection
slug: oee-calculation-losses-plc-data-collection-guide
type: BLOG
category: smart-manufacturing
author: edword
tags: OEE, Smart manufacturing, ISA-95, PLC programming, Unified Namespace
publishedAt: 2026-11-14T09:00:00Z
featured: true
excerpt: Overall Equipment Effectiveness (OEE) measures how much of a machine's planned production time actually produces good parts at full speed. Learn the exact OEE formulas, the Six Big Losses, how to collect accurate signals directly from PLCs using PackML, and how to prevent OEE gaming.
seoTitle: OEE in Manufacturing: Formula, Losses & PLC Data Guide
seoDescription: Practical engineering guide to OEE (Availability x Performance x Quality), the Six Big Losses, automated PLC data collection with PackML and common pitfalls.
---
**Overall Equipment Effectiveness (OEE)** is the gold-standard manufacturing metric for measuring how effectively a piece of production equipment turns planned operating time into saleable, first-pass quality product. Developed within **Total Productive Maintenance (TPM)** and standardized in **ISO 22400-2**, OEE distills machine efficiency into a single percentage — and more importantly, breaks every lost minute into actionable engineering loss categories.

Yet in many factories, OEE dashboards are distrusted by operators and engineers alike. The cause is almost never the math; it is **inconsistent time definitions** and **manual paper entry** that hide micro-stops and speed losses. Automating OEE collection directly from the PLC fixes both problems.

## The OEE formula and worked shift example

OEE is the product of three ratios:

```
OEE = Availability × Performance × Quality
```

Where:

- **Availability** = `Run Time / Planned Production Time`
- **Performance** = `(Ideal Cycle Time × Total Count) / Run Time`
- **Quality** = `Good Count / Total Count`

Notice that when you multiply the three fractions out, `Run Time` and `Total Count` cancel, revealing the simplest sanity check in manufacturing:

```
OEE = (Ideal Cycle Time × Good Count) / Planned Production Time
```

### Worked shift example

Consider an automated packaging line scheduled for an 8-hour shift (**480 minutes**), with a **30-minute** scheduled lunch break (not planned production time):

- **Planned Production Time:** `480 - 30 = 450 min`
- **Unplanned Downtime:** `45 min` (25 min changeover + 20 min servo fault) → **Run Time** = `405 min`
- **Ideal Cycle Time:** `1.0 sec/unit` (ideal rate = `60 units/min`)
- **Total Count Produced:** `21,870 units`
- **Reject / Scrap Count:** `437 units` → **Good Count** = `21,433 units`

Calculating each factor:

1. **Availability:** `405 / 450 = 90.0%`
2. **Performance:** `(21,870 / 60) / 405 = 364.5 / 405 = 90.0%`
3. **Quality:** `21,433 / 21,870 = 98.0%`
4. **OEE:** `0.90 × 0.90 × 0.98 = 79.38%`

Even though each individual factor looks respectable (90% or better), **over 20% of planned capacity was lost**. Checking the simple formula confirms it: `21,433 good units × 1 sec = 357.22 min` of fully productive time out of `450 min` (`79.38%`).

## Mapping the Six Big Losses

The real operational value of OEE is not the headline score — it is knowing which of the **Six Big Losses** consumes the most capacity:

| OEE Factor | TPM Loss Category | Typical Shop-Floor Examples | Primary Engineering Owner |
|---|---|---|---|
| **Availability** | 1. Equipment failure (breakdowns) | Servo amplifier trip, jammed actuator, burnt heater, sensor failure | Maintenance & reliability |
| **Availability** | 2. Setup and adjustments | Product changeover, tooling swap, warm-up, material reel splice | Operations & SMED team |
| **Performance** | 3. Idling and minor stops | 15-second photo-eye jams, starved infeed, blocked discharge | Controls & line operators |
| **Performance** | 4. Reduced speed | Running line at 80% rated speed to avoid jams or vibration | Process & controls engineering |
| **Quality** | 5. Process defects | Out-of-tolerance dimensions, mislabeled cartons, bad welds | Process & quality engineering |
| **Quality** | 6. Reduced yield (startup) | First-article scrap during warm-up or after every changeover | Process & operations |

## Automated PLC data collection: the minimum viable signal set

Paper clipboards miss nearly all minor stops under two minutes and routinely misclassify speed reductions. Modern [MES platforms](/blog/mes-vs-erp-vs-scada-isa-95-integration-guide) and [Unified Namespace (UNS)](/blog/unified-namespace-uns-architecture-practical-guide) architectures collect OEE directly from the machine controller using just **five reliable PLC signals** per bottleneck machine:

1. **Machine State (`INT` / `ENUM`):** Running, Stopped/Faulted, Held/Starved/Blocked, Setup/Changeover, Idle.
2. **Primary Fault / Stop Code (`DINT`):** The *first-out* alarm code latched by the PLC when the machine drops out of `EXECUTE`, so cascading downstream alarms do not mask the root cause.
3. **Total Part Counter (`UDINT` / `LINT`):** A monotonically increasing counter triggered by a reliable exit sensor or cycle-complete bit (never reset mid-shift by an HMI button; let the edge collector compute deltas!).
4. **Reject / Scrap Counter (`UDINT` / `LINT`):** Driven by checkweighers, vision reject chutes or PLC quality bits.
5. **Active Product / Recipe ID (`STRING` or `DINT`):** Essential because **Ideal Cycle Time changes by SKU** — using a single plant-wide target rate corrupts Performance on multi-product lines.

### Standardizing machine states with PackML (ISA-TR88.00.02)

If every OEM names PLC status bits differently (`AutoRun`, `CycleActive`, `Line_OK`), rolling out OEE across twenty machines becomes a maintenance nightmare. Adopting the **PackML (ANSI/ISA-TR88.00.02)** state model inside your [IEC 61131-3 PLC program](/blog/iec-61131-3-programming-languages-explained) standardizes both **Unit Modes** (Production, Maintenance, Manual) and **Unit States** (`EXECUTE`, `SUSPENDED`, `HELD`, `ABORTED`, `STOPPED`, `IDLE`):

- `EXECUTE` = running and producing (Availability = Run Time).
- `SUSPENDED` = machine healthy, waiting on upstream starvation or downstream blockage (critical for separating line-balance losses from internal breakdowns).
- `HELD` = internal process hold or minor interruption.
- `ABORTED` / `STOPPED` = faulted or stopped (Availability loss).

### Handling micro-stops vs downtime cleanly

Configure a consistent **minor-stop threshold** (commonly **60 to 120 seconds**) in the edge collector or MES:

- Stops shorter than the threshold are logged automatically as **Performance (Minor Stop)** events without nagging the operator for a manual reason code.
- Stops longer than the threshold trigger an **Availability (Downtime)** event, pre-populated with the PLC's first-out fault code and optionally refined by the operator on the HMI if the stop was operational (such as waiting for forklift material delivery).

## Common OEE traps and how to avoid them

- **Chasing "85% world-class OEE" blindly:** An 85% benchmark originated in high-volume automotive machining. A high-mix job shop running 12 changeovers per shift may be operating brilliantly at 62% OEE, whereas a 24/7 continuous bottling line at 70% has huge hidden capacity. Track **your own trend line**, not a generic slogan.
- **Inflating OEE by redefining Planned Production Time:** Moving changeovers, preventive maintenance or material waits out of Planned Production Time artificially boosts OEE while hiding real lost output. If you want to track asset utilization across all 24 hours, report **TEEP (Total Effective Equipment Performance)** alongside OEE.
- **Using slow historical averages as Ideal Cycle Time:** Ideal Cycle Time must represent the **true theoretical nameplate or engineered design rate** for each SKU — never last quarter's average speed, which hides chronic de-rating.
- **Measuring every machine instead of the constraint:** Start automated OEE collection on the **bottleneck asset** of each production line. Improving Availability on a non-bottleneck upstream conveyor rarely increases total shipped units.

## Turning OEE data into plant-floor results

Data collection alone never raised throughput by a single part. Pair automated PLC OEE collection with a short daily tier meeting reviewing the **top three Pareto loss reasons from the past 24 hours**:

- High **Equipment Failure** → deploy targeted reliability fixes or [condition monitoring and predictive maintenance](/blog/predictive-maintenance-vibration-motor-current-analysis).
- High **Setup / Changeover** → run SMED workshops and automate recipe downloads from MES to PLC.
- High **Minor Stops / Reduced Speed** → inspect chronic photo-eye alignments, pneumatic cylinder sticking and conveyor accumulation buffer tuning.

=== takeaways
Overall Equipment Effectiveness (OEE) equals Availability multiplied by Performance multiplied by Quality, measuring the share of planned production time spent making good parts at ideal speed.
OEE breaks lost capacity into the Six Big Losses: breakdowns, changeovers, minor stops, reduced speed, process defects and startup scrap.
Reliable OEE requires automated PLC data collection using five core signals: standardized machine state (such as PackML), first-out fault code, monotonic total count, reject count and active SKU/recipe ID.
Ideal Cycle Time must reflect true engineered design speed per SKU rather than historical averages, and Planned Production Time should not be shrunk to artificially inflate scores.
Start automated OEE deployment on the bottleneck machine of each line and review the top daily Pareto loss reasons with operations and maintenance teams.

=== faqs
Q: How is OEE calculated?
A: OEE is calculated as Availability × Performance × Quality. Availability is Run Time divided by Planned Production Time; Performance is (Ideal Cycle Time × Total Count) divided by Run Time; Quality is Good Count divided by Total Count. Equivalently, OEE equals (Ideal Cycle Time × Good Count) divided by Planned Production Time.

Q: What is considered a good OEE score in manufacturing?
A: While 85% is widely cited as a world-class benchmark for high-volume discrete manufacturing, a good OEE score depends heavily on product mix and changeover frequency. High-mix batch lines often target 60%–70%, whereas dedicated continuous lines may exceed 85%. Tracking steady improvement against your own baseline matters more than a universal number.

Q: What is the difference between OEE and TEEP?
A: OEE measures effectiveness during Planned Production Time (excluding scheduled breaks, holidays or unscheduled shifts). Total Effective Equipment Performance (TEEP) measures effectiveness against all available calendar time (24 hours a day, 365 days a year), showing total untapped plant capacity.

Q: Why should PLC counters for OEE be monotonically increasing?
A: If an operator or PLC logic resets a shift counter to zero while an edge gateway or network link is momentarily offline, production counts can be lost or duplicated. Using a continuous monotonic counter (UDINT/LINT) and computing deltas in the edge collector or MES ensures accurate counts even across brief network outages.

=== sources
ISO 22400-2: Automation systems and integration — Key performance indicators (KPIs) for manufacturing operations management | https://www.iso.org/standard/54497.html
ANSI/ISA-TR88.00.02: Machine and Unit States: An Implementation Example of ANSI/ISA-88.00.01 (PackML) | https://www.isa.org/standards-and-publications/isa-standards/isa-88-committee
OMAC — Organization for Machine Automation and Control (PackML Guidelines) | https://www.omac.org/packml
ISA-95 / IEC 62264: Enterprise-Control System Integration | https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62264-series-of-standards
