---
title: Condition Monitoring and Predictive Maintenance: Vibration, Motor Current and Edge Analytics
slug: predictive-maintenance-vibration-motor-current-analysis
type: BLOG
category: smart-manufacturing
author: edword
tags: Condition monitoring, Smart manufacturing, VFDs, Edge computing, IIoT, OEE
publishedAt: 2026-10-23T09:00:00Z
excerpt: Predictive maintenance catches bearing wear, misalignment and electrical faults weeks before catastrophic breakdown — when paired with the right sensors and physics. Compare vibration analysis, ultrasound, Motor Current Signature Analysis (MCSA) and edge deployment strategies.
seoTitle: Predictive Maintenance: Vibration, MCSA & Edge Guide
seoDescription: Guide to condition monitoring and predictive maintenance: P-F curve, MEMS vs piezo vibration sensors, FFT fault frequencies, VFD MCSA and edge rollouts.
---
Unplanned breakdowns on a critical fan, main compressor, hydraulic pump or CNC spindle are the single most destructive driver of [Availability loss in OEE](/blog/oee-calculation-losses-plc-data-collection-guide). Traditional **calendar-based preventive maintenance (PM)** — swapping bearings or belts every 4,000 hours whether they need it or not — wastes parts, burns technician hours and frequently introduces *infant-mortality* failures through installation misalignment.

**Condition-Based Monitoring (CBM)** and **Predictive Maintenance (PdM)** shift maintenance from fixed schedules to actual equipment health. Yet many industrial AI/PdM pilots stall in "proof-of-concept purgatory" because teams slap low-grade sensors onto non-critical assets and flood technicians with false alarms. Building a PdM program that actually prevents downtime starts with understanding failure physics and the **P-F curve**.

## The P-F curve: matching the sensor to the failure stage

Most mechanical and electrical faults do not happen instantaneously — they progress along the **P-F (Potential-to-Functional failure) curve**, leaving measurable physical signatures weeks or months before seizure:

| Stage Before Breakdown | Physical Fault Progression | Best Detection Technique | Typical Lead Time (P-F Interval) |
|---|---|---|---|
| **Earliest** | Microscopic sub-surface bearing fatigue, early lubrication starvation, slight friction | **Airborne / structure-borne ultrasound** (20–100 kHz) & **oil tribology / wear-particle analysis** | Months |
| **Early** | Micro-spalling on bearing races, early gear tooth pitting, rotor bar cracks | **High-frequency vibration (enveloping / FFT)** & **Motor Current Signature Analysis (MCSA)** | Weeks to months |
| **Mid-stage** | Looseness, shaft misalignment, unbalance, severe bearing spalling | **Broadband RMS vibration velocity (ISO 20816)**, audible noise change | Days to weeks |
| **Late** | Elevated friction heating, winding insulation breakdown | **Infrared thermography**, embedded RTD/PTC temperature sensors | Hours to days |
| **Imminent** | Smoke, seizure, tripped VFD overcurrent or thermal overload | Standard PLC / drive protection trips (**too late** — collateral damage already occurred) | Seconds to minutes |

Notice the lesson on temperature: **by the time a bearing housing feels hot on a SCADA trend, the bearing is often hours away from destroying the shaft.** Temperature is an emergency protection metric; **vibration, ultrasound and motor current** provide the early planning window maintenance teams actually need to schedule repairs during planned weekend outages.

## Vibration monitoring: broadband RMS vs FFT spectrum analysis

Vibration remains the workhorse of rotating-equipment condition monitoring across motors, pumps, fans, gearboxes and machine-tool spindles.

### Broadband RMS velocity (ISO 20816)

Measuring overall RMS vibration velocity (mm/s or in/s across 10–1,000 Hz) against **ISO 20816-3** (which replaced ISO 10816-3) zones (`A` Good, `B` Satisfactory, `C` Unsatisfactory, `D` Unacceptable) is the simplest continuous health check. It catches gross **unbalance (1× shaft running speed)**, **misalignment (2× running speed)** and **mechanical looseness** reliably — and requires almost zero data science.

### Frequency-domain FFT & bearing fault frequencies

