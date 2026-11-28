---
title: 3-Phase Motor Troubleshooting and Repair: IEEE 43 Megger Testing, Winding Balance, and EASA Rewind vs. Replace Criteria
slug: three-phase-motor-diagnostics-ieee-43-megger-rewind-vs-replace
type: BLOG
category: motion-control-drives
author: edward
tags: Motor repair, Motor efficiency, Automation repair, Condition monitoring, MRO strategy
publishedAt: 2026-11-25T10:00:00Z
excerpt: A standard 9-volt multimeter ohm check routinely passes a failing 3-phase motor that trips a VFD on ground fault two seconds later. Master IEEE Std 43-2013 insulation resistance, 40°C temperature correction, PI/DAR curves, winding unbalance limits, and ANSI/EASA AR100 rewind-vs-replace economics.
seoTitle: 3-Phase Motor Diagnostics: IEEE 43 Megger & EASA Rewind
seoDescription: Troubleshoot 3-phase motors with IEEE 43-2013 Megger, PI/DAR, and 40°C correction tables, winding balance limits, and ANSI/EASA AR100 rewind vs. replace data.
coverImage: /media/2026/11/cover-three-phase-motor-diagnostics-ieee-43-megger-rewind-vs-replace.jpg
coverAlt: Technical editorial illustration of a three-phase AC induction motor stator winding undergoing IEEE 43 insulation resistance Megger and polarization index testing
coverCaption: Disciplined offline electrical diagnostics under IEEE Std 43-2013 and ANSI/EASA AR100 separate salvable wet windings from condemned stators and guide rewind-vs-replace decisions.
---
One of the most common troubleshooting traps shared across `r/Motors`, `r/electricians`, and `r/industrialmaintenance` happens during an urgent line-down call: a technician disconnects a 480 V motor, measures `0.9 Ω` phase-to-phase across `T1–T2`, `T2–T3`, and `T3–T1` and `OL` to frame ground with a standard handheld multimeter, declares *"motor tests good!"* — and watches the breaker or VFD trip on Ground Fault the instant power returns.

A standard digital multimeter tests resistance with less than **1 to 3 volts DC**. At 3 volts, microscopic carbon tracks, coolant contamination, or thermally brittle slot-liner cracks appear completely open (`OL`), yet break down instantly under **650 V peak VFD pulses** or 480 V AC line voltage. Proper motor diagnostics requires applying **IEEE Std 43-2013** (*Recommended Practice for Testing Insulation Resistance of Electric Machinery*), evaluating **milliohm phase balance** and **voltage unbalance**, and applying **ANSI/EASA AR100-2020** criteria to decide objectively whether a failed motor should be baked, rewound, or replaced.

## Official IEEE Std 43-2013 Insulation Resistance (Megger) Standards

Before performing any insulation resistance (`IR`) test, **lock out power and disconnect the motor from all VFDs, soft starters, surge capacitors, and RTD/thermistor leads** (grounding RTD shields during test per IEEE 43). Apply the rated DC test voltage between all three stator leads tied together (`T1+T2+T3`) and the clean unpainted motor frame (`PE`).

### IEEE Std 43-2013 Table 1 & Table 3: DC Test Voltages and Minimum Acceptable `IR_1min` (Corrected to 40°C)

