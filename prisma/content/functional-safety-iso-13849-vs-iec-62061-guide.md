---
title: ISO 13849-1 vs IEC 62061: Choosing and Applying Functional Safety Standards for Machinery
slug: functional-safety-iso-13849-vs-iec-62061-guide
type: BLOG
category: standards-regulation
author: edword
tags: Functional safety, Machine safety, Machinery Regulation, EU regulation, IEC 62443
publishedAt: 2026-10-12T09:00:00Z
excerpt: Both ISO 13849-1 and IEC 62061 provide harmonized pathways for designing safety-related machine control systems — including compliance with the EU Machinery Regulation taking effect January 20, 2027. Compare PL vs SIL, Categories B–4, MTTFd, software rules and which standard fits your machine.
seoTitle: ISO 13849-1 vs IEC 62061: Machine Functional Safety Guide
seoDescription: Compare ISO 13849-1 (PL a–e) and IEC 62061 (SIL 1–3) for machinery safety: PFH mapping, Categories B–4, SISTEMA verification and EU Machinery Regulation.
---
Whenever a machine builder designs an emergency stop circuit, a light-curtain guard interlock, a two-hand press control or a [drive-integrated Safe Torque Off (STO) / Safe Limited Speed (SLS) function](/blog/safe-torque-off-sto-functional-safety-drives-iec-61800-5-2), one question arises immediately: **should we engineer and validate the safety control system under ISO 13849-1 or IEC 62061?**

With the [EU Machinery Regulation (EU) 2023/1230 applying from January 20, 2027](/news/eu-machinery-regulation-2023-1230-january-2027), getting functional safety calculations, validation reports and cybersecurity-of-safety documentation right is no longer optional paperwork — it is the technical backbone of EU CE conformity and global machinery liability defense.

## Two standards, one underlying goal

Both standards address **Safety-Related Parts of Control Systems (SRP/CS)** in machinery and provide a **presumption of conformity** when harmonized under European machinery legislation:

- **ISO 13849-1** (revised in **2023**, fourth edition) evolved from the classic mechanical/pneumatic/electrical control categories of EN 954-1. It covers **electrical, electronic, programmable electronic, pneumatic, hydraulic and mechanical** safety technologies using **Performance Levels (`PL a` through `PL e`)**.
- **IEC 62061** (revised in **2021**, second edition) is the machinery-sector implementation of the generic electrical safety standard **IEC 61508** (just as [IEC 61511](/blog/safety-instrumented-systems-iec-61511-sil-guide) is the process-sector implementation). It focuses on **electrical, electronic and programmable electronic (E/E/PE)** systems using **Safety Integrity Levels (`SIL 1` through `SIL 3`)**.

## Side-by-side comparison: ISO 13849-1 vs IEC 62061

| Criterion | ISO 13849-1:2023 | IEC 62061:2021 |
|---|---|---|
| **Integrity metric** | Performance Level: **PL a, b, c, d, e** | Safety Integrity Level: **SIL 1, SIL 2, SIL 3** (no SIL 4 in machinery) |
| **Technologies covered** | Electrical, electronic, programmable, **hydraulic, pneumatic & mechanical** | **Electrical, electronic & programmable electronic (E/E/PE)** only |
| **Architectural model** | Five **Designated Architectures (Categories B, 1, 2, 3, 4)** | **Hardware Fault Tolerance (HFT)** + **Safe Failure Fraction (SFF)** / subsystem structures (A, B, C, D) |
| **Risk estimation tool** | Simple 3-parameter Risk Graph (`S` severity, `F` frequency, `P` avoidance) | Detailed numerical scoring matrix (Severity × Frequency + Probability + Avoidance) |
| **Typical user base** | Vast majority of discrete machine builders, OEMs, packaging, CNC, robotics integrators | Complex programmable electronics, multi-subsystem custom safety controls, teams already using IEC 61508/61511 |
| **Common verification software** | **IFA SISTEMA** (free industry standard), vendor tools (PAScal, SET, Safety Builder) | Vendor SIL calculators, FTA/Markov tools |

## Mapping Performance Level (PL) to SIL via PFH

Because both standards measure high-demand / continuous machinery safety using the same quantitative metric — **Average Probability of a Dangerous Failure per Hour (`PFH` or `PFH_D`)** — their levels map cleanly to one another:

