---
title: G-Code Modal State and Program Restart Safety
slug: gcode-modal-state-program-restart-safety-guide
type: BLOG
category: motion-control-drives
author: edward
tags: CNC programming, FANUC, Motion control
publishedAt: 2026-11-26T13:00:00Z
excerpt: Most crashed tools and scrapped parts after a restart come from modal state the operator assumed was still active. This guide explains which G-codes persist, which are cleared by reset or power-off, and how to re-enter a program safely.
seoTitle: G-Code Modal State and Program Restart Safety
seoDescription: Which G-code modal states survive reset and power-off, why block-search restart is unsafe inside G41 compensation, and a safe resume procedure.
coverImage: /media/2026/11/cover-gcode-modal-state-program-restart-safety-guide.jpg
coverAlt: Technical editorial illustration of a CNC control screen showing modal G-code state groups and a restart path with compensation cleared
coverCaption: Nothing in the program changed: what changed was the modal state the control resumed in.
---

A machinist stops a program mid-cut to change a broken insert, presses cycle start again, and the machine rapids into the part. Nothing in the program changed. What changed was modal state: the cutter compensation, the work offset or the motion mode that was active when the program was interrupted is no longer the mode the control is in when it resumes.

Modal state is the part of a CNC program that is defined once and stays in effect until something replaces it. It is also the part that operators and CAM posts forget, because it is invisible in the program listing. Nearly every "the machine did something I did not program" incident traces back to it.

## Why modal state causes crashes

ISO 6983 G-code is not a procedure with local variables. It is a machine-wide state machine. When the program says `G01 X100. F200`, it does three things at once: selects linear interpolation mode, sets a target position, and sets a feed rate that will remain active for every subsequent block that does not specify another one.

That design is why hand-written G-code is compact. It is also why the control's state at any instant depends on the entire history of the program plus whatever the operator did at the panel. The dangerous cases are the ones where history is rewritten:

- **Reset** returns most modal groups to machine defaults, but not all of them, and the set differs between controls.
- **Power-off** loses more state, and on some controls also clears work offsets that were set through `G10` rather than stored in the offset table.
- **Program restart** (block search / restart) restores the modes the control believes should be active at the restart block — usually correctly for motion and feed, less reliably for compensation and canned cycles.
- **Manual intervention** (jog, handwheel, `G53` moves, spindle override) leaves modes untouched while moving the machine somewhere the program does not expect.

The failure mode is always the same shape: the program resumes under an assumed state, and the first block that relies on that assumption goes somewhere unexpected.

## The modal groups that matter

Most controls organise modal codes into numbered groups where only one member of each group is active at a time. The group numbers below follow the FANUC convention, which is the most widely documented; Siemens ShopMill/840D and LinuxCNC use the same concept with different group numbering.

![Engineering diagram listing G-code modal groups 01 motion, 02 plane, 03 distance, 05 feed, 07 canned cycle, 08 radius compensation, 12 work offset and 13 path control with their reset defaults, beside a matrix showing which states survive reset, power-off and mid-program restart, and a warning that block search never executes the G41 approach move](/media/2026/11/diagram-gcode-modal-state-program-restart-safety-guide.png "Figure 1: The modal groups that decide machine behaviour, what reset and power-off leave behind, and the restart case that no control handles safely.")

| Group | Function | Common codes | Active after reset |
|---|---|---|---|
| 01 | Motion | `G00` `G01` `G02` `G03` | `G00` |
| 02 | Plane selection | `G17` `G18` `G19` | `G17` (varies by parameter) |
| 03 | Distance mode | `G90` `G91` | `G90` |
| 05 | Feed mode | `G94` `G95` | `G94` |
| 07 | Canned cycle | `G81` `G83` `G84` `G76` | Cancelled |
| 08 | Cutter radius compensation | `G40` `G41` `G42` | `G40` |
| 12 | Work coordinate system | `G54`–`G59` | `G54` |
| 13 | Path control | `G61` `G64` | `G64` (control-dependent) |
| 14 | Spindle mode | `G96` `G97` | `G97` |

Two rows deserve emphasis. Group 12 is the one that moves the part: if a program is written for `G55` and resumes in `G54`, every coordinate is wrong by the offset difference, and on a machine with a large fixture offset that difference can be hundreds of millimetres. Group 13 is the one that changes surface finish silently: resuming in `G61` exact-stop when the program expects `G64` contouring turns a finishing pass into a stop-start series of witness marks.

`G43` tool length compensation and `G41`/`G42` radius compensation live outside the modal group table on some controls but behave modally in practice. They are the most dangerous to lose, because the program was verified with them active and the machine geometry changes completely without them. A `G43` that is cleared before a resume means the control thinks the tool tip is at the spindle gauge line.

## What survives a reset, and what does not

The practical answer depends on the control, but the pattern is consistent enough to build a procedure on:

**Cleared by reset (typical):** motion mode, plane, distance mode, canned cycles, cutter compensation, spindle and coolant states, feed and speed overrides, active program pointer.

**Persisted in the offset table:** work offsets written through `G10` and stored, tool length and radius data, parameters. These survive reset and power-off because they live in memory, not in program state.

