// Bespoke 1200x675 (16:9) industrial engineering editorial cover SVG renderer.
// Layout keeps bottom-left clean/dark so PostCardFeature text overlay stays legible,
// while showcasing rich vector industrial artwork on the right/center canvas.

const FONT_SANS = "DejaVu Sans, sans-serif";
const FONT_MONO = "DejaVu Sans Mono, monospace";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fixBareAmps(svg) {
  return svg.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;");
}

function wrapLines(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + " " + w).length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const CAT_PALETTES = {
  "motion-control-drives": { bg1: "#091426", bg2: "#0e2948", bg3: "#0b3b66" },
  "plc-controllers": { bg1: "#0b132b", bg2: "#162447", bg3: "#1b3a6b" },
  "process-automation-dcs": { bg1: "#071b24", bg2: "#0d323e", bg3: "#114b5f" },
  "scada-hmi": { bg1: "#0c1626", bg2: "#142942", bg3: "#1a3c63" },
  "industrial-networking": { bg1: "#08172b", bg2: "#0f2e52", bg3: "#124273" },
  "ot-cybersecurity": { bg1: "#140e1f", bg2: "#1d1a36", bg3: "#1e2e52" },
  "robotics": { bg1: "#141422", bg2: "#22243a", bg3: "#2a3552" },
  "iiot-edge": { bg1: "#0c1229", bg2: "#1c1f4a", bg3: "#163561" },
  "smart-manufacturing": { bg1: "#081c24", bg2: "#0f3342", bg3: "#124959" },
  "standards-regulation": { bg1: "#0a1733", bg2: "#142a59", bg3: "#1b3d7a" },
  "suppliers-services": { bg1: "#101827", bg2: "#1c2a42", bg3: "#213a5c" },
};

