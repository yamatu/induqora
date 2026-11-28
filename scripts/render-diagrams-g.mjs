// Bespoke light-canvas engineering diagrams (Part G: Batch 6 — cutter compensation offset vector,
// CNC program structure & variable scope, chatter stability lobes, servo sizing criteria).
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

function tick(cx, cy, kind) {
  if (kind === "ok") {
    return `<path d="M ${cx - 5} ${cy} L ${cx - 1} ${cy + 5} L ${cx + 6} ${cy - 5}" fill="none" stroke="#059669" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (kind === "no") {
    return `<path d="M ${cx - 5} ${cy - 5} L ${cx + 5} ${cy + 5} M ${cx + 5} ${cy - 5} L ${cx - 5} ${cy + 5}" fill="none" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return `<path d="M ${cx} ${cy - 6} L ${cx + 6} ${cy + 5} L ${cx - 6} ${cy + 5} Z" fill="#d97706"/>`;
}

export function renderDiagramBodyG(d) {
  switch (d.type) {
    // ------------------------------------------------------------------ 1
    case "cutter-comp-offset-vector": {
      // Straight programmed path with tool centre offset above it (G41, travel +X).
      const cutY = 392;
      const offY = 348;
      const tool = (cx, cy) =>
        `<circle cx="${cx}" cy="${cy}" r="34" fill="#dbeafe" fill-opacity="0.55" stroke="#0b5cad" stroke-width="1.8"/>
         <circle cx="${cx}" cy="${cy}" r="3" fill="#0b5cad"/>`;

      const cases = [
        {
          t: "OUTSIDE CORNER",
          s: "tool swings an arc of radius = D",
          k: "ok",
          draw: `${label(690, 246, "R = D", { size: 9.4, fill: "#059669", mono: true })}`,
        },
        {
          t: "INSIDE CORNER",
          s: "control trims to the offset intersection",
          k: "ok",
          draw: `${label(690, 322, "trim", { size: 9.4, fill: "#0b5cad", mono: true })}`,
        },
        {
          t: "INNER RADIUS BELOW D",
          s: "no valid solution: alarm, or uncut stock",
          k: "no",
          draw: `${label(690, 398, "impossible", { size: 9.4, fill: "#dc2626", mono: true })}`,
        },
      ];

      const caseBlocks = cases
        .map((c, i) => {
          const y = 214 + i * 84;
          return `
            <rect x="678" y="${y}" width="106" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
            <path d="M 706 ${y + 46} L 706 ${y + 20} L 756 ${y + 20}" fill="none" stroke="${c.k === "no" ? "#dc2626" : "#0b5cad"}" stroke-width="2.2" stroke-linecap="round"/>
            ${c.draw}
            ${tick(768, y + 32, c.k)}
            ${label(800, y + 22, c.t, { size: 11, fill: "#0f172a", weight: "bold" })}
            ${label(800, y + 40, c.s, { size: 9.6, fill: "#64748b" })}
            ${label(800, y + 56, ["arc of tool radius", "trimmed, may return early", "gouge or interference alarm"][i], { size: 9.2, fill: c.k === "no" ? "#dc2626" : "#475569", mono: true })}
          `;
        })
        .join("");

      return `
        <!-- Left: offset vector construction -->
        ${box(44, 108, 588, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Programmed part edge vs tool centre path", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Inside G41/G42 the coordinates describe the part; the control moves the tool centre elsewhere.", { size: 10.4, fill: "#64748b" })}

        <rect x="76" y="186" width="524" height="250" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
        ${label(92, 208, "G41 · travel +X · D = tool radius", { size: 10.2, fill: "#64748b", mono: true })}

        <!-- programmed path -->
        <path d="M 110 ${cutY} L 500 ${cutY}" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-dasharray="9 6"/>
        ${label(504, cutY + 4, "programmed", { size: 9.6, fill: "#0f172a", weight: "bold" })}
        ${label(504, cutY + 18, "part edge", { size: 9.6, fill: "#0f172a", weight: "bold" })}

        <!-- offset path -->
        <path d="M 110 ${offY} L 500 ${offY}" fill="none" stroke="#0b5cad" stroke-width="2.2"/>
        ${label(504, offY + 4, "tool centre", { size: 9.6, fill: "#0b5cad", weight: "bold" })}
        ${label(504, offY + 18, "path", { size: 9.6, fill: "#0b5cad", weight: "bold" })}

        ${tool(180, offY)}
        ${tool(320, offY)}

        <!-- offset arrow -->
        <line x1="250" y1="${cutY - 2}" x2="250" y2="${offY + 4}" stroke="#dc2626" stroke-width="2" marker-end="url(#arrRed)"/>
        ${label(256, 372, "offset = D (normal to travel)", { size: 9.6, fill: "#dc2626", mono: true })}

        <!-- lead-in -->
        <path d="M 110 ${offY} L 62 ${offY + 40} L 40 ${offY + 40}" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrGreen)"/>
        ${label(96, 424, "lead-in ≥ 1 × D", { size: 9.8, fill: "#059669", mono: true, weight: "bold" })}

        <rect x="76" y="448" width="524" height="104" rx="8" fill="#eff6ff" stroke="#0b5cad"/>
        ${label(96, 474, "The D register holds a RADIUS or a DIAMETER depending on a machine parameter", { size: 11, fill: "#0b5cad", weight: "bold" })}
        ${label(96, 492, "that is not visible on the offset screen. Set it wrong and every part is offset by one radius:", { size: 10.2, fill: "#1e293b" })}
        ${label(96, 512, "correct on every job, or consistently oversize, or consistently gouged.", { size: 10.2, fill: "#1e293b" })}
        ${label(96, 536, "Settle it once per machine: cut a slot, measure the width, compare with 2 × D.", { size: 10, fill: "#059669", weight: "bold" })}

        <!-- Right: corner cases -->
        ${box(656, 108, 496, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(678, 136, "What the control must decide at every corner", { size: 13.6, fill: "#0f172a", weight: "bold" })}
        ${label(678, 156, "Straight sections are trivial; corners and short segments are where parts are lost.", { size: 9.8, fill: "#64748b" })}
        ${caseBlocks}

        <rect x="678" y="470" width="452" height="76" rx="8" fill="#fef2f2" stroke="#dc2626"/>
        ${label(696, 494, "Compensation is the only common modal feature where the control", { size: 10.4, fill: "#991b1b", weight: "bold" })}
        ${label(696, 510, "generates motion the program does not contain.", { size: 10.4, fill: "#991b1b", weight: "bold" })}
        ${label(696, 530, "That is why a program verified with an old setup can gouge on a new one.", { size: 9.6, fill: "#7f1d1d" })}
      `;
    }

    // ------------------------------------------------------------------ 2
    case "cnc-program-structure-scope": {
      const nodes = [
        { x: 96, y: 196, w: 250, h: 46, t: "O0001  MAIN PROGRAM", s: "safety block · per-tool sections · return", c: "#0f172a", f: "#ffffff" },
        { x: 156, y: 276, w: 230, h: 46, t: "M98 P1001  L6", s: "feature subprogram, called 6×", c: "#0b5cad", f: "#eff6ff" },
        { x: 156, y: 356, w: 230, h: 46, t: "G65 P9010 A50. B30.", s: "macro call, args → #1 #2", c: "#059669", f: "#ecfdf5" },
        { x: 216, y: 436, w: 200, h: 46, t: "O9020  nested", s: "depth 4 max on FANUC", c: "#d97706", f: "#fffbeb" },
      ];

      const nodeBlocks = nodes
        .map(
          (n) => `
          <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="7" fill="${n.f}" stroke="${n.c}" stroke-width="1.8"/>
          ${label(n.x + 14, n.y + 20, n.t, { size: 11.4, fill: n.c, mono: true, weight: "bold" })}
          ${label(n.x + 14, n.y + 36, n.s, { size: 9.4, fill: "#64748b" })}
        `
        )
        .join("");

      const scope = [
        { r: "#1 – #33", t: "Local", b: "cleared on M99 / G65 return", tone: "#059669" },
        { r: "#100 – #199", t: "Common, volatile", b: "shared, cleared at power-off", tone: "#d97706" },
        { r: "#500 – #999", t: "Common, persistent", b: "shared, survives power-off", tone: "#dc2626" },
        { r: "#1000 +", t: "System", b: "machine state — not scratch space", tone: "#64748b" },
      ];

      const scopeRows = scope
        .map((s, i) => {
          const y = 202 + i * 42;
          return `
            <rect x="678" y="${y}" width="452" height="34" rx="5" fill="${i % 2 ? "#f8fafc" : "#ffffff"}" stroke="#eef2f7"/>
            ${label(692, y + 21, s.r, { size: 10.2, fill: s.tone, mono: true, weight: "bold" })}
            ${label(796, y + 21, s.t, { size: 10.4, fill: "#0f172a", weight: "bold" })}
            ${label(906, y + 21, s.b, { size: 9.4, fill: "#475569" })}
          `;
        })
        .join("");

      const neutral = [
        "G40 compensation cancelled",
        "G80 canned cycle cancelled",
        "G90 distance mode restored",
        "work offset + G43 re-established",
      ]
        .map((t, i) => {
          const y = 400 + i * 26;
          return `${tick(690, y - 4, "ok")}${label(706, y, t, { size: 10, fill: "#334155" })}`;
        })
        .join("");

      return `
        <!-- Left: call structure -->
        ${box(44, 108, 588, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "A structured program is a call tree, not a list", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Each level owns one decision; a change to a pocket lives in one file.", { size: 10.4, fill: "#64748b" })}

        <path d="M 221 242 L 221 ${266} L 271 ${266} L 271 274" fill="none" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrDark)"/>
        <path d="M 221 322 L 221 ${346} L 271 ${346} L 271 354" fill="none" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrDark)"/>
        <path d="M 271 402 L 271 ${426} L 316 ${426} L 316 434" fill="none" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrDark)"/>
        ${nodeBlocks}

        <rect x="66" y="500" width="544" height="52" rx="8" fill="#fef2f2" stroke="#dc2626"/>
        ${label(84, 522, "A subprogram inherits modal state and leaves behind what it changes.", { size: 10.4, fill: "#991b1b", weight: "bold" })}
        ${label(84, 540, "Every routine must be state-neutral on exit, or the caller's next block is wrong.", { size: 9.8, fill: "#7f1d1d" })}

        <!-- Right top: variable scope -->
        ${box(656, 108, 496, 232, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(678, 136, "Macro variable scope decides what a value affects", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${label(678, 156, "Number range is the only thing separating scratch space from global state.", { size: 9.8, fill: "#64748b" })}
        ${scopeRows}
        ${label(678, 378, "Undocumented persistent variables are a future mystery: allocate them in a header comment.", { size: 9.4, fill: "#d97706", weight: "bold" })}

        <!-- Right bottom: state neutrality -->
        ${box(656, 396, 496, 172, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(678, 424, "The four things a subprogram must restore", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${neutral}
        ${label(678, 540, "Test persistent values before use: IF [[#500 GT 200] AND [#500 LT 400]] …", { size: 9, fill: "#475569", mono: true })}
      `;
    }

    // ------------------------------------------------------------------ 3
    case "chatter-stability-lobes": {
      const lobeCurve = "M 118 424 Q 160 300 231 265 Q 255 300 276 388 Q 300 270 360 244 Q 400 300 434 358 Q 480 270 583 226";

      const mech = [
        { t: "FORCED", sig: "freq = spindle or tooth passing", dep: "independent of depth", tone: "#0b5cad", fix: "balance, holder, insert, drive" },
        { t: "REGENERATIVE", sig: "freq = structural natural mode", dep: "grows with depth & ae", tone: "#dc2626", fix: "spindle speed, ae, overhang" },
        { t: "MODE COUPLING", sig: "slender tool, low ae pocketing", dep: "overhang dominated", tone: "#d97706", fix: "shorten overhang, stiffer holder" },
      ];

      const mechRows = mech
        .map((m, i) => {
          const y = 200 + i * 66;
          return `
            <rect x="678" y="${y}" width="452" height="56" rx="7" fill="#ffffff" stroke="${m.tone}" stroke-width="1.5"/>
            <rect x="678" y="${y}" width="5" height="56" rx="2" fill="${m.tone}"/>
            ${label(694, y + 20, m.t, { size: 10.6, fill: m.tone, weight: "bold" })}
            ${label(694, y + 36, m.sig, { size: 9.2, fill: "#334155", mono: true })}
            ${label(694, y + 49, m.dep, { size: 9.2, fill: "#64748b" })}
            ${label(1116, y + 20, m.fix, { size: 8.8, fill: "#475569", anchor: "end" })}
          `;
        })
        .join("");

      const fixes = [
        "Change spindle speed ±15–20% to leave the resonance",
        "Reduce radial engagement, keep depth (or HEM the reverse)",
        "Shorten overhang — stiffness falls with cube of length",
        "Hydraulic / shrink-fit holder over collet at same length",
        "Variable pitch breaks the tooth-passing periodicity",
        "Servo tuning last: fixes loop wobble, not cutting chatter",
      ]
        .map((t, i) => {
          const y = 430 + i * 24;
          return `
            <circle cx="690" cy="${y - 4}" r="3.4" fill="${i < 3 ? "#dc2626" : "#94a3b8"}"/>
            ${label(706, y, t, { size: 9.6, fill: i < 3 ? "#1e293b" : "#475569", weight: i < 3 ? "bold" : "normal" })}
          `;
        })
        .join("");

      return `
        <!-- Left: stability lobe diagram -->
        ${box(44, 108, 600, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Stability lobe diagram: depth of cut against spindle speed", { size: 13.6, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Above the curve the cut is unstable. Between the lobes lie pockets of high-depth stability.", { size: 10, fill: "#64748b" })}

        <rect x="100" y="200" width="520" height="260" fill="#fef2f2" fill-opacity="0.55" stroke="none"/>
        <path d="${lobeCurve} L 583 460 L 118 460 Z" fill="#ecfdf5" fill-opacity="0.9" stroke="none"/>
        <path d="${lobeCurve}" fill="none" stroke="#0f172a" stroke-width="2.6"/>

        <line x1="100" y1="460" x2="620" y2="460" stroke="#475569" stroke-width="1.8"/>
        <line x1="100" y1="200" x2="100" y2="460" stroke="#475569" stroke-width="1.8"/>
        ${label(616, 480, "spindle speed (rpm)", { size: 9.8, fill: "#475569", anchor: "end" })}
        ${label(96, 196, "depth of cut (mm)", { size: 9.8, fill: "#475569" })}

        ${label(104, 478, "2k", { size: 9, fill: "#64748b", mono: true })}
        ${label(276, 478, "6k", { size: 9, fill: "#64748b", mono: true })}
        ${label(434, 478, "11k", { size: 9, fill: "#64748b", mono: true })}
        ${label(600, 478, "16k", { size: 9, fill: "#64748b", mono: true })}

        ${label(96, 440, "0", { size: 9, fill: "#64748b", mono: true, anchor: "end" })}
        ${label(96, 320, "4", { size: 9, fill: "#64748b", mono: true, anchor: "end" })}
        ${label(96, 205, "8", { size: 9, fill: "#64748b", mono: true, anchor: "end" })}

        ${label(150, 232, "UNSTABLE", { size: 11, fill: "#dc2626", weight: "bold" })}
        ${label(236, 300, "chatter", { size: 9.4, fill: "#991b1b", mono: true })}
        ${label(200, 442, "STABLE", { size: 11, fill: "#059669", weight: "bold" })}

        <circle cx="231" cy="265" r="4.6" fill="#059669"/>
        ${label(238, 260, "lobe peak", { size: 9, fill: "#059669", weight: "bold" })}
        <circle cx="360" cy="244" r="4.6" fill="#059669"/>
        <circle cx="118" cy="424" r="4.6" fill="#dc2626"/>
        ${label(104, 400, "limiting depth", { size: 9, fill: "#dc2626", weight: "bold" })}
        ${label(104, 388, "cannot be exceeded", { size: 8.6, fill: "#991b1b" })}

        <rect x="66" y="496" width="556" height="56" rx="8" fill="#eff6ff" stroke="#0b5cad"/>
        ${label(84, 518, "Slowing down usually moves tooth-passing frequency INTO the resonance.", { size: 10.4, fill: "#0b5cad", weight: "bold" })}
        ${label(84, 536, "The diagram is valid per setup: every holder, overhang or fixturing change moves it.", { size: 9.6, fill: "#1e293b" })}

        <!-- Right top: mechanisms -->
        ${box(672, 108, 480, 260, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(694, 136, "Three mechanisms, three different fixes", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${label(694, 156, "Measure the frequency before changing a parameter.", { size: 9.8, fill: "#64748b" })}
        ${mechRows}

        <!-- Right bottom: fix order -->
        ${box(672, 388, 480, 180, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(694, 414, "Fix in this order of return", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${fixes}
      `;
    }

    // ------------------------------------------------------------------ 4
    case "servo-sizing-three-criteria": {
      // torque/speed plot: x = 100..540 maps 0..6000 rpm, y = 440..180 maps 0..100 %
      const baseX = 247;
      const peakPath = `M 100 220 L ${baseX} 220 Q 380 250 540 367`;
      const contPath = `M 100 341 L ${baseX} 341 Q 380 372 540 407`;

      const criteria = [
        { n: "1", t: "CONTINUOUS TORQUE", s: "RMS over worst cycle × ambient derating", k: "ok" },
        { n: "2", t: "PEAK TORQUE", s: "accel & reversal vs drive overload duration", k: "ok" },
        { n: "3", t: "SPEED AT MAX FEED", s: "feed / lead — torque above base speed", k: "warn" },
      ];

      const critRows = criteria
        .map((c, i) => {
          const y = 200 + i * 62;
          return `
            <rect x="648" y="${y}" width="500" height="52" rx="7" fill="#ffffff" stroke="#e2e8f0"/>
            <circle cx="672" cy="${y + 26}" r="12" fill="#0f172a"/>
            ${label(672, y + 30, c.n, { size: 11.4, fill: "#ffffff", weight: "bold", anchor: "middle", mono: true })}
            ${label(694, y + 21, c.t, { size: 10.6, fill: "#0f172a", weight: "bold" })}
            ${label(694, y + 39, c.s, { size: 9.4, fill: "#64748b" })}
            ${tick(1120, y + 26, c.k)}
          `;
        })
        .join("");

      const ratio = [
        { t: "high-accuracy positioning", v: "3:1 – 5:1" },
        { t: "general CNC feed axis", v: "5:1 – 10:1" },
        { t: "high-dynamic pick & place", v: "2:1 – 5:1" },
        { t: "geared axis (at motor shaft)", v: "≤ 10:1" },
      ];

      const ratioRows = ratio
        .map((r, i) => {
          const y = 404 + i * 30;
          return `
            <rect x="664" y="${y}" width="470" height="24" rx="4" fill="${i % 2 ? "#f8fafc" : "#ffffff"}" stroke="#eef2f7"/>
            ${label(676, y + 16, r.t, { size: 9.6, fill: "#334155" })}
            ${label(1122, y + 16, r.v, { size: 9.6, fill: "#0b5cad", mono: true, weight: "bold", anchor: "end" })}
          `;
        })
        .join("");

      return `
        <!-- Left: torque speed curve -->
        ${box(44, 108, 584, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Available torque against speed, and the base-speed pivot", { size: 13.6, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Below base speed torque is constant; above it power is constant and torque falls.", { size: 10, fill: "#64748b" })}

        <line x1="100" y1="440" x2="540" y2="440" stroke="#475569" stroke-width="1.8"/>
        <line x1="100" y1="180" x2="100" y2="440" stroke="#475569" stroke-width="1.8"/>
        ${label(536, 460, "speed (rpm)", { size: 9.8, fill: "#475569", anchor: "end" })}
        ${label(96, 176, "torque (% of continuous)", { size: 9.8, fill: "#475569" })}

        ${label(96, 444, "0", { size: 9, fill: "#64748b", mono: true, anchor: "end" })}
        ${label(baseX, 444, "base", { size: 9, fill: "#0f172a", mono: true, weight: "bold", anchor: "middle" })}
        ${label(536, 444, "6k", { size: 9, fill: "#64748b", mono: true, anchor: "end" })}

        <path d="${peakPath}" fill="none" stroke="#dc2626" stroke-width="2.4"/>
        <path d="${contPath}" fill="none" stroke="#059669" stroke-width="2.4"/>
        ${label(300, 240, "peak (2–3 s)", { size: 9.8, fill: "#dc2626", weight: "bold", mono: true })}
        ${label(300, 330, "continuous (thermal)", { size: 9.8, fill: "#059669", weight: "bold", mono: true })}

        <line x1="${baseX}" y1="180" x2="${baseX}" y2="440" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="6 5"/>
        ${label(baseX + 8, 196, "constant torque | constant power", { size: 9, fill: "#64748b" })}

        <rect x="176" y="352" width="300" height="26" rx="4" fill="#f0fdf4" fill-opacity="0.0"/>
        ${label(120, 402, "tapping / large drilling", { size: 9.2, fill: "#0b5cad", mono: true })}
        ${label(360, 402, "high-speed finishing", { size: 9.2, fill: "#0b5cad", mono: true })}
        <line x1="120" y1="410" x2="230" y2="410" stroke="#0b5cad" stroke-width="1.4"/>
        <line x1="360" y1="410" x2="500" y2="410" stroke="#0b5cad" stroke-width="1.4"/>

        <rect x="66" y="478" width="540" height="74" rx="8" fill="#fef2f2" stroke="#dc2626"/>
        ${label(84, 500, "Catalogue rated power is measured at maximum speed, cold.", { size: 10.4, fill: "#991b1b", weight: "bold" })}
        ${label(84, 518, "Sizing on rated power alone under-sizes low-speed torque — the tap, drill and face mill case.", { size: 9.6, fill: "#7f1d1d" })}
        ${label(84, 538, "Specify torque at the lowest cutting speed and power at the highest, separately.", { size: 9.6, fill: "#1e293b", weight: "bold" })}

        <!-- Right top: three criteria -->
        ${box(628, 108, 524, 268, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(650, 136, "All three must pass, not two", { size: 13.6, fill: "#0f172a", weight: "bold" })}
        ${label(650, 156, "Each one fails late, in production, under a condition not on the sizing sheet.", { size: 9.8, fill: "#64748b" })}
        ${critRows}
        ${label(650, 366, "A drive current limit is often reached before the motor's peak torque rating.", { size: 9.2, fill: "#d97706", weight: "bold" })}

        <!-- Right bottom: inertia ratio -->
        ${box(628, 388, 524, 180, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(650, 414, "Inertia ratio: load ÷ rotor, referred to the motor shaft", { size: 12.8, fill: "#0f172a", weight: "bold" })}
        ${ratioRows}
        ${label(664, 552, "Screw inertia ∝ diameter⁴: 25 → 32 mm is 2.7× the inertia of the same length.", { size: 9, fill: "#dc2626", weight: "bold" })}
      `;
    }

    default:
      return null;
  }
}
