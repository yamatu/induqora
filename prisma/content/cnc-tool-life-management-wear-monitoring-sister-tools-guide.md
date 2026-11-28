---
title: CNC Tool Life Management: Wear, Sister Tools and Breakage
slug: cnc-tool-life-management-wear-monitoring-sister-tools-guide
type: BLOG
category: motion-control-drives
author: edward
tags: Motion control, CNC tooling, Condition monitoring
publishedAt: 2026-11-26T09:30:00Z
excerpt: Tool life is not a fixed number in a tooling catalogue — it is a distribution that shifts with material, coolant, holder runout and spindle condition. This guide covers the wear mechanisms that matter, the life criteria standards use, and how tool life management, sister-tool strategies and breakage detection actually work in a production cell.
seoTitle: CNC Tool Life Management: Wear, Sister Tools and Breakage Detection
seoDescription: How to manage CNC tool life: flank wear criteria, ISO 8688 tool life testing, sister tool strategies, spindle load monitoring and breakage detection.
coverImage: /media/2026/11/cover-cnc-tool-life-management-wear-monitoring-sister-tools-guide.jpg
coverAlt: Technical editorial illustration of CNC cutting tool wear progression with flank wear land measurement and spindle load signature trace
coverCaption: Tool life is a distribution, not a catalogue number: measured criteria, conservative counters and evidence-based replacement keep failure predictable.
---
A tool that fails mid-cut does more damage than the cost of the insert. It scraps the part, marks the fixture, may scrap the next part before anyone notices, and on a finishing pass can turn a nearly complete workpiece into a stress-relief exercise for the operator. The economics of tool life management are therefore not about saving inserts; they are about making failure predictable.

That distinction shapes everything below. A tool life system is not a timer that stops a tool after a set number of minutes. It is a model of how a specific tool behaves in a specific material on a specific machine, updated by evidence.

## Wear mechanisms and what each one asks you to change

| Wear mode | Appearance | What it responds to | The fix |
|---|---|---|---|
| Flank wear | Uniform wear land on the clearance face | Cutting speed, abrasiveness | Reduce speed, or accept and plan for it |
| Crater wear | Crater on the rake face, away from the edge | Cutting temperature, speed | Coolant strategy, coating grade |
| Notch wear | Localised grooving at depth-of-cut line | Work-hardened surface, oxidation | Vary depth of cut between passes |
| Chipping / micro-breakage | Ragged edge, irregular | Interrupted cuts, runout, unstable setup | Rigidity, runout, edge preparation |
| Built-up edge | Welded work material on the edge | Low speed with ductile materials | Raise speed, improve coolant delivery |
| Thermal cracking | Comb pattern perpendicular to the edge | Intermittent cooling (dry/wet cycling) | Consistent coolant, avoid interrupted flood |

Most "premature tool failure" reports resolve to one of three causes: tool holder runout (TIR above about 20 µm shortens life dramatically), coolant that is aimed anywhere but the cutting zone, or a speed chosen from a catalogue chart without adjusting for the machine's actual rigidity.

## Life criteria: what counts as "worn out"

Standards work with measurable criteria rather than shop-floor judgement:

- **ISO 8688** (milling) defines tool life end points — typically an average flank wear land of 0.3 mm, or localised wear of 0.5 mm on carbide, or a specified increase in cutting force.
- **ISO 3685** (single-point turning) uses a similar approach with flank wear criteria tied to tolerance and surface finish rather than absolute values.

The practical version of this on a shop floor is simpler: a tool is spent when the part stops meeting specification. That is a legitimate criterion, but it has to be measured, not guessed. Which means:

1. Pick the criterion — surface roughness, bore size, or a wear land measured under a toolmaker's microscope.
2. Establish the life at one cutting condition, varying one parameter at a time.
3. Fit a Taylor-style relation (v·Tⁿ = C) so you can predict life at other speeds instead of re-testing.

Without that baseline, a "tool life" number in the control is just an opinion with a decimal point.

## What tool life management does inside the control

Both major control families implement tool life management, and both work on the same principle: each tool has a life allowance, consumption is counted, and when the allowance runs out the control acts.

![Engineering diagram of a four stage CNC tool life management loop with tool life counters and sister tool switching, plus three tiers of breakage detection: cycle end probing, spindle load signature and acoustic emission, and a warning about tools broken while the spindle was stopped](/media/2026/11/diagram-cnc-tool-life-management-wear-monitoring-sister-tools-guide.png "Figure 1: The tool life management loop, three breakage detection tiers and the stopped-spindle failure mode that only probing catches.")

**FANUC tool life management** counts either usage time or number of cycles per tool, held in tool groups. When a tool expires, the control automatically switches to the next tool in the group (the sister tool), and raises an interface signal that the ladder program can use to stop the cycle or request a replacement. Life counters can be programmed to be reset per tool change, per part, or manually.

**SINUMERIK tool management** works with a tool table that carries wear values and a monitoring type — by workpiece count, by machining time, or by a monitored wear quantity — plus magazine place logic. It supports sister-tool groups and can pre-select the replacement while the current tool is still cutting.

The failure mode of both systems is the same: **the counters are only as good as the life figure that was entered once and never reviewed.** A tool life system that runs on stale numbers gives a false sense of control, and worse, it hides real problems, because a tool that is quietly degrading never triggers anything.

Practical countermeasures:

- **Feed the counters with measured life, not catalogue life.** Set the initial value at 70–80% of the measured mean life and observe how often the sister tool actually gets called.
- **Log every sister-tool change with timestamp and part count.** A rising replacement rate at constant conditions is the earliest signal of a spindle, coolant or holder problem.
- **Re-baseline after any change to speed, feed, material supplier or coolant concentration.** Those changes move tool life more than the control's counting strategy does.