**Persisted only in the program:** `G92` coordinate shifts. `G92` redefines the current position as a new coordinate value, shifting the active work coordinate system. It is modal, it stacks with whatever offset was active, and it is not visible in the offset table. A program that uses `G92` for a fixture adjustment and then gets interrupted can leave the machine with an offset that no table shows and that no amount of "check the offsets" will find. `G92` is the single most common cause of a mystery shift after a restart, and the reason many shops ban it in production programs in favour of a dedicated work offset.

The practical rule: if a mode must be true for the program to be safe, program it explicitly at the start of every tool section rather than relying on it being inherited. A safety block costs one second of cycle time:

```gcode
G40 G49 G80 G90 G94 G17
G54
G43 H01 Z50.
M08
```

That block is the cheapest insurance in the workshop. It makes the program's assumptions explicit and it makes a resume from the middle of the previous operation harmless, because the following block re-establishes them anyway.

## Block delete, optional stop and restart blocks

Three control features change which blocks execute, and each interacts with modal state differently.

- **Block delete (`/`)** skips blocks marked on the control. It is normally used for optional clamping, probing or coolant. The trap is that a skipped block may be the only place a mode is set. If `G41` is on a block-delete block, the compensation is silently gone and the part is cut to the tool centre line.
- **Optional stop (`M01`)** stops only when the panel switch is on, so the same program behaves differently depending on a physical switch. Programs that rely on `M01` for inspection stops must not depend on the stop for state changes.
- **Restart block / block search** jumps into the middle of a program. The control scans backwards to reconstruct modal state, but reconstruction is not the same as execution: it reads codes, it does not simulate them. Cutter compensation is the classic casualty, because the approach move that establishes the compensation geometry never physically happens. Restarting inside a compensated contour is unsafe on nearly every control, and the standard advice is to restart at a point before the compensation was applied.

The safe restart points are the ones the program was written to have: after a tool change, at a clearance plane, at a `G40`-clean boundary. If a program has no such points, it cannot be restarted safely, only re-run.

## A modal state audit for shift handover

The audit takes about a minute per job and catches nearly all of these failures:

1. Confirm the active work offset on the position display, and confirm it matches the setup sheet — not the last job.
2. Confirm `G43` and the active `H` number against the tool in the spindle.
3. Confirm `G40` (no compensation) and `G80` (no canned cycle) before any manual move.
4. Confirm distance mode `G90` and feed mode `G94` before restarting.
5. Park with `G53` (non-modal machine coordinate move) rather than a work-coordinate position, so the park location is independent of the offset.
6. After any `G92` in the program, verify the offset table has not been disturbed, and prefer rewriting the program to use a real offset.

None of this needs a parameter change or a new control. It is entirely a discipline question, which is why it survives machine upgrades: the newer the control, the more state it keeps, and the more there is to be wrong about.

Modal state is the interface between the programmer's assumptions and the machine's reality. Programs that assume little are portable, restartable and safe; programs that assume a great deal are fast to write and fragile in service. For production work the second kind is a false economy.

=== takeaways
Modal state is machine-wide and cumulative: the control's behaviour at any block depends on the entire program history plus manual intervention, not just on the block itself.
Reset clears most modal groups but not stored offsets; G92 coordinate shifts are invisible in the offset table and are the usual cause of a mystery shift after restart.
Restart inside cutter compensation is unsafe on nearly every control, because the approach move that defines the compensation geometry is scanned but never executed.
Program an explicit safety block (G40 G49 G80 G90 G94 with work offset and G43) at the start of every tool section, and park using G53 machine coordinates.

=== faqs
Q: Does pressing reset clear the work offset on a FANUC control?
A: No. Work offsets stored in the offset table (G54–G59 and extended offsets) persist through reset and power-off because they live in memory, not in program state. What reset does clear is the active motion mode, plane, distance mode, cutter compensation, canned cycles and override states. An offset set with G92 is a program-level shift and behaves differently from a table offset, which is one reason to avoid it.

Q: Why did my tool rapid into the part after I restarted mid-program?
A: Almost always because the control resumed in G00 rather than the interpolation mode that was active when the program stopped, or because tool length compensation was no longer applied. Reset returns the motion group to G00. Restarting without a safety block means the first positioning move is a rapid in machine coordinates with the assumed offset.

Q: Can I restart a program inside a G41/G42 contour?
A: It is unsafe on nearly all controls. Block search reconstructs modal state by reading codes backwards, but the approach move that physically establishes the compensation geometry is not executed, so the control's compensation vector does not match the tool's real position. Restart before the compensation is applied, typically after the last tool change.

Q: Is G92 ever the right choice?
A: It is useful for one-off manual work and for temporary shifts during setup, where the operator is watching. In production programs a dedicated work offset or a G10 write to the offset table is safer, because the value is visible in the table, survives restart predictably, and can be verified at shift handover.

=== sources
ISO 6983-1:2009 — Automation systems and integration: Numerical control of machines, Program format and definitions of address words | 
ISO 10791-6:2014 — Test conditions for machining centres, Part 6: Accuracy of feeds, speeds and interpolations | 
FANUC Series 0i-Model F Operator's Manual — Modal command groups and reset behaviour | 
LinuxCNC G-Code Reference — Modal groups and their persistence across program termination |
