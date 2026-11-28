---
title: Preventing VFD Motor Failures: Bearing Fluting (Shaft Currents), Reflected Wave Voltage, and Cable Grounding
slug: vfd-motor-bearing-fluting-edm-reflected-wave-repair-guide
type: BLOG
category: motion-control-drives
author: edward
tags: VFD troubleshooting, Motor repair, Motion troubleshooting, Power quality, Condition monitoring, VFDs
publishedAt: 2026-11-25T07:00:00Z
excerpt: Replacing noisy VFD-driven motor bearings only to watch them howl again 90 days later with washboard fluting is one of industrial maintenance's most frustrating cycles. Learn the physics of EDM shaft currents, NEMA MG 1 Part 31 reflected wave limits, output filter selection, and 360-degree shield grounding.
seoTitle: VFD Motor Bearing Fluting, Reflected Wave & Grounding
seoDescription: Stop recurring VFD motor failures: EDM bearing fluting fixes, NEMA MG 1 Part 31 reflected wave limits, dV/dt filter tables, and 360-degree shield grounding.
coverImage: /media/2026/11/cover-vfd-motor-bearing-fluting-edm-reflected-wave-repair-guide.jpg
coverAlt: Technical editorial illustration of a VFD-driven motor bearing raceway showing EDM fluting patterns, reflected PWM voltage overshoot, and shaft grounding protection
coverCaption: Fast IGBT PWM switching creates common-mode shaft currents and reflected standing waves that rapidly destroy bearings and stator insulation unless properly mitigated.
---
One of the most frequently posted mysteries across `r/Motors`, `r/industrialmaintenance`, `r/electricians`, and `r/PLC` reads almost identically every time: *"We replaced the bearings on our 30 HP HVAC fan motor three months ago, laser-aligned the shaft, checked grease — and now it's screaming like a jet engine again. We cut the inner race open and it looks like a miniature washboard!"* Another perennial shop-floor debate follows close behind: *"Our motor sits 220 feet away from the VFD and keeps burning out stator windings — and half the electricians say ground the VFD cable shield at one end while the other half insist on grounding both ends!"*

Both failures trace directly back to how modern **IGBT pulse-width modulation (PWM) inverters** switch DC bus voltage. Unlike clean 50/60 Hz utility sine waves, modern IGBTs slam **560–680 V DC pulses** onto motor cables with blazingly fast **voltage rise times (`t_r = 0.05 to 0.2 µs`)** thousands of times per second (`2–16 kHz` carrier frequency). That high `dV/dt` triggers two silent motor killers: **Electrical Discharge Machining (EDM) bearing fluting** and **transmission-line reflected wave overvoltage**.

## How VFD Common-Mode Voltage Causes Bearing Fluting (EDM)

On a balanced three-phase sinusoidal supply, the instantaneous sum of voltages `V_U + V_V + V_W` equals zero at every instant. On a two-level PWM VFD, each output phase is always clamped to either `+V_DC/2` or `-V_DC/2`, so the instantaneous average of all three phases — the **common-mode voltage (`V_CM`)** — is never zero. Instead, it forms a sharp high-frequency stepped waveform jumping at every IGBT switching edge.

Inside the motor, stator windings couple capacitively to the rotor (`C_wr`) and frame (`C_wf`), turning the spinning shaft into a capacitive voltage divider relative to the grounded stator frame:

1. **Capacitive Charge Buildup:** Common-mode `dV/dt` charges the rotating shaft to **10–40 V peak** while the bearing runs on a microscopic `0.2–2 µm` insulating hydrodynamic grease film.
2. **Micro-Arc Breakdown (EDM):** Whenever shaft voltage exceeds the dielectric breakdown strength of the grease film (typically **5–15 V**), the stored energy discharges violently through a pinpoint spot on the ball/roller raceway, reaching localized plasma temperatures that melt microscopic craters (**frosting / pitting**).
3. **Washboard Fluting (ISO 15243):** As rolling elements strike those microscopic pits repeatedly at ball-pass frequency, mechanical impact and repeated electrical discharges organize into evenly spaced corrugated ridges across the raceway — classic **bearing fluting** — causing intense high-frequency audible whine and complete bearing seizure in **3 to 12 months**.

![Cross-section schematic of VFD-induced common-mode shaft voltage capacitive coupling Cwr Cwf Cb causing EDM bearing fluting alongside shaft grounding ring and insulated bearing mitigation](/media/2026/11/diagram-vfd-motor-bearing-fluting-edm-reflected-wave-repair-guide.png "Figure 1: Capacitive shaft-voltage circuit inside a VFD-fed motor illustrating EDM raceway discharge (fluting) and proper mitigation using a shaft grounding ring plus NDE insulated bearing.")