To diagnose *what* is failing inside a machine — rather than just knowing "it is shaking more" — the edge node computes a **Fast Fourier Transform (FFT)** and monitors characteristic kinematic fault frequencies:

- **1× RPM:** Rotor unbalance, bent shaft.
- **2× RPM (plus axial vibration):** Shaft angular or parallel misalignment.
- **BPFO / BPFI / BSF / FTF:** Ball Pass Frequency Outer/Inner race, Ball Spin Frequency and Fundamental Train Frequency — derived directly from bearing geometry and shaft speed.
- **Gear Mesh Frequency (GMF = teeth × RPM) with sidebands:** Worn or cracked gearbox teeth.
- **2× Line Frequency (100/120 Hz):** Electrical air-gap eccentricity or stator looseness in AC motors.

### Choosing vibration hardware: MEMS wireless vs wired IEPE piezoelectric

| Criterion | Wireless Triaxial MEMS Sensor | Wired Piezoelectric (IEPE / ICP) Accelerometer |
|---|---|---|
| **Frequency bandwidth** | Typically 1 Hz – 1–5 kHz (newer industrial MEMS reaching ~10 kHz) | Wide: 0.5 Hz – 10–25+ kHz (excellent for high-frequency early bearing impact & gearboxes) |
| **Installation cost** | Very low (magnetic or stud mount, battery lasts 2–5 years; zero conduit) | Higher (shielded cable, conduit, dedicated DAQ / IO-Link or PLC vibration card) |
| **Sampling pattern** | Periodic bursts (e.g., every 1–4 hours) to preserve battery | Continuous real-time streaming |
| **Best suited for** | Balance-of-plant pumps, HVAC fans, conveyors, remote motors (semi-critical assets) | Critical high-speed spindles, turbines, critical compressors, variable-speed assets requiring continuous protection |

**Mounting matters more than sensor marketing:** Never stick an accelerometer onto a thin sheet-metal fan guard or painted plastic cover. Mount perpendicular to the shaft directly on the **load-bearing housing** using a tapped stud (best high-frequency fidelity) or structural adhesive; flat-magnet mounts work for periodic checks under ~2 kHz.

## Motor Current Signature Analysis (MCSA) and VFD-based monitoring

What about **submerged pumps, hermetically sealed compressors, high-temperature kilns or hard-to-reach mixers** where you cannot mount a vibration sensor?

**Motor Current Signature Analysis (MCSA)** measures high-resolution 3-phase current (and voltage) right inside the clean, accessible **Motor Control Center (MCC)** cabinet using split-core current transformers — or extracts internal torque/current harmonics directly from an existing [Variable Frequency Drive (VFD)](/blog/vfd-vs-servo-drive-selection-guide).

MCSA excels at catching faults that vibration misses or sees late:

- **Broken rotor bars and end-ring cracks** (distinct pole-pass sidebands around supply frequency `f_s ± 2·s·f_s`).
- **Stator winding turn-to-turn insulation degradation** and phase current unbalance.
- **Air-gap eccentricity** and load-side mechanical pulsations (cavitation in centrifugal pumps, worn belts, jammed auger blades) reflected back into motor torque ripple.

Combining **MCSA inside the MCC** with **vibration on mechanical bearings** covers both the electrical and mechanical halves of the drivetrain.

## Why raw vibration waveforms belong at the edge — not in the cloud

Streaming raw 25.6 kHz triaxial vibration waveforms from 200 motors continuously over a factory network to a cloud bucket wastes gigabytes of bandwidth and creates latency. Instead, process signals at the **edge** — either inside a smart IO-Link/wireless sensor node or a local [industrial edge gateway](/blog/industrial-edge-gateways-selection-deployment-guide):

1. Compute compact health features locally every few minutes (triaxial RMS velocity, peak acceleration, kurtosis/crest factor, bearing envelope energy, temperature).
2. Publish only lightweight KPIs and state changes into your plant [Unified Namespace (UNS)](/blog/unified-namespace-uns-architecture-practical-guide) or historian.
3. Capture and upload a **full high-resolution FFT spectrum snapshot only on anomaly trigger** (or once daily for baseline trending) so a reliability engineer can confirm the exact failure mode before issuing a CMMS work order.

