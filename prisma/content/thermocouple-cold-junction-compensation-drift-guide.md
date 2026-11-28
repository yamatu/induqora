---
title: Thermocouple Cold Junction Compensation and Drift
slug: thermocouple-cold-junction-compensation-drift-guide
type: BLOG
category: process-automation-dcs
author: edward
tags: Instrumentation and signals, Process control
publishedAt: 2026-11-28T02:49:00Z
excerpt: A thermocouple measures the difference between two junctions, so an uncompensated cold junction turns the terminal block temperature into a direct measurement error. This guide covers how cold junction compensation actually works, why a Type K reads about 41 microvolts per degree, what extension-grade wire does and does not fix, and the drift mechanisms that make a thermocouple read low after a year at temperature.
seoTitle: Thermocouple Cold Junction Compensation and Drift
seoDescription: How cold junction compensation works, why Type K gives 41 microvolts per degree, where extension wire fails and why readings drift after a year hot.
coverImage: /media/2026/11/cover-thermocouple-cold-junction-compensation-drift-guide.jpg
coverAlt: Technical editorial illustration of a thermocouple hot junction in a process and a cold junction at a terminal block, with cold junction compensation shown as a measured correction
coverCaption: The sensor does not measure temperature. It measures a difference, and the terminal block is half the measurement.
---
A thermocouple produces a voltage from the Seebeck effect at the junction of two dissimilar metals, and that voltage depends on the difference between the hot junction and the reference junction, not on the hot junction temperature alone. Every millivolt of thermocouple EMF is therefore half a measurement, and the other half is whatever the terminal block is doing. This is why thermocouple systems fail quietly: with cold junction compensation misconfigured or drifting, the reading stays plausible while being wrong by several degrees at every temperature, and no diagnostic flag appears.

This guide covers the compensation mechanism, the arithmetic that makes the error visible, extension-grade wire, and the drift mechanisms that decide whether a thermocouple is still trustworthy after a year in service.

## Two junctions, one voltage

The thermoelectric circuit contains at least two junctions. One is in the process, the other where the thermocouple wires meet the copper of the instrument. The measured EMF corresponds to the difference: if both junctions were at the same temperature, the voltage would be zero regardless of the material pair.

Two compensation methods exist, and understanding which one is in use explains the failure modes:

| Method | How it works | Failure mode |
| --- | --- | --- |
| Ice bath / fixed reference | Reference junction held at a known 0 degrees Celsius | Impractical in a plant; drift if the bath is not maintained |
| Cold junction compensation (CJC) | A separate sensor measures the terminal block temperature and the mathematics compensates | Error in the CJC sensor, in its placement, or in the compensation being disabled |

Modern transmitters and PLC input cards use CJC, which means there is a second temperature sensor inside the device, mounted near the terminals. That sensor measures the reference junction temperature, the firmware computes the equivalent EMF for that temperature, and adds it to the measured EMF before converting to a temperature.

Three consequences follow, and each is a real commissioning failure:

1. **The CJC sensor must be at the same temperature as the terminals.** A card mounted where the cabinet has a thermal gradient, or a terminal block warmer than the PCB, produces a reference error that appears as measurement error.
2. **Compensation must be enabled and set to the right type.** An input card configured for Type K with CJC disabled reads the raw difference between junctions, which is wrong by the cabinet temperature - typically 25 to 45 degrees in an enclosure.
3. **A remote terminal block breaks the compensation.** If the thermocouple wire extends to a terminal block and then copper continues to the card, the second junction is at that terminal block, not at the card. Unless that block is itself compensated - which needs its own CJC sensor or an isothermal block at the card - the compensation is measuring the wrong place.

The third point is the most common architecture error. Moving a transmitter closer to the process solves it far more reliably than extending thermocouple wire across a cabinet and expecting the input card to compensate a junction it cannot see.

## The arithmetic: why 41 microvolts per degree matters

Type K (chromel-alumel) is the most common general-purpose thermocouple, with a sensitivity of approximately 41 microvolts per degree Celsius and a range of -200 to +1350 degrees Celsius. The sensitivity is the conversion factor between every error in the junction chain and a temperature error:

| Type | Sensitivity | Range | Practical note |
| --- | --- | --- | --- |
| K (chromel-alumel) | ~41 µV/degC | -200 to +1350 degC | General purpose; nickel is magnetic; vulnerable to green rot in reducing atmospheres |
| J (iron-constantan) | ~50 µV/degC | -40 to +1200 degC | Higher output; iron Curie point at 770 degC limits upper use |
| T (copper-constantan) | ~43 µV/degC | -200 to +350 degC | Good at low temperature; often used differentially |
| E (chromel-constantan) | ~68 µV/degC | -270 to +740 degC | Highest output of the base-metal types |
| N (nicrosil-nisil) | ~39 µV/degC at 900 degC | -270 to +1300 degC | Developed to reduce the instability mechanisms of Type K |