### Three Distinct Bearing Current Mechanisms (IEC TS 60034-25)

Field engineers frequently install a shaft grounding brush on a 250 HP motor and wonder why bearings still fail — because larger frames introduce **circulating currents**, not just capacitive EDM:

| Bearing Current Mechanism | Dominant Motor Frame Size | Physical Current Path | Required Mitigation Strategy |
|---|---|---|---|
| **1. Capacitive EDM Currents** | **All VFD motors** *(dominant < 75 kW / 100 HP)* | Stator → `C_wr` → Rotor Shaft → **Bearing Grease Film** → Frame Ground | Install **conductive microfiber Shaft Grounding Ring (SGR)** on DE or NDE shaft to divert charge safely (`< 2 V` shaft peak) |
| **2. High-Frequency Circulating Currents** | **Large motors (`≥ 75–100 kW` / `≥ 100 HP`, IEC frame ≥ 280)** | High-frequency magnetic flux induces end-to-end shaft voltage → loop flows **DE Bearing → Shaft → NDE Bearing → Frame** | **Break the loop!** Install an **Insulated Bearing** (ceramic-coated or hybrid ceramic per SKF/IEC 60034-17) on **NDE** AND a **Shaft Grounding Ring** on **DE** |
| **3. Rotor Ground Currents** | Any size with **poor motor-frame bonding** | Common-mode current flows from stator → rotor → **coupled driven load (pump/gearbox)** via bearings when motor frame impedance is high | Low-impedance **360° braided HF bonding strap** from motor frame to VFD ground + insulated coupling if driven load is better grounded than motor |

*Critical Field Rule (Never Violate This!):* If you install an insulated bearing on the **non-drive end (NDE)** of a large motor **without** a shaft grounding ring on the drive end (DE), capacitive shaft voltage simply discharges harder through the DE bearing — or travels across the shaft coupling and **flutes your expensive gearbox or centrifugal pump bearings instead**!

## Reflected Wave Voltage (`dV/dt`) and NEMA MG 1 Part 31 Limits

When an IGBT launches a steep voltage pulse (`t_r = 0.05–0.2 µs`) down a motor power cable, the cable behaves as a high-frequency transmission line with characteristic impedance `Z_0 ≈ 50–100 Ω`, while the motor winding presents a much higher surge impedance `Z_m ≈ 500–5,000 Ω`. At the motor terminals, that impedance mismatch creates a reflection coefficient approaching **`Γ ≈ +0.8 to +1.0`**, causing the forward and reflected waves to stack up to **nearly 2.0× DC bus voltage** (`~1,300–1,600 V peak` on a 480 V system, or `>2,000 V` during regenerative braking!).

Full voltage doubling occurs whenever the cable exceeds the **critical length (`L_crit`)**:

`L_crit = (v_prop × t_r) / 2` *(where cable propagation velocity `v_prop ≈ 150 m/µs` or `500 ft/µs`)*

For a modern fast IGBT with `t_r = 0.1 µs`, **full 2× reflected voltage overshoot develops at just `7.5 meters (25 feet)`** — far shorter than most electricians assume!

![Reflected wave peak voltage versus motor cable length curve for a 480V VFD comparing unmitigated fast IGBT switching against NEMA MG 1 Part 30 and Part 31 insulation limits, dV/dt filters, and sine-wave filters](/media/2026/11/diagram2-vfd-motor-bearing-fluting-edm-reflected-wave-repair-guide.png "Figure 2: Peak motor terminal voltage versus cable run length on a 480V VFD showing fast-IGBT overshoot crossing NEMA MG 1 Part 30 limits within 15–30 m compared with dV/dt and sine-wave filtering.")

### NEMA MG 1 Part 30 vs. Part 31 Insulation & Cable Thresholds

| Motor Classification | Peak Voltage Withstand (≤ 460 V Rated) | Minimum Rise Time Rating | Typical Safe Unfiltered Cable Run (`480 V` VFD) | Typical Failure Mode When Exceeded |
|---|---|---|---|---|
| **Standard General-Purpose (NEMA MG 1 Part 30)** | **`1,000 V` peak** | `≥ 2.0 µs` | **`< 15 m (50 ft)`** *(risk starts even shorter with fast SiC/IGBT drives)* | **First-turn stator corona discharge** → rapid phase-to-phase turn short within months |
| **Definite-Purpose Inverter-Duty (NEMA MG 1 Part 31.4.4.2)** | **`1,600 V` peak** (`3.1 × V_rated`) | **`≥ 0.1 µs`** | **`~30 – 90 m (100 – 300 ft)`** *(check drive vendor chart & carrier Hz)* | Partial discharge above 1,600 V (especially during regen bus boost or 575 V / 690 V systems!) |

