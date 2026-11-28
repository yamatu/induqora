---
title: CNC Look-Ahead and Jerk Limits: Why Corners Get Rounded
slug: cnc-look-ahead-jerk-limits-contour-accuracy-guide
type: BLOG
category: motion-control-drives
author: edward
tags: Motion control, CNC machine accuracy, Servo drives
publishedAt: 2026-11-26T12:30:00Z
excerpt: A machine that reaches programmed feed on a straight move can still round every corner and overshoot every small arc. The cause is usually acceleration planning, block processing time and jerk limits — not servo gain. This guide explains how look-ahead works and which parameters actually control corner accuracy.
seoTitle: CNC Look-Ahead and Jerk Limits: Corner Accuracy Explained
seoDescription: How CNC look-ahead, block processing time, acceleration and jerk limits control corner accuracy, feed rate on arcs, and surface finish at speed.
coverImage: /media/2026/11/cover-cnc-look-ahead-jerk-limits-contour-accuracy-guide.jpg
coverAlt: Technical editorial illustration comparing exact stop staircase velocity profile against smooth look-ahead contouring velocity profile on a CNC motion controller
coverCaption: A machine that reaches programmed feed on a straight move can still round every corner: planning limits, not servo gain, decide corner accuracy.
---
Two machines with identical positioning accuracy and identical drives can cut the same program very differently. One produces sharp corners and accurate arcs at 8,000 mm/min; the other rounds corners, overshoots short moves and leaves chatter marks on every direction change. The difference is rarely the servo loop. It is the motion planning layer above it: how far ahead the control looks, how fast it processes blocks, and what acceleration and jerk limits it is allowed to use.

Understanding this layer matters because the symptoms are routinely misdiagnosed. Operators reduce feed rate to fix corner rounding, which works by accident — not because feed was the problem, but because lower feed reduces the acceleration demand. The programmed feed was never achievable through that corner in the first place.

## What look-ahead actually computes

The ISO-style G-code program is a sequence of discrete blocks. If the control executed each block independently — accelerate, traverse, decelerate to a stop, next block — every move would end at zero velocity and the machine would crawl through any program with short segments. Look-ahead exists to avoid that.

![Engineering diagram comparing a staircase exact stop velocity profile with a smooth look-ahead contouring profile across program blocks, a block processing time feed rate ceiling table for 1.0, 0.5 and 0.2 millimetre segments, and three corner strategy modes with their permitted path deviation](/media/2026/11/diagram-cnc-look-ahead-jerk-limits-contour-accuracy-guide.png "Figure 1: Velocity planning across blocks, the block-processing-time feed ceiling, and corner strategies selected against feature tolerance.")

The control reads ahead N blocks, builds a velocity profile across them, and decides how fast it can pass through each junction without exceeding the acceleration limit on any axis. The constraint is per-axis, not per-path: a move that requires 0.3 g along the path may require 0.9 g on one axis if the direction is close to that axis, and it is the axis limit that binds.

Consequences that surprise people:

- **Block processing time sets a hard ceiling on feed rate.** If the control can process one block every 1 ms and your program has 0.5 mm segments, the theoretical maximum is 500 mm/min regardless of what `F` says. Programs from CAM with very short segments (trochoidal paths, high-resolution splines) hit this ceiling constantly.
- **Look-ahead depth determines how early deceleration starts.** Too shallow, and the machine enters a corner too fast and overshoots; deeper look-ahead allows smoother planning at the cost of computation.
- **Programmed feed means feed along the tool path, not axis velocity.** On a diagonal move, each axis runs slower than the programmed feed; on simultaneous multi-axis moves the relationship changes again.

## Corner accuracy: three strategies, three outcomes

Controls offer a spectrum from exact stop to full contouring, and the choice is a trade between accuracy and speed:

| Strategy | Behaviour at a corner | Typical use |
|---|---|---|
| Exact stop (`G61` / `G09`) | Decelerates to zero at every block end | Boring, sharp internal corners, reference moves |
| Corner deceleration with tolerance | Decelerates only as much as needed to stay within a deviation band | General milling — the default choice |
| Continuous contouring (`G64` / tolerance modes) | Maintains feed, rounds the corner within a set deviation | Finishing at high feed on large radii |

The middle option is what most controls call a corner tolerance or path deviation parameter, and it is the one worth tuning. Setting it too tight turns a finishing pass into a stuttering stop-start sequence; too loose and the corner radius becomes visible on the part.

For FANUC, this is the `G64` family with an allowable path deviation; the AI contour control options extend it with feed-forward and smoothing. On SINUMERIK 840D sl the equivalents are `G64` continuous-path mode with `$SC_MINFEED`/`$SC_CORNER_TOL` style settings and the `COMPCAD`/`COMPCURV` compressor for spline approximation. In both cases the parameter is expressed in millimetres of permitted deviation, which means it must be set relative to the tolerance of the feature being cut, not once for the whole machine.

## Acceleration and jerk: the two limits that shape the profile

Acceleration limits are usually set conservatively by the machine builder and left alone. Jerk — the rate of change of acceleration — is the parameter that separates smooth machines from harsh ones, and it is often the one that was never tuned.

A trapezoidal velocity profile (constant acceleration, sudden onset) excites machine structure at every start and stop. A jerk-limited profile (S-curve) ramps the acceleration, which costs a few milliseconds per move and removes the excitation. On a program with thousands of short segments, the accumulated difference in surface finish is significant.