| ISO 13849-1 Performance Level | Probability of Dangerous Failure per Hour (`PFH`) | Corresponding IEC 62061 SIL |
|---|---|---|
| **PL a** | `≥ 10^-5` to `< 10^-4` | No corresponding SIL |
| **PL b** | `≥ 3 × 10^-6` to `< 10^-5` | **SIL 1** |
| **PL c** | `≥ 10^-6` to `< 3 × 10^-6` | **SIL 1** |
| **PL d** | `≥ 10^-7` to `< 10^-6` | **SIL 2** |
| **PL e** | `≥ 10^-8` to `< 10^-7` | **SIL 3** |

*(Note: A numerical `PFH` match alone does not make a PL d circuit automatically compliant with SIL 2 or vice versa — architectural constraints, systematic capability and validation documentation must satisfy the chosen standard.)*

## Understanding ISO 13849-1 Categories (B, 1, 2, 3, 4)

Because **more than 80% of machine builders** use ISO 13849-1 — especially since real machines almost always include pneumatic dump valves or hydraulic blocking valves alongside safety PLCs — mastering its five architectural categories is essential:

- **Category B:** Basic safety principles applied; single channel; a single fault can lead to loss of the safety function (max **PL b**).
- **Category 1:** Category B + **well-tried components** and principles (e.g., positively driven mechanical switches); still single channel, better reliability (max **PL c**).
- **Category 2:** Single functional channel plus an **independent test channel** that checks the safety function periodically (at startup and at intervals ≥ 100× faster than the demand rate); up to **PL d**.
- **Category 3:** **Dual-channel redundancy** where a single fault does **not** cause loss of the safety function, and *some* (not necessarily all) faults are detected (**Diagnostic Coverage `DCavg` ≥ 60%**). Accumulation of undetected faults can eventually defeat safety; up to **PL e** (with high MTTFd & medium/high DC).
- **Category 4:** **Dual-channel redundancy with high diagnostic coverage (`DCavg ≥ 99%`)** so single faults are detected at or before the next demand, and even an accumulation of undetected faults does not compromise the safety function; required for highest-assurance **PL e** applications (such as light curtains on hydraulic presses).

### The four parameters that determine achieved PL

For every safety function (input sensor + safety logic + final actuator/valve/contactor), ISO 13849-1 combines four metrics:

1. **Category** (B, 1, 2, 3 or 4).
2. **`MTTFd` (Mean Time to Dangerous Failure):** Component reliability calculated from vendor `B10d` wear ratings and annual machine operating cycles (`nop`). *Watch out:* electromechanical relays, contactors and pneumatic valves wear out with cycles — high-cycle machines quickly push `MTTFd` down unless you switch to solid-state [drive STO](/blog/safe-torque-off-sto-functional-safety-drives-iec-61800-5-2) or schedule replacements!
3. **`DCavg` (Average Diagnostic Coverage):** Percentage of dangerous failures caught by automatic diagnostics (such as dual-channel discrepancy checks, OSSD test pulses and EDM feedback monitoring on contactors).
4. **`CCF` (Common Cause Failure):** Mandatory score of **≥ 65 points out of 100** (covering physical separation, diversity, EMC/surge immunity, environmental protection and engineering competence) for Category 2, 3 and 4 designs so a single power surge or pinched cable does not wipe out both channels together.

## What changed in ISO 13849-1:2023 and the EU Machinery Regulation

Engineers still relying on older 2015 checklists should note four key updates in **ISO 13849-1:2023** and **Regulation (EU) 2023/1230**:

- **Integrated validation guidance:** Validation requirements (previously split into ISO 13849-2) are now heavily clarified and integrated into ISO 13849-1:2023, making the Safety Requirements Specification (SRS) and test plan much more explicit.
- **Cybersecurity and protection against corruption:** Both ISO 13849-1:2023 (referencing [IEC 62443](/blog/iec-62443-explained)) and the EU Machinery Regulation explicitly require protecting safety-related software, parameters and remote connections from accidental or malicious corruption, plus logging legitimate or unauthorized interventions.
- **Clearer software lifecycle rules:** Distinguishes **Safety-Related Application Software (SRASW)** (ladder/FBD safety PLC logic using vendor-validated blocks) from embedded firmware (**SRESW**), clarifying review, testing and checksum management.
- **EMC and fault-exclusion rigor:** Tighter scrutiny on claiming "fault exclusions" (such as claiming two wires in one cable can never short together) — when in doubt, use pulsed OSSD diagnostics or separate conduits rather than shaky fault exclusions.