| Motor Rated Winding Voltage (Line-to-Line) | **Recommended DC Test Voltage** | Minimum `IR_1min` at 40°C (Post-1970 Random-Wound) | Minimum `IR_1min` at 40°C (Form-Wound / MV) | Practical Plant Maintenance Threshold |
|---|---|---|---|---|
| **`< 1,000 V`** *(208 V, 400 V, 480 V, 600 V)* | **`500 V DC`** | **`≥ 5 MΩ`** *(minimum safe to energize)* | **`≥ 100 MΩ`** | Healthy dry motors typically read **`> 100–2,000 MΩ`**; trend drop >50% signals moisture/contamination |
| **`1,000 – 2,500 V`** | **`500 – 1,000 V DC`** | **`≥ 100 MΩ`** | **`≥ 100 MΩ`** | Perform 10-minute Polarization Index (PI) test |
| **`2,501 – 5,000 V`** *(4,160 V class)* | **`1,000 – 2,500 V DC`** | — | **`≥ 100 MΩ`** | Require PI ≥ 2.0 + offline surge/hi-pot if trending downward |
| **`5,001 – 12,000 V`** *(6.6 kV / 11 kV)* | **`2,500 – 5,000 V DC`** | — | **`≥ 100 MΩ`** | Full IEEE 43 PI + step-voltage + partial discharge trending |

### Why Temperature Correction (`K_T` to 40°C) Prevents False Condemnation

Another frequent shop-floor error is comparing a hot motor's Megger reading taken immediately after a trip (winding at `80°C`) against a cold spare on the floor (`20°C`). Winding insulation resistance follows a steep inverse exponential curve — **roughly halving for every +10°C increase in winding temperature**!

Under **IEEE Std 43-2013**, normalize every raw reading `R_T` (measured at winding temperature `T` in °C) to the **`40°C` reference baseline** using:

`R_40°C = K_T × R_T`, where **`K_T = 0.5^((40 − T) / 10)`**

- **Worked Example (Hot vs. Cold Illusion):** A 480 V motor trips hot at **`T = 80°C`** and reads **`12 MΩ`**. Using `K_T = 0.5^((40 − 80) / 10) = 0.5^(-4) = 16.0`, its temperature-corrected insulation resistance at 40°C is **`12 × 16 = 192 MΩ`** — completely healthy! Conversely, a cold motor sitting in a `10°C` winter warehouse reading `20 MΩ` corrects to `20 × 0.5^3 = 2.5 MΩ` at 40°C — **FAIL** (severely wet winding that will arc over once warmed up!).

![IEEE Std 43-2013 dual diagnostic chart plotting 10-minute Polarization Index resistance curves for dry versus wet motor windings alongside the 40 degree Celsius temperature correction curve halving every 10 degrees](/media/2026/11/diagram-three-phase-motor-diagnostics-ieee-43-megger-rewind-vs-replace.png "Figure 1: IEEE Std 43-2013 insulation diagnostics showing 10-minute Polarization Index (PI) behavior of healthy versus wet windings (left) and the 10°C-halving temperature correction factor KT (right).")

## Polarization Index (PI) and Dielectric Absorption Ratio (DAR)

A single 60-second Megger snapshot can be fooled by temperature or surface dust. Applying DC test voltage continuously reveals whether absorption current decays properly while leakage current stays tiny:

- **DAR (Dielectric Absorption Ratio):** `IR_60sec / IR_30sec` (fast 1-minute field screening)
- **PI (Polarization Index):** `IR_10min / IR_1min` (authoritative IEEE 43-2013 insulation health metric — temperature-independent as long as winding temperature does not drift during the 10-minute window!)

| Metric Value | **DAR (`60s / 30s`)** | **PI (`10m / 1m`)** | Insulation Condition & Action Required |
|---|---|---|---|
| **`< 1.0`** | Dangerous | **Dangerous / Condemn** | Severe moisture ingress, conductive contamination, or cracked winding — **DO NOT ENERGIZE** |
| **`1.0 – 1.25` (DAR) / `1.0 – 1.5` (PI)** | Questionable | **Questionable / Wet** | Heavy moisture or oil/carbon tracking; send for wash, bake-out (105–120°C), and re-test |
| **`1.25 – 1.6` (DAR) / `1.5 – 2.0` (PI)** | Acceptable (Class A) | **Marginal (Class B/F/H)** | Below IEEE 43 Class B/F/H minimum (`2.0`); schedule outage for cleaning and re-varnish |
| **`> 1.6` (DAR) / `2.0 – 4.0` (PI)** | Good | **Good (Class B, F, H)** | Clean, dry, intact insulation system — safe for continued service |
| **`> 4.0 – 5.0` (PI)** | Very High | **Excellent OR Brittle/Dry** | Normal for modern epoxy/VPI windings; on 25+ year-old hot-running motors, verify insulation isn't thermally baked brittle |