At 41 microvolts per degree, a 1 degree error in the CJC sensor is a 1 degree measurement error - the ratio is one to one, so CJC accuracy is not diluted. A 20 degree error in the reference junction (which is what a disabled CJC in a warm cabinet produces) is a 20 degree error in the reading. The error is also not constant: cabinet temperature changes with the season, so a disabled CJC produces a reading that drifts by several degrees over a year and looks like sensor aging.

The conversion is where the quadratic behaviour bites. Thermocouple EMF is not linear in temperature, which is why the linear sensitivity above is only useful for estimating error magnitude. A correct implementation converts EMF to temperature with the polynomial from IEC 60584 for the specific type, after adding the reference junction EMF computed for the measured terminal temperature. A control system that applies a single linear gain across a 1200 degree range will be several degrees wrong at both ends even with perfect wiring.

## Extension wire, compensating wire and the colour codes

Extension-grade wire is designed to carry the thermoelectric circuit over a longer distance: it follows the stated E(T) curve but is not built for extreme environments, so it cannot be used at the sensing junction. Compensating wire is a different idea - it uses an alloy pair chosen to approximate the thermocouple's EMF over a limited range, usually cheaper and less accurate.

![Diagram of a thermocouple measurement chain: hot junction in the process at 41 microvolts per degree, extension wire that must match type and polarity, cold junction at the terminal block at 25 to 45 degrees, and an input card measuring the terminal temperature for cold junction compensation, alongside the drift mechanisms and the commissioning checks](/media/2026/11/diagram-thermocouple-cold-junction-compensation-drift-guide.png "Figure 1: A disabled CJC produces an error exactly equal to the cabinet temperature, and nothing in the diagnostics says so.")

Three rules that prevent most wiring mistakes:

- **Extension wire must match the thermocouple type and be connected with the correct polarity.** A reversed extension pair produces an error of twice the extension-junction temperature, which at 30 degrees in a cabinet is a 60 degree error that often looks like a failed sensor.
- **Never use copper to extend a thermocouple unless the junction is isothermal and compensated.** Copper creates a new junction pair at unknown temperature, and the input card cannot compensate what it cannot measure.
- **Colour codes differ by standard region.** The same colour pair means different types in IEC and in the American ANSI convention, and a plant with imported equipment will have both. Verify from the marking, not from the colour.

The polarity rule deserves emphasis because it is symmetric and easy: any thermocouple junction at a temperature different from the reference contributes an error, and reversing a pair double-counts it rather than cancelling it.

## Drift: why a thermocouple reads low after a year

Thermocouples drift, and the mechanism is metallurgical rather than electrical. All base-metal thermoelement materials show a gradual and generally cumulative drift in thermal EMF on long exposure at elevated temperature, caused by compositional changes from oxidation, carburization or other contamination. In Type K specifically, manganese and aluminium atoms migrate from the negative wire to the positive wire, changing the EMF the pair produces.

The practical consequences:

1. **A thermocouple is a consumable, not a permanent reference.** Expect drift in the low degrees over a year at high temperature, more in a contaminated atmosphere.
2. **Green rot destroys Type K in reducing atmospheres.** Type N was developed as an alternative for low-oxygen conditions and for vacuum, inert or dry reducing atmospheres, though it does not tolerate sulfur.
3. **Calibration at one temperature misses drift magnitude.** A drift that is small at 200 degrees may be several degrees at 800 degrees. For critical points, verify at the operating temperature, not at ambient.
4. **A spare thermocouple in the store is also aging.** It does not drift at room temperature, but a replacement that has been in a hot cabinet for years has its own history.

The honest engineering position is that a thermocouple gives you a wide range, low cost and simplicity in exchange for a bounded accuracy that must be re-verified. Where that trade is unacceptable, an RTD is the alternative - and the wiring error that comes with it is a different, more tractable problem. See [Pt100 lead resistance](/blog/pt100-rtd-2-3-4-wire-lead-resistance-error-guide) for that trade in numbers.

## Commissioning and verification sequence

Per measurement point:

