---
title: Subprograms and Macro Variables: Structuring CNC Programs
slug: cnc-subprograms-macro-variables-program-structure-guide
type: BLOG
category: motion-control-drives
author: edward
tags: CNC programming, FANUC, Motion control
publishedAt: 2026-11-26T14:20:00Z
excerpt: A 4000-line CNC program with no structure is a maintenance liability: one offset change means editing twenty duplicated blocks. Subprograms, local variables and macro loops are how production programs stay editable, and each one has a scope rule that decides whether your change affects one job or every part in the file.
seoTitle: CNC Subprograms and Macro Variables: Program Structure Guide
seoDescription: M98/M99 subprogram rules, local versus common macro variables, G65 argument passing and WHILE loop structure for CNC programs that stay maintainable.
coverImage: /media/2026/11/cover-cnc-subprograms-macro-variables-program-structure-guide.jpg
coverAlt: Technical editorial illustration of a CNC program structure diagram showing a main program calling nested subprograms with variable scopes
coverCaption: The program that is easiest to write is rarely the one that is cheapest to change.
---

Ask two machinists to write the same part and you can predict the difference without seeing the part. One produces a linear file of coordinates with the same pocket profile pasted six times. The other produces a main program that calls a subprogram with parameters, loops it, and fits on two screens. Both cut a good first article. Only one survives the first engineering change.

Program structure in CNC is not an aesthetic question. It is the difference between a change that touches one block and a change that must be found in six places and missed in one of them. The tools are old and standardized — `M98`/`M99` subprogram calls, `G65` macro calls with arguments, and macro variables with defined scope — but the scope rules are where programs break, because a variable written in the wrong scope silently shares state across parts, calls or shifts.

## M98 and M99: the subprogram layer

A subprogram is a second program file (or a labelled region, depending on the control) that the main program calls and returns from. On FANUC-family controls the pattern is:

```gcode
M98 P1001      (call subprogram O1001 once)
M98 P1001 L6   (call it six times)
...
M99            (at the end of O1001: return to caller)
```

The important properties are easy to state and easy to violate:

- **Nesting depth is limited.** FANUC permits four levels of nested subprogram calls; recursion into the same subprogram counts against the limit and is a fast route to an alarm mid-cut.
- **Modal state is shared.** A subprogram inherits the caller's modal state and leaves any state it changes behind. A pocket subprogram that enables `G41` and does not cancel `G40` on exit returns control with compensation active, and the caller's next block is now geometrically offset.
- **`M99` in the main program behaves differently.** Executed at main-program level it loops to the program start rather than returning, which is occasionally useful for a warm-up program and otherwise a way to run a program forever by accident.
- **`M99 Pn` (return to a label) exists on some controls** and is widely misunderstood; it is not portable and should not appear in a program that will run on more than one machine model.

The practical rule is that a subprogram must be state-neutral: whatever modal state it needs, it establishes on entry, and whatever it changes, it restores on exit. `G40`, `G80`, `G90` and the work offset are the four that matter.

## Macro variables: the scope that breaks programs

Macro variables are numbered variables that a program can read and write. On FANUC-family controls the ranges are roughly:

![Engineering diagram of a CNC program call tree from main program through M98 subprogram calls and a G65 macro call with arguments to nested subprograms, beside a table of macro variable ranges showing local variables cleared on return, volatile common variables in the hundreds, persistent common variables in the five hundreds that survive power-off, and system variables, plus the four pieces of modal state a subprogram must restore](/media/2026/11/diagram-cnc-subprograms-macro-variables-program-structure-guide.png "Figure 1: The call tree that keeps a program editable, and the variable scope that decides whether a value affects one part or every part.")

| Range | Type | Behaviour |
|---|---|---|
| `#1`–`#33` | Local | Cleared on `M99` return and on macro call; used for arguments |
| `#100`–`#199` | Common, volatile | Shared across all programs, cleared at power-off |
| `#500`–`#999` | Common, persistent | Shared across all programs, retained at power-off |
| `#1000`+ | System | Machine state (position, offsets, alarms) — read-only or dangerous to write |

The scope distinction is the whole point. A local variable is per-call scratch space: pass a value in, compute with it, and it disappears on return. A common variable is global state that outlives the program — deliberately useful for a tool counter or a probe result, and a source of spectacular failures when used by accident.

The classic failure: an operator uses `#100` as a loop counter in a warm-up routine, and the same `#100` is used by a production macro to hold a probe-derived offset. The warm-up runs in the morning and quietly corrupts the value. `#500`-series variables are worse in one specific way: they survive power-off, so the corrupted value reappears after a weekend and the investigation starts from a false assumption.

Guidelines that prevent nearly all of it:

1. **Local variables only inside subprograms and macros**, unless persistence is the explicit requirement.
2. **Allocate the `#500`-series by register**, documented in a comment block at the top of the program: `#500 = tool 1 life count`, `#501 = tool 2 life count`. An undocumented persistent variable is a future mystery.
3. **Never assume a common variable's initial value.** Test it (`IF [#500 EQ 0] THEN #500 = 1`) rather than trusting the previous run.
4. **Do not use `#100`–`#199` for anything that must survive a restart**, and do not use them for anything that must not.

