---
title: Five-Axis Machining: RTCP Kinematics and Singularities
slug: five-axis-machining-rtcp-kinematics-post-processor-guide
type: BLOG
category: motion-control-drives
author: edward
tags: Motion control, Five-axis machining, CNC machine accuracy
publishedAt: 2026-11-26T11:00:00Z
excerpt: Five-axis work fails in ways three-axis work never does: the tool tip moves when you rotate, rotary axes reach singularities where no feed rate can help, and the post-processor can be wrong in ways that only appear on the machine. This guide covers RTCP kinematics, the singular point, and how to verify a post before it cuts metal.
seoTitle: Five-Axis CNC: RTCP Kinematics, Singularities and Post Verification
seoDescription: How five-axis CNC works: RTCP/TCPM kinematics, rotary axis singularities, pivot length measurement and post-processor verification before cutting parts.
coverImage: /media/2026/11/cover-five-axis-machining-rtcp-kinematics-post-processor-guide.jpg
coverAlt: Technical editorial illustration of a five-axis CNC trunnion table with rotary axes, pivot length vector and tool centre point control geometry
coverCaption: With RTCP active the control corrects three linear axes continuously so the tool tip stays on the programmed point as two rotaries move.
---
A three-axis machine has an obvious relationship between the program and the part: the numbers in the code are the position of the tool tip. A five-axis machine breaks that relationship. The tool tip position now depends on two rotary axes as well as three linear ones, and every error in the rotary chain — pivot length, rotary centre offset, backlash in the trunnion — appears as a positional error at the cutting edge, amplified by the distance from the pivot.

That amplification is why five-axis machining has a reputation for being fragile. It is not fragile; it is simply more sensitive to setup errors, and the sensitivity scales with tool length.

## RTCP: what it actually does

Without RTCP (Rotational Tool Centre Point, called TCPM on SINUMERIK and G43.4 on FANUC), a rotary move rotates the coordinate system, and the tool tip swings away from the programmed point in an arc. The programmer must compensate manually by recalculating linear positions for every orientation — which is why older five-axis programs were generated only by CAM and never edited by hand.

![Engineering diagram of a five axis CNC RTCP kinematic chain showing spindle head, pivot length dimension to the rotary centre, tool tip position, A and C rotation arcs, the singular cone where rotary velocity goes to infinity, and a four step post processor verification order](/media/2026/11/diagram-five-axis-machining-rtcp-kinematics-post-processor-guide.png "Figure 1: RTCP kinematic chain and pivot-error amplification, the rotary singular cone, and the verification sequence for a new post-processor.")

With RTCP active, the control reads the kinematic chain and continuously corrects the three linear axes so the tool tip stays at the programmed point while the rotary axes move. It is a control function, not a CAM function, and it depends on the control knowing four things accurately:

1. **Pivot length** — the distance from the gauge line to the rotary centre.
2. **Rotary axis centre offsets** in machine coordinates, per rotary axis.
3. **Rotary axis direction and orientation** — which sign of rotation corresponds to which physical direction.
4. **Tool length and radius**, from the tool table, not from the CAM file.

Any of these being wrong produces a characteristic symptom: RTCP error shows up as a **position shift that changes with orientation**. Orient the tool vertically and the part is correct; tilt it 30° and the part is offset by a consistent amount in a consistent direction.

RTCP also changes how the program reads. On FANUC, `G43.4 H__` activates tool centre point control for the orientation axes; `G43.5` is the alternative form that programs the tool direction vector directly. On SINUMERIK, `TRAORI` enables the transformation and `CYCLE800` handles swivel cycles for kinematic transformation. All of them should be cancelled explicitly at the end of the operation, and the machine should never be left in an RTCP state across a program end — a resumed program that assumes RTCP is off will move unexpectedly on the first rotary command.

## The singularity: where no feed rate helps

Every five-axis kinematic arrangement has at least one orientation where two axes become collinear and the control has to move two rotary axes infinitely fast to maintain a constant tool vector. For an A-C trunnion table, that is the point where the tool points straight up along the C-axis: to rotate the tool vector around itself, C must spin without limit.

Near the singularity, rotary axis velocity rises sharply. The control clamps it to the axis limit, the actual feed rate drops below the programmed value, and the result is a dwell mark or a witness line on the surface. Pushing the feed rate higher makes it worse, not better.

Four practical countermeasures:

- **Tilt away from the singular orientation** in CAM — a 1–2° bias on the primary rotary axis is often enough to remove the problem entirely, at negligible cost to the tool vector.
- **Limit rotary axis velocity in the control** so the machine degrades predictably rather than jumping.
- **Choose a machine configuration that moves the singularity out of the working range.** A nutating (two-axis) head or a trunnion with limited C travel changes where the problem sits; for some part geometries it eliminates it.
- **Verify in simulation** before the first cut, checking rotary axis velocity and acceleration limits, not just collisions.