### Choosing the Right VFD Output Filter

| Output Mitigation Device | Peak Voltage Clamp (480 V System) | Practical Cable Length Limit | Voltage Drop at Full Load | Protects Against Bearing Fluting? | Typical Best Application |
|---|---|---|---|---|---|
| **3% Output Load Reactor** | Moderate (`~1,100–1,350 V`) | Up to **`~90–150 m (300–500 ft)`** | `~2–3%` | Slightly (lowers `dI/dt`, not full `V_CM`) | Standard inverter-duty motor at moderate runs; budget protection |
| **`dV/dt` Output Filter** *(RLC)* | Clamps rise time `> 0.5–1.5 µs` (`< 1,000–1,100 V`) | Up to **`~150–300 m (500–1,000 ft)`** | `~1–2%` | Moderately reduces capacitive peak | Legacy non-inverter-duty motors or long 480 V / 690 V feeder runs |
| **Sine-Wave Output Filter** | Pure sinusoidal **`~680 V` peak** *(zero PWM pulse)* | **`300 – 1,000+ m (1,000–3,000 ft)`** | `~3–5%` | **Significantly reduces `dV/dt`** *(add CM choke/SGR for full CM elimination)* | Submersible deep-well pumps, step-up transformers, multi-motor runs, extreme cable lengths |
| **Common-Mode Ferrite Core / Choke** | Does not change phase-to-phase `dV/dt` | Any (mounted right at VFD output) | `0%` | **Yes — cuts high-frequency `I_CM` 30–60%** | Low-cost addition inside cabinet paired with Shaft Grounding Ring |

*Quick Parameter Tip:* Lowering VFD **carrier frequency** from `8–12 kHz` down to **`2–4 kHz`** immediately cuts switching-edge count per second by 3–4× (dramatically slowing corona aging and bearing pitting), at the minor trade-off of slightly higher audible motor whine.

## Settling the Classic Reddit Debate: VFD Cable Shield Grounding

No electrical topic triggers more heated comment threads among industrial electricians and PLC techs than: *"Should I land the VFD cable shield at one end only (to avoid ground loops) or at BOTH ends?"*

The confusion comes from mixing up **low-frequency analog instrumentation rules** with **high-frequency RF/EMI power rules**:

| Cable Type | Dominant Noise Frequency | Correct Shield Termination Rule | Why the Opposite Rule Fails |
|---|---|---|---|
| **4–20 mA Analog / Thermocouple / Encoder Signal** | Low frequency (`DC – 60 Hz` hum + capacitive coupling) | **Ground at ONE end only** *(typically PLC/cabinet reference ground)* | Grounding both ends allows 50/60 Hz plant ground potential differences (`V_GPD`) to drive mA loop currents straight through the shield, corrupting sensor readings |
| **3-Phase VFD Power Cable (Symmetric Shielded)** | **High frequency (`100 kHz – 30 MHz` PWM edges)** | **Bond 360° at BOTH ends** *(VFD EMC clamp + Motor junction box EMC gland)* — **NEVER leave pigtails > 25 mm!** | Grounding only one end turns the floating shield into a **quarter-wave RF antenna** that radiates switching noise into nearby PLC I/O and provides no low-impedance return path for common-mode currents |

### Four Rules for Bulletproof VFD Motor Wiring

1. **Use True Symmetric Shielded VFD Cable (3 Phase + 3 Symmetrical Grounds + Copper Tape/Braid Shield):** Three symmetrical ground conductors placed in the interstices cancel residual magnetic flux and reduce common-mode impedance far better than pulling loose THHN conductors in PVC conduit.
2. **Terminate Shields 360° — Not with "Pigtails":** Twisting a copper braid into a 15 cm "pigtail" adds roughly `150 nH` of inductance — which acts like a dead open circuit at 10 MHz switching harmonics! Use **360° brass EMC cable glands** at the motor peckerhead and **360° saddle clamps** directly onto the unpainted zinc VFD subpanel.
3. **Never Run VFD Output Cables in the Same Conduit or Tray as 24 V DC PLC I/O, Analog, or Ethernet:** Maintain at least **300 mm (12 in)** parallel separation (or steel divider barrier) and cross power/signal trays strictly at **90 degrees**.
4. **Verify With Predictive Monitoring:** Pair mechanical protection with early-stage ultrasound or high-frequency accelerometer envelope monitoring (see our [predictive maintenance vibration and MCSA guide](/blog/predictive-maintenance-vibration-motor-current-analysis)) to catch early bearing frosting months before fluting halts production.

