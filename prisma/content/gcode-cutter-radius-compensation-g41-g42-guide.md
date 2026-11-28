---
title: Cutter Radius Compensation: G41/G42 Without Scrapping Parts
slug: gcode-cutter-radius-compensation-g41-g42-guide
type: BLOG
category: motion-control-drives
author: edward
tags: CNC programming, CNC machine accuracy, FANUC
publishedAt: 2026-11-26T14:00:00Z
excerpt: Cutter radius compensation is the feature that most often turns a proven program into a scrapped part, because the control computes the tool path geometrically from a lead-in move the programmer never considered. This guide covers the offset vector, lead-in rules, D-register values and the gouge alarms that reveal a real error.
seoTitle: Cutter Radius Compensation: G41/G42 Without Scrapping Parts
seoDescription: How G41/G42 compute the offset vector, why lead-in geometry causes gouges and oversize parts, and what the D register must hold.
coverImage: /media/2026/11/cover-gcode-cutter-radius-compensation-g41-g42-guide.jpg
coverAlt: Technical editorial illustration of a CNC cutter path offset by tool radius with a lead-in move and the resulting compensated contour
coverCaption: The program describes the part edge; the tool travels somewhere else entirely.
---

A programmer verifies a profile on a machine at the bench, sets the cutter compensation value from the tool label, runs the first production part, and it comes out 0.4 mm oversize with a gouge on one corner. The program was correct on the previous job. What changed is that the control now has to construct a geometric offset from the tool's real radius — and the result depends on moves that were never part of the design intent.

Cutter radius compensation (`G41` left, `G42` right, `G40` cancel) is the only common G-code feature where the control invents motion the program does not contain. Everywhere else the program states a target and the machine goes there. Inside compensation, the control solves a geometry problem: given the programmed contour and a tool radius, where must the tool centre travel so the tool edge touches the programmed path?

That solve is why compensation is simultaneously indispensable and dangerous. It is indispensable because it lets one program cut with any tool of the same nominal type, adjusting for regrind and wear at the machine instead of reposting the CAM file. It is dangerous because the failure modes are geometric and silent in the listing: nothing in the program text looks different when the lead-in is too short.

## What the control actually computes

Inside `G41`/`G42`, the programmed coordinates describe the finished part edge, not the tool centre. The control offsets every programmed path normal to the direction of travel by the value in the compensation register (`D` word on FANUC-family controls, `_cutter_radius`-class variables elsewhere). On straight sections this is trivial: the offset is perpendicular.

![Engineering diagram showing a programmed part edge and the offset tool centre path for G41 with an offset equal to the tool radius, a lead-in of at least one tool radius, and three corner cases: an outside corner where the tool swings an arc of tool radius, an inside corner where the control trims to the offset intersection, and an inside radius smaller than the tool radius where no valid solution exists](/media/2026/11/diagram-gcode-cutter-radius-compensation-g41-g42-guide.png "Figure 1: The offset construction, the lead-in that establishes it, and the corner cases where geometry, not the program, decides whether the part is cut.")

At every intersection the control must decide how the offset tool-centre path joins. For an outside corner, the tool must swing around the corner, producing an arc whose radius equals the tool radius. For an inside corner, the two offset lines intersect and the control trims to that intersection. Where the inside corner radius is smaller than the tool radius, there is no valid intersection at all — the tool physically cannot cut the shape, and the correct response is an alarm rather than motion.

The lead-in block is where geometry is established. The control needs the approach vector to determine which side the tool is on and to build a valid starting offset. On FANUC-family controls this means the lead-in must be a move of at least the tool radius, perpendicular to (or collinear with) the first compensated path, and free of arcs. Nineteen out of twenty "compensation gouged my part" incidents start with a lead-in that violated one of those three conditions.

## Lead-in and lead-out rules that actually hold

The rules below are the shared subset across FANUC 0i/30i, Siemens 840D, Heidenhain TNC and LinuxCNC. They are conservative, which is what a production program needs:

- **Cancel compensation outside the material.** `G40` belongs on a move away from the part, never at the end of the contour. `G40` on the last profile block leaves a witness step where the tool returns to nominal path while still in contact.
- **Make the lead-in at least one tool radius long**, and ideally 1.5–2 radii. A 0.4 mm lead-in with a 6 mm cutter has no room to construct the vector.
- **Enter perpendicular or tangent, not diagonally into a corner.** A diagonal approach to the first corner asks the control to resolve two offset directions simultaneously, and the resolution becomes control-specific.
- **Never change `D` while compensation is active.** Compensation value is read at the block where `G41`/`G42` takes effect; a mid-contour change is ignored on some controls and produces a step on others.
- **Keep every compensated segment longer than the compensation value.** Segments shorter than the radius make the offset path self-intersect, which is exactly the condition that produces the "interference" alarm or, worse, an uncut gouge on older controls.
- **Do not use `G53` inside compensation.** Machine-coordinate moves are non-modal and bypass the offset frame the compensation was computed in.

A lead-in that satisfies all six looks like a plain move: position clear of the part with `G40` active, select the register, then feed into the contour along the approach direction. The pattern is boring, and boring is the point.

## The D register: radius or diameter

