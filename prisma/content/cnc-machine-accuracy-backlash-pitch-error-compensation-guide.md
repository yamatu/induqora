---
title: CNC Machine Accuracy: Backlash and Pitch-Error Compensation
slug: cnc-machine-accuracy-backlash-pitch-error-compensation-guide
type: BLOG
category: motion-control-drives
author: edward
tags: Motion control, CNC machine accuracy, FANUC
publishedAt: 2026-11-26T08:00:00Z
excerpt: A positioning spec on a datasheet says little about what a machine does after ten years of cutting. This guide covers how to measure backlash, set pitch-error compensation, read a ballbar trace and validate the result against ISO 230-2.
seoTitle: CNC Accuracy: Backlash, Pitch-Error Compensation and ISO 230-2
seoDescription: Measure backlash, set pitch-error compensation and read ballbar traces to verify CNC machine accuracy against ISO 230-2 positioning and reversal tests.
coverImage: /media/2026/11/cover-cnc-machine-accuracy-backlash-pitch-error-compensation-guide.jpg
coverAlt: Technical editorial illustration of a CNC machine accuracy measurement trace with backlash step and ballbar circular test overlay
coverCaption: Positioning error decomposes into backlash, pitch error, thermal growth and squareness — only the first two are truly compensable in the control.
---
Most machine tool specifications advertise a positioning accuracy of around ±0.005 mm on a new machine. That number is measured under controlled conditions, at one temperature, on one axis, usually without a cutting load. A machine that has produced parts for a decade is a different object: ballscrews have worn, thrust bearings have settled, guideways have lost preload, and the spindle has grown 40–80 µm since the morning cold start.

Accuracy work therefore has two halves. The first is knowing which error mechanism is dominant; the second is knowing which of them compensation can hide and which must be fixed mechanically. Confusing the two is how machines end up with compensation tables that mask a failing bearing.

## Accuracy, repeatability and reversal error

ISO 230-2 defines the numbers you will actually be asked for. They are not interchangeable:

- **Positioning accuracy (A)** — the spread between commanded and achieved position across the travel, including the mean deviation from nominal.
- **Repeatability (R)** — the scatter of results when you approach the same point many times. This is the number that decides whether a machine can hold a tolerance at all.
- **Reversal error (B)** — the difference in achieved position when a point is approached from the positive versus the negative direction. This is the formal name for what operators call backlash, and it is the easiest of the three to compensate.

A machine with poor repeatability cannot be fixed by compensation. A machine with good repeatability and a large reversal error usually can.

## Where the error actually comes from

| Error source | Typical magnitude (VMC) | Compensable in the control? | First symptom |
|---|---|---|---|
| Ballscrew backlash / thrust bearing play | 5–40 µm | Yes (reversal compensation) | Step or witness mark at every direction change |
| Ballscrew pitch error (lead deviation) | 10–30 µm over 500 mm | Yes (pitch-error table) | Positional error growing with travel distance |
| Thermal growth (spindle, ballscrew) | 20–80 µm | Partly (needs temperature sensing) | Same program holds size in the morning, drifts by afternoon |
| Squareness / straightness | 5–20 µm/m | No | Out-of-square faces on a single setup |
| Servo following error mismatch | 2–20 µm in motion | Yes (gain and feed-forward tuning) | Elliptical bores, poor circular interpolation |
| Guideway stick-slip | 3–15 µm | No | Spikes in reversal, worse at low feed |

![Engineering diagram of a CNC positioning error budget showing backlash 5 to 40 micrometres, pitch error, thermal growth up to 80 micrometres, squareness and servo gain mismatch, alongside ballbar circular test signatures and a table of compensable versus non-compensable faults](/media/2026/11/diagram-cnc-machine-accuracy-backlash-pitch-error-compensation-guide.png "Figure 1: Positioning error budget for a typical VMC, the ballbar trace signature of each fault, and which mechanisms the control can genuinely compensate.")

The practical rule: mechanical faults show up as **repeatability problems**, electronic tuning faults as **contour problems in motion but not in point-to-point positioning**.

## Backlash: measure it before you compensate it

Do not copy a backlash value from a service report or a previous machine. Measure each axis at several points along its travel, because wear is rarely uniform — a screw that runs 80% of its life in a 200 mm band will be tight at the ends and loose in the middle.