**Critical IEEE 43-2013 Clause Many Technicians Miss:** If **`IR_1min` exceeds `5,000 MΩ`** (very common on modern Vacuum Pressure Impregnated — VPI — motors), IEEE 43-2013 explicitly notes that **PI becomes mathematically unreliable** because leakage current is down in the sub-nanoamp noise floor of the meter. Do not condemn a modern VPI motor reading `18,000 MΩ` at 1 minute just because `PI = 1.3`!

## Beyond Megger: Winding Resistance Balance, Inductance & Voltage Unbalance

A Megger only tests **winding-to-ground** insulation — it **cannot detect a turn-to-turn short** inside the same phase! Always combine insulation testing with **low-resistance (4-wire Kelvin milliohmmeter)** and **inductance/phase-angle** checks:

| Offline / Online Parameter | Healthy Tolerance | Warning / Investigation Zone | Condemn / Fault Signature |
|---|---|---|---|
| **Phase-to-Phase Winding Resistance (`R_12`, `R_23`, `R_31`)** | **`< 1% – 2%` max deviation** from average | **`2% – 5%` imbalance** *(inspect terminal lugs, crimped ring connectors, corroded motor-box splices first!)* | **`> 5%` imbalance** (after disconnecting terminal block) = open parallel stator strand or dead turn-to-turn short |
| **Phase-to-Phase Inductance (`L_12`, `L_23`, `L_31`)** *(at identical rotor angle)* | **`< 2% – 3%` deviation** | **`3% – 7%` deviation** *(run Rotor Influence Check — rotate shaft 10–15° steps to check rotor bars)* | **`> 7–10%` imbalance** = shorted stator coil turns or broken rotor cage bars |
| **Incoming 3-Phase Supply Voltage Unbalance** *(Online, NEMA MG 1)* | **`≤ 1.0%`** *(zero derating required)* | **`1.0% – 3.0%`** *(derate motor HP per NEMA MG 1 Fig 14-1; 3% V unbalance → ~18% extra temp rise!)* | **`> 5.0%`** — **NEMA MG 1 prohibits operating motor** (current unbalance reaches 6–10× voltage unbalance!) |

*NEMA MG 1 Quick Formula:* Percentage extra winding temperature rise caused by supply voltage unbalance scales with the square of unbalance:
`% Temp Rise Increase ≈ 2 × (% Voltage Unbalance)²`
That means just **3.5 percent utility voltage unbalance** drives **`~24.5 percent` extra winding temperature rise** — cutting Class F insulation thermal life by more than 75 percent even when the motor is not overloaded!

## ANSI/EASA AR100-2020: Rewind vs. Replace Engineering Decision Matrix

When a stator winding truly fails turn-to-turn or burns to ground, plant engineers face the classic procurement question: **repair/rewind or buy new?**

For decades, a persistent shop myth claimed *"every motor rewind permanently destroys 2 to 4 percent efficiency."* The landmark joint **EASA / AEMT Rewind Efficiency Study** (*The Effect of Repair/Rewinding on Motor Efficiency*) disproved that blanket myth under controlled conditions: when a repair shop strictly follows **ANSI/EASA AR100-2020** — specifically performing pre- and post-strip **core-loss (loop) testing**, stripping old windings in a **temperature-controlled burnout oven capped at `360–370°C (680–700°F)`** (never an open oxy-acetylene torch that welds interlaminar steel!), maintaining original wire cross-section/turns, and applying proper VPI varnish — **motor efficiency is preserved within `±0.1%` (often improving slightly on older motors)**.

