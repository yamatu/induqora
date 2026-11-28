// Bespoke light-canvas engineering diagrams (Part E: Batch 4 — CNC accuracy budget, tool life loop,
// five-axis RTCP kinematics, look-ahead velocity planning).
// Canvas working area inside diagram frame: x=36..1164, y=104..576

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function box(x, y, w, h, { fill = "#ffffff", stroke = "#cbd5e1", sw = 1.6, rx = 10 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function label(x, y, t, o = {}) {
  const { size = 12, fill = "#334155", weight = "normal", anchor = "start", mono = false } = o;
  const fam = mono ? MONO : SANS;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${fam}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${t}</text>`;
}

export function renderDiagramBodyE(d) {
  switch (d.type) {
    case "cnc-accuracy-error-budget": {
      const budget = [
        { name: "Ballscrew backlash", lo: 5, hi: 40, color: "#dc2626", tag: "Compensable" },
        { name: "Screw pitch error", lo: 10, hi: 30, color: "#d97706", tag: "Compensable" },
        { name: "Thermal growth", lo: 20, hi: 80, color: "#0b5cad", tag: "Partly" },
        { name: "Squareness / straightness", lo: 5, hi: 20, color: "#7c3aed", tag: "Not compensable" },
        { name: "Servo gain mismatch", lo: 2, hi: 20, color: "#059669", tag: "Tuning" },
      ];
      const X0 = 296;
      const SCALE = 200 / 80;
      return `
        <!-- Left: error budget bars -->
        ${box(44, 108, 540, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Positioning error budget — typical vertical machining centre", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Bar spans the working range encountered in service, not the new-machine spec.", { size: 11, fill: "#64748b" })}

        <!-- Axis ticks -->
        ${[0, 20, 40, 60, 80].map((v) => `
          <line x1="${X0 + v * SCALE}" y1="172" x2="${X0 + v * SCALE}" y2="452" stroke="#e2e8f0" stroke-width="1"/>
          ${label(X0 + v * SCALE, 466, `${v}`, { size: 10, fill: "#94a3b8", anchor: "middle", mono: true })}
        `).join("")}
        ${label(X0 + 40 * SCALE, 484, "µm of positional error", { size: 10.5, fill: "#64748b", anchor: "middle" })}

        ${budget.map((b, i) => {
          const y = 186 + i * 50;
          return `
            <rect x="${X0}" y="${y}" width="${200}" height="22" rx="4" fill="#f1f5f9"/>
            <rect x="${X0 + b.lo * SCALE}" y="${y}" width="${Math.max((b.hi - b.lo) * SCALE, 3)}" height="22" rx="4" fill="${b.color}" opacity="0.88"/>
            ${label(66, y + 11, b.name, { size: 12, fill: "#1e293b", weight: "bold" })}
            ${label(66, y + 26, b.tag, { size: 10, fill: b.color, mono: true })}
            ${label(X0 + b.hi * SCALE + 8, y + 16, `${b.lo}–${b.hi}`, { size: 10.5, fill: "#475569", mono: true })}
          `;
        }).join("")}

        <rect x="66" y="506" width="496" height="42" rx="7" fill="#eff6ff" stroke="#0b5cad"/>
        ${label(84, 532, "Thermal growth alone can exceed the whole mechanical error budget —", { size: 11.2, fill: "#0b5cad", weight: "bold" })}
        ${label(84, 546, "which is why a cold-calibrated machine drifts out of tolerance by afternoon.", { size: 11.2, fill: "#475569" })}

        <!-- Right top: ballbar signatures -->
        ${box(600, 108, 556, 214, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(622, 136, "Circular test signatures (ballbar, ISO 230-4)", { size: 14, fill: "#0f172a", weight: "bold" })}

        <path d="M 700 190 A 40 40 0 0 0 700 270 M 706 184 A 40 40 0 0 1 706 264" fill="none" stroke="#dc2626" stroke-width="2.6"/>
        ${label(703, 292, "Step at quadrants", { size: 10.5, fill: "#991b1b", anchor: "middle", weight: "bold" })}
        ${label(703, 306, "backlash", { size: 10, fill: "#64748b", anchor: "middle", mono: true })}

        <ellipse cx="878" cy="230" rx="42" ry="29" transform="rotate(45 878 230)" fill="none" stroke="#059669" stroke-width="2.6"/>
        ${label(878, 292, "45° ellipse", { size: 10.5, fill: "#047857", anchor: "middle", weight: "bold" })}
        ${label(878, 306, "gain mismatch", { size: 10, fill: "#64748b", anchor: "middle", mono: true })}

        <path d="M 1014 230 Q 1014 188 1056 188 Q 1098 188 1098 230 Q 1098 272 1056 272 Q 1014 272 1014 230" fill="none" stroke="#7c3aed" stroke-width="2.6"/>
        ${label(1056, 292, "Flat-sided oval", { size: 10.5, fill: "#6d28d9", anchor: "middle", weight: "bold" })}
        ${label(1056, 306, "squareness", { size: 10, fill: "#64748b", anchor: "middle", mono: true })}

        <!-- Right bottom: allowed / not allowed -->
        ${box(600, 340, 556, 228, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(622, 368, "What the control can hide, and what it cannot", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${[
          { y: 388, ok: "✓", c: "#059669", t: "Backlash / reversal error", s: "Reversal compensation at each direction change" },
          { y: 430, ok: "✓", c: "#059669", t: "Pitch (lead) error", s: "Lookup table anchored to the reference point" },
          { y: 472, ok: "±", c: "#d97706", t: "Thermal growth", s: "Only with sensors and a fitted model" },
          { y: 514, ok: "✗", c: "#dc2626", t: "Squareness, stick-slip, loose preload", s: "Mechanical — compensation only hides it" },
        ].map((r) => `
          ${label(624, r.y + 16, r.ok, { size: 17, fill: r.c, weight: "bold" })}
          ${label(650, r.y + 12, r.t, { size: 12, fill: "#1e293b", weight: "bold" })}
          ${label(650, r.y + 27, r.s, { size: 10.8, fill: "#64748b" })}
        `).join("")}
      `;
    }

    case "cnc-tool-life-loop": {
      const stages = [
        { t: "1 · MEASURE LIFE", s: "ISO 8688 / 3685 criterion: wear land, force or spec loss", c: "#0b5cad" },
        { t: "2 · SET THE COUNTER", s: "70–80% of measured mean life — a safety limit, not a target", c: "#059669" },
        { t: "3 · CONSUME & LOG", s: "Time or cycles per tool; log every sister-tool call with timestamp", c: "#d97706" },
        { t: "4 · SWITCH SISTER TOOL", s: "Control swaps tool, signals ladder, requests replacement", c: "#7c3aed" },
      ];
      return `
        <!-- Left: control loop -->
        ${box(44, 108, 540, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Tool life management is a loop, not a setting", { size: 14, fill: "#0f172a", weight: "bold" })}

        ${stages.map((s, i) => {
          const y = 156 + i * 88;
          return `
            ${box(78, y, 484, 68, { fill: "#f8fafc", stroke: s.c, sw: 1.6 })}
            <rect x="78" y="${y}" width="6" height="68" rx="3" fill="${s.c}"/>
            ${label(98, y + 26, s.t, { size: 12.5, fill: s.c, weight: "bold", mono: true })}
            ${label(98, y + 46, s.s, { size: 10.8, fill: "#475569" })}
            ${i < 3 ? `<line x1="320" y1="${y + 70}" x2="320" y2="${y + 86}" stroke="#475569" stroke-width="2" marker-end="url(#arrDark)"/>` : ""}
          `;
        }).join("")}

        <path d="M 60 502 L 60 190 L 72 190" fill="none" stroke="#0b5cad" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arrBlue)"/>
        ${label(80, 514, "re-baseline after any process change", { size: 10, fill: "#0b5cad", mono: true })}

        <!-- Right: detection tiers -->
        ${box(600, 108, 556, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(622, 136, "Breakage detection: three tiers of effort", { size: 14, fill: "#0f172a", weight: "bold" })}

        ${[
          { y: 152, n: "TIER 1", t: "Cycle-end probing", s: "Length check against stored value. Reliable, costs one cycle per tool.", c: "#059669" },
          { y: 244, n: "TIER 2", t: "Spindle load signature", s: "Uses existing drive data. Catches wear too — needs a learned band per tool.", c: "#d97706" },
          { y: 336, n: "TIER 3", t: "Acoustic emission / force", s: "Millisecond response. For high-value parts and lights-out machining.", c: "#0b5cad" },
        ].map((t) => `
          ${box(622, t.y, 512, 84, { fill: "#f8fafc", stroke: t.c, sw: 1.6 })}
          <rect x="622" y="${t.y + 20}" width="62" height="24" rx="5" fill="${t.c}"/>
          ${label(653, t.y + 36, t.n, { size: 10, fill: "#ffffff", anchor: "middle", weight: "bold", mono: true })}
          ${label(696, t.y + 26, t.t, { size: 12.5, fill: "#0f172a", weight: "bold" })}
          ${label(696, t.y + 48, t.s, { size: 10.6, fill: "#475569" })}
        `).join("")}

        <rect x="622" y="436" width="512" height="112" rx="8" fill="#fef2f2" stroke="#dc2626"/>
        ${label(640, 462, "The blind spot every load monitor shares", { size: 12, fill: "#991b1b", weight: "bold" })}
        ${label(640, 484, "A tool chipped while the spindle was stopped runs at low load with a broken edge.", { size: 10.8, fill: "#7f1d1d" })}
        ${label(640, 502, "Only probing or a visual check catches it — no signature analysis will.", { size: 10.8, fill: "#7f1d1d" })}
        ${label(640, 528, "Tiered practice: probe critical tools, load-monitor roughing tools.", { size: 10.8, fill: "#0b5cad", weight: "bold" })}
      `;
    }

    case "five-axis-rtcp-kinematics": {
      return `
        <!-- Left: kinematic chain -->
        ${box(44, 108, 588, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "RTCP: the control moves X/Y/Z so the tool tip stays put", { size: 14, fill: "#0f172a", weight: "bold" })}

        <!-- spindle head -->
        ${box(250, 156, 176, 52, { fill: "#0f172a", stroke: "#0f172a" })}
        ${label(338, 186, "SPINDLE HEAD", { size: 12, fill: "#ffffff", anchor: "middle", weight: "bold", mono: true })}

        <!-- tool shank from head to rotary centre -->
        <line x1="338" y1="208" x2="338" y2="316" stroke="#475569" stroke-width="6"/>
        ${label(350, 250, "tool shank", { size: 10.5, fill: "#64748b" })}

        <!-- rotary centre -->
        <circle cx="338" cy="322" r="11" fill="#ffffff" stroke="#0b5cad" stroke-width="3"/>
        ${label(356, 320, "rotary centre", { size: 11, fill: "#0b5cad", weight: "bold" })}
        ${label(356, 334, "(A / B / C axes meet here)", { size: 10, fill: "#64748b", mono: true })}

        <!-- pivot length dimension -->
        <line x1="196" y1="208" x2="196" y2="322" stroke="#d97706" stroke-width="2" marker-start="url(#arrDark)" marker-end="url(#arrDark)"/>
        ${label(188, 268, "pivot length L", { size: 11, fill: "#b45309", anchor: "end", weight: "bold" })}
        <line x1="200" y1="208" x2="250" y2="208" stroke="#d97706" stroke-width="1.2" stroke-dasharray="4 3"/>
        <line x1="200" y1="322" x2="327" y2="322" stroke="#d97706" stroke-width="1.2" stroke-dasharray="4 3"/>

        <!-- tool past rotary centre down to tip -->
        <line x1="338" y1="333" x2="338" y2="452" stroke="#0b5cad" stroke-width="4"/>
        <path d="M 338 468 L 330 448 L 346 448 Z" fill="#0b5cad"/>
        ${label(352, 462, "tool tip — held on the programmed point", { size: 10.8, fill: "#0b5cad", weight: "bold" })}

        <!-- rotation arcs -->
        <path d="M 400 300 A 62 62 0 0 1 400 352" fill="none" stroke="#7c3aed" stroke-width="2.4" marker-end="url(#arrDark)"/>
        ${label(412, 330, "A rotate", { size: 10.5, fill: "#6d28d9", mono: true })}
        <path d="M 268 350 A 74 74 0 0 0 268 296" fill="none" stroke="#059669" stroke-width="2.4" marker-end="url(#arrGreen)"/>
        ${label(196, 326, "C rotate", { size: 10.5, fill: "#047857", mono: true, anchor: "end" })}

        <!-- tip error callout -->
        <rect x="66" y="484" width="544" height="64" rx="8" fill="#fffbeb" stroke="#d97706"/>
        ${label(84, 508, "Kinematic rule: tip error ≈ L × (angular error)", { size: 12, fill: "#92400e", weight: "bold" })}
        ${label(84, 530, "10 µm of rotary backlash on a 300 mm pivot is 10 µm at the tip — and grows with every mm of tool length.", { size: 10.4, fill: "#78350f" })}

        <!-- Right top: singularity -->
        ${box(660, 108, 496, 208, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(682, 136, "The singularity: geometry, not tuning", { size: 14, fill: "#0f172a", weight: "bold" })}

        <line x1="742" y1="176" x2="742" y2="290" stroke="#475569" stroke-width="2"/>
        <line x1="662" y1="290" x2="1078" y2="290" stroke="#475569" stroke-width="2"/>
        <path d="M 742 176 L 700 286 M 742 176 L 784 286" fill="none" stroke="#fca5a5" stroke-width="1.6" stroke-dasharray="5 4"/>
        <path d="M 742 176 L 718 286 M 742 176 L 766 286" fill="none" stroke="#dc2626" stroke-width="1.4" stroke-dasharray="3 3"/>
        ${label(742, 168, "tool vector // C axis", { size: 10, fill: "#991b1b", anchor: "middle", mono: true })}
        ${label(742, 306, "singular cone (±1–2°)", { size: 10.5, fill: "#991b1b", anchor: "middle", weight: "bold" })}

        ${label(842, 200, "Rotary velocity demand:", { size: 11, fill: "#334155" })}
        <path d="M 842 214 C 900 214, 906 246, 962 258" fill="none" stroke="#dc2626" stroke-width="2.4"/>
        ${label(842, 232, "→ ∞ near the cone", { size: 10.5, fill: "#991b1b", mono: true })}
        ${label(842, 254, "Control clamps → feed collapses →", { size: 10.2, fill: "#475569" })}
        ${label(842, 270, "dwell mark, not an alarm.", { size: 10.2, fill: "#475569" })}
        ${label(842, 288, "Fix in CAM: bias tilt 1–2°.", { size: 10.2, fill: "#0b5cad", weight: "bold" })}

        <!-- Right bottom: post verification -->
        ${box(660, 334, 496, 234, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(682, 362, "Post-processor verification order", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${[
          { y: 376, t: "Kinematic model in simulation", s: "the model itself must use measured pivot data" },
          { y: 418, t: "Rotary-only move at safe height", s: "tip must not move while RTCP is active" },
          { y: 460, t: "Pivot length with dial indicator", s: "rotate 180°, deviation = pivot error" },
          { y: 502, t: "45° test block, probe-checked", s: "costs a scrap block, not a part" },
        ].map((s) => `
          <circle cx="692" cy="${s.y + 8}" r="4" fill="#0b5cad"/>
          ${label(708, s.y + 4, s.t, { size: 11.4, fill: "#1e293b", weight: "bold" })}
          ${label(708, s.y + 18, s.s, { size: 10.2, fill: "#64748b" })}
        `).join("")}
      `;
    }

    case "cnc-lookahead-velocity-profile": {
      return `
        <!-- Top: velocity profile comparison -->
        ${box(44, 108, 1112, 244, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Same program, same drives: exact stop versus look-ahead contouring", { size: 14, fill: "#0f172a", weight: "bold" })}

        <line x1="120" y1="300" x2="1080" y2="300" stroke="#475569" stroke-width="1.6"/>
        <line x1="120" y1="170" x2="120" y2="300" stroke="#475569" stroke-width="1.6"/>
        ${label(112, 174, "v", { size: 11, fill: "#475569", anchor: "end", mono: true })}
        ${label(1084, 304, "path distance / blocks", { size: 10.5, fill: "#475569", anchor: "end" })}

        <!-- exact stop staircase -->
        <polyline points="120,300 150,300 150,196 200,196 200,300 230,300 230,214 280,214 280,300 310,300 310,190 360,190 360,300 390,300 390,220 440,220 440,300 470,300 470,198 520,198 520,300" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="6 4"/>
        ${label(150, 186, "exact stop (G61): zero at every block end", { size: 10.8, fill: "#991b1b", weight: "bold" })}

        <!-- look-ahead smooth profile -->
        <path d="M 560 300 L 590 300 C 610 300 614 208 640 208 C 668 208 672 300 700 300 C 712 300 716 258 734 250 C 756 240 764 300 784 300 C 796 300 800 206 826 206 C 854 206 858 300 886 300 C 898 300 902 244 920 238 C 942 230 950 300 972 300 L 1080 300" fill="none" stroke="#059669" stroke-width="2.8"/>
        ${label(600, 196, "look-ahead contouring (G64 + tolerance)", { size: 10.8, fill: "#047857", weight: "bold" })}
        ${label(600, 210, "never reaches zero — corner speed set by acceleration limit", { size: 10.2, fill: "#475569" })}

        <!-- legend -->
        <rect x="900" y="150" width="240" height="52" rx="7" fill="#f8fafc" stroke="#cbd5e1"/>
        ${label(914, 170, "Feed rate ceiling =", { size: 10.5, fill: "#475569" })}
        ${label(914, 190, "segment length ÷ block time", { size: 11, fill: "#0b5cad", weight: "bold", mono: true })}

        <!-- Bottom left: block processing time -->
        ${box(44, 364, 548, 204, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 392, "Block processing time sets the real feed ceiling", { size: 13.5, fill: "#0f172a", weight: "bold" })}
        ${[
          { y: 406, seg: "1.0 mm segments", t: "1 ms / block", f: "1,000 mm/min", w: 120, c: "#059669" },
          { y: 442, seg: "0.5 mm segments", t: "1 ms / block", f: "500 mm/min", w: 74, c: "#d97706" },
          { y: 478, seg: "0.2 mm segments", t: "1 ms / block", f: "200 mm/min", w: 40, c: "#dc2626" },
        ].map((r) => `
          ${label(66, r.y + 12, r.seg, { size: 11, fill: "#1e293b", weight: "bold" })}
          ${label(196, r.y + 12, r.t, { size: 10.4, fill: "#64748b", mono: true })}
          <rect x="300" y="${r.y}" width="${r.w}" height="18" rx="4" fill="${r.c}" opacity="0.85"/>
          ${label(308 + r.w, r.y + 13, r.f, { size: 11, fill: r.c, weight: "bold", mono: true })}
        `).join("")}
        ${label(66, 526, "Trochoidal and spline paths hit this ceiling long before the drive does.", { size: 10.6, fill: "#475569" })}
        ${label(66, 548, "Shorter segments never raise the ceiling — only faster block processing does.", { size: 10.6, fill: "#0b5cad", weight: "bold" })}

        <!-- Bottom right: corner strategies -->
        ${box(608, 364, 548, 204, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(630, 392, "Corner strategy is a tolerance decision", { size: 13.5, fill: "#0f172a", weight: "bold" })}
        ${[
          { y: 406, c: "#dc2626", t: "Exact stop — G61 / G09", s: "zero at each block end: bores, sharp internal corners" },
          { y: 448, c: "#d97706", t: "Tolerance-banded deceleration", s: "the usable default: rounded only within the band" },
          { y: 490, c: "#059669", t: "Continuous G64 / compressor", s: "full feed, rounding inside permitted deviation" },
        ].map((r) => `
          <rect x="630" y="${r.y}" width="504" height="34" rx="6" fill="#f8fafc" stroke="${r.c}" stroke-width="1.4"/>
          ${label(642, r.y + 15, r.t, { size: 11.2, fill: r.c, weight: "bold" })}
          ${label(642, r.y + 28, r.s, { size: 10.2, fill: "#475569" })}
        `).join("")}
        ${label(630, 546, "Set per operation class against the feature tolerance — never once machine-wide.", { size: 10.6, fill: "#0b5cad", weight: "bold" })}
      `;
    }

    default:
      return null;
  }
}
