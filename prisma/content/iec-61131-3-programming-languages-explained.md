---
title: IEC 61131-3 Programming Languages Explained: Ladder, FBD, Structured Text, SFC and IL
slug: iec-61131-3-programming-languages-explained
type: BLOG
category: plc-controllers
author: edward
tags: IEC 61131-3, PLC programming, Structured Text, Ladder Logic
publishedAt: 2026-09-02T09:00:00Z
excerpt: IEC 61131-3 defines the standard PLC programming languages used by almost every major controller platform. Here is what each language is good at, where it falls short, and how to choose between them on a real project.
seoTitle: IEC 61131-3 PLC Programming Languages Explained
seoDescription: A practical guide to the IEC 61131-3 PLC languages — Ladder Diagram, Function Block Diagram, Structured Text, SFC and Instruction List — and when to use each.
coverImage: /media/2026/11/cover-iec-61131-3-programming-languages-explained.jpg
coverAlt: Engineering graphic depicting the IEC 61131-3 PLC programming languages: Ladder Diagram, Function Block Diagram, Structured Text, and Sequential Function Chart
coverCaption: Modern PLC engineering mixes IEC 61131-3 languages by task: Ladder for interlocks, FBD for continuous loops, ST for math, and SFC for machine states.
---
IEC 61131-3 is the international standard that defines the programming languages and software model for programmable logic controllers (PLCs). First published in 1993 and revised in 2003 and 2013, it is the reason a controls engineer trained on one vendor's platform can read code written on another. Most major controller platforms — including CODESYS-based systems, Siemens TIA Portal, Rockwell Studio 5000, Beckhoff TwinCAT, Schneider EcoStruxure and B&R Automation Studio — implement it, though each with its own extensions and naming.

The standard defines two graphical languages, two textual languages, and one structuring language. Understanding what each one is designed for is the fastest way to write PLC code that other people can maintain.

## The software model behind the languages

Before the languages themselves, IEC 61131-3 defines a common software model that all of them share:

- **Program Organization Units (POUs)** — the building blocks of every project. There are three kinds: *functions* (no memory between calls, same inputs always give the same output), *function blocks* (have internal state, instantiated like objects) and *programs* (the top-level units that tie everything together).
- **Data types** — elementary types such as `BOOL`, `INT`, `DINT`, `REAL`, `TIME` and `STRING`, plus user-defined structures, enumerations and arrays.
- **Configurations, resources and tasks** — how programs are mapped onto CPUs and scheduled, either cyclically or on events.

Because every language compiles to the same model, you can mix languages in one project. A function block written in Structured Text can be called from a Ladder rung, and an SFC step can run actions written in FBD.

## Ladder Diagram (LD)

Ladder Diagram represents logic as relay contacts and coils arranged on rungs between two power rails. It descends directly from the relay panels that PLCs replaced in the late 1960s and 1970s.

**Strengths**

- Instantly readable by electricians and maintenance technicians.
- Excellent for discrete interlocks, permissives and simple sequencing.
- Online monitoring shows power flow visually, which makes troubleshooting fast.

**Weaknesses**

- Math, string handling, loops and data manipulation become awkward and verbose.
- Large programs turn into hundreds of rungs that are hard to structure.

**Use it for:** machine interlocks, motor starters, safety permissives and any logic that plant maintenance staff will need to troubleshoot at 3 a.m.

## Function Block Diagram (FBD)

FBD connects function and function block instances with signal lines, much like a schematic or a process control diagram. Data flows from left to right.

**Strengths**

- Natural fit for continuous control: PID loops, signal conditioning, scaling and alarming.
- Familiar to process and instrumentation engineers, and close to the way many DCS platforms present control strategies.
- Reusable blocks encourage modular design.

**Weaknesses**

- Execution order can be non-obvious in complex diagrams.
- Large diagrams sprawl across many pages.

**Use it for:** analog control loops, signal processing chains and process control strategies.

## Structured Text (ST)

Structured Text is a high-level textual language with a syntax derived from Pascal. It supports `IF`, `CASE`, `FOR`, `WHILE` and `REPEAT` statements, expressions and function calls.

```
IF TankLevel > HighLimit THEN
    InletValve := FALSE;
    HighLevelAlarm := TRUE;
ELSIF TankLevel < LowLimit THEN
    InletValve := TRUE;
END_IF;
```

**Strengths**

- The most compact way to express math, algorithms, data handling and state machines.
- Works well with version control, diff tools and code review.
- Since the 2013 edition, supports object-oriented features such as methods, interfaces and inheritance for function blocks.