![Three-phase motor offline troubleshooting and EASA AR100 rewind versus replace engineering decision tree from LOTO and milliohm balance through IEEE 43 Megger and core-loss testing](/media/2026/11/diagram2-three-phase-motor-diagnostics-ieee-43-megger-rewind-vs-replace.png "Figure 2: End-to-end 3-phase motor offline diagnostic workflow and ANSI/EASA AR100-2020 decision logic separating field-recoverable moisture faults from rewind and IE3/IE4 replacement paths.")

### Practical Rewind vs. Replace Decision Table

| Motor Frame / Power Class | Repair Cost Threshold (`% of New Motor`) | Typical Best Economic Decision | Exceptions That Favor Rewind / Repair |
|---|---|---|---|
| **`< 15 HP (< 11 kW)` Standard NEMA / IEC** | Usually `> 75–100%` of new | **Replace** with new NEMA Premium (IE3) or IE4/IE5 unit | Specialty custom shaft, integral brake/gearhead, explosion-proof `Ex d` with 16-week lead time |
| **`15 – 50 HP (11 – 37 kW)` General Purpose** | Rewind only if **`< 50–55%`** of new & core-loss passes | **Replace** if motor is legacy IE1/IE2 running `> 4,000 hrs/yr` (energy payback < 2 yrs!) | Existing IE3/IE4 motor with **bearing-only** or **wash-and-bake** moisture failure |
| **`50 – 150 HP (37 – 110 kW)` Continuous Duty** | Rewind if **`< 60–65%`** of new AND motor is already IE3/IE4 | **Evaluate 10-Yr TCO** (see our [IE3/IE4/IE5 energy ROI guide](/blog/industrial-motor-efficiency-ie3-ie4-ie5-energy-roi-guide)); upgrade legacy IE1/IE2 to IE4 | Emergency downtime where certified EASA rewind takes 4 days vs. 12-week OEM stock lead time |
| **`> 150 HP (> 110 kW)` / Medium-Voltage / Servo & Spindle Motors** | Rewind/rebuild almost always **`25–50%`** of new | **Certified EASA AR100 Rewind & Mechanical Overhaul** (if stator core iron passes core-loss test) | Severe stator core iron melt/welding where lamination restacking exceeds new motor cost |

### Four Audit Questions Before Sending Any Motor to a Repair Shop

1. **Are you EASA-accredited and working to ANSI/EASA AR100-2020?** Ask for their standard final test sheet before shipping.
2. **What is your burnout oven maximum part-temperature limit and do you log chart recordings?** Demand **`≤ 360–370°C` (`680–700°F`)** for organic Class F/H insulation (higher temperatures degrade interlaminar core-plate enamel and spike eddy-current iron losses permanently).
3. **Do you perform pre-burnout and post-burnout core-loss testing plus offline surge comparison testing?** Core-loss testing catches hot spots in stator laminations before you pay for a copper rewind; surge testing catches weak turn-to-turn insulation that a Megger misses.
4. **If the motor runs on a VFD, will you upgrade magnet wire to NEMA MG 1 Part 31 inverter-duty wire and install shaft grounding?** Upgrading insulation during a rewind costs marginally more and prevents repeat failure (see our [VFD bearing fluting and reflected-wave guide](/blog/vfd-motor-bearing-fluting-edm-reflected-wave-repair-guide) and [obsolete industrial spare parts repair vs. sourcing guide](/blog/obsolete-automation-spare-parts-sourcing-repair-guide)).

