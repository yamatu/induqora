// Bespoke light-canvas engineering diagrams (Part H: spray air control unit —
// layered architecture with safety boundary, and pressure loop step response vs dead time).
// Canvas working area inside diagram frame: x=36..1164, y=104..576

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function box(x, y, w, h, { fill = "#ffffff", stroke = "#cbd5e1", sw = 1.6, rx = 10, dash = null } = {}) {
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${d}/>`;
}

function label(x, y, t, o = {}) {
  const { size = 12, fill = "#334155", weight = "normal", anchor = "start", mono = false } = o;
  const fam = mono ? MONO : SANS;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${fam}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${t}</text>`;
}

function layer(x, y, w, h, title, sub, items, color, tint) {
  const chips = items
    .map((it, i) => {
      const cx = x + 14 + (i % 3) * ((w - 28) / 3);
      const cy = y + h - 30;
      return `<rect x="${cx}" y="${cy - 13}" width="${(w - 28) / 3 - 8}" height="20" rx="5" fill="${tint}" stroke="${color}" stroke-width="0.9"/>
        ${label(cx + ((w - 28) / 3 - 8) / 2, cy + 1, it, { size: 9.2, fill: color, anchor: "middle", mono: true, weight: "bold" })}`;
    })
    .join("");
  return `${box(x, y, w, h, { fill: "#ffffff", stroke: color, sw: 1.7 })}
    <rect x="${x}" y="${y}" width="6" height="${h}" rx="3" fill="${color}"/>
    ${label(x + 18, y + 24, title, { size: 13, fill: "#0f172a", weight: "bold" })}
    ${label(x + 18, y + 42, sub, { size: 9.8, fill: "#64748b" })}
    ${chips}`;
}

