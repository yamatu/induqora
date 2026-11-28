// Bespoke light-canvas engineering diagrams (Part A: Motion, PLC, Process/DCS, SCADA/HMI, Networking)
// Canvas working area inside diagram frame: x=36..1164, y=104..576 (width 1128, height 472)

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function box(x, y, w, h, { fill = "#ffffff", stroke = "#cbd5e1", sw = 1.6, rx = 10 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

export function renderDiagramBodyA(d) {
  switch (d.type) {
    case "dc-bus-architecture":
      return `
        <!-- 3-Phase Input -->
        ${box(44, 170, 152, 165, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <text x="120" y="206" text-anchor="middle" fill="#0b5cad" font-family="${SANS}" font-size="14" font-weight="bold">3-Phase Mains</text>
        <text x="120" y="230" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="13">400V AC · L1/L2/L3</text>
        <text x="120" y="254" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="12">Breaker + Line Reactor</text>
        <rect x="64" y="274" width="112" height="42" rx="6" fill="#fff7ed" stroke="#f59e0b"/>
        <text x="120" y="294" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="11" font-weight="bold">PRE-CHARGE</text>
        <text x="120" y="309" text-anchor="middle" fill="#92400e" font-family="${SANS}" font-size="10">Resistor + Bypass</text>

        <line x1="196" y1="252" x2="236" y2="252" stroke="#0b5cad" stroke-width="3" marker-end="url(#arrBlue)"/>

        <!-- Power Supply Module -->
        ${box(242, 145, 200, 215, { fill: "#f0fdf4", stroke: "#059669", sw: 2.2 })}
        <rect x="242" y="145" width="200" height="34" rx="10" fill="#059669"/>
        <text x="342" y="167" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="13" font-weight="bold">POWER SUPPLY (PSM)</text>
        <text x="342" y="206" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="13" font-weight="bold">Active / Diode Rectifier</text>
        <text x="342" y="228" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="12">Converts AC → DC Link</text>
        <text x="342" y="248" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="12">Regen to Grid or Resistor</text>
        <rect x="262" y="270" width="160" height="70" rx="6" fill="#ffffff" stroke="#a7f3d0"/>
        <text x="342" y="292" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">DC CAP BANK TEST</text>
        <text x="342" y="311" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="11">Ripple &lt; 15V p-p</text>
        <text x="342" y="329" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10">Wait &lt;50V before service</text>

        <!-- Common DC Bus Rails -->
        <line x1="442" y1="185" x2="1085" y2="185" stroke="#d97706" stroke-width="6" stroke-linecap="round"/>
        <line x1="442" y1="208" x2="1085" y2="208" stroke="#0b5cad" stroke-width="6" stroke-linecap="round"/>
        <rect x="478" y="128" width="560" height="42" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="758" y="154" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="13" font-weight="bold">COMMON DC BUS: 560V DC Nominal  |  OV Trip &gt; 760V  |  UV Trip &lt; 430V</text>

        <!-- Connected Drive Amplifiers -->
        ${[
          { x: 478, w: 185, name: "SPINDLE AMP (SPM)", sub: "Closed-Loop Vector", load: "Spindle Motor + Sensor", c: "#0b5cad", bg: "#eff6ff" },
          { x: 682, w: 185, name: "SERVO AMP (SVM-X/Y)", sub: "Dual / Triple Axis", load: "Feed Axis Motors", c: "#0369a1", bg: "#f0f9ff" },
          { x: 886, w: 195, name: "REGEN / BRAKE UNIT", sub: "Chopper IGBT + Resistor", load: "Absorbs Decel Energy", c: "#b45309", bg: "#fffbeb" },
        ].map((m) => `
          <line x1="${m.x + 52}" y1="185" x2="${m.x + 52}" y2="250" stroke="#d97706" stroke-width="3"/>
          <line x1="${m.x + 124}" y1="208" x2="${m.x + 124}" y2="250" stroke="#0b5cad" stroke-width="3"/>
          <circle cx="${m.x + 52}" cy="185" r="5" fill="#d97706"/>
          <circle cx="${m.x + 124}" cy="208" r="5" fill="#0b5cad"/>
          ${box(m.x, 250, m.w, 128, { fill: m.bg, stroke: m.c, sw: 2 })}
          <text x="${m.x + m.w/2}" y="280" text-anchor="middle" fill="${m.c}" font-family="${MONO}" font-size="12" font-weight="bold">${m.name}</text>
          <text x="${m.x + m.w/2}" y="304" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12">${m.sub}</text>
          <rect x="${m.x + 14}" y="322" width="${m.w - 28}" height="38" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="${m.x + m.w/2}" y="346" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="11" font-weight="bold">${m.load}</text>
        `).join("")}

        <!-- Bottom Diagnostic Voltage Band -->
        ${box(44, 412, 1112, 146, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="440" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">DC Bus Voltage Diagnostic Bands (400V AC 3-Phase Class)</text>
        <rect x="68" y="458" width="220" height="46" rx="6" fill="#fee2e2" stroke="#dc2626"/>
        <text x="178" y="479" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="12" font-weight="bold">&lt; 430V DC · UNDERVOLTAGE</text>
        <text x="178" y="496" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="11">Phase loss / pre-charge fault</text>

        <rect x="302" y="458" width="380" height="46" rx="6" fill="#dcfce7" stroke="#059669"/>
        <text x="492" y="479" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">510V – 620V DC · NORMAL OPERATING WINDOW</text>
        <text x="492" y="496" text-anchor="middle" fill="#064e3b" font-family="${SANS}" font-size="11">Nominal ~565V DC (√2 × 400V) · Stable ripple</text>

        <rect x="696" y="458" width="190" height="46" rx="6" fill="#fef3c7" stroke="#d97706"/>
        <text x="791" y="479" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="12" font-weight="bold">660V – 740V · REGEN</text>
        <text x="791" y="496" text-anchor="middle" fill="#78350f" font-family="${SANS}" font-size="11">Chopper / grid regen active</text>

        <rect x="900" y="458" width="232" height="46" rx="6" fill="#fee2e2" stroke="#dc2626"/>
        <text x="1016" y="479" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="12" font-weight="bold">&gt; 760V DC · OVERVOLTAGE</text>
        <text x="1016" y="496" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="11">Open brake resistor / fast decel</text>

        <text x="68" y="538" fill="#475569" font-family="${SANS}" font-size="12">Field Tip: When a single common-bus alarm drops all axes simultaneously, test the PSM pre-charge relay, mains phase balance, and braking circuit before swapping axis amplifiers.</text>
      `;

    case "arrhenius-mro": {
      // Left: Real exponential Arrhenius curve (halving every 10°C: 45°C->100k, 55°C->50k, 65°C->25k, 75°C->12.5k, 85°C->6.25k)
      const pts = [];
      for (let t = 40; t <= 85; t += 1) {
        const life = 100 * Math.pow(0.5, (t - 45) / 10);
        const clamped = Math.min(130, life);
        const px = 110 + ((t - 40) / 45) * 440;
        const py = 475 - (clamped / 130) * 300;
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      const markers = [
        { t: 45, k: "100k h", yr: "~11.4 yrs", c: "#059669" },
        { t: 55, k: "50k h", yr: "~5.7 yrs", c: "#0b5cad" },
        { t: 65, k: "25k h", yr: "~2.8 yrs", c: "#d97706" },
        { t: 75, k: "12.5k h", yr: "~1.4 yrs", c: "#ea580c" },
        { t: 85, k: "6.2k h", yr: "~8.5 mo", c: "#dc2626" },
      ];
      return `
        <!-- Left Panel: Arrhenius Curve -->
        ${box(44, 114, 540, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Electrolytic Capacitor Life vs. Cabinet Temperature</text>
        <text x="68" y="166" fill="#64748b" font-family="${SANS}" font-size="12">Arrhenius 10°C rule: L = L₀ × 2^((T_max − T_actual) / 10)</text>
        <line x1="110" y1="185" x2="110" y2="475" stroke="#64748b" stroke-width="1.8"/>
        <line x1="110" y1="475" x2="555" y2="475" stroke="#64748b" stroke-width="1.8"/>
        ${[25, 50, 75, 100].map((v) => {
          const y = 475 - (v / 130) * 300;
          return `<line x1="110" y1="${y.toFixed(1)}" x2="555" y2="${y.toFixed(1)}" stroke="#e2e8f0"/><text x="102" y="${(y+4).toFixed(1)}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="11">${v}k h</text>`;
        }).join("")}
        <polyline points="${pts.join(" ")}" fill="none" stroke="#0b5cad" stroke-width="3.5"/>
        ${markers.map((m) => {
          const life = 100 * Math.pow(0.5, (m.t - 45) / 10);
          const px = 110 + ((m.t - 40) / 45) * 440;
          const py = 475 - (life / 130) * 300;
          return `
            <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="${m.c}" stroke="#fff" stroke-width="2"/>
            <text x="${(px + 8).toFixed(1)}" y="${(py - 8).toFixed(1)}" fill="${m.c}" font-family="${MONO}" font-size="11" font-weight="bold">${m.k} (${m.yr})</text>
            <text x="${px.toFixed(1)}" y="495" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">${m.t}°C</text>
          `;
        }).join("")}
        <text x="332" y="532" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12" font-weight="bold">Control Cabinet Ambient Temperature (°C)</text>

        <!-- Right Panel: Top 5 Control Board Failure Drivers -->
        ${box(608, 114, 548, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="632" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Primary Control Board, PLC &amp; HMI Failure Drivers</text>
        <text x="632" y="166" fill="#64748b" font-family="${SANS}" font-size="12">Field MRO inspection priorities &amp; preventive controls</text>
        ${[
          { y: 196, name: "1. Electrolytic Cap Dry-Out (ESR Rise)", pct: 88, fix: "Keep cabinet &lt;40°C; recap aged 7–10 yr power boards", c: "#dc2626" },
          { y: 266, name: "2. Cooling Fan & Filter Clogging", pct: 74, fix: "Clean/replace filters quarterly; monitor fan tach alarms", c: "#ea580c" },
          { y: 336, name: "3. Backup Battery & NVRAM Loss", pct: 62, fix: "Replace 3V lithium cells under power every 2–3 years", c: "#d97706" },
          { y: 406, name: "4. Optocoupler & Relay Contact Wear", pct: 52, fix: "Use interposing relays for inductive solenoid/brake loads", c: "#0b5cad" },
          { y: 476, name: "5. Latent ESD Damage (IEC 61340-5-1)", pct: 40, fix: "Wrist strap + static mat + shielded bags on every swap", c: "#059669" },
        ].map((r) => `
          <text x="632" y="${r.y}" fill="#0f172a" font-family="${SANS}" font-size="13" font-weight="bold">${r.name}</text>
          <rect x="632" y="${r.y + 8}" width="496" height="14" rx="4" fill="#f1f5f9"/>
          <rect x="632" y="${r.y + 8}" width="${Math.round(496 * r.pct / 100)}" height="14" rx="4" fill="${r.c}" fill-opacity="0.85"/>
          <text x="632" y="${r.y + 39}" fill="#475569" font-family="${SANS}" font-size="11.5">${r.fix}</text>
        `).join("")}
      `;
    }

    case "servo-fault-flow":
      return `
        ${[
          { x: 44, n: "STEP 1", t: "Capture Alarm", b: "Log exact fault code,\naxis state, and whether\nfault triggers at power-up,\nenable, or decel.", c: "#0b5cad", bg: "#eff6ff" },
          { x: 268, n: "STEP 2", t: "Verify Mains & Bus", b: "Check 3-phase input\nbalance & DC bus level.\nConfirm <50V DC before\nopening power terminals.", c: "#0369a1", bg: "#f0f9ff" },
          { x: 492, n: "STEP 3", t: "Isolate Motor Load", b: "Disconnect U/V/W leads\nat drive. Re-enable:\nfault stays = drive IGBT;\nfault clears = motor/cable.", c: "#d97706", bg: "#fffbeb" },
          { x: 716, n: "STEP 4", t: "Megger & Encoder", b: "500V DC megger motor\nwindings (>100 MΩ),\ncheck brake & shielded\nencoder cable continuity.", c: "#059669", bg: "#f0fdf4" },
          { x: 940, n: "STEP 5", t: "Repair / Replace", b: "Swap verified spare or\nschedule board-level\nrepair; fix root coolant\nor brake cause first.", c: "#7c3aed", bg: "#f5f3ff" },
        ].map((s, i) => `
          ${box(s.x, 132, 206, 250, { fill: s.bg, stroke: s.c, sw: 2 })}
          <rect x="${s.x}" y="132" width="206" height="36" rx="10" fill="${s.c}"/>
          <text x="${s.x + 103}" y="155" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">${s.n}</text>
          <text x="${s.x + 103}" y="196" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">${s.t}</text>
          ${s.b.split("\n").map((line, li) => `<text x="${s.x + 103}" y="${228 + li * 24}" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12.5">${esc(line)}</text>`).join("")}
          ${i < 4 ? `<line x1="${s.x + 206}" y1="257" x2="${s.x + 220}" y2="257" stroke="#475569" stroke-width="2.5" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}

        <!-- Bottom Quick Alarm Verdict Strip -->
        ${box(44, 412, 1112, 146, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="442" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">Common Servo Alarm Signatures &amp; Primary Suspects</text>
        ${[
          { x: 68, k: "OVERCURRENT (OC)", v: "Shorted motor cable, ground fault, locked brake, or blown IGBT", c: "#dc2626" },
          { x: 342, k: "OVERVOLTAGE (OV)", v: "Open regen resistor, failed brake chopper, or aggressive decel ramp", c: "#d97706" },
          { x: 616, k: "ENCODER / FEEDBACK", v: "Coolant ingress in connector, EMI shield break, or dead battery", c: "#0b5cad" },
          { x: 890, k: "OVERLOAD (OL)", v: "Binding ballscrew/way, wrong tuning gain, or dragging brake", c: "#059669" },
        ].map((q) => `
          <rect x="${q.x}" y="458" width="256" height="82" rx="8" fill="#ffffff" stroke="${q.c}" stroke-width="1.5"/>
          <text x="${q.x + 14}" y="482" fill="${q.c}" font-family="${MONO}" font-size="11.5" font-weight="bold">${q.k}</text>
          <text x="${q.x + 14}" y="504" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(q.v.slice(0, 34))}</text>
          <text x="${q.x + 14}" y="523" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(q.v.slice(34).trim())}</text>
        `).join("")}
      `;

    case "vfd-vs-servo-curves":
      return `
        <!-- Left Chart -->
        ${box(44, 114, 680, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="72" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Torque-Speed Envelopes (% of Rated Continuous Torque)</text>
        <line x1="114" y1="176" x2="114" y2="486" stroke="#475569" stroke-width="2"/>
        <line x1="114" y1="486" x2="688" y2="486" stroke="#475569" stroke-width="2"/>
        ${[100, 200, 300].map((v) => {
          const y = 486 - (v / 330) * 290;
          return `<line x1="114" y1="${y.toFixed(1)}" x2="688" y2="${y.toFixed(1)}" stroke="#e2e8f0"/><text x="104" y="${(y+4).toFixed(1)}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="11">${v}%</text>`;
        }).join("")}
        <!-- Servo Peak Region -->
        <path d="M 114 222 L 455 222 Q 555 232 630 358 L 630 398 L 114 398 Z" fill="#dbeafe" fill-opacity="0.72"/>
        <path d="M 114 222 L 455 222 Q 555 232 630 358" fill="none" stroke="#0b5cad" stroke-width="3.5"/>
        <text x="134" y="208" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">AC SERVO INTERMITTENT PEAK ZONE (250–300%)</text>
        <!-- Servo Continuous -->
        <path d="M 114 398 L 485 398 L 630 436" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="7 5"/>
        <text x="134" y="388" fill="#0369a1" font-family="${MONO}" font-size="11.5" font-weight="bold">AC Servo Continuous Rated (Flat to 0 RPM)</text>
        <!-- VFD Induction Curve -->
        <path d="M 114 432 Q 160 404 220 402 L 415 402 Q 525 415 660 456" fill="none" stroke="#ea580c" stroke-width="3.8"/>
        <text x="435" y="454" fill="#c2410c" font-family="${MONO}" font-size="11.5" font-weight="bold">VFD Field-Weakening</text>
        <text x="128" y="456" fill="#c2410c" font-family="${SANS}" font-size="11">Low-speed derating</text>
        <!-- Base Speed vertical marker -->
        <line x1="415" y1="184" x2="415" y2="486" stroke="#94a3b8" stroke-dasharray="5 5"/>
        <text x="415" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">Rated / Base Speed</text>
        <text x="114" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">0 RPM</text>
        <text x="640" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">Max Speed</text>
        <text x="400" y="536" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12" font-weight="bold">Shaft Speed (RPM)</text>

        <!-- Right Decision Card -->
        ${box(748, 114, 408, 444, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="772" y="148" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Engineering Selection Summary</text>
        ${[
          { y: 174, k: "AC SERVO DRIVE + PM MOTOR", c: "#0b5cad", bg: "#eff6ff", items: ["• Positioning accuracy &lt; 0.01 mm", "• Rapid start/stop &amp; camming sync", "• High-res encoder closed loop", "• Strict load:motor inertia (&lt;= 10:1)"] },
          { y: 368, k: "VFD + INDUCTION MOTOR", c: "#c2410c", bg: "#fff7ed", items: ["• Pumps, fans, conveyors, mixers", "• Continuous speed &amp; energy savings", "• Lower hardware &amp; cabling cost", "• Tolerates high inertia mismatch"] },
        ].map((g) => `
          <rect x="770" y="${g.y}" width="364" height="170" rx="8" fill="${g.bg}" stroke="${g.c}" stroke-width="1.6"/>
          <text x="788" y="${g.y + 28}" fill="${g.c}" font-family="${MONO}" font-size="12" font-weight="bold">${g.k}</text>
          ${g.items.map((it, idx) => `<text x="788" y="${g.y + 58 + idx * 27}" fill="#1e293b" font-family="${SANS}" font-size="12.5">${it}</text>`).join("")}
        `).join("")}
      `;

    case "sto-ss1-sls":
      return `
        ${[
          {
            x: 44, title: "STO · Safe Torque Off", sub: "Uncontrolled Coast (Stop Cat. 0)", c: "#dc2626", bg: "#fef2f2",
            note: "Dual-channel cutoff disables IGBT gate drivers instantly; motor coasts to zero via friction/brake.",
            path: "M 74 218 L 160 218 Q 225 224 315 362 L 372 362",
            extra: `<line x1="160" y1="185" x2="160" y2="372" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/><text x="166" y="200" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">TORQUE OFF</text>`,
          },
          {
            x: 422, title: "SS1 · Safe Stop 1", sub: "Controlled Ramp → STO (Cat. 1)", c: "#d97706", bg: "#fffbeb",
            note: "Drive actively brakes along a monitored decel ramp, then triggers STO at zero speed.",
            path: "M 452 218 L 520 218 L 620 362 L 750 362",
            extra: `<line x1="520" y1="185" x2="520" y2="372" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4"/><line x1="620" y1="185" x2="620" y2="372" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/><text x="526" y="200" fill="#b45309" font-family="${MONO}" font-size="10">RAMP</text><text x="626" y="200" fill="#dc2626" font-family="${MONO}" font-size="10" font-weight="bold">STO</text>`,
          },
          {
            x: 800, title: "SLS · Safely-Limited Speed", sub: "Monitored Setup Speed Envelope", c: "#059669", bg: "#f0fdf4",
            note: "Monitors shaft speed below a safe ceiling during jog/setup; trips STO if threshold is breached.",
            path: "M 830 218 L 892 218 L 950 302 L 1126 302",
            extra: `<line x1="830" y1="286" x2="1128" y2="286" stroke="#059669" stroke-width="2" stroke-dasharray="6 4"/><rect x="955" y="264" width="142" height="18" rx="4" fill="#dcfce7"/><text x="1026" y="277" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="10" font-weight="bold">SLS SPEED LIMIT</text>`,
          },
        ].map((p) => `
          ${box(p.x, 122, 356, 332, { fill: "#ffffff", stroke: p.c, sw: 2 })}
          <rect x="${p.x}" y="122" width="356" height="52" rx="10" fill="${p.bg}"/>
          <text x="${p.x + 18}" y="145" fill="${p.c}" font-family="${MONO}" font-size="13" font-weight="bold">${p.title}</text>
          <text x="${p.x + 18}" y="164" fill="#475569" font-family="${SANS}" font-size="11.5">${p.sub}</text>
          <!-- Velocity vs Time Axes -->
          <line x1="${p.x + 28}" y1="190" x2="${p.x + 28}" y2="365" stroke="#64748b" stroke-width="1.5"/>
          <line x1="${p.x + 28}" y1="365" x2="${p.x + 332}" y2="365" stroke="#64748b" stroke-width="1.5"/>
          <text x="${p.x + 18}" y="278" transform="rotate(-90 ${p.x + 18} 278)" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10">SPEED</text>
          <text x="${p.x + 318}" y="382" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="10">TIME →</text>
          ${p.extra}
          <path d="${p.path}" fill="none" stroke="${p.c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="${p.x + 18}" y="410" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(p.note.slice(0, 48))}</text>
          <text x="${p.x + 18}" y="428" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(p.note.slice(48).trim())}</text>
        `).join("")}

        <!-- Bottom Dual-Channel Gate Hardware Bar -->
        ${box(44, 476, 1112, 84, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="505" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">Critical Vertical-Axis &amp; Maintenance Verification Rule (IEC 61800-5-2)</text>
        <text x="68" y="528" fill="#334155" font-family="${SANS}" font-size="12">1. STO does NOT provide electrical shock isolation (DC bus remains live at ~560V DC).  2. Gravity-loaded vertical axes require Safe Brake Control (SBC) + mechanical brake.</text>
        <text x="68" y="546" fill="#334155" font-family="${SANS}" font-size="12">3. Verify both STO1 &amp; STO2 channels independently after every drive replacement — never leave factory bypass jumpers installed on live machines.</text>
      `;

    case "plc-scan-cycle":
      return `
        <!-- Top Row: 4-Phase Cyclic Scan -->
        <text x="52" y="134" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">1. Four Sequential Phases of a Deterministic PLC Scan</text>
        ${[
          { x: 52, w: 245, n: "PHASE 1", t: "Read Physical Inputs", s: "Snapshot field sensors into\nInput Image Table (I)", c: "#0369a1", bg: "#f0f9ff" },
          { x: 332, w: 260, n: "PHASE 2", t: "Execute Control Logic", s: "Solve LD / FBD / ST top-to-bottom\nusing frozen input image", c: "#0b5cad", bg: "#eff6ff" },
          { x: 627, w: 245, n: "PHASE 3", t: "Update Physical Outputs", s: "Flush Output Image Table (Q)\nto actuators & fieldbus", c: "#059669", bg: "#f0fdf4" },
          { x: 907, w: 245, n: "PHASE 4", t: "Comms & Housekeeping", s: "Service HMI/SCADA packets,\ndiagnostics & reset watchdog", c: "#b45309", bg: "#fffbeb" },
        ].map((p, i) => `
          ${box(p.x, 148, p.w, 114, { fill: p.bg, stroke: p.c, sw: 2 })}
          <text x="${p.x + 16}" y="172" fill="${p.c}" font-family="${MONO}" font-size="11" font-weight="bold">${p.n}</text>
          <text x="${p.x + 16}" y="196" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">${p.t}</text>
          ${p.s.split("\n").map((l, li) => `<text x="${p.x + 16}" y="${220 + li * 18}" fill="#475569" font-family="${SANS}" font-size="11.5">${esc(l)}</text>`).join("")}
          ${i < 3 ? `<line x1="${p.x + p.w}" y1="205" x2="${p.x + p.w + 27}" y2="205" stroke="#475569" stroke-width="2.5" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}

        <!-- Bottom: Worst-Case 2x Scan Timing Diagram + Watchdog -->
        ${box(52, 290, 1100, 268, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="76" y="320" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">2. Worst-Case Response Time (2× Scan Rule) &amp; Watchdog Supervision</text>
        <!-- Scan N -->
        <text x="76" y="356" fill="#475569" font-family="${MONO}" font-size="11" font-weight="bold">SCAN N (T_scan)</text>
        <rect x="210" y="338" width="85" height="34" rx="4" fill="#0369a1"/><text x="252" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11">READ</text>
        <rect x="299" y="338" width="165" height="34" rx="4" fill="#0b5cad"/><text x="381" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11">LOGIC</text>
        <rect x="468" y="338" width="85" height="34" rx="4" fill="#059669"/><text x="510" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11">WRITE</text>
        <rect x="557" y="338" width="60" height="34" rx="4" fill="#b45309"/><text x="587" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="10">SYS</text>
        <!-- Scan N+1 -->
        <rect x="625" y="338" width="85" height="34" rx="4" fill="#0369a1"/><text x="667" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11">READ</text>
        <rect x="714" y="338" width="165" height="34" rx="4" fill="#0b5cad"/><text x="796" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11">LOGIC</text>
        <rect x="883" y="338" width="85" height="34" rx="4" fill="#059669"/><text x="925" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11">WRITE</text>
        <rect x="972" y="338" width="60" height="34" rx="4" fill="#b45309"/><text x="1002" y="359" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="10">SYS</text>

        <!-- Missed input event marker -->
        <line x1="305" y1="378" x2="305" y2="432" stroke="#dc2626" stroke-width="2.2"/>
        <circle cx="305" cy="432" r="5" fill="#dc2626"/>
        <text x="305" y="452" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">Input arrives just AFTER Read N</text>

        <line x1="965" y1="378" x2="965" y2="432" stroke="#059669" stroke-width="2.2"/>
        <circle cx="965" cy="432" r="5" fill="#059669"/>
        <text x="965" y="452" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11" font-weight="bold">Output finally updates at Write N+1</text>

        <!-- Span arrow -->
        <line x1="308" y1="412" x2="958" y2="412" stroke="#0f172a" stroke-width="2.2" marker-end="url(#arrDark)"/>
        <rect x="495" y="396" width="275" height="28" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
        <text x="632" y="415" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="12" font-weight="bold">Worst-Case Latency ≈ 2 × T_scan</text>

        <!-- Watchdog bar -->
        <rect x="76" y="482" width="1048" height="54" rx="8" fill="#fef2f2" stroke="#fca5a5"/>
        <text x="96" y="505" fill="#991b1b" font-family="${MONO}" font-size="12" font-weight="bold">WATCHDOG TIMER LIMIT (e.g. 100–150 ms)</text>
        <text x="96" y="525" fill="#7f1d1d" font-family="${SANS}" font-size="12">If an infinite loop, runaway array search, or comms storm delays scan completion beyond T_watchdog, CPU trips to STOP and forces fail-safe outputs.</text>
      `;

    case "iec-61131-languages":
      return `
        ${[
          {
            x: 44, y: 116, title: "LD · Ladder Diagram", tag: "GRAPHICAL · INTERLOCKS", c: "#0b5cad", bg: "#eff6ff",
            best: "Best for: Discrete safety/machine interlocks & electrician troubleshooting",
            art: `
              <line x1="76" y1="196" x2="76" y2="270" stroke="#0f172a" stroke-width="3"/>
              <line x1="538" y1="196" x2="538" y2="270" stroke="#0f172a" stroke-width="3"/>
              <line x1="76" y1="226" x2="170" y2="226" stroke="#0b5cad" stroke-width="2.5"/>
              <line x1="170" y1="212" x2="170" y2="240" stroke="#0b5cad" stroke-width="3"/>
              <line x1="190" y1="212" x2="190" y2="240" stroke="#0b5cad" stroke-width="3"/>
              <text x="180" y="204" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="10.5">Start_PB</text>
              <line x1="190" y1="226" x2="290" y2="226" stroke="#0b5cad" stroke-width="2.5"/>
              <line x1="290" y1="212" x2="290" y2="240" stroke="#dc2626" stroke-width="3"/>
              <line x1="310" y1="212" x2="310" y2="240" stroke="#dc2626" stroke-width="3"/>
              <line x1="292" y1="238" x2="308" y2="214" stroke="#dc2626" stroke-width="2"/>
              <text x="300" y="204" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="10.5">Fault_NC</text>
              <line x1="310" y1="226" x2="435" y2="226" stroke="#0b5cad" stroke-width="2.5"/>
              <circle cx="452" cy="226" r="14" fill="#dbeafe" stroke="#0b5cad" stroke-width="2.5"/>
              <text x="452" y="204" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="10.5" font-weight="bold">Motor_Run</text>
              <line x1="466" y1="226" x2="538" y2="226" stroke="#0b5cad" stroke-width="2.5"/>
            `,
          },
          {
            x: 608, y: 116, title: "FBD · Function Block Diagram", tag: "GRAPHICAL · SIGNAL FLOW", c: "#059669", bg: "#f0fdf4",
            best: "Best for: Analog scaling, PID loops, drive blocks & safety logic",
            art: `
              <rect x="764" y="192" width="160" height="82" rx="6" fill="#ffffff" stroke="#059669" stroke-width="2"/>
              <rect x="764" y="192" width="160" height="24" rx="6" fill="#059669"/>
              <text x="844" y="208" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11" font-weight="bold">PID_Compact</text>
              <line x1="654" y1="234" x2="764" y2="234" stroke="#334155" stroke-width="2"/>
              <text x="654" y="228" fill="#334155" font-family="${MONO}" font-size="10.5">Temp_SP</text>
              <line x1="654" y1="258" x2="764" y2="258" stroke="#334155" stroke-width="2"/>
              <text x="654" y="252" fill="#334155" font-family="${MONO}" font-size="10.5">Temp_PV</text>
              <line x1="924" y1="244" x2="1032" y2="244" stroke="#059669" stroke-width="2.5"/>
              <text x="1040" y="248" fill="#059669" font-family="${MONO}" font-size="11" font-weight="bold">Valve_Out</text>
            `,
          },
          {
            x: 44, y: 344, title: "ST · Structured Text", tag: "TEXTUAL · MATH & DATA", c: "#7c3aed", bg: "#f5f3ff",
            best: "Best for: Recipes, arrays, math, parsing & complex loops",
            art: `
              <rect x="68" y="408" width="496" height="86" rx="6" fill="#0f172a"/>
              <text x="84" y="432" fill="#c4b5fd" font-family="${MONO}" font-size="12">FOR i := 1 TO 10 DO</text>
              <text x="104" y="454" fill="#e2e8f0" font-family="${MONO}" font-size="12">AvgTemp := AvgTemp + Zone[i].PV / 10.0;</text>
              <text x="84" y="476" fill="#c4b5fd" font-family="${MONO}" font-size="12">END_FOR;</text>
            `,
          },
          {
            x: 608, y: 344, title: "SFC · Sequential Function Chart", tag: "STATE MACHINE · BATCH", c: "#d97706", bg: "#fffbeb",
            best: "Best for: Multi-step machine cycles, PackML & batch sequences",
            art: `
              <rect x="652" y="424" width="110" height="44" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="2.5"/>
              <text x="707" y="450" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11.5" font-weight="bold">S0: IDLE</text>
              <line x1="762" y1="446" x2="830" y2="446" stroke="#334155" stroke-width="2"/>
              <line x1="796" y1="434" x2="796" y2="458" stroke="#0f172a" stroke-width="3.5"/>
              <rect x="830" y="424" width="118" height="44" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
              <text x="889" y="450" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11.5" font-weight="bold">S1: CLAMP</text>
              <line x1="948" y1="446" x2="1014" y2="446" stroke="#334155" stroke-width="2"/>
              <line x1="981" y1="434" x2="981" y2="458" stroke="#0f172a" stroke-width="3.5"/>
              <rect x="1014" y="424" width="118" height="44" rx="4" fill="#dcfce7" stroke="#059669" stroke-width="2"/>
              <text x="1073" y="450" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11.5" font-weight="bold">S2: CYCLE</text>
            `,
          },
        ].map((q) => `
          ${box(q.x, q.y, 548, 210, { fill: "#ffffff", stroke: q.c, sw: 1.8 })}
          <rect x="${q.x}" y="${q.y}" width="548" height="44" rx="10" fill="${q.bg}"/>
          <text x="${q.x + 18}" y="${q.y + 28}" fill="${q.c}" font-family="${SANS}" font-size="15" font-weight="bold">${q.title}</text>
          <text x="${q.x + 530}" y="${q.y + 27}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="11" font-weight="bold">${q.tag}</text>
          ${q.art}
          <text x="${q.x + 18}" y="${q.y + 192}" fill="#334155" font-family="${SANS}" font-size="12">${q.best}</text>
        `).join("")}
      `;

    case "isa-18-2-kpis":
      return `
        <!-- Left: Alarm Rate KPI Thresholds -->
        ${box(44, 118, 640, 440, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">ISA-18.2 / IEC 62682 Operator Alarm Rate Benchmarks</text>
        <text x="68" y="170" fill="#64748b" font-family="${SANS}" font-size="12">Per single operator console under normal steady-state plant operation</text>
        ${[
          { y: 204, lbl: "Alarms per Day", target: "≤ 150 / day", max: "Max manageable: 300 / day", w1: 210, w2: 410, c: "#059669" },
          { y: 302, lbl: "Alarms per Hour", target: "≤ 6 / hour", max: "Max manageable: 12 / hour", w1: 210, w2: 410, c: "#0b5cad" },
          { y: 400, lbl: "Peak 10-Min Window", target: "≤ 1–2 normal", max: "> 10 in 10 min = ALARM FLOOD", w1: 90, w2: 410, c: "#dc2626" },
        ].map((r) => `
          <text x="68" y="${r.y}" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">${r.lbl}</text>
          <rect x="68" y="${r.y + 12}" width="585" height="32" rx="6" fill="#fee2e2"/>
          <rect x="68" y="${r.y + 12}" width="${r.w2}" height="32" rx="6" fill="#fef3c7"/>
          <rect x="68" y="${r.y + 12}" width="${r.w1}" height="32" rx="6" fill="${r.c}"/>
          <text x="80" y="${r.y + 33}" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">${r.target}</text>
          <text x="488" y="${r.y + 33}" fill="#991b1b" font-family="${MONO}" font-size="11" font-weight="bold">OVERLOAD</text>
          <text x="68" y="${r.y + 62}" fill="#475569" font-family="${SANS}" font-size="11.5">${r.max}</text>
        `).join("")}

        <!-- Right: Priority Distribution + Top Nuisance Fixes -->
        ${box(708, 118, 448, 440, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="732" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Target Alarm Priority Distribution</text>
        <text x="732" y="170" fill="#64748b" font-family="${SANS}" font-size="12">Avoid "everything is High priority" fatigue</text>
        <!-- Stacked Horizontal Bar -->
        <rect x="732" y="196" width="320" height="44" rx="6" fill="#0b5cad"/>
        <text x="892" y="223" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">80% LOW</text>
        <rect x="1056" y="196" width="60" height="44" rx="4" fill="#d97706"/>
        <text x="1086" y="223" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11" font-weight="bold">15%</text>
        <rect x="1120" y="196" width="20" height="44" rx="4" fill="#dc2626"/>
        <text x="732" y="262" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">■ 80% Low</text>
        <text x="850" y="262" fill="#d97706" font-family="${MONO}" font-size="11.5" font-weight="bold">■ 15% Medium</text>
        <text x="998" y="262" fill="#dc2626" font-family="${MONO}" font-size="11.5" font-weight="bold">■ 5% High</text>

        <text x="732" y="308" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">5 Engineering Fixes for Bad Actors</text>
        ${[
          "1. Add deadbands & on/off delay timers to chatterers",
          "2. State-based suppression when equipment is OFF",
          "3. Convert status notifications to events (not alarms)",
          "4. Require a documented operator action per alarm",
          "5. Track Top-10 bad actors weekly in KPI audits",
        ].map((t, i) => `
          <rect x="732" y="${324 + i * 42}" width="400" height="34" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
          <text x="746" y="${346 + i * 42}" fill="#334155" font-family="${SANS}" font-size="12">${t}</text>
        `).join("")}
      `;

    case "pid-response-curves": {
      const plotX = (t) => 112 + (t / 10) * 620;
      const plotY = (val) => 478 - (val / 1.45) * 320;
      const curve = (fn) => {
        const pts = [];
        for (let t = 0; t <= 10; t += 0.12) {
          pts.push(`${plotX(t).toFixed(1)},${plotY(fn(t)).toFixed(1)}`);
        }
        return pts.join(" ");
      };
      // Real closed-loop second-order step responses
      const under = curve((t) => 1 - Math.exp(-0.42 * t) * (Math.cos(2.1 * t) + 0.2 * Math.sin(2.1 * t)));
      const optimal = curve((t) => 1 - Math.exp(-1.15 * t) * (Math.cos(0.95 * t) + 1.15 * Math.sin(0.95 * t)));
      const over = curve((t) => 1 - Math.exp(-0.38 * t) * (1 + 0.38 * t));
      const pOnly = curve((t) => 0.76 * (1 - Math.exp(-0.9 * t)));
      const spY = plotY(1.0);
      return `
        ${box(44, 114, 720, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <line x1="112" y1="146" x2="112" y2="478" stroke="#475569" stroke-width="2"/>
        <line x1="112" y1="478" x2="736" y2="478" stroke="#475569" stroke-width="2"/>
        ${[0, 0.5, 1.0, 1.3].map((v) => {
          const y = plotY(v);
          return `<line x1="112" y1="${y.toFixed(1)}" x2="736" y2="${y.toFixed(1)}" stroke="${v === 1 ? '#0f172a' : '#e2e8f0'}" stroke-dasharray="${v === 1 ? '8 5' : ''}" stroke-width="${v === 1 ? 1.8 : 1}"/><text x="102" y="${(y+4).toFixed(1)}" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="11">${Math.round(v*100)}%</text>`;
        }).join("")}
        <text x="726" y="${(spY - 8).toFixed(1)}" text-anchor="end" fill="#0f172a" font-family="${MONO}" font-size="11.5" font-weight="bold">SETPOINT (100%)</text>
        <polyline points="${under}" fill="none" stroke="#dc2626" stroke-width="3"/>
        <polyline points="${optimal}" fill="none" stroke="#059669" stroke-width="4"/>
        <polyline points="${over}" fill="none" stroke="#0b5cad" stroke-width="2.8" stroke-dasharray="7 5"/>
        <polyline points="${pOnly}" fill="none" stroke="#d97706" stroke-width="2.8" stroke-dasharray="4 4"/>
        <text x="424" y="514" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12" font-weight="bold">Time After Step Change (Normalized Time Constants)</text>
        <text x="64" y="315" transform="rotate(-90 64 315)" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12" font-weight="bold">Process Variable (PV)</text>

        <!-- Right Legend & Term Guide -->
        ${box(788, 114, 368, 444, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="812" y="148" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Tuning Signatures</text>
        ${[
          { y: 170, name: "Optimal (Lambda / Tuned PID)", desc: "Minimal overshoot, fast clean settling, low valve wear.", c: "#059669" },
          { y: 256, name: "Underdamped (Gain Too High)", desc: "Overshoot & ringing; stresses control valves & actuators.", c: "#dc2626" },
          { y: 342, name: "Overdamped (Too Sluggish)", desc: "Slow recovery from load upsets; safe but poor disturbance rejection.", c: "#0b5cad" },
          { y: 428, name: "P-Only (No Integral Action)", desc: "Leaves permanent steady-state offset below setpoint.", c: "#d97706" },
        ].map((l) => `
          <rect x="812" y="${l.y}" width="320" height="72" rx="8" fill="#ffffff" stroke="${l.c}" stroke-width="1.6"/>
          <line x1="826" y1="${l.y + 22}" x2="854" y2="${l.y + 22}" stroke="${l.c}" stroke-width="4"/>
          <text x="864" y="${l.y + 26}" fill="${l.c}" font-family="${SANS}" font-size="12.5" font-weight="bold">${l.name}</text>
          <text x="826" y="${l.y + 49}" fill="#475569" font-family="${SANS}" font-size="11">${esc(l.desc.slice(0, 44))}</text>
          <text x="826" y="${l.y + 64}" fill="#475569" font-family="${SANS}" font-size="11">${esc(l.desc.slice(44).trim())}</text>
        `).join("")}
      `;
    }

    case "sil-voting-matrix":
      return `
        <!-- Left: SIL 1-4 Logarithmic Table -->
        ${box(44, 118, 560, 440, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">IEC 61511 SIL 1–4 Low-Demand Targets</text>
        <text x="68" y="170" fill="#64748b" font-family="${SANS}" font-size="12">Each SIL level increases Risk Reduction Factor (RRF) by 10×</text>
        ${[
          { y: 204, sil: "SIL 1", pfd: "10⁻¹ to 10⁻²", rrf: "10 – 100×", w: 120, c: "#0284c7" },
          { y: 288, sil: "SIL 2", pfd: "10⁻² to 10⁻³", rrf: "100 – 1,000×", w: 230, c: "#059669" },
          { y: 372, sil: "SIL 3", pfd: "10⁻³ to 10⁻⁴", rrf: "1,000 – 10,000×", w: 345, c: "#d97706" },
          { y: 456, sil: "SIL 4", pfd: "10⁻⁴ to 10⁻⁵", rrf: "10,000 – 100,000×", w: 455, c: "#dc2626" },
        ].map((s) => `
          <text x="68" y="${s.y + 20}" fill="${s.c}" font-family="${MONO}" font-size="15" font-weight="bold">${s.sil}</text>
          <rect x="134" y="${s.y}" width="444" height="36" rx="6" fill="#f1f5f9"/>
          <rect x="134" y="${s.y}" width="${s.w}" height="36" rx="6" fill="${s.c}" fill-opacity="0.88"/>
          <text x="148" y="${s.y + 23}" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">RRF ${s.rrf}</text>
          <text x="568" y="${s.y + 52}" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="11">PFDavg: ${s.pfd}</text>
        `).join("")}

        <!-- Right: Voting Architectures -->
        ${box(628, 118, 528, 440, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="652" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Hardware Voting: Safety vs. Spurious Trips</text>
        <text x="652" y="170" fill="#64748b" font-family="${SANS}" font-size="12">Balancing failure-to-trip risk against false plant shutdowns</text>
        ${[
          { y: 196, v: "1oo1", t: "Single Channel", safe: "Baseline", avail: "Baseline", note: "No hardware fault tolerance (HFT = 0). Typically SIL 1.", c: "#64748b" },
          { y: 282, v: "1oo2", t: "1-out-of-2 Redundant", safe: "Very High", avail: "Lower (2× spurious)", note: "Either sensor trips plant. Strong safety, more false trips.", c: "#d97706" },
          { y: 368, v: "2oo2", t: "2-out-of-2 Series", safe: "Lower", avail: "Very High", note: "Both must agree to trip. Avoids false stops, weaker PFD.", c: "#0b5cad" },
          { y: 454, v: "2oo3", t: "2-out-of-3 Majority", safe: "Very High", avail: "Very High", note: "Gold standard for SIL 2/3: tolerates 1 fault without false trip.", c: "#059669" },
        ].map((v) => `
          <rect x="652" y="${v.y}" width="480" height="74" rx="8" fill="#ffffff" stroke="${v.c}" stroke-width="1.6"/>
          <rect x="664" y="${v.y + 14}" width="66" height="46" rx="6" fill="${v.c}"/>
          <text x="697" y="${v.y + 42}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="14" font-weight="bold">${v.v}</text>
          <text x="746" y="${v.y + 26}" fill="#0f172a" font-family="${SANS}" font-size="13" font-weight="bold">${v.t}</text>
          <text x="1118" y="${v.y + 26}" text-anchor="end" fill="${v.c}" font-family="${MONO}" font-size="10.5" font-weight="bold">Safe: ${v.safe}</text>
          <text x="746" y="${v.y + 48}" fill="#475569" font-family="${SANS}" font-size="11.5">${v.note}</text>
        `).join("")}
      `;

    case "isa-101-hmi-compare":
      return `
        <!-- Left: Bad Legacy Rainbow P&ID HMI -->
        ${box(44, 118, 540, 440, { fill: "#1e293b", stroke: "#dc2626", sw: 2.2 })}
        <rect x="44" y="118" width="540" height="42" rx="10" fill="#dc2626"/>
        <text x="314" y="144" text-anchor="middle" fill="#ffffff" font-family="${SANS}" font-size="14" font-weight="bold">AVOID: Traditional Rainbow P&amp;ID Clutter</text>
        <!-- Cluttered pipes & bright colors -->
        <line x1="90" y1="260" x2="530" y2="260" stroke="#22c55e" stroke-width="12"/>
        <line x1="200" y1="260" x2="200" y2="390" stroke="#38bdf8" stroke-width="10"/>
        <line x1="410" y1="260" x2="410" y2="390" stroke="#ec4899" stroke-width="10"/>
        <rect x="110" y="210" width="90" height="100" rx="10" fill="#ef4444" stroke="#facc15" stroke-width="3"/>
        <text x="155" y="265" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">TANK 1</text>
        <rect x="330" y="200" width="120" height="110" rx="10" fill="#22c55e" stroke="#facc15" stroke-width="3"/>
        <text x="390" y="255" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="12" font-weight="bold">REACTOR</text>
        <circle cx="200" cy="390" r="28" fill="#22c55e" stroke="#fff" stroke-width="2"/><text x="200" y="394" text-anchor="middle" fill="#000" font-family="${MONO}" font-size="10" font-weight="bold">P-101</text>
        <circle cx="410" cy="390" r="28" fill="#ef4444" stroke="#fff" stroke-width="2"/><text x="410" y="394" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="10" font-weight="bold">P-102</text>
        <!-- Raw numbers without context -->
        <rect x="84" y="446" width="140" height="34" fill="#000" stroke="#22c55e"/><text x="154" y="468" text-anchor="middle" fill="#22c55e" font-family="${MONO}" font-size="14">74.82 °C</text>
        <rect x="244" y="446" width="140" height="34" fill="#000" stroke="#facc15"/><text x="314" y="468" text-anchor="middle" fill="#facc15" font-family="${MONO}" font-size="14">4.91 bar</text>
        <rect x="404" y="446" width="140" height="34" fill="#000" stroke="#ef4444"/><text x="474" y="468" text-anchor="middle" fill="#ef4444" font-family="${MONO}" font-size="14">89.4 %</text>
        <text x="314" y="514" text-anchor="middle" fill="#fca5a5" font-family="${SANS}" font-size="12">✗ Bright greens/reds hide real alarms · Raw digits lack normal bands</text>
        <text x="314" y="534" text-anchor="middle" fill="#fca5a5" font-family="${SANS}" font-size="12">✗ 3D vessels &amp; blinking icons increase cognitive load under stress</text>

        <!-- Right: ISA-101 High-Performance Grayscale HMI -->
        ${box(616, 118, 540, 440, { fill: "#e2e8f0", stroke: "#059669", sw: 2.2 })}
        <rect x="616" y="118" width="540" height="42" rx="10" fill="#059669"/>
        <text x="886" y="144" text-anchor="middle" fill="#ffffff" font-family="${SANS}" font-size="14" font-weight="bold">RECOMMENDED: ISA-101 High-Performance HMI</text>
        <!-- Calm neutral gray moving analog indicators -->
        ${[
          { x: 646, lbl: "TEMP", val: "74.8°C", pos: 295, alert: false },
          { x: 766, lbl: "PRESS", val: "4.9 bar", pos: 280, alert: false },
          { x: 886, lbl: "LEVEL", val: "89.4% HI", pos: 214, alert: true },
          { x: 1006, lbl: "FLOW", val: "142 m3", pos: 302, alert: false },
        ].map((g) => `
          <rect x="${g.x}" y="186" width="102" height="196" rx="6" fill="#f8fafc" stroke="${g.alert ? '#d97706' : '#94a3b8'}" stroke-width="${g.alert ? 3 : 1.5}"/>
          <text x="${g.x + 51}" y="208" text-anchor="middle" fill="${g.alert ? '#b45309' : '#334155'}" font-family="${MONO}" font-size="11.5" font-weight="bold">${g.lbl}</text>
          <!-- Normal band -->
          <rect x="${g.x + 28}" y="246" width="46" height="84" fill="#cbd5e1"/>
          <line x1="${g.x + 20}" y1="246" x2="${g.x + 82}" y2="246" stroke="#64748b" stroke-width="1.5"/>
          <line x1="${g.x + 20}" y1="330" x2="${g.x + 82}" y2="330" stroke="#64748b" stroke-width="1.5"/>
          <!-- Pointer -->
          <polygon points="${g.x + 22},${g.pos - 7} ${g.x + 42},${g.pos} ${g.x + 22},${g.pos + 7}" fill="${g.alert ? '#d97706' : '#0f172a'}"/>
          <line x1="${g.x + 42}" y1="${g.pos}" x2="${g.x + 78}" y2="${g.pos}" stroke="${g.alert ? '#d97706' : '#0f172a'}" stroke-width="3"/>
          <text x="${g.x + 51}" y="366" text-anchor="middle" fill="${g.alert ? '#b45309' : '#0f172a'}" font-family="${MONO}" font-size="11" font-weight="bold">${g.val}</text>
        `).join("")}
        <!-- Sparkline Trend Bar -->
        <rect x="646" y="400" width="462" height="82" rx="6" fill="#f8fafc" stroke="#94a3b8"/>
        <rect x="646" y="424" width="462" height="34" fill="#cbd5e1" fill-opacity="0.55"/>
        <path d="M 660 448 L 740 444 L 820 446 L 900 436 L 980 416 L 1094 408" fill="none" stroke="#d97706" stroke-width="3"/>
        <text x="660" y="416" fill="#475569" font-family="${MONO}" font-size="10.5">LEVEL TREND (NORMAL BAND SHADED — RISING INTO HIGH ALARM)</text>
        <text x="886" y="514" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="12" font-weight="bold">✓ Normal state stays calm grayscale; amber/red reserved for abnormal</text>
        <text x="886" y="534" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="12">✓ Moving analog bars + sparklines reveal trends before trips occur</text>
      `;

    case "scada-vs-dcs-arch":
      return `
        <!-- Left: SCADA -->
        ${box(44, 118, 540, 440, { fill: "#ffffff", stroke: "#0b5cad", sw: 2 })}
        <rect x="44" y="118" width="540" height="44" rx="10" fill="#0b5cad"/>
        <text x="314" y="145" text-anchor="middle" fill="#ffffff" font-family="${SANS}" font-size="15" font-weight="bold">SCADA · Wide-Area Supervisory &amp; Telemetry</text>
        ${box(174, 184, 280, 74, { fill: "#eff6ff", stroke: "#0b5cad" })}
        <text x="314" y="214" text-anchor="middle" fill="#0b5cad" font-family="${SANS}" font-size="14" font-weight="bold">Central SCADA Master / Historian</text>
        <text x="314" y="236" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="11.5">Event-driven polling &amp; multi-vendor drivers</text>
        <!-- WAN Links -->
        <line x1="234" y1="258" x2="140" y2="334" stroke="#0b5cad" stroke-width="2.2" stroke-dasharray="6 4"/>
        <line x1="314" y1="258" x2="314" y2="334" stroke="#0b5cad" stroke-width="2.2" stroke-dasharray="6 4"/>
        <line x1="394" y1="258" x2="488" y2="334" stroke="#0b5cad" stroke-width="2.2" stroke-dasharray="6 4"/>
        <rect x="214" y="280" width="200" height="26" rx="13" fill="#fef3c7" stroke="#f59e0b"/>
        <text x="314" y="297" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11" font-weight="bold">WAN · CELLULAR / RADIO</text>
        ${[
          { x: 68, t: "RTU / PLC A", s: "Pump Station\nLocal Buffering" },
          { x: 242, t: "RTU / PLC B", s: "Substation\nDNP3 / MQTT" },
          { x: 416, t: "RTU / PLC C", s: "Wellhead\nAutonomous" },
        ].map((r) => `
          ${box(r.x, 336, 144, 84, { fill: "#f8fafc", stroke: "#64748b" })}
          <text x="${r.x + 72}" y="364" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="12" font-weight="bold">${r.t}</text>
          <text x="${r.x + 72}" y="386" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="11">${r.s.split("\n")[0]}</text>
          <text x="${r.x + 72}" y="404" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="10.5">${r.s.split("\n")[1]}</text>
        `).join("")}
        <text x="68" y="458" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">Best Fit: Pipelines, water/wastewater, power grids, multi-site lines</text>
        <text x="68" y="482" fill="#475569" font-family="${SANS}" font-size="12">• Tolerates WAN latency &amp; disconnects (remote RTUs run autonomously)</text>
        <text x="68" y="504" fill="#475569" font-family="${SANS}" font-size="12">• Hardware-agnostic: mixes Siemens, Rockwell, Schneider &amp; Modbus</text>
        <text x="68" y="526" fill="#475569" font-family="${SANS}" font-size="12">• Separate engineering databases for PLC logic vs. HMI screens</text>

        <!-- Right: DCS -->
        ${box(616, 118, 540, 440, { fill: "#ffffff", stroke: "#059669", sw: 2 })}
        <rect x="616" y="118" width="540" height="44" rx="10" fill="#059669"/>
        <text x="886" y="145" text-anchor="middle" fill="#ffffff" font-family="${SANS}" font-size="15" font-weight="bold">DCS · Integrated Plant-Wide Process Control</text>
        ${box(656, 184, 460, 74, { fill: "#f0fdf4", stroke: "#059669" })}
        <text x="886" y="214" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="14" font-weight="bold">Unified Engineering DB · Operator Consoles · Historian</text>
        <text x="886" y="236" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="11.5">Single tag change propagates automatically across HMI, alarms &amp; logic</text>
        <!-- Redundant Plant Control Bus -->
        <line x1="664" y1="292" x2="1108" y2="292" stroke="#059669" stroke-width="4"/>
        <line x1="664" y1="302" x2="1108" y2="302" stroke="#0b5cad" stroke-width="4"/>
        <text x="886" y="284" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">REDUNDANT DETERMINISTIC PLANT CONTROL NETWORK</text>
        ${[
          { x: 644, t: "CTRL PAIR 1", s: "Redundant CPU\nReactor Loops" },
          { x: 816, t: "CTRL PAIR 2", s: "Redundant CPU\nDistillation" },
          { x: 988, t: "CTRL PAIR 3", s: "Redundant CPU\nUtilities / Batch" },
        ].map((r) => `
          <line x1="${r.x + 72}" y1="302" x2="${r.x + 72}" y2="336" stroke="#059669" stroke-width="2.5"/>
          ${box(r.x, 336, 144, 84, { fill: "#f0fdf4", stroke: "#059669" })}
          <text x="${r.x + 72}" y="364" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">${r.t}</text>
          <text x="${r.x + 72}" y="386" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="11">${r.s.split("\n")[0]}</text>
          <text x="${r.x + 72}" y="404" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="10.5">${r.s.split("\n")[1]}</text>
        `).join("")}
        <text x="640" y="458" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">Best Fit: Refineries, chemical, pharma, pulp &amp; paper, power plants</text>
        <text x="640" y="482" fill="#475569" font-family="${SANS}" font-size="12">• Process-driven continuous analog loops with hot-standby failover</text>
        <text x="640" y="504" fill="#475569" font-family="${SANS}" font-size="12">• Native batch (ISA-88), alarm rationalization &amp; faceplates built in</text>
        <text x="640" y="526" fill="#475569" font-family="${SANS}" font-size="12">• Tight single-vendor ecosystem; higher capex, lower lifecycle friction</text>
      `;

    case "industrial-ethernet-compare":
      return `
        ${box(44, 118, 1112, 440, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="72" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Typical Cyclic Update Latency (Logarithmic Scale: 10 μs to 100 ms)</text>
        <text x="72" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Lower cycle time = tighter multi-axis motion synchronization and lower jitter</text>
        <!-- Log scale ticks: 10us=310, 100us=495, 1ms=680, 10ms=865, 100ms=1050 -->
        ${[
          { x: 310, t: "10 μs" },
          { x: 495, t: "100 μs" },
          { x: 680, t: "1 ms" },
          { x: 865, t: "10 ms" },
          { x: 1050, t: "100 ms" },
        ].map((tk) => `
          <line x1="${tk.x}" y1="192" x2="${tk.x}" y2="490" stroke="#e2e8f0" stroke-width="1.5"/>
          <text x="${tk.x}" y="512" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11.5" font-weight="bold">${tk.t}</text>
        `).join("")}
        ${[
          { y: 214, name: "EtherCAT", sub: "On-the-fly HW frame", x1: 375, x2: 515, lbl: "30 – 125 μs (Sub-μs jitter)", c: "#059669" },
          { y: 274, name: "PROFINET IRT", sub: "Isochronous Real-Time", x1: 565, x2: 680, lbl: "250 μs – 1 ms (HW switch)", c: "#0b5cad" },
          { y: 334, name: "PROFINET RT", sub: "Standard factory I/O", x1: 680, x2: 865, lbl: "1 – 10 ms (Managed switch)", c: "#0284c7" },
          { y: 394, name: "EtherNet/IP (CIP)", sub: "CIP Motion / Implicit I/O", x1: 680, x2: 880, lbl: "1 – 10 ms (IEEE 1588 PTP)", c: "#d97706" },
          { y: 454, name: "Modbus TCP", sub: "Request / Response TCP", x1: 865, x2: 1050, lbl: "10 – 100+ ms (Non-deterministic)", c: "#64748b" },
        ].map((r) => `
          <text x="72" y="${r.y + 15}" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">${r.name}</text>
          <text x="72" y="${r.y + 32}" fill="#64748b" font-family="${SANS}" font-size="11">${r.sub}</text>
          <rect x="${r.x1}" y="${r.y}" width="${r.x2 - r.x1}" height="32" rx="6" fill="${r.c}"/>
          <text x="${r.x2 + 12}" y="${r.y + 21}" fill="${r.c}" font-family="${MONO}" font-size="11.5" font-weight="bold">${r.lbl}</text>
        `).join("")}
        <text x="72" y="542" fill="#475569" font-family="${SANS}" font-size="12">Ecosystem guide: Siemens plants standardize on PROFINET; Rockwell/North America leans EtherNet/IP; high-speed CNC/packaging/robotics favors EtherCAT.</text>
      `;

    case "modbus-frames":
      return `
        <!-- Top: RTU vs TCP Frame Comparison -->
        ${box(44, 114, 1112, 238, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="72" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Modbus RTU (RS-485 Serial) vs. Modbus TCP (Ethernet Port 502) Packet Framing</text>
        <!-- RTU Frame -->
        <text x="72" y="188" fill="#b45309" font-family="${MONO}" font-size="12.5" font-weight="bold">MODBUS RTU</text>
        <rect x="200" y="166" width="130" height="44" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/><text x="265" y="193" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="12" font-weight="bold">Slave ID (1B)</text>
        <rect x="336" y="166" width="150" height="44" rx="6" fill="#dbeafe" stroke="#0b5cad" stroke-width="2"/><text x="411" y="193" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">Func Code (1B)</text>
        <rect x="492" y="166" width="380" height="44" rx="6" fill="#eff6ff" stroke="#0b5cad" stroke-width="2"/><text x="682" y="193" text-anchor="middle" fill="#1e3a8a" font-family="${MONO}" font-size="12" font-weight="bold">Data Payload (Up to 252 Bytes)</text>
        <rect x="878" y="166" width="130" height="44" rx="6" fill="#dcfce7" stroke="#059669" stroke-width="1.8"/><text x="943" y="193" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">CRC-16 (2B)</text>
        <!-- Shared PDU Bracket -->
        <text x="602" y="236" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">▲  IDENTICAL PROTOCOL DATA UNIT (PDU)  ▼</text>
        <!-- TCP Frame -->
        <text x="72" y="280" fill="#0b5cad" font-family="${MONO}" font-size="12.5" font-weight="bold">MODBUS TCP</text>
        <rect x="200" y="256" width="130" height="44" rx="6" fill="#f3e8ff" stroke="#7c3aed" stroke-width="1.8"/><text x="265" y="275" text-anchor="middle" fill="#6b21a8" font-family="${MONO}" font-size="11" font-weight="bold">MBAP Header</text><text x="265" y="291" text-anchor="middle" fill="#7c3aed" font-family="${MONO}" font-size="10">7 Bytes + Unit ID</text>
        <rect x="336" y="256" width="150" height="44" rx="6" fill="#dbeafe" stroke="#0b5cad" stroke-width="2"/><text x="411" y="283" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">Func Code (1B)</text>
        <rect x="492" y="256" width="380" height="44" rx="6" fill="#eff6ff" stroke="#0b5cad" stroke-width="2"/><text x="682" y="283" text-anchor="middle" fill="#1e3a8a" font-family="${MONO}" font-size="12" font-weight="bold">Data Payload (Up to 252 Bytes)</text>
        <rect x="878" y="256" width="248" height="44" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="5 4"/><text x="1002" y="283" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">CRC handled by TCP/Ethernet</text>
        <text x="72" y="332" fill="#dc2626" font-family="${SANS}" font-size="12" font-weight="bold">Security Note: Neither Modbus RTU nor classic Modbus TCP includes authentication or encryption — isolate behind firewalls / VPNs.</text>

        <!-- Bottom: 4 Modbus Register Tables -->
        ${[
          { x: 44, t: "Coils (0xxxx)", rw: "Read / Write · 1-bit", fc: "FC 01, 05, 15", ex: "Relay outputs, motor start bits", c: "#0b5cad" },
          { x: 326, t: "Discrete Inputs (1xxxx)", rw: "Read-Only · 1-bit", fc: "FC 02", ex: "Limit switches, fault contacts", c: "#059669" },
          { x: 608, t: "Input Registers (3xxxx)", rw: "Read-Only · 16-bit", fc: "FC 04", ex: "Analog sensors, live currents", c: "#d97706" },
          { x: 890, t: "Holding Regs (4xxxx)", rw: "Read / Write · 16-bit", fc: "FC 03, 06, 16", ex: "Setpoints, PID params, floats", c: "#7c3aed" },
        ].map((tb) => `
          ${box(tb.x, 376, 266, 180, { fill: "#f8fafc", stroke: tb.c, sw: 1.8 })}
          <rect x="${tb.x}" y="376" width="266" height="38" rx="10" fill="${tb.c}"/>
          <text x="${tb.x + 133}" y="400" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12.5" font-weight="bold">${tb.t}</text>
          <text x="${tb.x + 18}" y="440" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">${tb.rw}</text>
          <text x="${tb.x + 18}" y="468" fill="${tb.c}" font-family="${MONO}" font-size="12" font-weight="bold">${tb.fc}</text>
          <text x="${tb.x + 18}" y="502" fill="#475569" font-family="${SANS}" font-size="12">${tb.ex}</text>
          <text x="${tb.x + 18}" y="534" fill="#64748b" font-family="${MONO}" font-size="10.5">Watch 0-based vs 1-based offset</text>
        `).join("")}
      `;

    case "opcua-vs-mqtt":
      return `
        <!-- Left Zone: Plant Floor (OPC UA) -->
        ${box(44, 122, 326, 434, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <rect x="44" y="122" width="326" height="40" rx="10" fill="#0b5cad"/>
        <text x="207" y="147" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12.5" font-weight="bold">1. MACHINE EDGE · OPC UA</text>
        ${[
          { y: 184, t: "PLC / CNC Machine A", s: "Structured Object Model\nUnits + Limits + Alarms" },
          { y: 292, t: "Robot & Vision Cell B", s: "OPC UA Server (X.509)\nDeterministic Browsing" },
          { y: 400, t: "Packaging Line C", s: "PackML Companion Spec\nRich Device Context" },
        ].map((m) => `
          ${box(68, m.y, 278, 86, { fill: "#ffffff", stroke: "#93c5fd" })}
          <text x="207" y="${m.y + 28}" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="13" font-weight="bold">${m.t}</text>
          <text x="207" y="${m.y + 50}" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="11.5">${m.s.split("\n")[0]}</text>
          <text x="207" y="${m.y + 68}" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="10.5">${m.s.split("\n")[1]}</text>
        `).join("")}
        <text x="207" y="534" text-anchor="middle" fill="#1e3a8a" font-family="${SANS}" font-size="12" font-weight="bold">Best for rich machine semantics &amp; local HMI</text>

        <!-- Middle: Edge Gateway + MQTT Sparkplug B Broker -->
        <line x1="370" y1="335" x2="424" y2="335" stroke="#0b5cad" stroke-width="3" marker-end="url(#arrBlue)"/>
        ${box(432, 162, 316, 354, { fill: "#f0fdf4", stroke: "#059669", sw: 2.2 })}
        <rect x="432" y="162" width="316" height="40" rx="10" fill="#059669"/>
        <text x="590" y="187" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12.5" font-weight="bold">2. DECOUPLED DISTRIBUTION</text>
        ${box(458, 224, 264, 96, { fill: "#ffffff", stroke: "#34d399" })}
        <text x="590" y="252" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="13.5" font-weight="bold">Edge Gateway (OPC UA Client)</text>
        <text x="590" y="274" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="11.5">Report-by-Exception (RBE)</text>
        <text x="590" y="294" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11">TLS 1.3 · Birth/Death Certs</text>

        <line x1="590" y1="320" x2="590" y2="354" stroke="#059669" stroke-width="2.5" marker-end="url(#arrGreen)"/>

        ${box(458, 360, 264, 126, { fill: "#0f172a", stroke: "#059669", sw: 2 })}
        <text x="590" y="394" text-anchor="middle" fill="#34d399" font-family="${MONO}" font-size="14" font-weight="bold">MQTT SPARKPLUG B</text>
        <text x="590" y="418" text-anchor="middle" fill="#f8fafc" font-family="${SANS}" font-size="13" font-weight="bold">Central Event Broker (UNS)</text>
        <text x="590" y="442" text-anchor="middle" fill="#cbd5e1" font-family="${MONO}" font-size="10.5">spBv1.0/Plant1/NDATA/Line2</text>
        <text x="590" y="464" text-anchor="middle" fill="#94a3b8" font-family="${SANS}" font-size="11">1-to-Many Pub/Sub Fan-Out</text>

        <!-- Right Zone: Consumers -->
        <line x1="748" y1="335" x2="808" y2="335" stroke="#059669" stroke-width="3" marker-end="url(#arrGreen)"/>
        ${box(816, 122, 340, 434, { fill: "#f8fafc", stroke: "#64748b", sw: 2 })}
        <rect x="816" y="122" width="340" height="40" rx="10" fill="#334155"/>
        <text x="986" y="147" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12.5" font-weight="bold">3. ENTERPRISE CONSUMERS</text>
        ${[
          { y: 184, t: "Plant Historian &amp; OEE", s: "Subscribes once; zero PLC polling load", c: "#0b5cad" },
          { y: 274, t: "MES &amp; Quality Traceability", s: "Real-time batch &amp; part genealogy", c: "#059669" },
          { y: 364, t: "CMMS &amp; Maintenance", s: "Alarm triggers &amp; runtime counters", c: "#d97706" },
          { y: 454, t: "Cloud AI / Fleet BI", s: "Low-bandwidth outbound telemetry", c: "#7c3aed" },
        ].map((c) => `
          ${box(840, c.y, 292, 72, { fill: "#ffffff", stroke: c.c, sw: 1.6 })}
          <text x="858" y="${c.y + 28}" fill="${c.c}" font-family="${SANS}" font-size="13.5" font-weight="bold">${c.t}</text>
          <text x="858" y="${c.y + 52}" fill="#475569" font-family="${SANS}" font-size="11.5">${c.s}</text>
        `).join("")}
      `;

    default:
      return null;
  }
}