A dial indicator test on a magnetic base, with the indicator plunger against a clean machined surface on the table (or a mandrel in the spindle), is enough for a first check:

1. Approach the reference point from the **positive** direction and zero the indicator.
2. Move away 50 mm, then return to the reference point from the **negative** direction.
3. Read the indicator. That value is the reversal error at that position.
4. Repeat at three or four positions along the travel and record the spread.

If the reversal error varies by more than roughly 3:1 across the travel, or if it has grown since the last check, the mechanical assembly needs attention before compensation is adjusted upward.

On a FANUC 0i/30i, the per-axis backlash values live in the No.1851 parameter block, with No.1852 for the rapid-traverse value. On SINUMERIK 840D sl the equivalents are `$MA_BACKLASH[axis]` (also settable with `SD 32450`) and the friction compensation in `MD32500`. Two cautions apply to both platforms:

- **Compensation is applied at reversal only.** It cannot correct a screw that is non-linear over its length; that is what pitch-error tables are for.
- **Raising compensation to chase a mechanical problem accelerates wear.** The control adds the full step instantly, which hammers the nut and bearing at every direction change.

## Pitch-error compensation in practice

Pitch error is the deviation between commanded and actual slide position along the travel, caused by screw lead inaccuracy and by the geometry of the feedback system (direct scale versus encoder on the motor). It is a repeatable, monotonic error and therefore compensable with a lookup table.

The setup sequence, using a laser interferometer:

1. **Establish the reference point.** Compensation tables are anchored to the machine reference position. On FANUC this is the No.3620/3621 block; the table is meaningless if the reference point is re-established after the table is built.
2. **Choose the compensation interval** (No.3623). Standard practice is 10 mm for a machine with moderate travel and 20–50 mm for long travel. Halving the interval doubles setup time but rarely improves the result, because pitch error varies smoothly.
3. **Set the number of compensation points** (No.3624) so the table covers the full travel plus a margin at each end.
4. **Measure in both directions.** Pitch error is direction-dependent on machines with a heavily preloaded nut; if the difference is large, correct the mechanical preload first.
5. **Enter the values and re-measure.** Verify at points *between* the compensation points, not just at them — a table that matches at every entry but is wrong halfway between them usually means the interval is too coarse.

On SINUMERIK the equivalent is the encoder compensation table (`MD32700 $MA_ENC_COMP_ENABLE`, point count in `MD38000 $MA_MM_ENC_COMP_MAX_POINTS`, values written to `$AA_ENC_COMP`). In both systems the compensation is only valid at the temperature at which it was measured — which leads directly to the thermal problem.

## Thermal growth: the error that ruins afternoon parts

Compensation tables are built cold and used hot. A spindle running at 12,000 rpm reaches thermal equilibrium in 30–90 minutes and grows axially; a ballscrew driven continuously grows along its length. ISO 230-3 exists precisely to quantify this, and in production the effect is usually larger than residual pitch error after compensation.

Three approaches, in increasing order of effort:

- **Warm-up cycle.** A 15–20 minute programmed spindle and axis cycle at the start of each shift. Crude, but it removes most of the drift and costs nothing.
- **Thermal compensation with sensors.** Temperature sensors on the spindle housing and ballscrew bearing feed a control model that applies a live positional offset. FANUC implements this as thermal compensation with a growth model; SINUMERIK uses `$MA_TEMP_COMP` with `MD32750`. It works well if the sensors are properly placed and the coefficients are fitted to the actual machine.
- **Machine design.** Symmetrical headstock castings, cooled ballscrew nuts and climate control. Expensive, and the only option that fixes the problem at source.

For a machine that must hold ±10 µm over a shift, thermal behaviour deserves more attention than the compensation table.

## Circular tests: reading a ballbar trace

A telescoping ballbar runs the machine through a 360° circular path and plots the radial deviation. It exercises both axes simultaneously, which is much closer to real cutting than a point-to-point laser test, and the shape of the trace identifies the fault directly.