=== takeaways
Fast IGBT PWM voltage rise times (0.05–0.2 µs) generate both common-mode shaft currents (EDM bearing fluting) and reflected standing-wave voltage peaks up to 2× DC bus voltage (~1,300–1,600 V on 480 V systems).
Bearing fluting appears as evenly spaced washboard ridges on raceways and can destroy new motor bearings in 3–12 months; protect motors under 75 kW with a shaft grounding ring, and motors ≥75 kW with both an NDE insulated bearing and a DE shaft grounding ring.
Under NEMA MG 1 Part 31, definite-purpose inverter-duty motors withstand 1,600 V peak at 0.1 µs rise time, whereas general-purpose Part 30 motors are rated to only 1,000 V and suffer rapid stator turn-to-turn corona failure on unfiltered VFD cable runs over 15 m.
Install a dV/dt filter for 150–300 m runs or legacy motors, and a sine-wave filter for extreme cable runs (>300 m) or submersible pumps; lowering VFD carrier frequency to 2–4 kHz also cuts switching stress significantly.
Unlike 4–20 mA analog signal shields (grounded at one end), symmetric shielded VFD power cables must be bonded 360° at BOTH the drive chassis and motor frame using EMC clamps/glands with zero long pigtails.

=== faqs
Q: How can I tell if my motor bearing failed from VFD electrical fluting versus bad lubrication or misalignment?
A: Cut open the failed bearing outer and inner races and inspect the load zone under bright angled light. Mechanical fatigue causes irregular spalling and flaking, whereas VFD EDM electrical erosion creates a frosted gray band that progresses into uniform, evenly spaced parallel ridges ("washboard fluting") perpendicular to the rolling direction.

Q: Should I ground the shield of a VFD motor cable at one end or both ends?
A: Always terminate a shielded VFD power cable 360° at BOTH ends — directly to the unpainted metal chassis ground at the VFD and via an EMC brass gland at the motor junction box. Leaving one end ungrounded turns the shield into a high-frequency EMI antenna and blocks the return path for common-mode currents.

Q: Why do I need BOTH an insulated bearing and a shaft grounding ring on a 150 HP VFD motor?
A: Motors 100 HP (75 kW) and larger develop high-frequency end-to-end circulating shaft currents in addition to capacitive EDM currents. An insulated bearing on the NDE breaks the circulating current loop, while a shaft grounding ring on the DE safely drains capacitive voltage so it does not discharge through the DE bearing or damage the coupled gearbox/pump.

Q: What cable length requires a dV/dt filter or sine-wave filter on a 480V VFD?
A: Full 2× reflected wave peaks (~1,300–1,500 V) can begin forming in as little as 15–30 meters with fast IGBTs. Non-inverter-duty (NEMA Part 30) motors generally need a dV/dt filter beyond ~15 m, while inverter-duty (Part 31) motors typically need a load reactor or dV/dt filter beyond 50–90 m and a sine-wave filter above 300 m.

Q: Does lowering the VFD carrier frequency help reduce bearing fluting and motor heating?
A: Yes. Dropping carrier frequency from 8–12 kHz to 2–4 kHz reduces the number of high-dV/dt switching transitions per second by 3 to 4 times, cutting capacitive common-mode current, reflected wave repetition rate, and drive switching losses (reducing VFD heat) at the cost of slightly higher audible motor hum.

=== sources
NEMA MG 1 Part 31 — Definite-Purpose Inverter-Fed Polyphase Motors | https://www.nema.org/standards/view/motors-and-generators
SKF Technical Guide — Bearing Damage and Failure Analysis (ISO 15243 Electrical Erosion / Fluting) | https://www.skf.com/
IEC TS 60034-25 — AC Electrical Machines Used in Power Drive Systems (Bearing Currents & Insulation) | https://webstore.iec.ch/en/publication/120
Fluke Industrial Application Notes — Measuring VFD Shaft Voltages and Reflected Wave Overvoltage | https://www.fluke.com/
EASA Technical Guidelines — Variable Frequency Drives, Shaft Grounding, and Inverter-Duty Motors | https://easa.com/resources/easa-standards
