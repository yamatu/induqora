---
title: CNC Work Offsets: G54–G59, G10 and Probing Setup
slug: cnc-work-offsets-g54-g59-probing-setup-guide
type: BLOG
category: motion-control-drives
author: edward
tags: CNC programming, CNC machine accuracy, FANUC
publishedAt: 2026-11-26T13:20:00Z
excerpt: Work offsets decide where the part is, and every scrap event starts with a coordinate system that was not what the program assumed. This guide covers the offset chain from machine zero to tool tip, G54–G59 and G54.1, G10 writes, and probe-driven setup.
seoTitle: CNC Work Offsets: G54–G59, G10 and Probing
seoDescription: How the CNC offset chain from machine zero to tool tip works, how G54–G59, G54.1 and G10 programmable offsets differ, and how probing verifies setup.
coverImage: /media/2026/11/cover-cnc-work-offsets-g54-g59-probing-setup-guide.jpg
coverAlt: Technical editorial illustration of a CNC coordinate system offset chain from machine zero through work offset and tool length to the tool tip
coverCaption: The control does not know where the part is, only where it believes the part is.
---

A CNC machine has one physical reference and several logical ones. Machine zero is fixed by the scale and the reference switch. The part, the fixture and the tool are all somewhere else, and the offsets are the arithmetic that connects them. When a part is machined in the wrong place, the geometry is rarely the culprit; the offset chain is.

Understanding the chain is the difference between an operator who adjusts offsets by trial and one who can predict, in one pass, what a number should be.

## The offset chain, from machine zero to tool tip

Every position the control displays is the result of a chain:

![Engineering diagram of the CNC offset chain from machine zero through work offset G54 to G59, tool length G43 and radius compensation to the programmed point, with a table showing each stage stored in the offset table or only in program state, and a comparison of G10 L2 absolute writes against G10 L20 datum definition](/media/2026/11/diagram-cnc-work-offsets-g54-g59-probing-setup-guide.png "Figure 1: The four-stage offset chain, which stages are inspectable in the offset table, and why a G92 shift appears in none of them.")

1. **Machine coordinate** — the fixed reference. `G53` moves in this system and ignores offsets.
2. **Work offset (`G54`–`G59`, `G54.1 P1`–`P48`)** — the translation and, on five-axis and turning machines, rotation from machine zero to the part datum.
3. **Tool length offset (`G43 H`)** — the difference between the spindle gauge line and the tool tip.
4. **Cutter radius or tool radius compensation (`G41`/`G42`)** — the lateral shift that puts the tool edge, not the centre, on the programmed path.

Each stage is stored in a different place, cleared by different events, and set by a different workflow. That is why "the offset is wrong" is never a complete diagnosis.

The practical invariant is worth memorising: **the control does not know where the part is, only where it thinks the part is.** A missing `G43` moves the assumed tip by the length of the tool. A work offset entered in the wrong axis rotates the error into a direction the operator is not looking at. A stale offset from the previous job shifts everything by the difference between two fixtures.

## G54–G59 and the extended offsets

The six standard work offsets cover the ordinary case: one fixture, a few datums, or pallet positions. Their limits matter in production:

| Offset | Typical use | Notes |
|---|---|---|
| `G54` | Primary fixture, default active offset | Reset returns the control to `G54` on most machines |
| `G55`–`G59` | Additional fixtures, pallets, sub-datums | All six are always available |
| `G54.1 P1`–`P48` | Extended offsets, pallet pools, tombstone faces | Count is an option; not all machines have all 48 |
| `G53` | Machine coordinate move — not an offset | Non-modal, valid for one block only |

Two operational consequences follow. First, because reset returns to `G54`, a program written for `G55` will not resume correctly — this is the most common restart failure in multi-fixture work. Second, the extended offsets are frequently an option that is licensed and sometimes not licensed, so CAM posts that emit `G54.1` can produce a program the machine rejects. Post-processor configuration should match the option list of the specific machine, not the generic post.

For five-axis machines, work offsets also carry rotation (Euler angles or axis vectors), and the interaction between the offset rotation and the kinematic transformation is where RTCP behaviour becomes unintuitive. Rotating a work offset on a five-axis machine changes the singularity locations, not just the position.

## Programmable offsets with G10

`G10` writes offset values from inside the program. It is powerful and easy to misuse.

The two common forms:
- `G10 L2 P1 X.. Y.. Z..` — write work offset `G54` (L2 = work offset, P = offset number).
- `G10 L20 P1 X.. Y.. Z..` — set the offset so that the current position becomes the given coordinate value (L20 is control-dependent in syntax and naming).

