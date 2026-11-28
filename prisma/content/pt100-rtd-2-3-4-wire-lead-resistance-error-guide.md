---
title: Pt100 Lead Resistance Error: 2, 3 and 4-Wire Explained
slug: pt100-rtd-2-3-4-wire-lead-resistance-error-guide
type: BLOG
category: process-automation-dcs
author: edward
tags: Instrumentation and signals, Process control
publishedAt: 2026-11-28T02:48:00Z
excerpt: A Pt100 changes by 0.385 ohm per degree Celsius, so a fraction of an ohm of cable resistance becomes a temperature error measured in degrees. This guide works through the Callendar-Van Dusen relationship, why two-wire connection is a hidden offset, how three-wire connection cancels lead resistance only when the leads match, and when four-wire is the only defensible choice.
seoTitle: Pt100 Lead Resistance Error: 2, 3 and 4-Wire
seoDescription: Why Pt100 lead resistance becomes a temperature error: 0.385 ohm per degree, Callendar-Van Dusen, two-wire offset, three-wire matching and four-wire accuracy.
coverImage: /media/2026/11/cover-pt100-rtd-2-3-4-wire-lead-resistance-error-guide.jpg
coverAlt: Technical editorial illustration comparing two, three and four wire Pt100 connections across a cable run, with the resulting temperature error annotated
coverCaption: The sensor is accurate to a tenth of a degree. The cable is where the error lives.
---
A Pt100 sensor changes resistance by 0.385 ohm per degree Celsius, which is the number that decides every wiring decision in an RTD installation. One ohm of unwanted cable resistance is 2.6 degrees Celsius of error, and a hundred metres of ordinary two-core cable contributes several ohms. Two-wire connection therefore does not measure temperature - it measures temperature plus a fixed offset that varies with cable length, cable temperature and every terminal in the run. Three-wire connection removes most of it, four-wire removes all of it, and choosing between them is an arithmetic decision, not a preference.

This guide works through the resistance-to-temperature relationship, quantifies the lead error for realistic cable, and gives the criteria for picking a wiring scheme.

## The resistance-to-temperature relationship

Platinum RTDs follow the Callendar-Van Dusen equation. For the range 0 to 850 degrees Celsius it reduces to a quadratic:

```text
RT = R0 * (1 + A*T + B*T^2)

A = 3.9083e-3 /degC
B = -5.775e-7 /degC^2
C = -4.183e-12 /degC^4   (only needed below 0 degC)
```

where R0 is the resistance at 0 degrees Celsius - 100 ohm for a Pt100, 1000 ohm for a Pt1000. IEC 60751 and ASTM E1137 both specify the industrial coefficient alpha = 0.00385 ohm/(ohm·degC), which gives a nominal sensitivity of 0.385 ohm per degree for a Pt100. Older probes with alpha values of 0.003916 or 0.003902 exist in the field, which matters because a control system configured for 0.00385 will convert them with a small systematic error that nobody attributes to the sensor.

The quadratic matters for accuracy at the extremes, but for the lead-resistance argument the linear sensitivity is enough: 0.385 ohm per degree. That single number turns cable resistance into temperature error directly.

## What cable resistance actually costs

Cable resistance depends on cross-section and length. For annealed copper at 20 degrees Celsius:

| Conductor | Resistance per metre | Round trip over 100 m | Error on a Pt100 |
| --- | --- | --- | --- |
| 0.25 mm² | ~0.067 ohm | ~13.4 ohm | ~35 degC |
| 0.50 mm² | ~0.034 ohm | ~6.7 ohm | ~17 degC |
| 1.00 mm² | ~0.017 ohm | ~3.4 ohm | ~8.7 degC |
| 1.50 mm² | ~0.011 ohm | ~2.2 ohm | ~5.8 degC |

Those figures assume two-wire connection, where the transmitter sees the sensor resistance plus both conductors. Two observations follow, and both are routinely missed:

- **The error is an offset, so it looks like a calibration problem.** A two-wire loop over 100 metres of 0.5 mm² cable reads about 17 degrees high at every temperature. Technicians correct it with a single-point offset at ambient, and it then drifts as the cabinet warms, because copper resistance rises with temperature by roughly 0.4 percent per degree.
- **Terminals and joints add more.** Every screw terminal, junction box and marginal crimp contributes resistance, and a corroded terminal can easily add an ohm - another 2.6 degrees that appears overnight and disappears when someone re-torques the screw.