function renderMotif(motif, a1, a2, seed) {
  switch (motif) {
    case "dc-bus-rack":
      return `
        <g transform="translate(570, 82)">
          <line x1="30" y1="68" x2="530" y2="68" stroke="${a2}" stroke-width="5" stroke-linecap="round"/>
          <line x1="30" y1="86" x2="530" y2="86" stroke="${a1}" stroke-width="5" stroke-linecap="round"/>
          <text x="412" y="54" fill="${a2}" font-family="${FONT_MONO}" font-size="13" font-weight="bold">+560V DC LINK</text>
          <text x="412" y="109" fill="${a1}" font-family="${FONT_MONO}" font-size="12">0V / DC- RETURN</text>
          ${[
            { x: 32, w: 112, code: "PSM", label: "POWER SUPPLY", led: "#34d399", seg: "00" },
            { x: 162, w: 118, code: "SPM", label: "SPINDLE AMP", led: a1, seg: "88" },
            { x: 298, w: 108, code: "SVM-X", label: "SERVO AMP", led: "#34d399", seg: "01" },
            { x: 424, w: 108, code: "SVM-Z", label: "SERVO AMP", led: a2, seg: "02" },
          ].map((m) => `
            <rect x="${m.x}" y="128" width="${m.w}" height="296" rx="10" fill="#0f172a" fill-opacity="0.88" stroke="${a1}" stroke-opacity="0.55" stroke-width="2"/>
            <rect x="${m.x + 12}" y="142" width="${m.w - 24}" height="42" rx="5" fill="#1e293b" stroke="#334155"/>
            <text x="${m.x + 20}" y="169" fill="${m.led}" font-family="${FONT_MONO}" font-size="22" font-weight="bold">${m.seg}</text>
            <circle cx="${m.x + m.w - 24}" cy="158" r="5" fill="${m.led}"/>
            <circle cx="${m.x + m.w - 24}" cy="173" r="4" fill="#475569"/>
            <text x="${m.x + m.w / 2}" y="210" text-anchor="middle" fill="#e2e8f0" font-family="${FONT_SANS}" font-size="15" font-weight="bold">${m.code}</text>
            <text x="${m.x + m.w / 2}" y="228" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">${m.label}</text>
            ${[0,1,2,3,4,5].map((i) => `<line x1="${m.x + 16}" y1="${250 + i * 16}" x2="${m.x + m.w - 16}" y2="${250 + i * 16}" stroke="#334155" stroke-width="3" stroke-linecap="round"/>`).join("")}
            <rect x="${m.x + 16}" y="358" width="${m.w - 32}" height="48" rx="4" fill="#1e293b" stroke="${a1}" stroke-opacity="0.35"/>
            <circle cx="${m.x + 32}" cy="382" r="5" fill="${a2}"/><circle cx="${m.x + m.w/2}" cy="382" r="5" fill="${a1}"/><circle cx="${m.x + m.w - 32}" cy="382" r="5" fill="#34d399"/>
            <line x1="${m.x + 36}" y1="68" x2="${m.x + 36}" y2="128" stroke="${a2}" stroke-width="2.5"/>
            <line x1="${m.x + 64}" y1="86" x2="${m.x + 64}" y2="128" stroke="${a1}" stroke-width="2.5"/>
            <circle cx="${m.x + 36}" cy="68" r="4.5" fill="${a2}"/>
            <circle cx="${m.x + 64}" cy="86" r="4.5" fill="${a1}"/>
          `).join("")}
          <path d="M 30 475 Q 75 435 120 475 T 210 475 T 300 475 T 390 475 T 480 475 T 535 475" fill="none" stroke="${a1}" stroke-width="3" stroke-opacity="0.9"/>
          <path d="M 30 475 Q 75 510 120 475 T 210 475 T 300 475 T 390 475 T 480 475 T 535 475" fill="none" stroke="${a2}" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.8"/>
          <text x="32" y="518" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12">U · V · W  PWM INVERTER STAGE   |   REGEN MONITOR ACTIVE</text>
        </g>`;

    case "pcb-board":
      return `
        <g transform="translate(580, 75)">
          <rect x="20" y="25" width="510" height="475" rx="18" fill="#0b1f2a" fill-opacity="0.88" stroke="${a1}" stroke-opacity="0.55" stroke-width="2.5"/>
          <g stroke="${a1}" stroke-opacity="0.45" stroke-width="2.2" fill="none">
            <path d="M 55 95 H 165 L 200 130 H 255"/>
            <path d="M 55 120 H 150 L 185 155 H 255"/>
            <path d="M 55 145 H 135 L 170 180 H 255"/>
            <path d="M 395 155 H 455 L 485 125 V 70"/>
            <path d="M 395 185 H 470 L 495 210 V 350"/>
            <path d="M 395 215 H 445 L 470 240 V 420"/>
            <path d="M 275 305 V 385 L 235 425 H 95"/>
            <path d="M 310 305 V 410 L 350 450 H 460"/>
            <path d="M 345 305 V 370 L 385 410 H 480"/>
          </g>
          <rect x="245" y="125" width="160" height="160" rx="12" fill="#0f172a" stroke="${a1}" stroke-width="3"/>
          <rect x="268" y="148" width="114" height="114" rx="6" fill="#1e293b" stroke="${a2}" stroke-opacity="0.8" stroke-width="1.5"/>
          <text x="325" y="198" text-anchor="middle" fill="#f8fafc" font-family="${FONT_MONO}" font-size="16" font-weight="bold">MCU / FPGA</text>
          <text x="325" y="220" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="11">32-BIT CONTROL</text>
          <text x="325" y="242" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="10">ESD PROTECTED</text>
          ${[0,1,2,3,4,5,6].map((i) => `
            <rect x="${260 + i * 20}" y="114" width="8" height="11" fill="${a2}"/>
            <rect x="${260 + i * 20}" y="285" width="8" height="11" fill="${a2}"/>
            <rect x="234" y="${140 + i * 20}" width="11" height="8" fill="${a1}"/>
            <rect x="405" y="${140 + i * 20}" width="11" height="8" fill="${a1}"/>
          `).join("")}
          ${[0,1,2].map((i) => `
            <circle cx="${110}" cy="${245 + i * 74}" r="26" fill="#1e293b" stroke="${a2}" stroke-width="2.5"/>
            <path d="M ${110} ${223 + i * 74} A 22 22 0 0 1 ${132} ${245 + i * 74}" fill="none" stroke="${a1}" stroke-width="4"/>
            <text x="110" y="${250 + i * 74}" text-anchor="middle" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="10">C${i+1}</text>
          `).join("")}
          <rect x="175" y="390" width="120" height="72" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
          <text x="235" y="422" text-anchor="middle" fill="#34d399" font-family="${FONT_MONO}" font-size="13" font-weight="bold">3.0V SRAM</text>
          <text x="235" y="442" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">BACKUP CELL</text>
          ${Array.from({length: 14}, (_, i) => `<rect x="${330 + i * 12}" y="472" width="7" height="26" rx="2" fill="${a2}"/>`).join("")}
          ${[[55,95],[55,120],[55,145],[485,70],[495,350],[470,420]].map(([vx,vy]) => `<circle cx="${vx}" cy="${vy}" r="6" fill="#0f172a" stroke="${a2}" stroke-width="2.5"/>`).join("")}
        </g>`;

    case "servo-wave":
      return `
        <g transform="translate(570, 82)">
          <rect x="16" y="18" width="535" height="365" rx="14" fill="#0b1220" fill-opacity="0.92" stroke="${a1}" stroke-opacity="0.5" stroke-width="2"/>
          ${[1,2,3,4,5,6,7].map((i) => `<line x1="${16 + i*67}" y1="18" x2="${16 + i*67}" y2="383" stroke="#1e293b" stroke-width="1"/>`).join("")}
          ${[1,2,3,4,5].map((i) => `<line x1="16" y1="${18 + i*61}" x2="551" y2="${18 + i*61}" stroke="#1e293b" stroke-width="1"/>`).join("")}
          <path d="M 30 220 C 70 140, 110 140, 150 220 C 190 300, 230 300, 270 220 C 295 170, 315 65, 330 62 C 345 65, 355 240, 380 220 C 420 218, 470 220, 535 220" fill="none" stroke="${a1}" stroke-width="4" stroke-linecap="round"/>
          <line x1="25" y1="105" x2="542" y2="105" stroke="#ef4444" stroke-width="2" stroke-dasharray="8 6"/>
          <rect x="378" y="76" width="152" height="24" rx="4" fill="#7f1d1d"/>
          <text x="454" y="92" text-anchor="middle" fill="#fecaca" font-family="${FONT_MONO}" font-size="11" font-weight="bold">IGBT OC TRIP LIMIT</text>
          <path d="M 30 340 H 70 V 300 H 110 V 340 H 150 V 300 H 190 V 340 H 230 V 300 H 270 V 340 H 310 V 300 H 350 V 340 H 410 V 300 H 470 V 340 H 535" fill="none" stroke="${a2}" stroke-width="2.8"/>
          <text x="34" y="48" fill="${a1}" font-family="${FONT_MONO}" font-size="12" font-weight="bold">CH1: PHASE I_u (A)</text>
          <text x="215" y="48" fill="${a2}" font-family="${FONT_MONO}" font-size="12" font-weight="bold">CH2: ENCODER A/B</text>
          <text x="415" y="48" fill="#34d399" font-family="${FONT_MONO}" font-size="12">TRIG: RISING</text>
          ${[
            { x: 16, k: "DC BUS", v: "564 V", c: "#34d399" },
            { x: 200, k: "PEAK CURRENT", v: "312 %", c: a1 },
            { x: 384, k: "INSULATION", v: "&gt; 500 MΩ", c: a2 },
          ].map((c) => `
            <rect x="${c.x}" y="408" width="168" height="92" rx="10" fill="#0f172a" fill-opacity="0.9" stroke="${c.c}" stroke-opacity="0.6" stroke-width="1.8"/>
            <text x="${c.x + 16}" y="438" fill="#94a3b8" font-family="${FONT_MONO}" font-size="11">${c.k}</text>
            <text x="${c.x + 16}" y="478" fill="${c.c}" font-family="${FONT_MONO}" font-size="25" font-weight="bold">${c.v}</text>
          `).join("")}
        </g>`;

    case "torque-curve":
      return `
        <g transform="translate(570, 82)">
          <rect x="16" y="20" width="535" height="475" rx="14" fill="#0b1220" fill-opacity="0.9" stroke="${a1}" stroke-opacity="0.45" stroke-width="2"/>
          <line x1="78" y1="68" x2="78" y2="418" stroke="#64748b" stroke-width="2"/>
          <line x1="78" y1="418" x2="515" y2="418" stroke="#64748b" stroke-width="2"/>
          ${[138, 208, 278, 348].map((y) => `<line x1="78" y1="${y}" x2="515" y2="${y}" stroke="#1e293b" stroke-width="1.2"/>`).join("")}
          <path d="M 78 122 L 325 122 Q 410 128 485 245 L 485 418 L 78 418 Z" fill="${a1}" fill-opacity="0.16"/>
          <path d="M 78 122 L 325 122 Q 410 128 485 245" fill="none" stroke="${a1}" stroke-width="4"/>
          <path d="M 78 278 L 365 278 L 485 335" fill="none" stroke="${a1}" stroke-width="2.5" stroke-dasharray="7 5"/>
          <path d="M 78 335 Q 115 292 160 288 L 305 288 Q 395 295 495 365" fill="none" stroke="${a2}" stroke-width="4"/>
          <text x="95" y="108" fill="${a1}" font-family="${FONT_MONO}" font-size="13" font-weight="bold">AC SERVO PEAK (300% INTERMITTENT)</text>
          <text x="95" y="266" fill="#93c5fd" font-family="${FONT_MONO}" font-size="12">AC SERVO CONTINUOUS RATED</text>
          <text x="275" y="388" fill="${a2}" font-family="${FONT_MONO}" font-size="13" font-weight="bold">VFD + INDUCTION MOTOR</text>
          <text x="295" y="458" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12">MOTOR SPEED (RPM) →</text>
          <text x="38" y="250" transform="rotate(-90 38 250)" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12">TORQUE (% RATED) →</text>
        </g>`;

    case "safety-shield":
      return `
        <g transform="translate(585, 72)">
          <path d="M 265 28 L 465 98 V 265 C 465 395 365 468 265 505 C 165 468 65 395 65 265 V 98 Z" fill="#0f172a" fill-opacity="0.9" stroke="${a1}" stroke-width="3.5"/>
          <path d="M 265 62 L 432 120 V 262 C 432 372 348 435 265 468 C 182 435 98 372 98 262 V 120 Z" fill="${a1}" fill-opacity="0.08" stroke="${a2}" stroke-opacity="0.65" stroke-width="2" stroke-dasharray="8 5"/>
          <rect x="140" y="165" width="108" height="72" rx="8" fill="#1e293b" stroke="${a1}" stroke-width="2.5"/>
          <text x="194" y="198" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="14" font-weight="bold">CH A</text>
          <text x="194" y="220" text-anchor="middle" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="10">SAFE GATE 1</text>
          <rect x="282" y="165" width="108" height="72" rx="8" fill="#1e293b" stroke="${a2}" stroke-width="2.5"/>
          <text x="336" y="198" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="14" font-weight="bold">CH B</text>
          <text x="336" y="220" text-anchor="middle" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="10">SAFE GATE 2</text>
          <line x1="248" y1="201" x2="282" y2="201" stroke="#f8fafc" stroke-width="2" stroke-dasharray="4 3"/>
          <line x1="194" y1="237" x2="194" y2="292" stroke="${a1}" stroke-width="3"/>
          <line x1="336" y1="237" x2="336" y2="292" stroke="${a2}" stroke-width="3"/>
          <rect x="155" y="292" width="220" height="76" rx="10" fill="#064e3b" fill-opacity="0.7" stroke="#34d399" stroke-width="2.5"/>
          <text x="265" y="325" text-anchor="middle" fill="#a7f3d0" font-family="${FONT_SANS}" font-size="17" font-weight="bold">VERIFIED SAFE STATE</text>
          <text x="265" y="349" text-anchor="middle" fill="#d1fae5" font-family="${FONT_MONO}" font-size="11">SIL 3 / PL e · ZERO TORQUE</text>
          <text x="265" y="420" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="13" font-weight="bold">DUAL-CHANNEL DIAGNOSTIC COVERAGE</text>
        </g>`;

    case "plc-rack":
      return `
        <g transform="translate(575, 78)">
          <rect x="15" y="162" width="530" height="22" rx="3" fill="#334155"/>
          ${[
            { x: 32, w: 84, t: "PS", sub: "24V DC", c: "#f59e0b" },
            { x: 124, w: 126, t: "CPU", sub: "IEC 61131", c: a1 },
            { x: 258, w: 72, t: "DI 16", sub: "INPUT", c: a2 },
            { x: 338, w: 72, t: "DO 16", sub: "OUTPUT", c: a2 },
            { x: 418, w: 108, t: "PN / IO", sub: "COMMS", c: "#38bdf8" },
          ].map((m, idx) => `
            <rect x="${m.x}" y="42" width="${m.w}" height="248" rx="8" fill="#0f172a" fill-opacity="0.92" stroke="${m.c}" stroke-opacity="0.7" stroke-width="2"/>
            <rect x="${m.x + 10}" y="54" width="${m.w - 20}" height="28" rx="4" fill="${m.c}" fill-opacity="0.18"/>
            <text x="${m.x + m.w/2}" y="73" text-anchor="middle" fill="${m.c}" font-family="${FONT_MONO}" font-size="13" font-weight="bold">${m.t}</text>
            <text x="${m.x + m.w/2}" y="102" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">${m.sub}</text>
            ${[0,1,2,3,4,5].map((i) => `<circle cx="${m.x + 22}" cy="${126 + i*20}" r="4" fill="${(i + idx + seed) % 3 === 0 ? m.c : '#334155'}"/>`).join("")}
            ${[0,1,2,3,4,5].map((i) => `<rect x="${m.x + 34}" y="${122 + i*20}" width="${Math.max(18, m.w - 48)}" height="7" rx="2" fill="#1e293b"/>`).join("")}
            <rect x="${m.x + 12}" y="252" width="${m.w - 24}" height="24" rx="4" fill="#1e293b"/>
          `).join("")}
          <rect x="28" y="330" width="500" height="165" rx="12" fill="#0b1220" fill-opacity="0.9" stroke="${a1}" stroke-opacity="0.45" stroke-width="1.8"/>
          <text x="48" y="362" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12" font-weight="bold">CYCLIC DETERMINISTIC EXECUTION TIMELINE</text>
          <rect x="48" y="384" width="98" height="44" rx="6" fill="#0369a1"/><text x="97" y="411" text-anchor="middle" fill="#fff" font-family="${FONT_MONO}" font-size="12" font-weight="bold">1. READ</text>
          <rect x="156" y="384" width="160" height="44" rx="6" fill="#0b5cad"/><text x="236" y="411" text-anchor="middle" fill="#fff" font-family="${FONT_MONO}" font-size="12" font-weight="bold">2. SOLVE LOGIC</text>
          <rect x="326" y="384" width="98" height="44" rx="6" fill="#047857"/><text x="375" y="411" text-anchor="middle" fill="#fff" font-family="${FONT_MONO}" font-size="12" font-weight="bold">3. WRITE</text>
          <rect x="434" y="384" width="74" height="44" rx="6" fill="#b45309"/><text x="471" y="411" text-anchor="middle" fill="#fff" font-family="${FONT_MONO}" font-size="11" font-weight="bold">COMMS</text>
          <line x1="48" y1="454" x2="508" y2="454" stroke="${a2}" stroke-width="2" stroke-dasharray="6 4"/>
          <text x="278" y="476" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="11">WATCHDOG SUPERVISION BOUNDARY (SAFE HALT ON OVERRUN)</text>
        </g>`;

    case "process-loop":
      return `
        <g transform="translate(570, 78)">
          <rect x="16" y="18" width="535" height="475" rx="14" fill="#071921" fill-opacity="0.9" stroke="${a1}" stroke-opacity="0.45" stroke-width="2"/>
          <line x1="60" y1="158" x2="520" y2="158" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="8 6"/>
          <text x="442" y="146" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="12">SETPOINT (SP)</text>
          <path d="M 60 360 C 95 360, 125 82, 165 88 C 205 94, 220 228, 260 212 C 300 196, 325 128, 365 144 C 405 160, 445 165, 515 158" fill="none" stroke="${a2}" stroke-width="3" stroke-opacity="0.85"/>
          <path d="M 60 360 C 115 360, 150 185, 215 154 C 275 144, 340 158, 515 158" fill="none" stroke="${a1}" stroke-width="4.5"/>
          <path d="M 60 360 C 140 356, 235 280, 355 212 C 420 180, 465 168, 515 162" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-dasharray="6 5"/>
          <rect x="60" y="398" width="142" height="58" rx="8" fill="#0f2933" stroke="${a1}" stroke-width="1.8"/>
          <text x="131" y="424" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="12" font-weight="bold">OPTIMAL PID</text>
          <text x="131" y="444" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">FAST SETTLING</text>
          <rect x="216" y="398" width="142" height="58" rx="8" fill="#0f2933" stroke="${a2}" stroke-width="1.8"/>
          <text x="287" y="424" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="12" font-weight="bold">HIGH GAIN</text>
          <text x="287" y="444" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">OVERSHOOT</text>
          <rect x="372" y="398" width="142" height="58" rx="8" fill="#0f2933" stroke="#60a5fa" stroke-width="1.8"/>
          <text x="443" y="424" text-anchor="middle" fill="#60a5fa" font-family="${FONT_MONO}" font-size="12" font-weight="bold">OVERDAMPED</text>
          <text x="443" y="444" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">SLOW LAG</text>
        </g>`;

    case "hmi-console":
      return `
        <g transform="translate(570, 82)">
          <rect x="16" y="16" width="536" height="458" rx="16" fill="#0f172a" stroke="#475569" stroke-width="3"/>
          <rect x="34" y="36" width="500" height="402" rx="8" fill="#1e293b"/>
          <rect x="34" y="36" width="500" height="38" rx="8" fill="#0f172a"/>
          <text x="52" y="60" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="12" font-weight="bold">LEVEL 2 · UNIT OVERVIEW</text>
          <rect x="375" y="44" width="142" height="22" rx="4" fill="${a2}"/>
          <text x="446" y="59" text-anchor="middle" fill="#0f172a" font-family="${FONT_MONO}" font-size="11" font-weight="bold">1 ABNORMAL ALERT</text>
          ${[
            { x: 54, lbl: "TEMP", val: "72.4°C", h: 108, alert: false },
            { x: 146, lbl: "PRESS", val: "4.8 bar", h: 122, alert: false },
            { x: 238, lbl: "LEVEL", val: "89.2%", h: 175, alert: true },
            { x: 330, lbl: "FLOW", val: "142 m3", h: 98, alert: false },
          ].map((b) => `
            <rect x="${b.x}" y="96" width="76" height="205" rx="6" fill="#0f172a" stroke="${b.alert ? a2 : '#334155'}" stroke-width="${b.alert ? 2.5 : 1.5}"/>
            <rect x="${b.x + 18}" y="148" width="40" height="96" fill="#334155" fill-opacity="0.65"/>
            <rect x="${b.x + 26}" y="${282 - b.h}" width="24" height="${b.h}" rx="3" fill="${b.alert ? a2 : '#94a3b8'}"/>
            <text x="${b.x + 38}" y="116" text-anchor="middle" fill="${b.alert ? a2 : '#94a3b8'}" font-family="${FONT_MONO}" font-size="11" font-weight="bold">${b.lbl}</text>
            <text x="${b.x + 38}" y="295" text-anchor="middle" fill="#e2e8f0" font-family="${FONT_MONO}" font-size="10">${b.val}</text>
          `).join("")}
          <rect x="424" y="96" width="94" height="96" rx="6" fill="#0f172a" stroke="#334155"/>
          <text x="471" y="132" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">STATUS</text>
          <text x="471" y="162" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="15" font-weight="bold">AUTO</text>
          <rect x="424" y="205" width="94" height="96" rx="6" fill="#0f172a" stroke="#334155"/>
          <text x="471" y="241" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">UPTIME</text>
          <text x="471" y="271" text-anchor="middle" fill="#34d399" font-family="${FONT_MONO}" font-size="15" font-weight="bold">99.4%</text>
          <rect x="54" y="318" width="464" height="104" rx="6" fill="#0f172a" stroke="#334155"/>
          <rect x="54" y="346" width="464" height="42" fill="#334155" fill-opacity="0.32"/>
          <path d="M 68 380 L 128 372 L 188 376 L 248 368 L 308 362 L 368 345 L 428 332 L 498 328" fill="none" stroke="${a2}" stroke-width="3"/>
          <path d="M 68 395 L 158 392 L 248 394 L 338 390 L 428 392 L 498 391" fill="none" stroke="${a1}" stroke-width="2.2"/>
          <text x="68" y="336" fill="#94a3b8" font-family="${FONT_MONO}" font-size="10">60-MIN PROCESS TREND WITH NORMAL BAND</text>
        </g>`;

    case "network-ring":
      return `
        <g transform="translate(580, 74)">
          <circle cx="270" cy="255" r="185" fill="none" stroke="${a1}" stroke-width="5" stroke-opacity="0.75"/>
          <circle cx="270" cy="255" r="150" fill="none" stroke="${a2}" stroke-width="2" stroke-dasharray="10 8" stroke-opacity="0.7"/>
          <circle cx="270" cy="255" r="72" fill="#0f172a" stroke="${a1}" stroke-width="3"/>
          <text x="270" y="248" text-anchor="middle" fill="#f8fafc" font-family="${FONT_MONO}" font-size="15" font-weight="bold">REAL-TIME</text>
          <text x="270" y="270" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="12">ETHERNET</text>
          ${[
            { ang: -90, lbl: "PLC MASTER", c: a2 },
            { ang: -30, lbl: "SERVO AXIS", c: a1 },
            { ang: 30, lbl: "REMOTE I/O", c: "#34d399" },
            { ang: 90, lbl: "SAFETY I/O", c: a2 },
            { ang: 150, lbl: "HMI PANEL", c: a1 },
            { ang: 210, lbl: "EDGE SWITCH", c: "#34d399" },
          ].map((n) => {
            const rad = (n.ang * Math.PI) / 180;
            const nx = 270 + Math.cos(rad) * 185;
            const ny = 255 + Math.sin(rad) * 185;
            return `
              <line x1="270" y1="255" x2="${nx}" y2="${ny}" stroke="${n.c}" stroke-opacity="0.28" stroke-width="1.5"/>
              <rect x="${nx - 58}" y="${ny - 24}" width="116" height="48" rx="8" fill="#0f172a" stroke="${n.c}" stroke-width="2.2"/>
              <text x="${nx}" y="${ny + 5}" text-anchor="middle" fill="#e2e8f0" font-family="${FONT_MONO}" font-size="11" font-weight="bold">${n.lbl}</text>
            `;
          }).join("")}
        </g>`;

    case "cyber-shield":
      return `
        <g transform="translate(580, 74)">
          <circle cx="270" cy="255" r="210" fill="${a1}" fill-opacity="0.06" stroke="${a1}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 6"/>
          <circle cx="270" cy="255" r="154" fill="${a1}" fill-opacity="0.09" stroke="${a2}" stroke-opacity="0.65" stroke-width="2.5"/>
          <circle cx="270" cy="255" r="98" fill="#0f172a" fill-opacity="0.92" stroke="${a1}" stroke-width="3"/>
          <path d="M 270 185 L 330 208 V 258 C 330 296 300 322 270 335 C 240 322 210 296 210 258 V 208 Z" fill="${a1}" fill-opacity="0.18" stroke="${a1}" stroke-width="3"/>
          <text x="270" y="256" text-anchor="middle" fill="#f8fafc" font-family="${FONT_MONO}" font-size="17" font-weight="bold">OT CORE</text>
          <text x="270" y="278" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="11">SL 2–4</text>
          <rect x="200" y="34" width="140" height="34" rx="6" fill="#0f172a" stroke="${a1}"/><text x="270" y="56" text-anchor="middle" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="11">ENTERPRISE / IT</text>
          <rect x="378" y="238" width="132" height="34" rx="6" fill="#0f172a" stroke="${a2}"/><text x="444" y="260" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="11" font-weight="bold">IDMZ CONDUIT</text>
          <rect x="28" y="238" width="132" height="34" rx="6" fill="#0f172a" stroke="${a2}"/><text x="94" y="260" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="11" font-weight="bold">ZERO TRUST</text>
          <rect x="195" y="446" width="150" height="34" rx="6" fill="#0f172a" stroke="#34d399"/><text x="270" y="468" text-anchor="middle" fill="#34d399" font-family="${FONT_MONO}" font-size="11">LEVEL 0–1 CELLS</text>
        </g>`;

    case "cyber-advisory":
      return `
        <g transform="translate(575, 76)">
          <circle cx="275" cy="245" r="205" fill="${a1}" fill-opacity="0.07" stroke="${a1}" stroke-opacity="0.35" stroke-width="2"/>
          <circle cx="275" cy="245" r="145" fill="${a1}" fill-opacity="0.09" stroke="${a1}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="6 5"/>
          <circle cx="275" cy="245" r="85" fill="#1f0d14" stroke="${a1}" stroke-width="3"/>
          <polygon points="275,182 332,282 218,282" fill="${a1}" fill-opacity="0.22" stroke="${a1}" stroke-width="4" stroke-linejoin="round"/>
          <rect x="271" y="216" width="8" height="36" rx="4" fill="#fef2f2"/>
          <circle cx="275" cy="267" r="5" fill="#fef2f2"/>
          <line x1="70" y1="245" x2="480" y2="245" stroke="${a1}" stroke-opacity="0.22" stroke-width="1.5"/>
          <line x1="275" y1="40" x2="275" y2="450" stroke="${a1}" stroke-opacity="0.22" stroke-width="1.5"/>
          <rect x="52" y="54" width="186" height="44" rx="8" fill="#0f172a" stroke="${a1}" stroke-width="2"/>
          <text x="145" y="81" text-anchor="middle" fill="#fecaca" font-family="${FONT_MONO}" font-size="12" font-weight="bold">ICS SECURITY ALERT</text>
          <rect x="330" y="394" width="186" height="44" rx="8" fill="#0f172a" stroke="${a2}" stroke-width="2"/>
          <text x="423" y="421" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="12" font-weight="bold">OT MITIGATION ACTIVE</text>
        </g>`;

    case "robot-arm":
      return `
        <g transform="translate(575, 72)">
          <path d="M 85 450 A 220 220 0 0 1 510 450" fill="${a2}" fill-opacity="0.08" stroke="${a2}" stroke-opacity="0.45" stroke-width="2" stroke-dasharray="8 6"/>
          <path d="M 155 450 A 150 150 0 0 1 440 450" fill="${a1}" fill-opacity="0.1" stroke="${a1}" stroke-opacity="0.65" stroke-width="2"/>
          <rect x="180" y="438" width="140" height="36" rx="6" fill="#1e293b" stroke="${a1}" stroke-width="2.5"/>
          <rect x="212" y="395" width="76" height="45" rx="6" fill="#0f172a" stroke="${a1}" stroke-width="2.5"/>
          <line x1="250" y1="395" x2="178" y2="235" stroke="#e2e8f0" stroke-width="26" stroke-linecap="round"/>
          <line x1="250" y1="395" x2="178" y2="235" stroke="${a1}" stroke-width="6" stroke-linecap="round"/>
          <line x1="178" y1="235" x2="365" y2="148" stroke="#cbd5e1" stroke-width="20" stroke-linecap="round"/>
          <line x1="178" y1="235" x2="365" y2="148" stroke="${a2}" stroke-width="5" stroke-linecap="round"/>
          <line x1="365" y1="148" x2="438" y2="215" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <path d="M 438 215 L 468 205 L 486 226 M 438 215 L 446 248 L 474 252" fill="none" stroke="${a1}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          ${[[250,395,22],[178,235,20],[365,148,16],[438,215,12]].map(([jx,jy,jr]) => `
            <circle cx="${jx}" cy="${jy}" r="${jr}" fill="#0f172a" stroke="${a1}" stroke-width="3.5"/>
            <circle cx="${jx}" cy="${jy}" r="${Math.max(4, jr/3)}" fill="${a2}"/>
          `).join("")}
          <rect x="445" y="285" width="66" height="46" rx="6" fill="#1e293b" stroke="${a2}" stroke-width="2"/>
          <text x="478" y="313" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="11" font-weight="bold">CELL</text>
          <text x="298" y="505" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12">6-AXIS KINEMATICS · ISO 10218 SAFETY ZONE</text>
        </g>`;

    case "uns-hub":
      return `
        <g transform="translate(575, 74)">
          ${[
            { x: 96, y: 95, t: "PLC / CNC", s: "OPC UA", c: a2 },
            { x: 444, y: 95, t: "MES / ERP", s: "ISA-95", c: a1 },
            { x: 76, y: 265, t: "EDGE GW", s: "BUFFER", c: "#34d399" },
            { x: 464, y: 265, t: "HISTORIAN", s: "TIME SERIES", c: a2 },
            { x: 112, y: 430, t: "SCADA", s: "REAL-TIME", c: a1 },
            { x: 430, y: 430, t: "AI / BI", s: "ANALYTICS", c: "#34d399" },
          ].map((n) => `
            <line x1="270" y1="262" x2="${n.x}" y2="${n.y}" stroke="${n.c}" stroke-width="2.5" stroke-dasharray="6 4" stroke-opacity="0.75"/>
            <rect x="${n.x - 66}" y="${n.y - 30}" width="132" height="60" rx="10" fill="#0f172a" fill-opacity="0.94" stroke="${n.c}" stroke-width="2"/>
            <text x="${n.x}" y="${n.y - 3}" text-anchor="middle" fill="#f8fafc" font-family="${FONT_MONO}" font-size="12" font-weight="bold">${n.t}</text>
            <text x="${n.x}" y="${n.y + 16}" text-anchor="middle" fill="${n.c}" font-family="${FONT_MONO}" font-size="10">${n.s}</text>
          `).join("")}
          <circle cx="270" cy="262" r="76" fill="#0f172a" stroke="${a1}" stroke-width="4"/>
          <circle cx="270" cy="262" r="62" fill="${a1}" fill-opacity="0.14" stroke="${a2}" stroke-width="1.5" stroke-dasharray="5 4"/>
          <text x="270" y="256" text-anchor="middle" fill="#ffffff" font-family="${FONT_MONO}" font-size="16" font-weight="bold">MQTT UNS</text>
          <text x="270" y="278" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="11">EVENT BROKER</text>
        </g>`;

    case "oee-analytics":
      return `
        <g transform="translate(570, 82)">
          <rect x="16" y="18" width="535" height="475" rx="14" fill="#091822" fill-opacity="0.92" stroke="${a1}" stroke-opacity="0.45" stroke-width="2"/>
          ${[
            { x: 58, h: 255, lbl: "PLAN", val: "100%", c: "#64748b" },
            { x: 146, h: 228, lbl: "AVAIL", val: "90%", c: a1 },
            { x: 234, h: 204, lbl: "PERF", val: "90%", c: "#38bdf8" },
            { x: 322, h: 196, lbl: "QUAL", val: "98%", c: "#34d399" },
            { x: 410, h: 188, lbl: "OEE", val: "79.4%", c: a2 },
          ].map((b) => `
            <rect x="${b.x}" y="${348 - b.h}" width="64" height="${b.h}" rx="6" fill="${b.c}" fill-opacity="0.82"/>
            <text x="${b.x + 32}" y="${336 - b.h}" text-anchor="middle" fill="#f8fafc" font-family="${FONT_MONO}" font-size="13" font-weight="bold">${b.val}</text>
            <text x="${b.x + 32}" y="374" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12">${b.lbl}</text>
          `).join("")}
          <path d="M 55 438 L 115 438 L 135 404 L 155 438 L 220 438 L 240 392 L 260 438 L 325 438 L 345 412 L 365 438 L 495 438" fill="none" stroke="${a2}" stroke-width="2.5"/>
          <text x="58" y="468" fill="#94a3b8" font-family="${FONT_MONO}" font-size="11">LIVE PLC TELEMETRY · SPECTRUM &amp; PERFORMANCE ANALYTICS</text>
        </g>`;

    case "regulation-seal":
      return `
        <g transform="translate(585, 76)">
          <circle cx="270" cy="248" r="196" fill="${a1}" fill-opacity="0.06" stroke="${a1}" stroke-opacity="0.4" stroke-width="2"/>
          <circle cx="270" cy="248" r="146" fill="#0f172a" fill-opacity="0.9" stroke="${a2}" stroke-width="2.8"/>
          ${Array.from({length: 12}, (_, i) => {
            const ang = (i * 30 - 90) * Math.PI / 180;
            const sx = 270 + Math.cos(ang) * 172;
            const sy = 248 + Math.sin(ang) * 172;
            return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5.5" fill="${a2}"/>`;
          }).join("")}
          <text x="270" y="222" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="14" font-weight="bold">CONFORMITY</text>
          <text x="270" y="264" text-anchor="middle" fill="#ffffff" font-family="${FONT_SANS}" font-size="40" font-weight="bold">EU / IEC</text>
          <text x="270" y="298" text-anchor="middle" fill="${a1}" font-family="${FONT_MONO}" font-size="13">MANDATORY COMPLIANCE</text>
          <rect x="65" y="462" width="122" height="36" rx="6" fill="#0f172a" stroke="${a1}"/><text x="126" y="485" text-anchor="middle" fill="#e2e8f0" font-family="${FONT_MONO}" font-size="12">2026 LIVE</text>
          <line x1="187" y1="480" x2="218" y2="480" stroke="${a2}" stroke-width="2.5"/>
          <rect x="218" y="462" width="122" height="36" rx="6" fill="#0f172a" stroke="${a2}"/><text x="279" y="485" text-anchor="middle" fill="${a2}" font-family="${FONT_MONO}" font-size="12" font-weight="bold">JAN 2027</text>
          <line x1="340" y1="480" x2="371" y2="480" stroke="${a2}" stroke-width="2.5"/>
          <rect x="371" y="462" width="122" height="36" rx="6" fill="#0f172a" stroke="#34d399"/><text x="432" y="485" text-anchor="middle" fill="#34d399" font-family="${FONT_MONO}" font-size="12">DEC 2027</text>
        </g>`;

    case "supply-bench":
    default:
      return `
        <g transform="translate(570, 82)">
          <rect x="16" y="20" width="535" height="290" rx="14" fill="#0f172a" fill-opacity="0.92" stroke="${a1}" stroke-opacity="0.55" stroke-width="2"/>
          <text x="42" y="54" fill="${a1}" font-family="${FONT_MONO}" font-size="13" font-weight="bold">AUTOMATION LOAD-TEST BENCH · VERIFIED QC</text>
          ${[
            { x: 40, t: "DRIVE RIG", s: "400V LOAD", p: "PASS", c: "#34d399" },
            { x: 206, t: "CNC RACK", s: "I/O + BUS", p: "PASS", c: a2 },
            { x: 372, t: "BURN-IN", s: "THERMAL", p: "100%", c: a1 },
          ].map((b) => `
            <rect x="${b.x}" y="78" width="152" height="206" rx="10" fill="#1e293b" stroke="${b.c}" stroke-opacity="0.65" stroke-width="1.8"/>
            <text x="${b.x + 76}" y="112" text-anchor="middle" fill="#f8fafc" font-family="${FONT_MONO}" font-size="14" font-weight="bold">${b.t}</text>
            <text x="${b.x + 76}" y="134" text-anchor="middle" fill="#94a3b8" font-family="${FONT_MONO}" font-size="11">${b.s}</text>
            <circle cx="${b.x + 76}" cy="192" r="34" fill="#0f172a" stroke="${b.c}" stroke-width="3"/>
            <text x="${b.x + 76}" y="198" text-anchor="middle" fill="${b.c}" font-family="${FONT_MONO}" font-size="14" font-weight="bold">${b.p}</text>
            <rect x="${b.x + 24}" y="246" width="104" height="16" rx="4" fill="#0f172a"/>
            <rect x="${b.x + 24}" y="246" width="88" height="16" rx="4" fill="${b.c}" fill-opacity="0.75"/>
          `).join("")}
          <rect x="16" y="334" width="535" height="156" rx="14" fill="#0b1526" fill-opacity="0.92" stroke="${a2}" stroke-opacity="0.5" stroke-width="2"/>
          <path d="M 48 430 Q 170 355 290 420 T 518 395" fill="none" stroke="${a2}" stroke-width="3" stroke-dasharray="8 5"/>
          <circle cx="48" cy="430" r="8" fill="${a1}"/><circle cx="290" cy="420" r="8" fill="${a2}"/><circle cx="518" cy="395" r="8" fill="#34d399"/>
          <text x="42" y="370" fill="#cbd5e1" font-family="${FONT_MONO}" font-size="12" font-weight="bold">ESD PACKAGING · SERIAL TRACEABILITY · GLOBAL DISPATCH</text>
          <text x="42" y="468" fill="#94a3b8" font-family="${FONT_MONO}" font-size="11">KUNSHAN FACILITY → NORTH AMERICA · EUROPE · ASIA-PACIFIC</text>
        </g>`;
  }
}

export function renderCoverSvg(article) {
  const { cover, category, slug } = article;
  const pal = CAT_PALETTES[category] || CAT_PALETTES["plc-controllers"];
  const seed = hashStr(slug);
  const a1 = cover.accent || "#38bdf8";
  const a2 = cover.accent2 || "#f59e0b";
  const glowX = 820 + (seed % 160);
  const glowY = 220 + (seed % 140);

  let dots = "";
  for (let gx = 40; gx < 1200; gx += 44) {
    for (let gy = 40; gy < 675; gy += 44) {
      dots += `<circle cx="${gx}" cy="${gy}" r="1.1" fill="#94a3b8" fill-opacity="0.16"/>`;
    }
  }

  const subLines = wrapLines(cover.subtitle, 44);
  let chipX = 64;
  const chipY = subLines.length > 1 ? 424 : 404;
  const chipsSvg = (cover.chips || []).slice(0, 3).map((chip) => {
    const w = Math.max(106, chip.length * 8.2 + 24);
    const out = `
      <rect x="${chipX}" y="${chipY}" width="${w}" height="32" rx="6" fill="#0f172a" fill-opacity="0.72" stroke="${a1}" stroke-opacity="0.6" stroke-width="1.4"/>
      <text x="${chipX + w / 2}" y="${chipY + 21}" text-anchor="middle" fill="#e2e8f0" font-family="${FONT_MONO}" font-size="11.5" font-weight="bold">${esc(chip)}</text>`;
    chipX += w + 10;
    return out;
  }).join("");

  const titleSize = Math.max(cover.titleLine1.length, cover.titleLine2.length) > 15 ? 42 : 46;

  return fixBareAmps(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${pal.bg1}"/>
      <stop offset="55%" stop-color="${pal.bg2}"/>
      <stop offset="100%" stop-color="${pal.bg3}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${a1}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${a1}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${a2}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${a2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="leftVignette" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#050b16" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#050b16" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#050b16" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="675" fill="url(#bgGrad)"/>
  <circle cx="${glowX}" cy="${glowY}" r="360" fill="url(#glow1)"/>
  <circle cx="220" cy="540" r="280" fill="url(#glow2)"/>
  ${dots}
  <rect width="1200" height="675" fill="url(#leftVignette)"/>

  <rect x="0" y="0" width="1200" height="6" fill="${a1}"/>
  <rect x="0" y="0" width="320" height="6" fill="${a2}"/>

  ${renderMotif(cover.motif, a1, a2, seed)}

  <g>
    <rect x="64" y="54" width="10" height="32" rx="2.5" fill="#f59e0b"/>
    <text x="86" y="77" fill="#f8fafc" font-family="${FONT_SANS}" font-size="22" font-weight="bold" letter-spacing="0.5">INDUQORA</text>
    <text x="234" y="76" fill="#94a3b8" font-family="${FONT_MONO}" font-size="12" letter-spacing="1.5">ENGINEERING BRIEF</text>

    <rect x="64" y="132" width="${Math.min(460, cover.kicker.length * 8.6 + 28)}" height="30" rx="15" fill="${a1}" fill-opacity="0.16" stroke="${a1}" stroke-opacity="0.65" stroke-width="1.3"/>
    <text x="80" y="152" fill="${a1}" font-family="${FONT_MONO}" font-size="12" font-weight="bold" letter-spacing="1">${esc(cover.kicker)}</text>

    <text x="64" y="240" fill="#ffffff" font-family="${FONT_SANS}" font-size="${titleSize}" font-weight="bold">${esc(cover.titleLine1)}</text>
    <text x="64" y="298" fill="${a2}" font-family="${FONT_SANS}" font-size="${titleSize}" font-weight="bold">${esc(cover.titleLine2)}</text>

    <rect x="64" y="324" width="84" height="4" rx="2" fill="${a1}"/>
    ${subLines.map((line, i) => `<text x="64" y="${362 + i * 26}" fill="#cbd5e1" font-family="${FONT_SANS}" font-size="16">${esc(line)}</text>`).join("")}

    ${chipsSvg}
  </g>

  <text x="64" y="636" fill="#64748b" font-family="${FONT_MONO}" font-size="12">WWW.INDUQORA.COM</text>
  <line x1="210" y1="632" x2="480" y2="632" stroke="#334155" stroke-width="1"/>
</svg>`);
}