## Five rules for a predictive maintenance rollout that sticks

1. **Rank assets by criticality first (FMECA):** Start with the **top 10–20 "bad actor" or single-point-of-failure assets** whose surprise failure stops the whole line or carries a long lead time for spare parts — never instrument non-critical redundant sump pumps in Phase 1.
2. **Collect operating context from the PLC:** A vibration spike when a VFD accelerates from 20 Hz to 60 Hz — or when a CNC spindle shifts from aluminum to titanium — is normal, not a fault! Always correlate vibration/current readings with **PLC speed, load and machine state** to eliminate false alarms.
3. **Establish a 2–4 week healthy baseline** across all normal operating speeds and product SKUs before enabling automated alerts.
4. **Integrate alerts directly into the CMMS work-order workflow:** An anomaly email sitting in a data scientist's inbox fixes nothing. Route confirmed Stage-2 alerts automatically into maintenance planning with clear inspection instructions ("Inspect Motor M-204 drive-end bearing — elevated BPFO amplitude").
5. **Close the feedback loop:** When technicians pull a flagged bearing or motor, inspect and photograph the failed raceway and log the true root cause — every verified catch builds plant-floor trust and sharpens your thresholds.

=== takeaways
Condition monitoring and predictive maintenance detect mechanical and electrical degradation weeks before catastrophic failure by tracking early P-F curve signatures such as ultrasound, vibration and motor current — long before temperature rises.
Broadband RMS vibration velocity (ISO 20816) catches unbalance, misalignment and looseness, while FFT spectrum analysis pinpoints exact bearing raceway, gearbox and electrical fault frequencies.
Motor Current Signature Analysis (MCSA) monitors motors from inside the MCC cabinet or VFD without field sensors, making it ideal for submerged, hot or inaccessible machinery and electrical rotor/stator defects.
Computing vibration KPIs at the edge and uploading full FFT snapshots only on anomaly triggers minimizes plant network traffic and integrates cleanly with a Unified Namespace and CMMS.
Correlating condition sensors with live PLC speed and load states prevents false alarms on variable-speed equipment and is essential for maintenance-team adoption.

=== faqs
Q: What is the difference between preventive maintenance and predictive maintenance?
A: Preventive maintenance replaces parts or services equipment on fixed calendar or runtime intervals regardless of actual wear. Predictive maintenance monitors real-time equipment condition (such as vibration, ultrasound, oil quality or motor current) to schedule repairs only when measurable degradation begins, maximizing asset life while avoiding unplanned breakdowns.

Q: When should I use Motor Current Signature Analysis (MCSA) instead of vibration sensors?
A: MCSA is especially valuable when assets are submerged, sealed, in hazardous or high-temperature environments where mounting accelerometers is impractical, or when you want to detect electrical motor defects such as broken rotor bars, eccentricity and stator winding issues directly from the MCC cabinet. Many critical drivetrains combine both MCSA and vibration.

Q: Why do variable-speed machines generate false alarms in vibration monitoring?
A: Mechanical vibration amplitude changes naturally with shaft speed and process load, and resonance frequencies can appear at specific RPM bands. Correlating vibration readings with live speed and load tags from the PLC or VFD allows dynamic speed-binned baselines that prevent false alerts.

Q: What vibration standard sets severity thresholds for industrial rotating machinery?
A: ISO 20816 (particularly ISO 20816-3 for industrial machines above 15 kW and 120–30,000 rpm) replaced ISO 10816 and defines vibration velocity severity zones (A through D) to guide alarm and trip thresholds for pumps, fans, motors and compressors.

=== sources
ISO 20816-3:2022: Mechanical vibration — Measurement and evaluation of machine vibration (Industrial machinery) | https://www.iso.org/standard/75827.html
ISO 13373-1: Condition monitoring and diagnostics of machines — Vibration condition monitoring | https://www.iso.org/standard/21832.html
ISO 17359: Condition monitoring and diagnostics of machines — General guidelines | https://www.iso.org/standard/66468.html
IEEE Std 1415: Guide for Induction Machinery Maintenance Testing and Failure Analysis | https://standards.ieee.org/