The second point is why "the reading is drifting" and "the reading is high" are often the same fault at different stages of corrosion.

## Three-wire connection and its one condition

Three-wire connection is almost universal industrial practice because it removes most of the lead error without the cost of a fourth conductor. The measurement assumes two of the three leads are identical in resistance, measures the loop containing both, and subtracts the third lead measured separately - so the sensor resistance remains.

![Diagram comparing two-wire, three-wire and four-wire Pt100 connections with their error for a 100 metre 0.5 square millimetre copper run: two-wire adds about 6.7 ohm giving roughly 17 degrees, three-wire cancels only if leads match, four-wire eliminates lead resistance, with the Callendar-Van Dusen coefficients and a precision resistor substitution test](/media/2026/11/diagram-pt100-rtd-2-3-4-wire-lead-resistance-error-guide.png "Figure 1: Three-wire is not compensation, it is conditional cancellation. One extra terminal in a leg defeats it.")

The condition is in that assumption. Three-wire compensation cancels lead resistance only when the leads match. In practice:

- **Equal length, same cable, same route**: the mismatch is small and the residual error is usually negligible.
- **Different lengths, or one conductor with an extra junction**: the mismatch passes straight through as an error, at 0.385 ohm per degree.
- **A junction box where one leg has an additional terminal**: this is the single most common cause of a three-wire installation that reads a couple of degrees high.

So three-wire is sufficient for most purposes and is a reasonable default, but it must be installed as designed: same cable, same length, same number of terminals in each leg. A three-wire installation that was extended later with a different cable is worse than an honest two-wire one, because it looks like it is compensated.

## When four-wire is the only defensible choice

Four-wire connection uses a constant current through two leads and measures the voltage across the sensor with the other two. Because no current flows in the sense leads, their resistance does not matter, and the compensation is exact rather than conditional.

| Scheme | Conductors | Lead error | Acceptable use |
| --- | --- | --- | --- |
| Two-wire | 2 | Full lead resistance included | Short runs, indication only, no accuracy claim |
| Three-wire | 3 | Cancelled only if leads match | Most industrial loops, matched cable |
| Four-wire | 4 | Eliminated | Calibration standards, narrow spans, custody transfer, long runs |

Four-wire is used for the most precise applications, and the criteria for choosing it are concrete:

1. **The measurement span is narrow.** A 0 to 50 degree span makes 1 degree of lead error a 2 percent span error.
2. **The cable run is long or in a hot environment.** Cable resistance changes with cabinet temperature, so the error is not even constant.
3. **The value is used for a legal, contractual or safety-adjacent decision** where the uncertainty has to be bounded and documented.

For a jacket-water temperature on a cooling loop, three-wire is fine. For a reference thermometer used to calibrate others, four-wire is mandatory.

## Self-heating: the error the wiring does not fix

An RTD needs excitation current, and that current dissipates power in the element. The temperature rise depends on the sensor's thermal resistance to its surroundings: a probe in still air heats more than the same probe in flowing water. Typical practice uses 1 mA excitation, which dissipates about 100 microwatts in a Pt100 - small, but the resulting error can be tenths of a degree in still air.

This matters when someone chases a remaining 0.3 degree discrepancy after installing perfect four-wire cabling. If the transmitter's excitation current is configurable, reducing it lowers self-heating and increases noise; the right setting depends on the probe's dissipation constant, which is in its datasheet. For a Pt1000, the excitation current should be lower for the same power, which is one reason Pt1000 is preferred on long cable runs and in low-power loops.

## A commissioning check that catches the wiring fault

A short procedure, per loop, that separates sensor error from wiring error:

1. **Measure loop resistance with the sensor disconnected** and compare against the computed cable resistance for the actual length and cross-section. A significantly higher figure means bad terminals, not a bad sensor.
2. **Check the three leads for matching resistance** on a three-wire installation. Any difference above a tenth of an ohm is a real error at 2.6 degrees per ohm.
3. **Substitute a fixed resistor at the transmitter terminals** - typically 100.00 ohm for 0 degrees and 138.51 ohm for 100 degrees - and confirm the reading. This isolates transmitter configuration from everything upstream.
4. **Compare at two temperatures, not one.** A pure offset means lead resistance; a gain error means a configuration mismatch such as alpha or a range setting.
5. **Record the excitation current and the sensor's alpha** in the loop documentation, because both become invisible within a year.

