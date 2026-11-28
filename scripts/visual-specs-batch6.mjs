// Visual specifications for Batch 6 (4 CNC programming, vibration & servo sizing guides:
// 4 editorial covers 1200x675 JPEG + 4 bespoke engineering diagrams 1200x640 PNG).

export const ARTICLE_VISUALS_BATCH6 = [
  {
    file: "gcode-cutter-radius-compensation-g41-g42-guide.md",
    slug: "gcode-cutter-radius-compensation-g41-g42-guide",
    category: "motion-control-drives",
    cover: {
      kicker: "MOTION CONTROL · ISO 6983",
      titleLine1: "CUTTER RADIUS",
      titleLine2: "COMPENSATION",
      subtitle: "G41 / G42 · Offset Vector · Lead-In Rules · D Register",
      chips: ["G41 G42", "LEAD-IN ≥ 1 × D", "RADIUS OR DIAMETER"],
      motif: "servo-wave",
      accent: "#0b5cad",
      accent2: "#dc2626",
      alt: "Technical editorial illustration of a CNC cutter path offset by tool radius with a lead-in move and the resulting compensated contour",
      caption: "The program describes the part edge; the tool travels somewhere else entirely.",
    },
    diagram: {
      type: "cutter-comp-offset-vector",
      figLabel: "FIG. 1",
      title: "The Cutter Compensation Offset Vector, Corner Geometry & D Register",
      subtitle:
        "Inside G41/G42 the coordinates describe the part — the control computes where the tool centre must travel, and corners are where that computation fails",
      source: "ISO 6983-1:2009 · ISO 10791-7:2020 · FANUC 0i-F Operator's Manual · LinuxCNC G-Code Reference",
      insertAfterH2: "What the control actually computes",
      alt: "Engineering diagram showing a programmed part edge and the offset tool centre path for G41 with an offset equal to the tool radius, a lead-in of at least one tool radius, and three corner cases: an outside corner where the tool swings an arc of tool radius, an inside corner where the control trims to the offset intersection, and an inside radius smaller than the tool radius where no valid solution exists",
      caption:
        "Figure 1: The offset construction, the lead-in that establishes it, and the corner cases where geometry, not the program, decides whether the part is cut.",
    },
  },
  {
    file: "cnc-subprograms-macro-variables-program-structure-guide.md",
    slug: "cnc-subprograms-macro-variables-program-structure-guide",
    category: "motion-control-drives",
    cover: {
      kicker: "MOTION CONTROL · ISO 6983",
      titleLine1: "SUBPROGRAMS &",
      titleLine2: "MACRO VARIABLES",
      subtitle: "M98 / M99 · G65 Arguments · Variable Scope · State Neutrality",
      chips: ["M98 P1001 L6", "4 LEVELS", "#1–#33 LOCAL"],
      motif: "plc-rack",
      accent: "#7c3aed",
      accent2: "#059669",
      alt: "Technical editorial illustration of a CNC program structure diagram showing a main program calling nested subprograms with variable scopes",
      caption: "The program that is easiest to write is rarely the one that is cheapest to change.",
    },
    diagram: {
      type: "cnc-program-structure-scope",
      figLabel: "FIG. 1",
      title: "CNC Program Call Structure and Macro Variable Scope",
      subtitle:
        "Subprograms and macro calls form a tree that shares modal state, while variable number — not intent — decides whether a value is scratch space or global state",
      source: "ISO 6983-1:2009 · FANUC 0i-F Operator's Manual (Custom Macro B) · LinuxCNC G-Code Reference",
      insertAfterH2: "Macro variables: the scope that breaks programs",
      alt: "Engineering diagram of a CNC program call tree from main program through M98 subprogram calls and a G65 macro call with arguments to nested subprograms, beside a table of macro variable ranges showing local variables cleared on return, volatile common variables in the hundreds, persistent common variables in the five hundreds that survive power-off, and system variables, plus the four pieces of modal state a subprogram must restore",
      caption:
        "Figure 1: The call tree that keeps a program editable, and the variable scope that decides whether a value affects one part or every part.",
    },
  },
  {
    file: "cnc-chatter-vibration-suppression-stability-lobes-guide.md",
    slug: "cnc-chatter-vibration-suppression-stability-lobes-guide",
    category: "motion-control-drives",
    cover: {
      kicker: "MOTION CONTROL · ISO 8688",
      titleLine1: "CHATTER &",
      titleLine2: "VIBRATION",
      subtitle: "Stability Lobes · Regenerative vs Forced · Overhang · Radial Engagement",
      chips: ["±15–20% RPM", "ae > ap SENSITIVITY", "STIFFNESS ∝ 1/L³"],
      motif: "oee-analytics",
      accent: "#dc2626",
      accent2: "#0b5cad",
      alt: "Technical editorial illustration of a stability lobe diagram showing stable and unstable pockets across spindle speed with a machining vibration trace",
      caption: "The same tool, the same depth, the same material — and one spindle speed screams while another cuts clean.",
    },
    diagram: {
      type: "chatter-stability-lobes",
      figLabel: "FIG. 1",
      title: "Stability Lobe Diagram, Chatter Mechanisms and Fix Order",
      subtitle:
        "Depth of cut against spindle speed: above the curve the cut is unstable, between the lobes lie pockets of high-depth stability nobody uses",
      source: "ISO 10791-7:2020 · ISO 8688-1:1989 · ISO 3685:1993 · Altintas, Manufacturing Automation",
      insertAfterH2: "Reading a stability lobe diagram",
      alt: "Engineering diagram of a stability lobe diagram plotting depth of cut against spindle speed with a stable region below the curve, lobe peaks marked at 6k and 11k rpm, the limiting depth of cut marked at low speed, and an unstable region above, beside a comparison of forced vibration, regenerative chatter and mode coupling with their signatures and fixes, and a ranked list of six fixes starting with a 15 to 20 percent spindle speed change",
      caption:
        "Figure 1: The diagram that explains why slowing down makes it worse, the three mechanisms behind the same noise, and the fixes in order of return.",
    },
  },
  {
    file: "cnc-spindle-feed-servo-motor-sizing-guide.md",
    slug: "cnc-spindle-feed-servo-motor-sizing-guide",
    category: "motion-control-drives",
    cover: {
      kicker: "MOTION CONTROL · IEC 60034",
      titleLine1: "SERVO SIZING",
      titleLine2: "SPINDLE & FEED",
      subtitle: "RMS Torque · Overload Curve · Inertia Ratio · Base Speed",
      chips: ["3 CRITERIA", "INERTIA 5:1–10:1", "∝ D⁴ SCREW"],
      motif: "torque-curve",
      accent: "#0f172a",
      accent2: "#f59e0b",
      alt: "Technical editorial illustration of a servo motor torque-speed curve with continuous and intermittent regions beside a ball screw axis load diagram",
      caption: "A servo that is large enough for the cut and too small for the acceleration is the most common sizing error in machine design.",
    },
    diagram: {
      type: "servo-sizing-three-criteria",
      figLabel: "FIG. 1",
      title: "Servo Torque–Speed Envelope, Three Sizing Criteria and Inertia Ratio",
      subtitle:
        "Continuous torque is thermal, peak torque is limited by the drive's overload curve, and speed at maximum feed decides whether the axis has torque where it is needed",
      source: "IEC 60034-1:2022 · IEC 61800-5-2:2016 · ISO 10791-2:2015 · FANUC AC Servo specification manuals",
      insertAfterH2: "The three sizing criteria",
      alt: "Engineering diagram plotting servo torque against speed with a continuous thermal curve and a peak curve, a base speed line separating constant torque from constant power, tapping and large drilling marked at low speed and high-speed finishing at high speed, beside the three sizing criteria of continuous RMS torque, peak torque against the drive overload curve and speed at maximum feed, and a table of acceptable inertia ratios from 3 to 1 for high-accuracy positioning up to 10 to 1 for geared axes",
      caption:
        "Figure 1: The envelope the motor must cover, the three checks that must all pass, and the inertia ratio nobody agrees on.",
    },
  },
];