export function renderDiagramBodyH(d) {
  switch (d.type) {
    // ------------------------------------------------------------------ 1
    case "spray-air-loop-architecture": {
      const L = 48;
      const W = 690;
      const rows = [
        {
          y: 112,
          h: 84,
          t: "1 · SUPERVISION",
          s: "Changes rarely, holds no control authority",
          items: ["WEB UI SETPOINTS", "RECIPE STORE", "TRENDS + CSV"],
          c: "#7c3aed",
          tint: "#f5f3ff",
        },
        {
          y: 206,
          h: 100,
          t: "2 · CONTROL CORE — 100 Hz, no allocations, no network I/O",
          s: "PI + dead-time tuning · valve hysteresis model · plausibility alarms",
          items: ["10 ms TASK", "PI (SIMC)", "ALARM LOGIC"],
          c: "#0b5cad",
          tint: "#eff6ff",
        },
        {
          y: 316,
          h: 96,
          t: "3 · I/O & FIELDBUS",
          s: "Sampling and valve drive stay out of the control task",
          items: ["ADC 16-BIT", "CAN 2.0B", "RS-485 RTU"],
          c: "#059669",
          tint: "#ecfdf5",
        },
        {
          y: 452,
          h: 108,
          t: "4 · PNEUMATICS — certified, not software",
          s: "Filter-regulator · proportional valve · transducer · atomiser",
          items: ["FILTER-REG", "PROP. VALVE", "TRANSDUCER"],
          c: "#dc2626",
          tint: "#fef2f2",
        },
      ];
      const layers = rows.map((r) => layer(L, r.y, W, r.h, r.t, r.s, r.items, r.c, r.tint)).join("");

      // Arrows between layers
      const arrows = [
        { y1: 196, y2: 206 },
        { y1: 306, y2: 316 },
        { y1: 412, y2: 452, dash: true },
      ]
        .map(
          (a) =>
            `<line x1="${L + W / 2}" y1="${a.y1}" x2="${L + W / 2}" y2="${a.y2 - 2}" stroke="${a.dash ? "#dc2626" : "#94a3b8"}" stroke-width="2"${a.dash ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#arr${a.dash ? "Red" : "Dark"})"/>`
        )
        .join("");

      // Safety boundary
      const boundary = `
        <line x1="36" y1="440" x2="708" y2="440" stroke="#dc2626" stroke-width="2" stroke-dasharray="9 6"/>
        ${label(48, 434, "SAFETY &amp; ATEX BOUNDARY — nothing above this line may carry a safety function", { size: 9.6, fill: "#dc2626", weight: "bold" })}`;

      // Right column: what the boundary means
      const notes = [
        { y: 112, h: 150, t: "Above the line", c: "#0b5cad", rows: [
          "Rewritable, versionable, replaceable.",
          "No certification, no type approval.",
          "This is where the whole design lives.",
        ] },
        { y: 274, h: 150, t: "Below the line", c: "#dc2626", rows: [
          "Solvent vapour makes the booth a classified zone.",
          "Hardware inside it must be rated for it.",
          "E-stop, interlocks and safe torque off belong",
          "to the certified circuit — never to this device.",
        ] },
        { y: 436, h: 124, t: "The three defensible uses", c: "#059669", rows: [
          "Bench rig for process development.",
          "Monitoring-only box reading existing signals.",
          "Documented pilot on a non-producing cell.",
        ] },
      ]
        .map((n) => {
          const lines = n.rows
            .map((r, i) => label(766, n.y + 72 + i * 17, r, { size: 9.4, fill: "#334155" }))
            .join("");
          return `${box(748, n.y, 416, n.h, { fill: "#ffffff", stroke: n.c, sw: 1.4 })}
            <rect x="748" y="${n.y}" width="416" height="26" rx="10" fill="${n.c}"/>
            <rect x="748" y="${n.y + 16}" width="416" height="10" fill="${n.c}"/>
            ${label(766, n.y + 18, n.t, { size: 11.6, fill: "#ffffff", weight: "bold" })}
            ${lines}`;
        })
        .join("");

      return `<g>${layers}${arrows}${boundary}${notes}</g>`;
    }

    // ------------------------------------------------------------------ 2
    case "spray-air-step-response": {
      const X0 = 84;
      const X1 = 636;
      const Y0 = 470; // pv = 0
      const Y1 = 168; // pv = 3.0 bar
      const T_MAX = 560; // ms
      const P_MAX = 3.0; // bar
      const px = (t) => X0 + (t / T_MAX) * (X1 - X0);
      const py = (p) => Y0 - (p / P_MAX) * (Y0 - Y1);

      // grid + axes
      const yTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
        .map(
          (p) =>
            `<line x1="${X0}" y1="${py(p)}" x2="${X1}" y2="${py(p)}" stroke="#eef2f7" stroke-width="1"/>
             ${label(X0 - 10, py(p) + 4, p.toFixed(1), { size: 9, fill: "#94a3b8", anchor: "end", mono: true })}`
        )
        .join("");
      const xTicks = [0, 100, 200, 300, 400, 500]
        .map(
          (t) =>
            `<line x1="${px(t)}" y1="${Y0}" x2="${px(t)}" y2="${Y0 + 5}" stroke="#cbd5e1" stroke-width="1"/>
             ${label(px(t), Y0 + 18, String(t), { size: 9, fill: "#94a3b8", anchor: "middle", mono: true })}`
        )
        .join("");

      const axes = `
        <line x1="${X0}" y1="${Y1 - 8}" x2="${X0}" y2="${Y0}" stroke="#94a3b8" stroke-width="1.4"/>
        <line x1="${X0}" y1="${Y0}" x2="${X1 + 8}" y2="${Y0}" stroke="#94a3b8" stroke-width="1.4"/>
        ${yTicks}${xTicks}
        ${label(X0 - 44, Y1 - 4, "bar", { size: 9.4, fill: "#64748b", mono: true })}
        ${label(X1, Y0 + 34, "ms", { size: 9.4, fill: "#64748b", mono: true, anchor: "end" })}`;

      // step setpoint at t = 100 ms to 2.5 bar
      const SP = 2.5;
      const T_STEP = 100;
      const spPath = `M ${px(0)} ${py(0)} L ${px(T_STEP)} ${py(0)} L ${px(T_STEP)} ${py(SP)} L ${px(T_MAX)} ${py(SP)}`;

      // plant: theta = 60 ms, tau = 180 ms
      const theta = 60;
      const tau = 180;
      const pvOf = (t) => (t <= T_STEP + theta ? 0 : SP * (1 - Math.exp(-(t - T_STEP - theta) / tau)));
      const plantPts = [];
      for (let t = 0; t <= T_MAX; t += 2) plantPts.push(`${px(t).toFixed(1)},${py(pvOf(t)).toFixed(1)}`);
      const plantPath = `M ${plantPts.join(" L ")}`;

      // with trigger feed-forward: pre-positioned valve, shorter effective delay and faster rise
      const ffOf = (t) => {
        const t2 = T_STEP + 22;
        if (t <= t2) return 0;
        return SP * (1 - Math.exp(-(t - t2) / 105));
      };
      const ffPts = [];
      for (let t = 0; t <= T_MAX; t += 2) ffPts.push(`${px(t).toFixed(1)},${py(ffOf(t)).toFixed(1)}`);
      const ffPath = `M ${ffPts.join(" L ")}`;

      // +/- 5% band
      const band = `
        <rect x="${X0}" y="${py(SP * 1.05)}" width="${X1 - X0}" height="${py(SP * 0.95) - py(SP * 1.05)}" fill="#059669" fill-opacity="0.07"/>
        <line x1="${X0}" y1="${py(SP * 1.05)}" x2="${X1}" y2="${py(SP * 1.05)}" stroke="#059669" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="${X0}" y1="${py(SP * 0.95)}" x2="${X1}" y2="${py(SP * 0.95)}" stroke="#059669" stroke-width="1" stroke-dasharray="4 4"/>
        ${label(X1 - 4, py(SP * 1.05) - 6, "±5 % settle band", { size: 8.8, fill: "#059669", anchor: "end", weight: "bold" })}`;

      // dead time marker
      const deadMark = `
        <line x1="${px(T_STEP)}" y1="${Y0}" x2="${px(T_STEP)}" y2="${py(SP)}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 3"/>
        <line x1="${px(T_STEP + theta)}" y1="${Y0}" x2="${px(T_STEP + theta)}" y2="${Y0 - 6}" stroke="#dc2626" stroke-width="2"/>
        <line x1="${px(T_STEP)}" y1="${Y0 + 44}" x2="${px(T_STEP + theta)}" y2="${Y0 + 44}" stroke="#dc2626" stroke-width="1.4" marker-start="url(#arrRed)" marker-end="url(#arrRed)"/>
        ${label(px(T_STEP) - 6, Y0 + 40, "trigger", { size: 8.8, fill: "#475569", anchor: "end", mono: true })}
        ${label((px(T_STEP) + px(T_STEP + theta)) / 2 - 8, Y0 + 38, "θ", { size: 10, fill: "#dc2626", anchor: "middle", weight: "bold", mono: true })}`;

      const curves = `
        <path d="${plantPath}" fill="none" stroke="#0b5cad" stroke-width="2.6"/>
        <path d="${ffPath}" fill="none" stroke="#059669" stroke-width="2.6"/>
        <path d="${spPath}" fill="none" stroke="#0f172a" stroke-width="2" stroke-dasharray="7 5"/>
        ${label(px(430), py(SP) - 12, "setpoint", { size: 9.6, fill: "#0f172a", weight: "bold", mono: true })}
        ${label(px(470), py(pvOf(470)) + 26, "measured, dead time 60 ms", { size: 9.6, fill: "#0b5cad", weight: "bold" })}
        ${label(px(300), py(ffOf(300)) - 14, "with trigger feed-forward", { size: 9.6, fill: "#059669", weight: "bold" })}`;

      // Right panel
      const rp = `
        ${box(676, 108, 488, 150, { fill: "#ffffff", stroke: "#0b5cad", sw: 1.5 })}
        <rect x="676" y="108" width="488" height="26" rx="10" fill="#0b5cad"/>
        <rect x="676" y="124" width="488" height="10" fill="#0b5cad"/>
        ${label(694, 126, "Tuning rule for a dead-time plant (SIMC)", { size: 11.4, fill: "#ffffff", weight: "bold" })}
        ${label(694, 156, "Kc = (1/K) · τ / (τc + θ)", { size: 12, fill: "#0f172a", mono: true })}
        ${label(694, 178, "Ti = min(τ, 4 · (τc + θ))", { size: 12, fill: "#0f172a", mono: true })}
        ${label(694, 202, "θ/τ ≈ 0.3–0.6 here, so PI is enough and PID is not justified.", { size: 9.4, fill: "#64748b" })}
        ${label(694, 222, "Setting τc = θ reaches setpoint in about 3θ with no overshoot.", { size: 9.4, fill: "#64748b" })}
        ${label(694, 244, "20 ms of tuning cannot buy back 60 ms of transport delay.", { size: 9.4, fill: "#dc2626", weight: "bold" })}`;

      const rateBox = `
        ${box(676, 270, 488, 116, { fill: "#ffffff", stroke: "#059669", sw: 1.5 })}
        <rect x="676" y="270" width="488" height="26" rx="10" fill="#059669"/>
        <rect x="676" y="286" width="488" height="10" fill="#059669"/>
        ${label(694, 288, "Why 100 Hz and not 2 kHz", { size: 11.4, fill: "#ffffff", weight: "bold" })}
        ${label(694, 318, "10 ms task sits a dozen samples inside the dominant lag.", { size: 9.6, fill: "#334155" })}
        ${label(694, 338, "Above 1 kHz you are measuring transducer noise, not the plant.", { size: 9.6, fill: "#334155" })}
        ${label(694, 358, "Hose length sets dead time: about 3 ms per metre, plus valve lag.", { size: 9.6, fill: "#059669", weight: "bold" })}
        ${label(694, 376, "3 m hose ≈ 30–80 ms θ   ·   10 m hose ≈ 150 ms θ", { size: 9.4, fill: "#64748b", mono: true })}`;

      const failBox = `
        ${box(676, 398, 488, 100, { fill: "#fef2f2", stroke: "#dc2626", sw: 1.5 })}
        ${label(694, 424, "The first 100 ms of every stroke", { size: 12, fill: "#991b1b", weight: "bold" })}
        ${label(694, 446, "Delete the settle time in the RAPID program and every stroke starts at", { size: 9.4, fill: "#7f1d1d" })}
        ${label(694, 464, "the previous colour's pressure. That is the heavy start-of-stroke", { size: 9.4, fill: "#7f1d1d" })}
        ${label(694, 482, "defect that gets blamed on the bell, the paint and the operator.", { size: 9.4, fill: "#7f1d1d" })}`;

      return `<g>${band}${axes}${deadMark}${curves}${rp}${rateBox}${failBox}</g>`;
    }

    default:
      return null;
  }
}