## G65: passing arguments without global state

`G65` calls a macro program with arguments mapped onto local variables:

```gcode
G65 P9010 A50. B30. C-2.5 F400.
```

Inside `O9010`, `#1` holds the A word, `#2` the B word, `#3` the C word, and `#9` the F word. This is the cleanest parameter-passing mechanism in G-code and it is dramatically underused, because many programmers learned to write subprograms that read common variables instead. The difference in maintainability is large: a `G65` call is self-documenting at the call site, while a subprogram reading `#520` requires the reader to find who wrote `#520`.

Two constraints are worth knowing before adopting it:

- **Argument words are fixed**: A–Z map to `#1`–`#26` in a standard order (`I`, `J`, `K` map to `#4`, `#5`, `#6`). Using them for anything other than their conventional meaning is legal and confuses everyone who reads the program later.
- **The local variables are overwritten by the call.** Any value the caller had in `#1`–`#33` is gone after `G65`, so a program that mixes `G65` calls with hand-rolled local-variable bookkeeping will surprise itself.

## Loops and conditional logic

Macro B (`#` variables with `WHILE`, `IF`, `GOTO`) turns a control into a limited programming environment. The patterns that earn their place in production:

```gcode
(Repeat a pocket pattern in X)
#100 = 0
WHILE [#100 LT 6] DO 1
  G90 G00 X[50. + #100 * 40.] Y0.
  M98 P9020
  #100 = #100 + 1
END 1
```

Two rules keep loops from becoming infinite: always give the loop a counter that a human can inspect on the display, and always make the exit condition dependent on that counter rather than on a computed value that might never be reached. A `WHILE` loop whose exit depends on a probe reading will run forever when the probe fails, and it will run at feed rate.

For conditional logic, the useful safety pattern is a guarded pre-check rather than a mid-motion decision:

```gcode
IF [[#500 GT 200] AND [#500 LT 400]] GOTO 9000   (value plausible: continue)
#3000 = 1                                        (raise alarm)
M30
N9000
```

Testing a persisted value before using it catches the corrupted-variable class of failure at the start of the program instead of at the tool.

## Structure as a maintenance decision

A well-structured CNC program for a repeated production part typically looks like this:

1. **Header comment block**: part number, machine, author, revision, tool list, persistent variable allocation, and the parameter assumptions (radius-or-diameter compensation, in particular).
2. **Safety block**: `G40 G49 G80 G90 G94`, work offset, spindle mode — establishing state explicitly rather than inheriting it.
3. **Per-tool sections**: each opens with its own safety block and `G43`, and closes with the tool returning clear and compensation cancelled.
4. **Feature subprograms** parameterized by `G65`, so a change to the pocket definition happens in one file.
5. **State-neutral exit**: coolant off, spindle stop, compensation cancelled, and any persistent counters updated deliberately with a comment.

None of this reduces cutting time by one second. It reduces the cost of the fifth engineering change, which is where most of the money in a production program actually is.

=== takeaways
Subprograms inherit and leave behind modal state, so every subprogram must establish what it needs on entry and restore G40, G80, G90 and the work offset on exit.
Local macro variables (#1–#33) clear on return; common variables (#100–#199 volatile, #500–#999 persistent) are global, and the persistent ones survive power-off and therefore survive into the next investigation.
G65 argument passing maps A–Z words onto local variables and is the only parameter mechanism that is self-documenting at the call site.
Allocate persistent variables by register in a header comment, and test their value before use instead of trusting the previous run.
Loop exit conditions must depend on an inspectable counter, never on a live sensor value that can fail mid-loop.

=== faqs
Q: How many times can I nest subprogram calls?
A: FANUC-family controls typically allow four levels of nesting, and a subprogram calling itself counts against that limit. If a program alarms with a subprogram nesting error, the usual cause is a return path that re-enters the same subprogram rather than a legitimate deep call structure.

Q: Why did my tool counter reset after power-off?
A: It was stored in #100–#199, which are volatile common variables cleared at power-off. Persistent counters must live in #500–#999. The reverse mistake is also common: storing a temporary loop counter in the persistent range, so a partially completed loop resumes with a stale value after a power interruption.

Q: Is macro programming worth using on a small shop's machines?
A: Yes for one narrow purpose: parameterized feature subprograms and repeated patterns, where the alternative is duplicating blocks. Avoid it for anything that encodes process logic a machinist cannot read on the control display, because macro code has no type system and no debugging aids beyond #3000 alarms and the variable display.

Q: What is the difference between M98 and G65?
A: M98 calls a subprogram that reads whatever variables it wants; G65 calls a macro and passes arguments that land in local variables #1–#33, which are then cleared on return. Use M98 for a fixed routine with no parameters, and G65 whenever the routine needs inputs — the call site then documents its own values.

=== sources
ISO 6983-1:2009 — Automation systems and integration: Numerical control of machines, Program format and definitions of address words |
ISO 10791-7:2020 — Test conditions for machining centres, Part 7: Accuracy of finished test pieces |
FANUC Series 0i-Model F Operator's Manual — Custom macro B, subprogram calls and variable ranges |
LinuxCNC G-Code Reference — O-word subroutines and parameter passing |