=== takeaways
A standard handheld multimeter (1–3 V DC) misses winding-to-ground breakdown that trips breakers or VFDs under operating voltage; always test offline with a 500 V DC Megger (for <1,000 V motors) disconnected from drives per IEEE Std 43-2013.
Winding insulation resistance roughly halves for every +10°C rise in temperature; always normalize raw Megger readings to 40°C using KT = 0.5^((40-T)/10) before condemning a hot motor or approving a cold wet spare.
IEEE Std 43-2013 requires minimum 5 MΩ (post-1970 random-wound) or 100 MΩ (form-wound) at 40°C and a Polarization Index (PI) ≥ 2.0 for Class B/F/H insulation — except when 1-minute IR exceeds 5,000 MΩ on modern VPI windings, where PI is no longer diagnostic.
A Megger cannot detect turn-to-turn shorts; always combine insulation resistance with 4-wire Kelvin milliohm resistance balance (<2% deviation) and check supply voltage unbalance (where 3.5% unbalance adds ~25% extra winding temperature rise).
Per the EASA/AEMT Rewind Study and ANSI/EASA AR100-2020, controlled-oven rewinds (≤360–370°C) with core-loss verification preserve efficiency within ±0.1%, making rewinds cost-effective above 50–100 HP or for specialty frames when repair cost stays below 55–65% of replacement.

=== faqs
Q: Why did my motor pass a standard multimeter resistance check but immediately trip the VFD on ground fault?
A: A standard multimeter uses only 1 to 3 volts DC to measure ohms, which is far too low to ionize moisture paths, coolant contamination, or hairline insulation cracks. You must disconnect the motor from the VFD and apply 500 V DC (for 480 V motors) with an insulation resistance tester (Megger) to reveal real dielectric breakdown.

Q: What is a good Megger reading for a 480V three-phase industrial motor?
A: Under IEEE Std 43-2013, the absolute minimum safe threshold to energize a post-1970 random-wound <1,000 V motor is 5 MΩ corrected to 40°C (100 MΩ for form-wound stators). In practical plant maintenance, healthy dry 480 V motors typically read >100 MΩ to several Gigaohms, and any sudden 50%+ downward trend warrants wash-and-bake service.

Q: Why does a hot motor give a much lower Megger reading than the exact same motor after it cools down?
A: Polymeric motor insulation resistance drops roughly by half for every +10°C increase in winding temperature. Under IEEE 43-2013, a motor reading 12 MΩ at 80°C actually corrects to 192 MΩ at the 40°C standard reference — whereas a motor reading 12 MΩ at 10°C corrects to a failing 1.5 MΩ at 40°C.

Q: Does rewinding a burned-out electric motor ruin its efficiency?
A: Not when performed by an EASA-accredited shop following ANSI/EASA AR100-2020. The joint EASA/AEMT study proved that using temperature-controlled burnout ovens capped at 360–370°C (680–700°F) alongside core-loss testing and exact coil replication maintains motor efficiency within ±0.1%. Uncontrolled torch burnouts, however, permanently weld stator laminations and ruin efficiency.

Q: When is it better to replace a failed 3-phase motor instead of rewinding it?
A: Standard general-purpose motors under 15–50 HP are usually cheaper to replace with new NEMA Premium (IE3) or IE4 units, especially if the failed unit was a legacy IE1/IE2 motor running >4,000 hours/year or if repair quotes exceed 55–65% of a new motor's price. Rewinding wins on larger motors (>50–100 HP), custom frames, or long-lead specialty motors whose core iron passes core-loss testing.

=== sources
IEEE Std 43-2013 — IEEE Recommended Practice for Testing Insulation Resistance of Electric Machinery | https://www.ieee.org/
ANSI/EASA AR100-2020 — Recommended Practice for the Repair of Rotating Electrical Apparatus | https://easa.com/resources/easa-standards
EASA / AEMT Study — The Effect of Repair/Rewinding on Motor Efficiency | https://easa.com/
NEMA MG 1 — Motors and Generators (Voltage Unbalance Derating & Testing Standards) | https://www.nema.org/standards/view/motors-and-generators
U.S. Department of Energy — Motor Repair vs. Replacement Guidelines | https://www.energy.gov/cmei/ito/motor-systems