## Which standard should you choose?

- **Choose ISO 13849-1:2023** if your machine combines electrical, pneumatic, hydraulic or mechanical safety components (almost all packaging machines, CNC machine tools, conveyors, presses and [robot cells](/blog/robot-cell-integration-plc-safety-fieldbus-guide)), or if your customers ask for PL d / PL e and IFA SISTEMA verification files.
- **Choose IEC 62061:2021** if you are designing purely electrical/programmable complex safety subsystems, integrating into a facility standardized on IEC 61508/61511 SIL terminology, or building custom safety electronics from low-level component failure rates.
- **Remember:** Both standards explicitly permit using a component certified to one standard (for example, a SIL 2 safety PLC) inside a subsystem evaluated under the other standard using the `PFH` equivalence table — provided all architectural and systematic rules are respected.

=== takeaways
ISO 13849-1:2023 (Performance Levels PL a–e) and IEC 62061:2021 (SIL 1–3) are the two primary international functional safety standards for machinery control systems, both supporting compliance with the EU Machinery Regulation (EU) 2023/1230.
ISO 13849-1 covers electrical, programmable, pneumatic, hydraulic and mechanical safety parts using five architectural Categories (B, 1, 2, 3, 4), making it the default choice for most discrete machine builders.
IEC 62061 applies specifically to electrical, electronic and programmable electronic (E/E/PE) systems using Hardware Fault Tolerance and IEC 61508 concepts.
Achieved Performance Level depends on four coupled factors — Category, MTTFd (including mechanical wear from operating cycles), Diagnostic Coverage (DCavg) and Common Cause Failure prevention (CCF ≥ 65 points).
ISO 13849-1:2023 and the EU Machinery Regulation require protecting safety PLC logic and drive safety parameters against cyber corruption and unauthorized changes alongside traditional hardware safety checks.

=== faqs
Q: What is the difference between ISO 13849-1 and IEC 62061?
A: ISO 13849-1 covers electrical, electronic, programmable, hydraulic, pneumatic and mechanical safety control systems and rates integrity using Performance Levels (PL a to PL e). IEC 62061 covers only electrical, electronic and programmable electronic (E/E/PE) systems and rates integrity using Safety Integrity Levels (SIL 1 to SIL 3).

Q: How do Performance Levels (PL) map to Safety Integrity Levels (SIL)?
A: Based on Probability of Dangerous Failure per Hour (PFH), PL b and PL c correspond to SIL 1, PL d corresponds to SIL 2 (10^-7 to <10^-6 failures/hour), and PL e corresponds to SIL 3 (10^-8 to <10^-7 failures/hour). PL a has no equivalent SIL.

Q: Why does machine cycle rate affect ISO 13849-1 PL calculations?
A: Electromechanical safety components such as contactors, safety door switches and pneumatic dump valves fail primarily through mechanical wear (specified as B10d cycles). On a fast packaging machine cycling every few seconds, a contactor's calculated MTTFd drops rapidly — often requiring either scheduled replacement or switching to wear-free electronic Safe Torque Off (STO).

Q: Does ISO 13849-1 apply to process plants, or should I use IEC 61511?
A: Use ISO 13849-1 (or IEC 62061) for discrete machinery and equipment covered by machinery safety rules, and use IEC 61511 for process-industry Safety Instrumented Systems (SIS) protecting refineries, chemical reactors and continuous process plants.

=== sources
ISO 13849-1:2023: Safety of machinery — Safety-related parts of control systems — Part 1: General principles for design | https://www.iso.org/standard/73481.html
IEC 62061:2021: Safety of machinery — Functional safety of safety-related control systems | https://webstore.iec.ch/
IFA — SISTEMA Safety Integrity Software Tool for the Evaluation of Machine Applications | https://www.dguv.de/ifa/praxishilfen/practical-solutions-machine-safety/software-sistema/index-2.jsp
Regulation (EU) 2023/1230 on Machinery, Official Journal of the European Union | https://eur-lex.europa.eu/eli/reg/2023/1230/oj