The single most common setup error is that the register holds the wrong quantity. Whether the `D` value is a radius or a diameter depends on a machine parameter (`RAD`-style setting), and it is not visible from the offset screen. A shop that switches between machines without checking this will produce parts that are consistently correct, consistently oversize by one radius, or consistently gouged — and the diagnosis "the machine is inaccurate" will be wrong every time.

Three habits remove the ambiguity:

1. Put the parameter setting in the setup sheet, next to the tool list, with the date it was last verified.
2. Hold a known reference: cut a test slot with the tool, measure the actual width, and compare with `2 × D` (radius convention) or `D` (diameter convention). A single 30-second cut settles it for that machine permanently.
3. Store wear in a separate register from nominal radius where the control supports it, so regrind adjustments do not overwrite the nominal value that the CAM post assumed.

Tool length compensation (`G43`) is a different register chain and must be active before compensation matters — a machine that is correct in radius but wrong in length produces the same visual symptom (a gouge) for a completely different reason.

## Reading the failure modes

| Symptom | Most likely cause |
|---|---|
| Part oversize by roughly one tool radius | `D` = 0, or wrong register called, or comp never took effect |
| Gouge at the first corner after entry | Lead-in shorter than tool radius, or diagonal approach |
| Untouched stock on an inside corner | Corner radius smaller than tool radius; control trimmed instead of alarming |
| Step or witness mark at the end of the contour | `G40` cancelled while still in contact |
| Alarm "interference in G41/G42" | Compensated segment shorter than the offset value, or a self-intersecting path |
| Part correct on the bench, wrong after restart | Comp reset by `G40` and never re-established on resume |

The last row is the dangerous one and it is not a compensation problem at all: it is a modal state problem. Any restart inside a compensated contour is unsafe on nearly every control, because block search reconstructs the modal state by reading codes backwards but never executes the approach move that physically established the geometry. The control believes compensation is active at a vector position the tool never reached.

## Verifying a compensated cut before the first part

The sequence below costs about four minutes and catches nearly all geometric failures:

1. **Air cut at reduced rapid.** Run the program with work offset moved clear of the stock, feed override at 25%. Watch the position display for the first compensated block: the distance from the approach point to the contour should equal the lead-in length, and the axis should not jump.
2. **Single block through the first corner.** Outside corner: verify the display shows an arc of tool radius. Inside corner: verify no reversal.
3. **Cut a short test feature**, ideally the sharpest inside radius in the job, in scrap material or on a stock allowance.
4. **Measure the test feature**, then compute the correction and write it into the wear register — not into the nominal value, and not into the program.
5. **Record the register values and the parameter state** on the setup sheet so the next shift starts from a known configuration.

Compensation is worth using in production specifically because it makes tool wear a machine-side adjustment. The cost is that the program's correctness now depends on a register value and a geometric precondition that the program text does not show. Treat both as first-class setup data and the feature stops being a source of scrap.

=== takeaways
Cutter compensation is the only common modal feature where the control generates motion the program does not contain; every failure mode is geometric rather than logical.
The lead-in block establishes the offset vector, so it must be at least one tool radius long, perpendicular or tangent to the first compensated path, and must not contain arcs.
The D register holds either a radius or a diameter depending on a machine parameter that is invisible on the offset screen — verify it with a measured test slot once per machine and record it on the setup sheet.
Inside corners smaller than the tool radius have no valid offset solution; a control that trims instead of alarming will leave uncut stock.
Never restart a program inside G41/G42: block search restores the modal flag without executing the approach move that defined the geometry.

=== faqs
Q: Why is my part consistently oversize by exactly the tool radius?
A: The compensation register is either zero or the wrong quantity. If the control expects a radius and the register holds zero, the tool centre follows the programmed contour and the part grows by one radius in every direction. Check that the correct D number is called on the same block as G41/G42, and confirm with a measured test slot whether that machine expects radius or diameter.

Q: What causes the "interference in G41/G42" alarm?
A: The offset path self-intersects. This happens when a compensated segment is shorter than the compensation value, when the tool radius is larger than an inside corner radius, or when consecutive moves reverse direction within one tool radius. The program or the tool is wrong, not the machine — enlarge the corner radius, lengthen the segment, or use a smaller cutter.

Q: Can I use G41/G42 on a lathe the same way?
A: The concept is identical but the geometry is different: on a lathe, compensation is normally applied to the tool nose radius in the XZ plane and the control must also account for the insert's tip orientation (the T-word codes). Wrong tip orientation produces a characteristic error that appears only on tapers and radii, not on straight diameters, which is why it survives many jobs undetected.

Q: Should CAM output include compensation, or should the tool centre path be posted directly?
A: Use compensation when tool wear or regrind must be adjusted at the machine without reposting, which is most production work. Post the tool-centre path directly for complex 3D surfacing where the offset path becomes ambiguous, and for small tools where a lead-in of one radius would not fit in the feature.

=== sources
ISO 6983-1:2009 — Automation systems and integration: Numerical control of machines, Program format and definitions of address words |
ISO 10791-7:2020 — Test conditions for machining centres, Part 7: Accuracy of finished test pieces |
FANUC Series 0i-Model F Operator's Manual — Cutter compensation, lead-in and interference behaviour |
LinuxCNC G-Code Reference — G41 and G42 cutter radius compensation rules |