Practical tuning order:

1. **Verify the mechanical state first.** A machine with loose guideway preload will chatter regardless of jerk settings, and tuning around a mechanical fault hides it. The checks in [CNC machine accuracy, backlash and pitch-error compensation](/blog/cnc-machine-accuracy-backlash-pitch-error-compensation-guide) come first.
2. **Set acceleration from measured data**, not from a catalogue. A quick check: command a long move at increasing feed and watch following error; the point where error stops scaling linearly is where the axis is saturating.
3. **Tune jerk to the structure.** Too high and the machine rings at direction changes; too low and cycle time grows without visible benefit. A practical target is a finish that is stable across a range of segment lengths, not the fastest possible profile.
4. **Match axes to each other.** Mismatched acceleration limits between axes cause the path to deviate on non-axis-aligned moves — the same class of error as servo gain mismatch, and it produces the same elliptical bores.

## Where servo tuning ends and planning begins

The two layers produce similar-looking defects, so it is worth separating them with a simple test: **cut the same geometry at two very different feed rates.**

- Defect present at all feed rates, including slow ones → mechanical or geometric (backlash, squareness, gain mismatch).
- Defect appears only above a feed threshold → motion planning (look-ahead depth, acceleration or jerk limit, block processing time).

A second test distinguishes gain mismatch from planning: run a circular test at low feed. If the circle is elliptical at low feed, the axes are mismatched in gain — see [diagnosing servo drive alarms](/blog/servo-drive-alarm-troubleshooting-cnc-maintenance) for the drive-side checks. If the circle is clean at low feed and breaks up only at high feed, the problem is in the planning layer.

## Feed rate on arcs, and the centripetal limit

On a circular interpolation, the axis acceleration needed to follow the path is v²/r. Halving the radius quadruples the acceleration required at the same feed. This is why a program that runs perfectly on a 50 mm radius stalls on a 5 mm one at the same feed — the control is not being conservative, it is respecting a physical limit.

Practical consequences:

- **Arc-heavy finishing programs need feed rates scaled by radius.** Either set them in CAM, or let the control's arc feed limit do it — but verify that limit is actually active, because many machines ship with it disabled.
- **Small radii at high feed are the most common source of overshoot marks.** A witness mark at the entry to a small radius is the signature.
- **Trochoidal and high-feed milling paths depend on look-ahead depth being adequate** for their short segment length; a machine that cuts conventional paths well may still struggle with them.

## A short commissioning checklist

1. Measure block processing time and compare it with the shortest segment in your typical program.
2. Set corner tolerance per operation class — roughing, semi-finishing, finishing — rather than machine-wide.
3. Confirm the arc feed limit is enabled and set for the smallest radius you actually cut.
4. Tune jerk after mechanical verification, and match it across axes.
5. Cut a test part with a small radius, a 90° corner and a diagonal face at production feed, and measure all three.

Motion planning is where a machine's real productivity lives. Two machines with the same drives can differ by 30% in cycle time and by a whole tolerance grade in corner accuracy, purely on how their planning parameters were configured.

=== takeaways
Look-ahead builds a velocity profile across many blocks so the machine does not stop at every block end; block processing time sets a hard ceiling on achievable feed rate for short segments.
Corner accuracy is a trade between exact stop and continuous contouring — the usable middle setting is a deviation tolerance that must be matched to the feature tolerance, not set once machine-wide.
Defects present at all feed rates are mechanical or gain-related; defects that appear only above a feed threshold come from the motion planning layer.
Tune jerk after mechanical verification, match acceleration limits across axes, and enable the arc feed limit — the required acceleration on a circle rises as v²/r.

=== faqs
Q: Why does my machine never reach the programmed feed rate on this program?
A: Usually block processing time. If the program contains many short segments, the control cannot process and plan them fast enough to sustain the programmed feed, so the achieved feed is limited by segment length divided by block processing time. Longer segments, or a control with faster block processing, are the fix.

Q: Should corner tolerance be set as tight as possible?
A: No. Setting it tighter than the feature tolerance turns the pass into a stop-start sequence, which increases cycle time and can worsen surface finish by repeatedly accelerating and decelerating the machine structure. Set it relative to the tolerance of the operation.

Q: Can increasing servo gain fix corner rounding?
A: Not the rounding caused by motion planning. If the control decelerates into the corner or blends the path within a tolerance band, higher gain only makes the machine follow the blended path more precisely. The path itself is decided by the planning layer.

Q: Why do small arcs force a lower feed rate than large ones?
A: Following a circular path requires centripetal acceleration proportional to v²/r. Reducing the radius by a factor of four requires four times the acceleration at the same feed, so the axis acceleration limit sets a lower achievable feed on small arcs.

=== sources
ISO 10791-6:2014 — Test conditions for machining centres, Part 6: Accuracy of feeds, speeds and interpolations | https://www.iso.org/standard/62041.html
ISO 230-4:2022 — Test code for machine tools, Part 4: Circular tests for numerically controlled machine tools | https://www.iso.org/standard/78504.html
ISO 10791-7:2020 — Test conditions for machining centres, Part 7: Accuracy of finished test pieces | https://www.iso.org/standard/77124.html