Step 3 is the fastest way to end an argument between the instrument technician and the control engineer: a precision resistor at the terminals is either read correctly or it is not.

## Where this fits with the rest of the loop

The Pt100 is one element in a chain that ends in a historian or a control block. Upstream, the transmitter converts resistance to a current - see [HART on a 4-20 mA loop](/blog/hart-protocol-4-20ma-loop-commissioning-guide) for the fault bands and multidrop behaviour of that layer. Downstream, the value is scanned and stored - see [SCADA historian architecture](/blog/scada-historian-architecture-compression-buffering-guide). For a digital sensor-level alternative that carries its own diagnostics, see the [IO-Link master and port configuration guide](/blog/io-link-master-port-configuration-iec-61131-9-guide).

A temperature loop that reads two degrees high is rarely a sensor problem. It is almost always a cable, a terminal or an assumption about which wiring scheme was actually installed.

=== takeaways
A Pt100 changes 0.385 ohm per degree Celsius, so one ohm of cable resistance is roughly 2.6 degrees of error.
Two-wire connection includes the full lead resistance as a fixed offset that drifts with cabinet temperature and every terminal.
Over 100 m of 0.5 mm² copper, two-wire connection adds about 6.7 ohm, which is roughly 17 degrees of error.
Three-wire connection cancels lead resistance only if the leads match in length, cable and number of terminals.
Four-wire connection eliminates lead error entirely and is the right choice for narrow spans, long runs and reference measurements.
Self-heating from excitation current is a separate error that good cabling cannot remove; check the sensor's dissipation constant.
Substitute a precision resistor at the transmitter terminals to separate wiring error from sensor error in one step.

=== faqs
Q: How much error does a two-wire Pt100 have over 100 metres?
A: With 0.5 mm² copper, the round trip is about 6.7 ohm, which at 0.385 ohm per degree is roughly 17 degrees Celsius. It appears as a fixed offset, which is why it is frequently mistaken for a calibration error.

Q: Is three-wire always better than two-wire?
A: Only when the three leads match. Three-wire compensation assumes two leads have identical resistance; if one leg is longer or has an extra terminal, the mismatch passes through as an error. A badly extended three-wire run can be worse than an honest two-wire one.

Q: When do I need four-wire?
A: When the uncertainty has to be bounded: narrow spans, long or hot cable runs, reference thermometers, custody transfer. Four-wire removes lead resistance from the measurement rather than compensating for it.

Q: Why does my reading drift during the day?
A: Copper resistance changes about 0.4 percent per degree. A two-wire or mismatched three-wire installation therefore changes its error as the cabinet warms. It is a wiring fault that looks like sensor drift.

Q: What is the fastest way to prove the wiring is the problem?
A: Disconnect the sensor and substitute a precision resistor at the transmitter terminals - 100.00 ohm for 0 degrees, 138.51 ohm for 100 degrees. If the transmitter reads those correctly, everything upstream is suspect.

Q: Does a Pt1000 avoid the lead resistance problem?
A: It reduces it tenfold for the same cable, because the sensitivity is 3.85 ohm per degree instead of 0.385. It does not remove it, and Pt1000 also needs lower excitation current to keep self-heating comparable.

Q: What excitation current should I use?
A: Around 1 mA for a Pt100 is typical, giving roughly 100 microwatts. In still air the self-heating error can reach tenths of a degree. Check the probe's dissipation constant before increasing current for noise reasons.

=== sources
Resistance thermometer, Wikipedia (Callendar-Van Dusen equation and coefficients for alpha 0.00385, Pt100 and Pt1000 nominal resistance, IEC 60751 and ASTM E1137, three-wire and four-wire lead compensation), https://en.wikipedia.org/wiki/Resistance_thermometer
IEC 60751, *Industrial platinum resistance thermometers and platinum temperature sensors*.
ASTM E1137/E1137M, *Standard Specification for Industrial Platinum Resistance Thermometers*.
Current loop, Wikipedia (4-20 mA transmission context for the transmitter stage), https://en.wikipedia.org/wiki/Current_loop