## Breakage detection: three levels of sophistication

A broken tool must be detected before the next feature is cut. Detection options, in order of cost:

**1. Cycle-end probing.** Touch off the tool on a probe or a fixed reference and compare the measured length against the stored value. Catches a fully broken or pulled-out tool with high reliability, costs one probe cycle per tool, and requires nothing beyond the machine's existing probe.

**2. Spindle load monitoring.** The drive already reports load; a broken or badly worn tool changes the load signature. Compare the peak or mean load of the current cut against a learned band for that tool and material. This is cheap because it uses existing drive data, and it catches wear as well as breakage — but it needs a learned baseline per tool and per material, otherwise the band is either too wide to catch anything or too narrow to run.

**3. In-process acoustic emission or force sensing.** Sensitive enough to catch micro-chipping and to stop the cycle within milliseconds. Justified on high-value parts, deep-hole work and unattended lights-out machining; overkill for general milling.

For most cells the pragmatic combination is cycle-end probing on critical tools plus load monitoring on roughing tools. The load band should be set from actual cutting data, not from the drive's rated current — see [condition monitoring and predictive maintenance](/blog/predictive-maintenance-vibration-motor-current-analysis) for how to build that baseline from motor current and vibration rather than from single load snapshots.

One warning worth stating plainly: **load monitoring does not detect a tool that broke while the spindle was stopped.** A tool chipped during a tool change or a crash will run with low load and a broken edge until the surface finish gives it away. Only probing or a visual check catches that.

## Sister tools, redundancy and unattended running

A sister-tool strategy is what makes lights-out machining possible: two or more identical tools in the magazine, with the control switching when one expires. Three details decide whether it works:

- **Identical means measured, not nominal.** Two tools of the same part number can differ by 10 µm in length. Sister tools must be measured individually and carry individual length and radius offsets, or every switch produces a step in the part.
- **The spare must be qualified before it is needed.** A sister tool that has never been measured mid-program turns a routine switch into a stop.
- **Wear behaviour must be similar.** If the two tools were ground in different batches, setting the same life figure for both is a guess. Set them individually.

For long unattended runs, also verify that the tool change itself is safe after a power interruption — a machine that resumes mid-tool-change sequence without a controlled recovery is a crash waiting for a power dip. Some of the same recovery discipline applies to the control system as a whole, covered in [PLC scan cycle and determinism](/blog/plc-scan-cycle-determinism-watchdog-timers).

## Cutting data, holders and the machine itself

Three machine-side factors quietly dominate tool life, and none of them appear on a tooling chart:

**Runout.** Measure it with a dial indicator on a clean tool shank at 10 mm from the holder face. Above about 20 µm, one flute does most of the cutting, load per edge rises, and life falls faster than any speed adjustment can compensate.

**Coolant delivery.** Through-spindle coolant at the right pressure does more for tool life in deep pockets than a higher-grade insert. Check concentration weekly; a refractometer costs less than one broken tool.

**Machine rigidity and dynamic behaviour.** Chatter consumes tools. If a tool's life is erratic across otherwise identical parts, look at the stability of the cut before blaming the tool — spindle bearings, drawbar force and axis preload all show up as tool life scatter.

Tool life management is therefore a loop, not a setting: measure life against a criterion, set counters conservatively, log every switch, and re-baseline whenever anything in the process changes. The control can automate the counting, but it cannot know that the material supplier changed.

=== takeaways
Tool life criteria come from ISO 8688 (milling) and ISO 3685 (turning) and are measurable — flank wear land, force increase or specification loss — not shop-floor guesses.
FANUC and SINUMERIK both implement tool life counting and automatic sister-tool switching, but the counters are only as good as the life figure entered, so re-baseline after any process change.
Breakage detection in three tiers: cycle-end probing, spindle load signature monitoring and acoustic emission; none of them reliably catches a tool broken while the spindle was stopped.
Holder runout above roughly 20 µm, poor coolant delivery and machine chatter dominate tool life far more than insert grade selection.

=== faqs
Q: Should tool life counters be set to the measured average life?
A: No. Set them to about 70–80% of the measured mean life so the sister tool is called before the tail of the distribution starts breaking edges. The counter is a safety limit, not a performance target.

Q: Can spindle load monitoring replace tool probing?
A: Only partly. Load monitoring catches a broken or heavily worn tool while it is cutting, and it can catch wear progression. It cannot detect a tool that was chipped while the spindle was stopped, and it needs a learned baseline per tool and material, so probing is still required for critical tools.

Q: Why do two sister tools of the same part number produce different part sizes?
A: Because they differ in measured length and diameter. Each sister tool must be measured individually and carry its own length and radius offsets in the tool table; otherwise every automatic switch introduces a step equal to the difference between the two tools.

Q: Does higher cutting speed always shorten tool life predictably?
A: It follows a Taylor-type relation over a moderate range, but the relation breaks down when the dominant wear mode changes — for example when raising speed moves the failure from flank wear to crater wear or thermal cracking. Test at the speeds you will actually run rather than extrapolating from one data point.

=== sources
ISO 8688-1:1989 — Tool life testing in milling, Part 1: Face milling | https://www.iso.org/standard/16104.html
ISO 3685:1993 — Tool-life testing with single-point turning tools | https://www.iso.org/standard/66379.html
ISO 10791-7:2020 — Test conditions for machining centres, Part 7: Accuracy of finished test pieces | https://www.iso.org/standard/77124.html