`G10 L20` is the useful one in automation: a probe or operator jogs to a datum, the program writes the offset so that this position *is* the datum, and no arithmetic is required. That eliminates a whole class of sign and addition errors.

The risks are equally real. A `G10` write persists in the offset table and silently overwrites whatever was there — including values another job depends on. On many controls the write is not protected by the panel lock, so a wrong `P` number edits a different fixture. And because `G10` is a normal block, block delete or a mid-program restart can skip it or execute it twice.

Recommended practice: keep `G10` writes in a dedicated setup program, log what they wrote, and do not embed them in cutting programs unless the machine has probe verification immediately afterwards.

## Probe-driven setup

Touch probes turn offset setting from arithmetic into measurement. The typical cycle: probe contacts a datum surface, the control reads the skip position (`G31` motion, which stops on the probe signal), computes the offset, and writes it with `G10 L20` or to the table directly.

What probing actually improves:
- **Repeatability of setup**, not accuracy of the machine. A probe removes operator judgement; it does not remove machine error.
- **Cycle time in high-mix work.** The savings come from fewer trial cuts and less first-article inspection.
- **Auditability.** The measured values are logged, which matters in regulated work.

What probing does not fix:
- **Probe calibration.** Stylus length, ruby ball diameter and pre-travel are calibrated values; if they are wrong the offsets are consistently wrong, and the result is a part that is in tolerance to a measurement that is not.
- **Datum quality.** Probing a rough or burred surface measures the burr.
- **Thermal drift.** On a machine that is still warming up, a probed offset is a snapshot, not a constant.

The one hard rule: probe calibration should be verified on a known artefact (a ring gauge or a setting master) before a probe result is trusted to write a production offset.

## Setup verification checklist

1. Active work offset on the position display matches the setup sheet, and the setup sheet names the fixture, not just the number.
2. `G43` and the `H` number match the tool physically in the spindle, verified by a Z reference touch on a known surface.
3. Tool radius values in the table match the tool actually loaded; an oversized `R` from a previous regrind produces an undersized part with no alarm.
4. Offsets written by `G10` are logged, and the log is checked against the offset table after a restart.
5. Extended offsets (`G54.1`) confirm the machine has the option, and the post is configured to match.
6. Probe calibration verified on a reference artefact at least at the start of each shift.

Work offsets are the least glamorous part of machining and the one most often responsible for a scrapped first article. The arithmetic is simple; the discipline of verifying it is not. Shops that treat offset verification as a checklist item rather than a skill recover the time in scrap and setup hours within a week.

=== takeaways
Every displayed position is machine coordinate plus work offset plus tool length compensation; a missing link in that chain moves the assumed tool tip, not the real one.
Reset returns the control to G54 on most machines, so programs written for other offsets do not resume safely without an explicit offset block.
G10 L20 sets an offset so the current position becomes a named datum, eliminating arithmetic, but writes persist silently and can overwrite another fixture's values.
Probing improves setup repeatability and auditability, not machine accuracy; an uncalibrated probe writes consistently wrong offsets with no alarm.

=== faqs
Q: Why does my machine cut in the wrong place after a restart?
A: The usual cause is the work offset. Reset returns most controls to G54, so a program written for G55 or a G54.1 extended offset resumes in the wrong coordinate system. A secondary cause is missing G43, which changes the assumed tool tip position rather than the part position. Check the active offset on the position display before restarting.

Q: What is the difference between G10 L2 and G10 L20?
A: G10 L2 writes absolute values into the offset table. G10 L20 sets the offset such that the current position becomes the specified coordinate, which is how probe cycles write offsets. L20 removes arithmetic and sign errors but is more syntax-sensitive and more control-dependent.

Q: Can I use G54.1 extended offsets on any machine?
A: Not necessarily. The number of extended offsets (up to P48) is a licensed option on many controls. A CAM post that emits G54.1 can produce a program that the machine rejects outright, or that uses an offset number above the licensed count. Configure the post to the machine's actual option list.

Q: Should I probe every setup?
A: Probe when the setup changes, when the fixture is repositioned, or when the part is high value. There is little gain in probing an unchanged setup between identical parts, and probe cycles add cycle time. The exception is a machine with significant thermal growth, where re-measuring a datum periodically is worthwhile.

=== sources
ISO 10791-1:2015 — Test conditions for machining centres, Part 1: Geometric tests for machines with horizontal spindle | 
ISO 230-1:2012 — Test code for machine tools, Part 1: Geometric accuracy of machines operating under no-load conditions | 
FANUC Series 0i-Model F Operator's Manual — Work coordinate systems, G10 and G54.1 extended offsets | 
Renishaw probing application notes — Work offset and tool setting cycles |