**Weaknesses**

- Harder for maintenance technicians to troubleshoot online than graphical languages.
- Easy to write clever code that nobody else can follow.

**Use it for:** calculations, recipe and data handling, communication parsing, complex state machines and reusable library blocks.

## Sequential Function Chart (SFC)

SFC is not a language for writing logic so much as a way to *structure* it. It describes a process as a series of **steps** connected by **transitions**, with **actions** attached to steps. It is derived from the French GRAFCET standard (IEC 60848).

**Strengths**

- Makes sequential processes — batch phases, machine cycles, startup and shutdown sequences — explicit and visible.
- Online, you can see exactly which step is active and which transition is waiting.
- Supports parallel and alternative branches.

**Weaknesses**

- Overkill for simple logic.
- Error handling and abort paths need careful design or the chart becomes tangled.

**Use it for:** batch sequences, machine cycles and any process with clearly defined phases.

## Instruction List (IL)

Instruction List is a low-level, assembler-like textual language. It was deprecated in the third edition of the standard (2013) and should not be used for new projects. You will still meet it when maintaining legacy code, so it is worth being able to read it.

## How to choose: a practical rule set

| Task | Recommended language |
|---|---|
| Discrete interlocks and permissives | Ladder Diagram |
| Analog control loops and signal conditioning | Function Block Diagram |
| Math, data handling, algorithms, parsing | Structured Text |
| Batch phases and machine sequences | Sequential Function Chart |
| Reusable library function blocks | Structured Text (called from any language) |

![Four-quadrant engineering reference showing visual examples of Ladder Diagram rungs, Function Block Diagram PID wiring, Structured Text loop code, and Sequential Function Chart steps with recommended use cases](/media/2026/11/diagram-iec-61131-3-programming-languages-explained.png "Figure 1: Multi-language PLC projects combine LD, FBD, ST, and SFC inside reusable Program Organization Units (POUs) rather than forcing one language everywhere.")

Three principles matter more than the choice of language:

1. **Write for the person who will troubleshoot it.** If the plant's maintenance team only reads Ladder, keep the logic they will touch in Ladder and hide complexity inside well-named function blocks.
2. **Be consistent.** Agree on a language convention per module type in your company coding standard. PLCopen publishes coding guidelines that are a good starting point.
3. **Encapsulate.** Use function blocks with clear interfaces instead of global variables. This matters more for maintainability than any language decision.

## Portability: the limits of the standard

IEC 61131-3 makes skills portable, but code is only partly portable. Vendors differ in supported data types, system libraries, communication blocks, and how they store projects. The PLCopen XML exchange format helps move POUs between tools, but expect rework when migrating between platforms — especially for I/O configuration, motion and communication.

=== takeaways
IEC 61131-3 defines the standard PLC programming languages: Ladder Diagram, Function Block Diagram, Structured Text, Sequential Function Chart and the deprecated Instruction List.
All IEC 61131-3 languages share one software model of functions, function blocks and programs, so they can be mixed in a single project.
Ladder suits discrete interlocks, FBD suits continuous control, Structured Text suits math and data handling, and SFC structures sequential processes.
Instruction List was deprecated in the 2013 third edition and should not be used for new projects.
The 2013 edition added object-oriented features such as methods, interfaces and inheritance for function blocks.

=== faqs
Q: What are the five IEC 61131-3 programming languages?
A: Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL) and Sequential Function Chart (SFC). LD and FBD are graphical, ST and IL are textual, and SFC is used to structure sequential logic. IL has been deprecated since the 2013 edition.

Q: Which PLC programming language is best?
A: None is best for everything. Ladder is best for discrete logic that maintenance staff must troubleshoot, FBD for analog control loops, Structured Text for calculations and data handling, and SFC for sequences. Most well-designed projects combine several languages.

Q: Is Structured Text replacing Ladder Logic?
A: Structured Text use is growing, especially for reusable libraries and complex algorithms, but Ladder remains widely used for discrete machine logic because it is easy to troubleshoot online. In practice, the two are increasingly used side by side.

Q: Can I move PLC code between vendors using IEC 61131-3?
A: Partly. The languages and concepts are standardized, and PLCopen XML can transfer program units between tools, but vendor-specific libraries, I/O configuration and communication blocks usually need to be reworked.

=== sources
IEC 61131-3: Programmable controllers — Part 3: Programming languages (International Electrotechnical Commission)
PLCopen — Standardization in industrial control programming | https://www.plcopen.org/
IEC 60848: GRAFCET specification language for sequential function charts (International Electrotechnical Commission)
