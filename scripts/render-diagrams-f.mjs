// Bespoke light-canvas engineering diagrams (Part F: Batch 5 — G-code modal state,
// CNC offset chain, fixture locating & clamping distortion, cycle-time composition).
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

export function renderDiagramBodyF(d) {
  switch (d.type) {
    // ------------------------------------------------------------------ 1
    case "gcode-modal-state-groups": {
      const groups = [
        { g: "01", f: "Motion", codes: "G00 G01 G02 G03", after: "G00", tone: "#dc2626" },
        { g: "02", f: "Plane selection", codes: "G17 G18 G19", after: "G17", tone: "#0b5cad" },
        { g: "03", f: "Distance mode", codes: "G90 G91", after: "G90", tone: "#0b5cad" },
        { g: "05", f: "Feed mode", codes: "G94 G95", after: "G94", tone: "#0b5cad" },
        { g: "07", f: "Canned cycle", codes: "G81 G83 G84 G76", after: "cancelled", tone: "#dc2626" },
        { g: "08", f: "Radius comp.", codes: "G40 G41 G42", after: "G40", tone: "#dc2626" },
        { g: "12", f: "Work offset", codes: "G54 – G59", after: "G54", tone: "#dc2626" },
        { g: "13", f: "Path control", codes: "G61 G64", after: "G64 *", tone: "#d97706" },
      ];
      const matrix = [
        { t: "Work offset table (G54–G59)", v: ["ok", "ok", "ok"] },
        { t: "Tool length offset (G43 H)", v: ["no", "no", "warn"] },
        { t: "Motion mode (01)", v: ["no", "no", "warn"] },
        { t: "Cutter radius comp (G41/42)", v: ["no", "no", "no"] },
        { t: "G92 coordinate shift", v: ["ok", "ok", "ok"] },
        { t: "Canned cycle (07)", v: ["no", "no", "warn"] },
      ];

      const groupRows = groups
        .map((r, i) => {
          const y = 206 + i * 38;
          return `
            <rect x="60" y="${y}" width="508" height="30" rx="5" fill="${i % 2 ? "#f8fafc" : "#ffffff"}" stroke="#eef2f7"/>
            ${label(70, y + 19, r.g, { size: 10.5, fill: "#64748b", mono: true, weight: "bold" })}
            ${label(112, y + 19, r.f, { size: 11.4, fill: "#1e293b", weight: "bold" })}
            ${label(268, y + 19, r.codes, { size: 10.4, fill: "#475569", mono: true })}
            ${label(562, y + 19, r.after, { size: 10.8, fill: r.tone, mono: true, weight: "bold", anchor: "end" })}
          `;
        })
        .join("");

      const matrixRows = matrix
        .map((r, i) => {
          const y = 202 + i * 46;
          const marks = r.v.map((k, j) => tick(862 + j * 106, y + 19, k)).join("");
          return `
            <rect x="616" y="${y}" width="524" height="38" rx="5" fill="${i % 2 ? "#f8fafc" : "#ffffff"}" stroke="#eef2f7"/>
            ${label(630, y + 23, r.t, { size: 11, fill: "#1e293b" })}
            ${marks}
          `;
        })
        .join("");

      return `
        <!-- Left: modal groups -->
        ${box(44, 108, 540, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Modal groups: one member active at a time", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Value the control returns to after a reset — not what the program assumed.", { size: 10.6, fill: "#64748b" })}

        <line x1="66" y1="172" x2="562" y2="172" stroke="#e2e8f0" stroke-width="1.4"/>
        ${label(66, 190, "GRP", { size: 9.5, fill: "#94a3b8", mono: true })}
        ${label(112, 190, "FUNCTION", { size: 9.5, fill: "#94a3b8", mono: true })}
        ${label(268, 190, "CODES", { size: 9.5, fill: "#94a3b8", mono: true })}
        ${label(562, 190, "AFTER RESET", { size: 9.5, fill: "#94a3b8", mono: true, anchor: "end" })}

        ${groupRows}

        <rect x="66" y="516" width="496" height="38" rx="7" fill="#eff6ff" stroke="#0b5cad"/>
        ${label(84, 541, "* G64/G61 default is control- and parameter-dependent — verify, do not assume.", { size: 10.6, fill: "#0b5cad", weight: "bold" })}

        <!-- Right: survival matrix -->
        ${box(600, 108, 556, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(622, 136, "What survives an interruption", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(622, 158, "Same event, three different outcomes — why resume behaviour is unpredictable.", { size: 10.6, fill: "#64748b" })}

        ${label(862, 186, "RESET", { size: 10, fill: "#475569", mono: true, weight: "bold", anchor: "middle" })}
        ${label(968, 186, "POWER-OFF", { size: 10, fill: "#475569", mono: true, weight: "bold", anchor: "middle" })}
        ${label(1074, 186, "RESTART", { size: 10, fill: "#475569", mono: true, weight: "bold", anchor: "middle" })}

        ${matrixRows}

        <rect x="616" y="482" width="524" height="72" rx="8" fill="#fef2f2" stroke="#dc2626"/>
        ${label(634, 506, "The restart trap: block search reads codes backwards —", { size: 11.4, fill: "#991b1b", weight: "bold" })}
        ${label(634, 524, "it never executes the G41 approach move that set the compensation geometry,", { size: 10.4, fill: "#7f1d1d" })}
        ${label(634, 540, "so the control vector does not match the real tool position. Restart clean only.", { size: 10.4, fill: "#7f1d1d" })}
      `;
    }

    // ------------------------------------------------------------------ 2
    case "cnc-offset-chain": {
      const chain = [
        { t: "MACHINE ZERO", s: "fixed by scale + reference", c: "#64748b", code: "G53" },
        { t: "WORK OFFSET", s: "part datum, translation (+ rotation)", c: "#0b5cad", code: "G54–G59" },
        { t: "TOOL LENGTH", s: "gauge line to tool tip", c: "#d97706", code: "G43 H" },
        { t: "RADIUS COMP", s: "tool centre to cutting edge", c: "#7c3aed", code: "G41 / G42" },
        { t: "PROGRAMMED POINT", s: "what the part actually sees", c: "#059669", code: "X Y Z" },
      ];
      const stages = [
        { t: "Work offset", s: "G54–G59, G54.1 P1–P48", e: "offset table", r: "reset returns to G54", tone: "#dc2626" },
        { t: "Tool length", s: "G43 H01", e: "offset table", r: "cleared by reset", tone: "#dc2626" },
        { t: "Radius comp", s: "G41 D01 / G42 D01", e: "offset table", r: "cleared by reset", tone: "#dc2626" },
        { t: "G92 shift", s: "coordinate redefinition", e: "program state only", r: "in no table at all", tone: "#991b1b" },
      ];

      const chainBlocks = chain
        .map((c, i) => {
          const x = 60 + i * 220;
          const w = 172;
          const arrow =
            i < chain.length - 1
              ? `<line x1="${x + w + 4}" y1="217" x2="${x + w + 38}" y2="217" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrDark)"/>`
              : "";
          return `
            ${box(x, 178, w, 78, { fill: "#ffffff", stroke: c.c, sw: 1.8, rx: 8 })}
            <rect x="${x}" y="178" width="${w}" height="5" rx="2.5" fill="${c.c}"/>
            ${label(x + w / 2, 206, c.t, { size: 11.4, fill: "#0f172a", weight: "bold", anchor: "middle" })}
            ${label(x + w / 2, 224, c.s, { size: 9.4, fill: "#64748b", anchor: "middle" })}
            ${label(x + w / 2, 244, c.code, { size: 11, fill: c.c, mono: true, weight: "bold", anchor: "middle" })}
            ${arrow}
          `;
        })
        .join("");

      const stageRows = stages
        .map((s, i) => {
          const y = 340 + i * 52;
          return `
            <rect x="60" y="${y}" width="508" height="44" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
            <rect x="60" y="${y}" width="4" height="44" rx="2" fill="${s.tone}"/>
            ${label(74, y + 18, s.t, { size: 11.4, fill: "#1e293b", weight: "bold" })}
            ${label(74, y + 33, s.s, { size: 9.6, fill: "#64748b", mono: true })}
            ${label(556, y + 18, s.e, { size: 9.6, fill: "#475569", anchor: "end" })}
            ${label(556, y + 33, s.r, { size: 9.6, fill: s.tone, anchor: "end", weight: "bold" })}
          `;
        })
        .join("");

      return `
        <!-- Top: the chain -->
        ${box(44, 108, 1112, 168, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Every displayed position is this chain, not one number", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "A missing link does not move the part — it moves where the control believes the tool tip is.", { size: 10.8, fill: "#64748b" })}
        ${chainBlocks}

        <!-- Bottom left: where each stage lives -->
        ${box(44, 296, 540, 272, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 324, "Each stage is stored, and cleared, somewhere else", { size: 13.6, fill: "#0f172a", weight: "bold" })}
        ${stageRows}
        ${label(66, 556, "The offset table is inspectable. Program state is not. That is the risk difference.", { size: 10.2, fill: "#0b5cad", weight: "bold" })}

        <!-- Bottom right: G10 -->
        ${box(600, 296, 556, 272, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(622, 324, "G10: the offset write you cannot see happen", { size: 13.6, fill: "#0f172a", weight: "bold" })}

        <rect x="616" y="338" width="524" height="58" rx="6" fill="#f8fafc" stroke="#059669" stroke-width="1.4"/>
        ${label(630, 358, "G10 L2 P1 X… Y… Z…", { size: 11.2, fill: "#047857", mono: true, weight: "bold" })}
        ${label(630, 372, "writes absolute values into G54", { size: 10, fill: "#475569" })}
        ${label(630, 386, "explicit, but you must compute the numbers", { size: 9.6, fill: "#94a3b8" })}

        <rect x="616" y="404" width="524" height="58" rx="6" fill="#eff6ff" stroke="#0b5cad" stroke-width="1.4"/>
        ${label(630, 424, "G10 L20 P1 X… Y… Z…", { size: 11.2, fill: "#0b5cad", mono: true, weight: "bold" })}
        ${label(630, 438, "make the current position become the datum", { size: 10, fill: "#475569" })}
        ${label(630, 452, "no arithmetic, no sign errors — probe cycles use this", { size: 9.6, fill: "#64748b" })}

        ${label(622, 482, "Both persist silently, and both can be skipped by block delete:", { size: 10.4, fill: "#991b1b", weight: "bold" })}
        ${label(622, 500, "a wrong P number edits a different fixture offset", { size: 10, fill: "#475569" })}
        ${label(622, 516, "a duplicate execution shifts the part twice", { size: 10, fill: "#475569" })}
        ${label(622, 536, "Keep G10 in a logged setup program, never in a cutting program.", { size: 10.2, fill: "#0b5cad", weight: "bold" })}
        ${label(622, 554, "Verify with a probe straight afterwards, not with the first part.", { size: 9.8, fill: "#64748b" })}
      `;
    }

    // ------------------------------------------------------------------ 3
    case "cnc-fixture-locating-clamping": {
      const locatorDots = (pts, color, num) =>
        pts
          .map(
            (p) => `
          <circle cx="${p.x}" cy="${p.y}" r="7" fill="${color}"/>
          ${label(p.x, p.y + 4, num, { size: 9, fill: "#ffffff", mono: true, weight: "bold", anchor: "middle" })}
        `,
          )
          .join("");

      const tests = [
        { t: "Clamp, machine, measure, unclamp, re-clamp, measure", s: "the change is the fixture, not the machine", c: "#0b5cad" },
        { t: "Full-depth pass vs light finishing pass, same location", s: "difference that vanishes at light load = deflection", c: "#d97706" },
        { t: "Load and unload the same part ten times, probe the datum", s: "spread above zero-point spec = dirty or over-constrained", c: "#059669" },
      ];
      const testRows = tests
        .map((s, i) => {
          const y = 378 + i * 58;
          return `
            <rect x="676" y="${y}" width="464" height="50" rx="6" fill="#f8fafc" stroke="${s.c}" stroke-width="1.4"/>
            ${label(690, y + 20, s.t, { size: 10.4, fill: "#1e293b", weight: "bold" })}
            ${label(690, y + 36, s.s, { size: 9.6, fill: "#64748b" })}
          `;
        })
        .join("");

      return `
        <!-- Left: 3-2-1 locating -->
        ${box(44, 108, 588, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Six points, six degrees of freedom", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "Locators constrain. Clamps only press the part against them.", { size: 10.6, fill: "#64748b" })}

        <path d="M 130 300 L 330 300 L 390 250 L 190 250 Z" fill="#e8eef6" stroke="#94a3b8" stroke-width="1.6"/>
        <rect x="130" y="300" width="200" height="96" fill="#dde6f1" stroke="#94a3b8" stroke-width="1.6"/>
        <path d="M 330 300 L 390 250 L 390 346 L 330 396 Z" fill="#cfdae8" stroke="#94a3b8" stroke-width="1.6"/>
        ${label(214, 356, "WORKPIECE", { size: 11, fill: "#475569", mono: true, weight: "bold", anchor: "middle" })}

        ${locatorDots([{ x: 168, y: 400 }, { x: 274, y: 400 }, { x: 168, y: 340 }], "#0b5cad", "3")}
        ${label(96, 420, "PRIMARY", { size: 9.6, fill: "#0b5cad", mono: true, weight: "bold" })}
        ${label(96, 434, "Z + 2 rotations", { size: 9.2, fill: "#64748b" })}

        ${locatorDots([{ x: 186, y: 232 }, { x: 300, y: 232 }], "#d97706", "2")}
        ${label(150, 214, "SECONDARY", { size: 9.6, fill: "#b45309", mono: true, weight: "bold" })}
        ${label(300, 214, "X + 1 rotation", { size: 9.2, fill: "#64748b" })}

        <circle cx="392" cy="300" r="7" fill="#059669"/>
        ${label(392, 304, "1", { size: 9, fill: "#ffffff", mono: true, weight: "bold", anchor: "middle" })}
        ${label(408, 292, "TERTIARY · Y", { size: 9.6, fill: "#047857", mono: true, weight: "bold" })}

        <line x1="168" y1="350" x2="168" y2="394" stroke="#dc2626" stroke-width="3" marker-start="url(#arrRed)"/>
        <line x1="274" y1="350" x2="274" y2="394" stroke="#dc2626" stroke-width="3" marker-start="url(#arrRed)"/>
        ${label(300, 386, "CLAMP FORCE", { size: 9.6, fill: "#991b1b", mono: true, weight: "bold" })}
        ${label(300, 400, "directly over the locators", { size: 9.2, fill: "#64748b" })}

        <rect x="66" y="452" width="544" height="98" rx="8" fill="#fffbeb" stroke="#d97706"/>
        ${label(84, 476, "Over-constraining a non-flat face adds a fourth support point:", { size: 10.8, fill: "#92400e", weight: "bold" })}
        ${label(84, 494, "the part rocks, the clamp decides which three points actually touch,", { size: 10.2, fill: "#78350f" })}
        ${label(84, 510, "and the variation appears as machine error it is not.", { size: 10.2, fill: "#78350f" })}
        ${label(84, 532, "Locate on machined features; add relief so chips cannot become a datum.", { size: 10.2, fill: "#0b5cad", weight: "bold" })}

        <!-- Right top: clamping distortion -->
        ${box(660, 108, 496, 208, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(682, 136, "Clamping force is a machining parameter", { size: 13.4, fill: "#0f172a", weight: "bold" })}

        <line x1="700" y1="176" x2="700" y2="262" stroke="#94a3b8" stroke-width="2"/>
        <line x1="700" y1="176" x2="880" y2="176" stroke="#94a3b8" stroke-width="2"/>
        <line x1="700" y1="262" x2="880" y2="262" stroke="#94a3b8" stroke-width="2"/>
        <path d="M 712 176 L 712 210 Q 790 236 868 210 L 868 176" fill="none" stroke="#dc2626" stroke-width="2.4"/>
        ${label(790, 168, "clamped · machined", { size: 9.6, fill: "#991b1b", anchor: "middle", weight: "bold" })}
        ${label(790, 254, "wall deflects inward", { size: 9, fill: "#94a3b8", anchor: "middle" })}

        <line x1="920" y1="176" x2="920" y2="262" stroke="#94a3b8" stroke-width="2"/>
        <line x1="920" y1="176" x2="1100" y2="176" stroke="#94a3b8" stroke-width="2"/>
        <line x1="920" y1="262" x2="1100" y2="262" stroke="#94a3b8" stroke-width="2"/>
        <path d="M 932 176 L 932 219 L 1088 219 L 1088 176" fill="none" stroke="#059669" stroke-width="2.4"/>
        ${label(1010, 168, "released · measured", { size: 9.6, fill: "#047857", anchor: "middle", weight: "bold" })}
        ${label(1010, 254, "springs back, wall too thin", { size: 9, fill: "#94a3b8", anchor: "middle" })}

        ${label(682, 288, "In tolerance on the machine, out of tolerance on the CMM.", { size: 10.4, fill: "#991b1b", weight: "bold" })}
        ${label(682, 304, "Regulate clamp force, back the wall, or finish in the final clamped state.", { size: 9.6, fill: "#475569" })}

        <!-- Right bottom: is the fixture the limit -->
        ${box(660, 334, 496, 234, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(682, 362, "Three tests that name the culprit", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${testRows}
        ${label(682, 552, "A ballbar-perfect machine still scraps parts through a fixture built for convenience.", { size: 9.8, fill: "#0b5cad", weight: "bold" })}
      `;
    }

    // ------------------------------------------------------------------ 4
    case "cnc-cycle-time-composition": {
      const bars = [
        {
          t: "TYPICAL CYCLE",
          s: "non-cutting 55% of the minute",
          seg: [
            { n: "cutting", p: 45, c: "#0b5cad" },
            { n: "rapid", p: 15, c: "#38bdf8" },
            { n: "tool change", p: 10, c: "#d97706" },
            { n: "wait / load", p: 30, c: "#dc2626" },
          ],
        },
        {
          t: "AFTER NON-CUTTING WORK",
          s: "same tool path, same quality limits",
          seg: [
            { n: "cutting", p: 62, c: "#0b5cad" },
            { n: "rapid", p: 12, c: "#38bdf8" },
            { n: "tool change", p: 6, c: "#d97706" },
            { n: "wait / load", p: 20, c: "#dc2626" },
          ],
        },
      ];

      const barBlocks = bars
        .map((b, bi) => {
          const y = 180 + bi * 148;
          let acc = 0;
          const segs = b.seg
            .map((s) => {
              const h = (s.p / 100) * 220;
              const yy = y + (acc / 100) * 220;
              acc += s.p;
              const pct = h > 18 ? label(210, yy + h / 2 + 4, `${s.p}%`, { size: 10.5, fill: "#ffffff", mono: true, weight: "bold", anchor: "middle" }) : "";
              return `
                <rect x="150" y="${yy}" width="120" height="${h}" fill="${s.c}" opacity="0.9"/>
                ${pct}
              `;
            })
            .join("");
          const legend = b.seg
            .map((s, i) => {
              const yy = y + i * 26;
              return `
                <rect x="288" y="${yy + 2}" width="12" height="12" rx="2" fill="${s.c}"/>
                ${label(308, yy + 12, s.n, { size: 10.2, fill: "#334155" })}
              `;
            })
            .join("");
          return `
            ${label(66, y + 14, b.t, { size: 11.2, fill: "#0f172a", weight: "bold" })}
            ${label(66, y + 30, b.s, { size: 9.4, fill: "#64748b" })}
            <rect x="150" y="${y}" width="120" height="220" fill="#f8fafc" stroke="#e2e8f0"/>
            ${segs}
            ${legend}
          `;
        })
        .join("");

      const chip = [
        { n: "rubbing", s: "below range", c: "#dc2626", w: 130 },
        { n: "recommended", s: "manufacturer fz window", c: "#059669", w: 200 },
        { n: "overload", s: "above range", c: "#d97706", w: 140 },
      ];
      let chipAcc = 0;
      const chipBlocks = chip
        .map((c) => {
          const x = 694 + chipAcc;
          chipAcc += c.w;
          return `
            <rect x="${x}" y="204" width="${c.w - 6}" height="26" rx="4" fill="${c.c}" opacity="0.85"/>
            ${label(x + (c.w - 6) / 2, 222, c.n, { size: 10, fill: "#ffffff", weight: "bold", anchor: "middle" })}
            ${label(x, 276, c.s, { size: 9, fill: c.c, weight: "bold" })}
          `;
        })
        .join("");

      const verify = [
        "Tool life trend — a cycle halved for half the tool life is not a gain",
        "Surface finish on a representative feature, measured not judged",
        "Dimension and form on the tightest feature, after unclamping",
        "Spindle load — sustained above 90% duty is machine, not process",
        "Thermal drift across a full shift at the new utilisation",
      ]
        .map((t, i) => {
          const y = 414 + i * 28;
          return `
            <circle cx="690" cy="${y - 4}" r="3.6" fill="#0b5cad"/>
            ${label(704, y, t, { size: 10, fill: "#334155" })}
          `;
        })
        .join("");

      return `
        <!-- Left: time composition -->
        ${box(44, 108, 588, 460, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(66, 136, "Where the minute actually goes", { size: 14, fill: "#0f172a", weight: "bold" })}
        ${label(66, 158, "If non-cutting time exceeds 40%, no feed rate change can recover it.", { size: 10.6, fill: "#64748b" })}

        ${barBlocks}

        <rect x="66" y="478" width="544" height="76" rx="8" fill="#eff6ff" stroke="#0b5cad"/>
        ${label(84, 502, "Cheapest first: positioning height, tool count, shortest safe tool length,", { size: 10.6, fill: "#0b5cad", weight: "bold" })}
        ${label(84, 518, "spindle ramp overlapped with the approach, chip-to-chip time.", { size: 10.6, fill: "#0b5cad", weight: "bold" })}
        ${label(84, 538, "Feed override is the last lever, not the first: it changes the variable the process was designed around.", { size: 9.4, fill: "#475569" })}

        <!-- Right top: chip load window -->
        ${box(660, 108, 496, 240, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(682, 136, "Feed rate is an output; chip load is the decision", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${label(682, 160, "feed mm/min = fz × z × n", { size: 11, fill: "#0b5cad", mono: true, weight: "bold" })}
        ${label(682, 176, "fz per tooth · z teeth · n rev/min", { size: 9.6, fill: "#94a3b8", mono: true })}

        <line x1="694" y1="238" x2="1114" y2="238" stroke="#475569" stroke-width="1.6"/>
        ${label(694, 258, "chip load per tooth", { size: 9.4, fill: "#64748b" })}
        ${chipBlocks}
        ${label(682, 306, "Most underperforming processes sit in the red zone: run slow to be safe, and rub.", { size: 10, fill: "#991b1b", weight: "bold" })}
        ${label(682, 324, "Faster only helps if the spindle has the power and torque to carry it.", { size: 9.8, fill: "#475569" })}

        <!-- Right bottom: verify -->
        ${box(660, 364, 496, 204, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${label(682, 392, "Verify in this order before accepting a gain", { size: 13.4, fill: "#0f172a", weight: "bold" })}
        ${verify}
      `;
    }

    default:
      return null;
  }
}