| Trace pattern | Diagnosis | Typical fix |
|---|---|---|
| Sharp step at each quadrant change | Backlash / reversal error | Measure and compensate, check preload |
| Ellipse tilted at 45° | Servo gain mismatch between axes | Match position loop gain (`No.1825` / `$MA_..._KV`), add feed-forward |
| Oval with flat sides | Squareness error | Mechanical alignment, not compensable |
| Spikes at quadrant transitions | Stick-slip or friction, often over-tightened gib | Lubrication, guideway preload |
| Circle offset between CW and CCW runs | Lost motion plus friction asymmetry | Mechanical inspection |

The value of the ballbar is that it separates causes the laser test cannot: a machine with excellent positioning accuracy can still cut elliptical bores because of gain mismatch, and a ballbar trace shows that immediately.

## A verification workflow you can repeat

1. **Record the cold state** — positional accuracy on the three linear axes, ISO 230-2, at the start of a shift.
2. **Run the warm-up cycle** and repeat the measurement, so you know the thermal drift magnitude.
3. **Measure reversal error** at three positions per axis.
4. **Build or validate the pitch-error table** with the laser.
5. **Run a ballbar test** to check contour behaviour in motion.
6. **Cut a test part** with a circular pocket, a square step and a diagonal face — the three features that expose gain mismatch, squareness and reversal error respectively.
7. **Store the results with a date.** Compensation values that are tracked over time are a maintenance signal: a backlash figure that climbs 10 µm per year tells you when the screw will need replacing, long before parts go out of tolerance.

Machines that are calibrated on a schedule and whose compensation history is recorded fail predictably. Machines that get a fresh compensation table whenever scrap rate rises fail suddenly, usually mid-job.

Servo-level faults that masquerade as accuracy problems are worth separating out first: an axis with alarm history or a drive with a degrading power supply will produce inconsistent positioning that no compensation table can chase. See [diagnosing servo drive alarms](/blog/servo-drive-alarm-troubleshooting-cnc-maintenance) and [CNC power supply and common DC bus diagnostics](/blog/cnc-spindle-drive-power-supply-bus-diagnostics) for the electrical side of the same symptom, and [servo drive selection](/blog/vfd-vs-servo-drive-selection-guide) if the machine is being specified rather than repaired.

=== takeaways
ISO 230-2 separates positioning accuracy, repeatability and reversal error; only repeatability tells you whether a machine can hold tolerance, and only reversal error and pitch error are properly compensable.
Measure backlash at several points along each axis before adjusting compensation — non-uniform wear means the mechanical assembly, not the parameter, is the problem.
Pitch-error tables are anchored to the reference point and are only valid at the temperature at which they were measured, which makes thermal growth a larger production error than residual pitch error on most machines.
A ballbar trace identifies the fault from its shape: steps mean backlash, 45° ellipses mean servo gain mismatch, flat-sided ovals mean squareness error.

=== faqs
Q: Can pitch-error compensation fix a machine with poor repeatability?
A: No. Pitch-error compensation corrects a repeatable, monotonic deviation along the travel. If repeated approaches to the same point scatter, the cause is mechanical play, sticking or a servo problem, and a compensation table will simply move the scatter to a different position.

Q: How often should backlash compensation be re-measured?
A: Most shops should check it every six to twelve months, and always after a crash, a ballscrew replacement or a thrust bearing change. Recording the value over time matters more than the absolute number, because a trend reveals wear before parts go out of tolerance.

Q: Does thermal compensation replace a warm-up cycle?
A: Not usually. Thermal compensation models the machine's growth from sensor readings and applies an offset, but it depends on sensor placement and fitted coefficients, and it handles transient states less well than steady ones. A short warm-up cycle plus compensation is more reliable than compensation alone.

Q: Why does a machine with ±0.005 mm positioning accuracy still cut elliptical bores?
A: Because positioning accuracy is measured one axis at a time, while a bore requires both axes to move together. Mismatched position loop gains, missing feed-forward or a mismatched velocity loop produce contour error in motion that a point-to-point test never reveals; a ballbar circular test shows it directly.

=== sources
ISO 230-2:2014 — Test code for machine tools, Part 2: Determination of accuracy and repeatability of positioning | https://www.iso.org/standard/55295.html
ISO 230-4:2022 — Test code for machine tools, Part 4: Circular tests for numerically controlled machine tools | https://www.iso.org/standard/78504.html
ISO 230-3:2020 — Test code for machine tools, Part 3: Determination of thermal effects | https://www.iso.org/standard/74008.html