Singularity is a geometry problem, not a tuning problem. Anyone who tries to solve it by reducing feed rate or increasing servo gain is treating a symptom.

## Verifying a post-processor before it cuts metal

The post-processor converts CAM tool paths into machine code, and it encodes all the kinematic assumptions: pivot distances, rotary directions, RTCP conventions, how the control expects offsets to be applied. A post that is wrong by one sign on a rotary axis produces a part that is mirrored on one side; a post with the wrong pivot length cuts a taper.

A verification sequence that catches most of it, in order:

1. **Machine simulation with the real kinematic model.** Verify the model first — a simulation built on the wrong pivot length confirms nothing.
2. **Rotary-only test at safe height.** Command each rotary axis alone and watch the tool tip: with RTCP active, the tip should not move. If it does, RTCP parameters are wrong, not the post.
3. **Pivot length check with a dial indicator.** Mount an indicator at the rotary centre and rotate the axis through 180°; the deviation gives you the pivot error directly.
4. **Cut a test block with a known angular feature.** A 45° face measured on a CMM exposes both pivot error and rotary direction errors, and it costs a scrap block instead of a part.
5. **Only then run the first production part**, at reduced feed on the finishing pass, with a probe check on the critical orientation.

## Accuracy that only appears in motion

Five-axis machines add rotary axis acceptance tests that three-axis tests never cover. ISO 10791-6 covers the accuracy of feeds, speeds and interpolations on machining centres, and for rotary axes the relevant tests include bidirectional positioning on the rotary axis, and the dynamic accuracy of simultaneous five-axis motion.

Two practical points from the shop floor:

- **Rotary backlash is multiplied by the lever arm.** 20 µm of trunnion backlash measured at the rotary table is not 20 µm at the tool tip — it is 20 µm times the distance from the pivot divided by the radius. Short tools hide it; long tools expose it.
- **Rotary axis count on a trunnion is not the whole story.** The machine's static geometric accuracy usually matters less than the dynamic behaviour of the two rotaries in simultaneous motion, which is where a five-axis machine earns or loses its accuracy.

For the tools side of the same problem — holder runout, tool length measurement and breakage detection, all of which matter more on a five-axis machine because the tool is often long — see [CNC tool life management](/blog/cnc-tool-life-management-wear-monitoring-sister-tools-guide). For the axis-level accuracy work that must be right before any five-axis calibration is meaningful, see [CNC machine accuracy, backlash and pitch-error compensation](/blog/cnc-machine-accuracy-backlash-pitch-error-compensation-guide).

=== takeaways
RTCP/TCPM keeps the tool tip on the programmed point while the rotary axes move, and it is only as accurate as the pivot length, rotary centre offsets and tool table it is given.
A position error that changes with tool orientation is an RTCP parameter fault; a position error that is constant is a machine or fixture fault.
Singularities are geometry problems where rotary velocity must go to infinity — solve them in CAM by biasing the tilt or by machine configuration, not by lowering feed rate.
Verify any new post-processor in this order: kinematics model, rotary-only test at height, pivot length with an indicator, angular test block — then production.

=== faqs
Q: Do I need RTCP to run a five-axis machine?
A: You can run without it by having CAM compute all linear positions manually, which is how older five-axis programs were produced. In practice every modern program relies on RTCP or TCPM, because manual compensation for arbitrary tool vectors is not maintainable and cannot be edited at the machine.

Q: Why does the surface show a dwell mark when the tool passes through the vertical orientation?
A: That is the rotary singularity. Near that orientation, maintaining a constant tool vector requires one rotary axis to accelerate without limit; the control clamps the velocity, the actual feed rate collapses, and the tool dwells. Bias the tilt in CAM or change the machine configuration rather than reducing feed.

Q: How is pivot length measured?
A: Mount a dial indicator at the rotary centre and rotate the axis through 180°, or use a calibrated test bar held in the spindle and sweep it past a known reference. Both give the offset directly; entering a nominal value from the machine drawing is not adequate because the actual pivot depends on the assembled head geometry.

Q: Can five-axis errors be fixed with pitch-error compensation?
A: No. Pitch-error compensation corrects linear axis deviation along travel. Errors that vary with tool orientation come from the kinematic parameters — pivot length, rotary centre offsets, rotary direction — and must be corrected in the machine parameters or the post-processor.

=== sources
ISO 10791-6:2014 — Test conditions for machining centres, Part 6: Accuracy of feeds, speeds and interpolations | https://www.iso.org/standard/62041.html
ISO 230-1:2012 — Test code for machine tools, Part 1: Geometric accuracy of machines operating under no-load conditions | https://www.iso.org/standard/46449.html
ISO 10791-7:2020 — Test conditions for machining centres, Part 7: Accuracy of finished test pieces | https://www.iso.org/standard/77124.html