1. Confirm the input card type is set to the actual thermocouple type, not to the default from the factory.
2. Confirm CJC is enabled and read the CJC temperature - it should match the terminal block temperature within a degree.
3. Confirm extension wire type and polarity, and that no copper was inserted without compensation.
4. Verify at two points: ambient with the probe in a known environment, and at the operating temperature if the process allows.
5. Record the drift baseline against a reference at commissioning, so a later verification has something to compare with.
6. For critical points, log the CJC temperature as a diagnostic tag; a rising CJC with a stable process is a cabinet cooling fault, not a process change.

Step 2 is the one that catches the most installations, because a disabled CJC is invisible: the reading exists, the scale looks sane, and the error is exactly the cabinet temperature.

## Where this fits in the loop

The thermocouple sits at the front of the same chain as any other sensor: signal conditioning, then transmission, then historisation. For the 4-20 mA stage and its fault bands, see [HART on a 4-20 mA loop](/blog/hart-protocol-4-20ma-loop-commissioning-guide). For the digital sensor-level alternative that eliminates the reference junction question by construction, see the [IO-Link master and port configuration guide](/blog/io-link-master-port-configuration-iec-61131-9-guide). For how the resulting values are compressed and stored, see [SCADA historian architecture](/blog/scada-historian-architecture-compression-buffering-guide).

A thermocouple reading that is two degrees low at every temperature is not a sensor fault. It is a reference junction that nobody measured.

=== takeaways
A thermocouple measures the difference between the hot junction and the reference junction, so the terminal block is part of the measurement.
Cold junction compensation works by measuring the terminal temperature with a separate sensor; a disabled or misplaced CJC is invisible and produces an error equal to the cabinet temperature.
Type K sensitivity is about 41 microvolts per degree, so a 1 degree reference error is a 1 degree reading error.
Extension wire must match the type and polarity; a reversed pair produces an error of twice the extension junction temperature.
Base-metal thermocouples drift cumulatively at high temperature; Type K drifts through manganese and aluminium migration and fails in reducing atmospheres through green rot.
Verify at the operating temperature, not only at ambient, because drift magnitude grows with temperature.
Log the CJC temperature as a diagnostic tag: a rising CJC at stable process conditions points to cabinet cooling, not to the process.

=== faqs
Q: What happens if cold junction compensation is disabled?
A: The reading becomes wrong by the terminal block temperature, typically 25 to 45 degrees in an enclosure, and it drifts with cabinet temperature. Nothing in the diagnostics says so, which is why it survives for years.

Q: Why is my Type K reading low by a few degrees?
A: Check three things in order: whether CJC is enabled, whether the extension wire polarity is correct, and whether the input card type matches the actual thermocouple. A reversed extension pair gives an error of about twice the extension junction temperature.

Q: Can I use copper cable to extend a thermocouple?
A: Only if the copper junction is isothermal and separately compensated. Copper creates a new junction pair at an unmeasured temperature, and the input card cannot compensate what it cannot see.

Q: How much does a thermocouple drift per year?
A: It depends on temperature, atmosphere and type. Base-metal types show gradual cumulative drift at elevated temperature; expect low single-digit degrees per year in demanding service, more in contaminated atmospheres. Verify at operating temperature.

Q: Why use Type N instead of Type K?
A: Type N was developed to overcome the instability mechanisms of Type K, including drift from compositional change, and suits low-oxygen conditions where Type K suffers green rot. It is also slightly less sensitive, about 39 microvolts per degree.

Q: Is a thermocouple more accurate than an RTD?
A: Usually less accurate and less stable, but wider in range and simpler in installation. RTDs have higher accuracy and repeatability, which is why they are displacing thermocouples below 600 degrees Celsius. The RTD's weakness is lead resistance, which is a more tractable problem than junction drift.

Q: Why does my reading change when I open the cabinet?
A: Because the reference junction is inside the cabinet. Opening the door changes the terminal temperature, so the compensated result shifts. It confirms that CJC is doing something, and it shows how much the cabinet thermal design matters.

=== sources
Thermocouple, Wikipedia (Seebeck effect, reference and cold junction compensation, Type K at approximately 41 microvolts per degree and -200 to +1350 degC, Type J, T, E and N characteristics, extension grade wire, cumulative drift and green rot), https://en.wikipedia.org/wiki/Thermocouple
Resistance thermometer, Wikipedia (RTD accuracy and repeatability comparison below 600 degC), https://en.wikipedia.org/wiki/Resistance_thermometer
IEC 60584-1, *Thermocouples - Part 1: EMF specifications and tolerances*.
IEC 60584-3, *Thermocouples - Part 3: Extension and compensating cables - Tolerances and identification system*.
