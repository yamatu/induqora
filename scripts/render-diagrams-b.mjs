// Bespoke light-canvas engineering diagrams (Part B: Cybersecurity, Robotics, IIoT, Smart Mfg, Standards, Suppliers, News)
// Canvas working area inside diagram frame: x=36..1164, y=104..576

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function box(x, y, w, h, { fill = "#ffffff", stroke = "#cbd5e1", sw = 1.6, rx = 10 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

export function renderDiagramBodyB(d) {
  switch (d.type) {
    case "iec-62443-matrix":
      return `
        <!-- Left: 4 Parts Matrix -->
        <text x="48" y="134" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">IEC 62443 Four-Part Series &amp; Stakeholder Ownership</text>
        ${[
          { y: 150, p: "PART 1-x", r: "GENERAL (All Roles)", d: "Terminology, concepts, models & security lifecycle definitions (62443-1-1)", c: "#475569", bg: "#f8fafc" },
          { y: 248, p: "PART 2-x", r: "ASSET OWNER (Plant Operator)", d: "CSMS governance (2-1), patch management (2-3), service provider rules (2-4)", c: "#0b5cad", bg: "#eff6ff" },
          { y: 346, p: "PART 3-x", r: "SYSTEM INTEGRATOR (System)", d: "Risk assessment & zones/conduits (3-2), system security requirements SL 1–4 (3-3)", c: "#059669", bg: "#f0fdf4" },
          { y: 444, p: "PART 4-x", r: "COMPONENT VENDOR (OEM)", d: "Secure product development lifecycle (4-1) & embedded device controls (4-2)", c: "#7c3aed", bg: "#f5f3ff" },
        ].map((g) => `
          ${box(48, g.y, 650, 84, { fill: g.bg, stroke: g.c, sw: 1.8 })}
          <rect x="60" y="${g.y + 18}" width="106" height="48" rx="8" fill="${g.c}"/>
          <text x="113" y="${g.y + 47}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">${g.p}</text>
          <text x="182" y="${g.y + 36}" fill="${g.c}" font-family="${SANS}" font-size="13.5" font-weight="bold">${g.r}</text>
          <text x="182" y="${g.y + 60}" fill="#334155" font-family="${SANS}" font-size="12">${g.d}</text>
        `).join("")}

        <!-- Right: Security Levels SL 1-4 -->
        ${box(724, 150, 432, 378, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="748" y="182" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Security Levels (SL 1 – SL 4)</text>
        <text x="748" y="202" fill="#64748b" font-family="${SANS}" font-size="12">Escalating adversary skill &amp; resources</text>
        ${[
          { y: 222, sl: "SL 1", t: "Accidental / Casual Misuse", s: "Protection against human error or basic mistakes", c: "#0284c7" },
          { y: 298, sl: "SL 2", t: "Intentional · Simple Means", s: "Low resources, generic skills (common CRA baseline)", c: "#059669" },
          { y: 374, sl: "SL 3", t: "Sophisticated · IACS Skills", s: "Moderate resources & OT protocol-specific attacks", c: "#d97706" },
          { y: 450, sl: "SL 4", t: "Nation-State / Extended APT", s: "High resources, custom exploits, sustained campaigns", c: "#dc2626" },
        ].map((s) => `
          <rect x="748" y="${s.y}" width="384" height="64" rx="8" fill="#f8fafc" stroke="${s.c}" stroke-width="1.6"/>
          <rect x="758" y="${s.y + 12}" width="60" height="40" rx="6" fill="${s.c}"/>
          <text x="788" y="${s.y + 37}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">${s.sl}</text>
          <text x="832" y="${s.y + 28}" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">${s.t}</text>
          <text x="832" y="${s.y + 49}" fill="#475569" font-family="${SANS}" font-size="11">${s.s}</text>
        `).join("")}
      `;

    case "purdue-zero-trust":
      return `
        ${[
          { y: 114, lvl: "L4–L5", name: "Enterprise IT & Cloud", desc: "ERP, corporate email, BI analytics, user endpoints", c: "#475569", bg: "#f8fafc", zt: "Enterprise IdP + EDR" },
          { y: 196, lvl: "IDMZ", name: "Industrial DMZ (Strict IT/OT Termination Boundary)", desc: "MFA Jump Hosts · Patch Mirror · MQTT / Historian Replicator (Zero direct IT→PLC)", c: "#d97706", bg: "#fffbeb", zt: "Brokered + MFA Only" },
          { y: 282, lvl: "L3", name: "Manufacturing Operations (MES / Plant Historian / AV)", desc: "Site-wide scheduling, engineering repositories & central OT logging", c: "#0b5cad", bg: "#eff6ff", zt: "Least-Privilege Conduits" },
          { y: 364, lvl: "L2", name: "Area Supervisory (SCADA / Local HMI / Engineering WS)", desc: "Operator consoles & local alarm management segmented by production area", c: "#0284c7", bg: "#f0f9ff", zt: "Device Auth + Allowlist" },
          { y: 446, lvl: "L0–L1", name: "Control & Field Cells (PLCs, CNCs, Drives, Robots, SIS)", desc: "Cell-level micro-zones with deterministic I/O (zero external internet routes)", c: "#059669", bg: "#f0fdf4", zt: "Isolated Cell Conduits" },
        ].map((l) => `
          ${box(48, l.y, 825, 70, { fill: l.bg, stroke: l.c, sw: l.lvl === "IDMZ" ? 2.5 : 1.8 })}
          <rect x="60" y="${l.y + 13}" width="84" height="44" rx="8" fill="${l.c}"/>
          <text x="102" y="${l.y + 40}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">${l.lvl}</text>
          <text x="160" y="${l.y + 30}" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">${l.name}</text>
          <text x="160" y="${l.y + 52}" fill="#475569" font-family="${SANS}" font-size="11.5">${l.desc}</text>
          <!-- Right Zero Trust Pillar Mapping -->
          ${box(896, l.y, 260, 70, { fill: "#ffffff", stroke: l.c, sw: 1.5 })}
          <text x="1026" y="${l.y + 28}" text-anchor="middle" fill="${l.c}" font-family="${MONO}" font-size="11.5" font-weight="bold">ZERO TRUST CONTROL</text>
          <text x="1026" y="${l.y + 50}" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12" font-weight="bold">${l.zt}</text>
          <line x1="873" y1="${l.y + 35}" x2="896" y2="${l.y + 35}" stroke="${l.c}" stroke-width="2" stroke-dasharray="4 3"/>
        `).join("")}
        <text x="48" y="548" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">Key Rule: Keep Purdue vertical separation for safety &amp; determinism, and layer Zero Trust identity, MFA remote access, and cell-to-cell micro-segmentation.</text>
      `;

    case "robots-vs-cobots":
      return `
        ${box(44, 118, 1112, 440, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="72" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Head-to-Head Engineering Envelope: Fenced Industrial Robot vs. Collaborative Robot</text>
        <!-- Column Headers -->
        <rect x="72" y="172" width="230" height="36" rx="6" fill="#f1f5f9"/><text x="187" y="195" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="12" font-weight="bold">ENGINEERING METRIC</text>
        <rect x="314" y="172" width="404" height="36" rx="6" fill="#0b5cad"/><text x="516" y="195" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">INDUSTRIAL ROBOT (FENCED · ISO 10218)</text>
        <rect x="730" y="172" width="400" height="36" rx="6" fill="#ea580c"/><text x="930" y="195" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">COBOT (POWER &amp; FORCE LIMITED · ISO/TS 15066)</text>
        ${[
          { y: 220, k: "Payload Capacity", i: "10 kg – 1,000+ kg (heavy machining, palletizing)", c: "3 kg – 35 kg (light tending, assembly, packing)", iw: 370, cw: 120 },
          { y: 286, k: "Effective TCP Speed", i: "2.0 – 8.0+ m/s (high cycle-rate throughput)", c: "0.25 – 1.0 m/s in collaborative mode (force-limited)", iw: 365, cw: 135 },
          { y: 352, k: "Repeatability", i: "±0.01 to ±0.05 mm (rigid high-stiffness gearboxes)", c: "±0.03 to ±0.10 mm (compliant torque-sensing joints)", iw: 345, cw: 230 },
          { y: 418, k: "Safety & Guarding", i: "Hard fencing, interlock gates & light curtains", c: "Risk assessment STILL mandatory (sharp tools need guards)", iw: 280, cw: 260 },
          { y: 484, k: "Best ROI Fit", i: "High-volume, fast-cycle, heavy or hazardous cells", c: "High-mix, tight floor space, frequent redeployment", iw: 330, cw: 310 },
        ].map((r) => `
          <rect x="72" y="${r.y}" width="230" height="54" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
          <text x="86" y="${r.y + 32}" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">${r.k}</text>
          <rect x="314" y="${r.y}" width="404" height="54" rx="6" fill="#eff6ff" stroke="#bfdbfe"/>
          <rect x="324" y="${r.y + 36}" width="${r.iw}" height="8" rx="4" fill="#0b5cad" fill-opacity="0.75"/>
          <text x="324" y="${r.y + 24}" fill="#1e3a8a" font-family="${SANS}" font-size="12">${r.i}</text>
          <rect x="730" y="${r.y}" width="400" height="54" rx="6" fill="#fff7ed" stroke="#fed7aa"/>
          <rect x="740" y="${r.y + 36}" width="${r.cw}" height="8" rx="4" fill="#ea580c" fill-opacity="0.75"/>
          <text x="740" y="${r.y + 24}" fill="#9a3412" font-family="${SANS}" font-size="12">${r.c}</text>
        `).join("")}
      `;

    case "robot-cell-topology":
      return `
        <!-- Center Master Safety PLC -->
        ${box(436, 126, 328, 128, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2.5 })}
        <rect x="436" y="126" width="328" height="36" rx="10" fill="#0b5cad"/>
        <text x="600" y="149" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">CELL MASTER · SAFETY PLC (F-CPU)</text>
        <text x="600" y="186" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="13" font-weight="bold">Orchestrates Mode, Interlocks &amp; E-Stop</text>
        <text x="600" y="210" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11.5">PROFINET + PROFIsafe  /  EtherNet/IP + CIP Safety</text>
        <text x="600" y="232" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11">Cycle Time: 2–8 ms Deterministic</text>

        <!-- Dual Safety / Fieldbus Bus Bar -->
        <line x1="600" y1="254" x2="600" y2="298" stroke="#0b5cad" stroke-width="3.5"/>
        <line x1="175" y1="298" x2="1025" y2="298" stroke="#0b5cad" stroke-width="4"/>
        <line x1="175" y1="308" x2="1025" y2="308" stroke="#d97706" stroke-width="3" stroke-dasharray="8 4"/>
        <rect x="440" y="284" width="320" height="32" rx="16" fill="#fef3c7" stroke="#d97706"/>
        <text x="600" y="305" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11.5" font-weight="bold">STANDARD I/O + SAFETY FIELDBUS</text>

        <!-- 3 Subsystem Nodes Below -->
        ${[
          { x: 48, t: "ROBOT CONTROLLER", c: "#ea580c", bg: "#fff7ed", lines: ["• Program Select &amp; Cycle Start", "• Safe Position / Axis Limits", "• Interference Zone Request", "• Home / At-Perch Status Bits"] },
          { x: 422, t: "CNC / FIXTURE INTERFACE", c: "#059669", bg: "#f0fdf4", lines: ["• Auto Door Open / Closed", "• Chuck Clamped &amp; Part Present", "• Spindle Stopped (Zero Speed)", "• Clear-of-Zone Permit Bit"] },
          { x: 796, t: "CELL SAFETY PERIMETER", c: "#dc2626", bg: "#fef2f2", lines: ["• Dual-Channel E-Stop Loop", "• Interlocked Guard Gates", "• Light Curtains &amp; Area Scanners", "• Two-Hand Reset &amp; Mode Key"] },
        ].map((n) => `
          <line x1="${n.x + 178}" y1="308" x2="${n.x + 178}" y2="354" stroke="${n.c}" stroke-width="3" marker-end="url(#arrDark)"/>
          ${box(n.x, 360, 356, 192, { fill: n.bg, stroke: n.c, sw: 2 })}
          <rect x="${n.x}" y="360" width="356" height="36" rx="10" fill="${n.c}"/>
          <text x="${n.x + 178}" y="383" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12.5" font-weight="bold">${n.t}</text>
          ${n.lines.map((l, i) => `<text x="${n.x + 20}" y="${426 + i * 30}" fill="#1e293b" font-family="${SANS}" font-size="12.5">${l}</text>`).join("")}
        `).join("")}
      `;

    case "uns-vs-spaghetti":
      return `
        <!-- Left: Point-to-Point Spaghetti -->
        ${box(44, 118, 495, 440, { fill: "#fef2f2", stroke: "#dc2626", sw: 2 })}
        <rect x="44" y="118" width="495" height="40" rx="10" fill="#dc2626"/>
        <text x="291" y="143" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="14" font-weight="bold">Traditional Point-to-Point: N(N−1)/2 Links</text>
        ${(() => {
          const pts = [[135,220,"PLC 1"],[290,200,"SCADA"],[445,220,"MES"],[135,345,"PLC 2"],[445,345,"ERP"],[290,445,"HISTORIAN"]];
          let lines = "";
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              lines += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="#dc2626" stroke-opacity="0.38" stroke-width="1.8"/>`;
            }
          }
          const nodes = pts.map(([x,y,l]) => `<rect x="${x-50}" y="${y-22}" width="100" height="44" rx="8" fill="#ffffff" stroke="#dc2626" stroke-width="1.8"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="11.5" font-weight="bold">${l}</text>`).join("");
          return lines + nodes;
        })()}
        <text x="291" y="512" text-anchor="middle" fill="#991b1b" font-family="${SANS}" font-size="12" font-weight="bold">✗ 6 systems = 15 brittle custom interfaces</text>
        <text x="291" y="534" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="11.5">Replacing one tool breaks multiple upstream &amp; downstream links</text>

        <!-- Right: Unified Namespace Hub + ISA-95 Tree -->
        ${box(564, 118, 592, 440, { fill: "#f0fdf4", stroke: "#059669", sw: 2 })}
        <rect x="564" y="118" width="592" height="40" rx="10" fill="#059669"/>
        <text x="860" y="143" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="14" font-weight="bold">Unified Namespace (UNS): Single Hub + ISA-95 Topic Tree</text>
        ${[
          { x: 642, y: 224, l: "PLC / Edge" },
          { x: 642, y: 312, l: "SCADA" },
          { x: 642, y: 400, l: "Historian" },
          { x: 1076, y: 224, l: "MES" },
          { x: 1076, y: 312, l: "ERP" },
          { x: 1076, y: 400, l: "Analytics" },
        ].map((n) => `
          <line x1="${n.x < 860 ? n.x + 56 : n.x - 56}" y1="${n.y}" x2="${n.x < 860 ? 780 : 940}" y2="312" stroke="#059669" stroke-width="2.5"/>
          <rect x="${n.x - 56}" y="${n.y - 22}" width="112" height="44" rx="8" fill="#ffffff" stroke="#059669" stroke-width="1.8"/>
          <text x="${n.x}" y="${n.y + 5}" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11.5" font-weight="bold">${n.l}</text>
        `).join("")}
        <circle cx="860" cy="312" r="76" fill="#0f172a" stroke="#059669" stroke-width="3.5"/>
        <text x="860" y="305" text-anchor="middle" fill="#34d399" font-family="${MONO}" font-size="14" font-weight="bold">UNS BROKER</text>
        <text x="860" y="327" text-anchor="middle" fill="#e2e8f0" font-family="${SANS}" font-size="11.5">MQTT / Sparkplug B</text>
        <!-- ISA-95 Topic Example -->
        <rect x="590" y="458" width="540" height="78" rx="8" fill="#0f172a"/>
        <text x="610" y="484" fill="#94a3b8" font-family="${MONO}" font-size="11">ISA-95 SEMANTIC TOPIC STRUCTURE:</text>
        <text x="610" y="512" fill="#34d399" font-family="${MONO}" font-size="13.5" font-weight="bold">AcmeCorp / Plant01 / Machining / Cell04 / Spindle01 / Temp</text>
      `;

    case "edge-gateway-pipeline":
      return `
        ${[
          { x: 44, w: 226, h: "1. SOUTHBOUND OT", t: "Field Protocols", c: "#0b5cad", bg: "#eff6ff", items: ["OPC UA Client", "Modbus TCP / RTU", "Siemens S7 / EIP", "Dedicated OT NIC"] },
          { x: 304, w: 256, h: "2. EDGE PROCESSING", t: "Normalize &amp; Filter", c: "#059669", bg: "#f0fdf4", items: ["Tag Scaling &amp; Units", "Deadband / RBE Filter", "FFT / Edge Analytics", "ISA-95 Topic Mapping"] },
          { x: 594, w: 256, h: "3. RESILIENCE LAYER", t: "Store-and-Forward", c: "#d97706", bg: "#fffbeb", items: ["Encrypted Local SSD", "Zero Data Loss on WAN", "Ring-Buffer Backfill", "TPM 2.0 Hardware Root"] },
          { x: 884, w: 272, h: "4. NORTHBOUND IT", t: "Secure Uplink", c: "#7c3aed", bg: "#f5f3ff", items: ["Outbound-Only TLS 1.3", "MQTT Sparkplug B / REST", "Dedicated IT/DMZ NIC", "Fleet OTA Patch Mgmt"] },
        ].map((s, i) => `
          ${box(s.x, 134, s.w, 290, { fill: s.bg, stroke: s.c, sw: 2 })}
          <rect x="${s.x}" y="134" width="${s.w}" height="38" rx="10" fill="${s.c}"/>
          <text x="${s.x + s.w/2}" y="158" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">${s.h}</text>
          <text x="${s.x + s.w/2}" y="200" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">${s.t}</text>
          ${s.items.map((it, idx) => `
            <rect x="${s.x + 16}" y="${220 + idx * 46}" width="${s.w - 32}" height="36" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
            <text x="${s.x + s.w/2}" y="${243 + idx * 46}" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12">${it}</text>
          `).join("")}
          ${i < 3 ? `<line x1="${s.x + s.w}" y1="279" x2="${s.x + s.w + 26}" y2="279" stroke="#334155" stroke-width="3" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}

        <!-- Bottom Security & Hardware Verification Bar -->
        ${box(44, 452, 1112, 102, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="482" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">Non-Negotiable Industrial Gateway Spec Checklist</text>
        <text x="68" y="508" fill="#334155" font-family="${SANS}" font-size="12">• Fanless DIN-rail rating (-20°C to +60°C, 24V DC) · Dual isolated Ethernet NICs (no IP forwarding between OT and IT)</text>
        <text x="68" y="532" fill="#334155" font-family="${SANS}" font-size="12">• Signed firmware updates + SBOM transparency (EU CRA ready) · Sized local flash buffer for at least 72 hours of WAN outage</text>
      `;

    case "oee-waterfall": {
      // Exact article worked example: 480m shift -> -30m lunch = 450m planned -> -45m downtime = 405m run (90%) -> -40.5m speed loss = 364.5m net run (90%) -> -7.28m scrap = 357.22m productive (98% quality) => 79.38% OEE!
      const bars = [
        { x: 76, w: 120, top: 480, bot: 0, lbl: "Total Shift", sub: "480 min", c: "#64748b", val: "480m" },
        { x: 214, w: 94, top: 480, bot: 450, lbl: "Lunch", sub: "Excluded", c: "#94a3b8", val: "−30m" },
        { x: 326, w: 120, top: 450, bot: 0, lbl: "Planned Time", sub: "100% Base", c: "#0b5cad", val: "450m" },
        { x: 464, w: 94, top: 450, bot: 405, lbl: "Downtime", sub: "Avail. Loss", c: "#dc2626", val: "−45m" },
        { x: 576, w: 120, top: 405, bot: 0, lbl: "Run Time", sub: "Avail: 90.0%", c: "#0284c7", val: "405m" },
        { x: 714, w: 94, top: 405, bot: 364.5, lbl: "Speed Loss", sub: "Perf. Loss", c: "#d97706", val: "−40.5m" },
        { x: 826, w: 94, top: 364.5, bot: 357.2, lbl: "Scrap", sub: "Qual. Loss", c: "#ea580c", val: "−7.3m" },
        { x: 938, w: 162, top: 357.2, bot: 0, lbl: "Fully Productive", sub: "OEE = 79.38%", c: "#059669", val: "357.2m" },
      ];
      const yMap = (m) => 470 - (m / 500) * 320;
      return `
        ${box(44, 114, 1112, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        ${[0, 150, 300, 450].map((m) => `
          <line x1="68" y1="${yMap(m).toFixed(1)}" x2="1126" y2="${yMap(m).toFixed(1)}" stroke="#e2e8f0"/>
          <text x="62" y="${(yMap(m)+4).toFixed(1)}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="10.5">${m}m</text>
        `).join("")}
        ${bars.map((b) => {
          const y1 = yMap(b.top);
          const y2 = yMap(b.bot);
          const h = Math.max(8, y2 - y1);
          return `
            <rect x="${b.x}" y="${y1.toFixed(1)}" width="${b.w}" height="${h.toFixed(1)}" rx="6" fill="${b.c}" fill-opacity="0.9"/>
            <text x="${b.x + b.w/2}" y="${(y1 - 8).toFixed(1)}" text-anchor="middle" fill="${b.c}" font-family="${MONO}" font-size="12" font-weight="bold">${b.val}</text>
            <text x="${b.x + b.w/2}" y="494" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="11.5" font-weight="bold">${b.lbl}</text>
            <text x="${b.x + b.w/2}" y="511" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">${b.sub}</text>
          `;
        }).join("")}
        <rect x="68" y="524" width="1060" height="26" rx="5" fill="#f0fdf4"/>
        <text x="598" y="542" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">OEE = Availability (90.0%) × Performance (90.0%) × Quality (98.0%) = 79.38%  (21,433 Good Units / 450 Planned Min)</text>
      `;
    }

    case "isa-95-pyramid":
      return `
        <!-- Left Downward Arrow: Schedule & Orders -->
        <rect x="52" y="138" width="150" height="392" rx="10" fill="#eff6ff" stroke="#93c5fd"/>
        <text x="127" y="172" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">DOWNWARD FLOW</text>
        <line x1="127" y1="196" x2="127" y2="490" stroke="#0b5cad" stroke-width="3.5" marker-end="url(#arrBlue)"/>
        ${["Production Plan", "Work Orders", "Recipes / BOM", "Setpoints"].map((t, i) => `
          <rect x="64" y="${214 + i * 68}" width="126" height="34" rx="6" fill="#ffffff" stroke="#0b5cad"/>
          <text x="127" y="${236 + i * 68}" text-anchor="middle" fill="#1e3a8a" font-family="${SANS}" font-size="11.5" font-weight="bold">${t}</text>
        `).join("")}

        <!-- Center 5-Tier ISA-95 Pyramid -->
        ${[
          { y: 128, w: 320, lvl: "LEVEL 4 · ERP", desc: "Business Planning &amp; Logistics (Days–Months)", c: "#475569" },
          { y: 214, w: 450, lvl: "LEVEL 3 · MES / MOM", desc: "Dispatching, Quality, Genealogy &amp; OEE (Shifts–Hours)", c: "#0b5cad" },
          { y: 300, w: 580, lvl: "LEVEL 2 · SCADA / HMI", desc: "Supervisory Monitoring, Alarms &amp; Trends (Sec–Min)", c: "#0284c7" },
          { y: 386, w: 680, lvl: "LEVEL 1 · PLC / DCS / CNC", desc: "Deterministic Real-Time Control Loops (Milliseconds)", c: "#059669" },
          { y: 472, w: 740, lvl: "LEVEL 0 · FIELD DEVICES", desc: "Sensors, Drives, Robots, Valves &amp; Actuators (Continuous)", c: "#d97706" },
        ].map((t) => {
          const x = 600 - t.w / 2;
          return `
            <rect x="${x}" y="${t.y}" width="${t.w}" height="74" rx="10" fill="${t.c}"/>
            <text x="600" y="${t.y + 30}" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="14" font-weight="bold">${t.lvl}</text>
            <text x="600" y="${t.y + 54}" text-anchor="middle" fill="#f8fafc" font-family="${SANS}" font-size="12">${t.desc}</text>
          `;
        }).join("")}

        <!-- Right Upward Arrow: Actuals & Telemetry -->
        <rect x="998" y="138" width="150" height="392" rx="10" fill="#f0fdf4" stroke="#86efac"/>
        <text x="1073" y="172" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="12" font-weight="bold">UPWARD FLOW</text>
        <line x1="1073" y1="496" x2="1073" y2="202" stroke="#059669" stroke-width="3.5" marker-end="url(#arrGreen)"/>
        ${["Inventory / Cost", "OEE &amp; Genealogy", "Alarms &amp; Batch", "I/O Telemetry"].map((t, i) => `
          <rect x="1010" y="${214 + i * 68}" width="126" height="34" rx="6" fill="#ffffff" stroke="#059669"/>
          <text x="1073" y="${236 + i * 68}" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="11.5" font-weight="bold">${t}</text>
        `).join("")}
      `;

    case "pf-curve-pdm": {
      // Smooth declining P-F asset condition curve
      const pts = [];
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        const x = 96 + u * 990;
        const health = u < 0.2 ? 0.94 : 0.94 - 0.86 * Math.pow((u - 0.2) / 0.8, 2.25);
        const y = 490 - health * 315;
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      const stages = [
        { u: 0.26, lbl: "1. Ultrasound", sub: "Months lead time", c: "#059669", dy: -46 },
        { u: 0.42, lbl: "2. Vibration FFT", sub: "Bearing harmonics", c: "#0b5cad", dy: -46 },
        { u: 0.58, lbl: "3. Motor Current (MCSA)", sub: "Rotor / load sidebands", c: "#0284c7", dy: -46 },
        { u: 0.74, lbl: "4. IR Thermography", sub: "Weeks lead time", c: "#d97706", dy: -44 },
        { u: 0.88, lbl: "5. Audible Noise / Heat", sub: "Days before trip", c: "#ea580c", dy: -44 },
        { u: 0.98, lbl: "F: Failure", sub: "Unplanned stop", c: "#dc2626", dy: -36 },
      ];
      return `
        ${box(44, 114, 1112, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <line x1="96" y1="152" x2="96" y2="490" stroke="#475569" stroke-width="2"/>
        <line x1="96" y1="490" x2="1115" y2="490" stroke="#475569" stroke-width="2"/>
        <!-- Preventive vs Reactive Zone Shading -->
        <rect x="96" y="152" width="600" height="338" fill="#dcfce7" fill-opacity="0.28"/>
        <rect x="696" y="152" width="240" height="338" fill="#fef3c7" fill-opacity="0.32"/>
        <rect x="936" y="152" width="179" height="338" fill="#fee2e2" fill-opacity="0.35"/>
        <text x="396" y="176" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">PROACTIVE PLANNING WINDOW (LOW REPAIR COST)</text>
        <text x="816" y="176" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11.5" font-weight="bold">URGENT ACTION</text>
        <text x="1025" y="176" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="11.5" font-weight="bold">BREAKDOWN</text>

        <polyline points="${pts.join(" ")}" fill="none" stroke="#0f172a" stroke-width="4"/>
        ${stages.map((s) => {
          const x = 96 + s.u * 990;
          const health = 0.94 - 0.86 * Math.pow((s.u - 0.2) / 0.8, 2.25);
          const y = 490 - health * 315;
          const bx = Math.min(960, Math.max(120, x - 68));
          const by = Math.max(198, y + s.dy - 14);
          return `
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${s.c}" stroke="#fff" stroke-width="2"/>
            <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="152" height="40" rx="6" fill="#ffffff" stroke="${s.c}" stroke-width="1.6"/>
            <text x="${(bx + 76).toFixed(1)}" y="${(by + 16).toFixed(1)}" text-anchor="middle" fill="${s.c}" font-family="${SANS}" font-size="11" font-weight="bold">${s.lbl}</text>
            <text x="${(bx + 76).toFixed(1)}" y="${(by + 32).toFixed(1)}" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="10">${s.sub}</text>
          `;
        }).join("")}
        <text x="605" y="528" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12.5" font-weight="bold">Operating Time (From Potential Failure Point P → Functional Failure Point F)</text>
        <text x="66" y="325" transform="rotate(-90 66 325)" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12.5" font-weight="bold">Asset Condition / Health</text>
      `;
    }

    case "iso13849-vs-iec62061":
      return `
        <!-- Left: PL to SIL PFH Mapping -->
        ${box(44, 118, 560, 440, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">PFH Mapping: ISO 13849-1 (PL) ↔ IEC 62061 (SIL)</text>
        <text x="68" y="170" fill="#64748b" font-family="${SANS}" font-size="12">Average Probability of Dangerous Failure per Hour (PFH)</text>
        ${[
          { y: 196, pl: "PL a", sil: "No SIL", pfh: "10⁻⁵ to 10⁻⁴ / hr", c: "#64748b", w: 110 },
          { y: 266, pl: "PL b", sil: "SIL 1", pfh: "3×10⁻⁶ to 10⁻⁵ / hr", c: "#0284c7", w: 200 },
          { y: 336, pl: "PL c", sil: "SIL 1", pfh: "10⁻⁶ to 3×10⁻⁶ / hr", c: "#0b5cad", w: 280 },
          { y: 406, pl: "PL d", sil: "SIL 2", pfh: "10⁻⁷ to 10⁻⁶ / hr", c: "#d97706", w: 375 },
          { y: 476, pl: "PL e", sil: "SIL 3", pfh: "10⁻⁸ to 10⁻⁷ / hr", c: "#059669", w: 468 },
        ].map((r) => `
          <rect x="68" y="${r.y}" width="72" height="52" rx="6" fill="${r.c}"/>
          <text x="104" y="${r.y + 32}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="14" font-weight="bold">${r.pl}</text>
          <rect x="150" y="${r.y}" width="430" height="52" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
          <rect x="150" y="${r.y}" width="${Math.min(430, r.w)}" height="12" rx="4" fill="${r.c}" fill-opacity="0.82"/>
          <text x="164" y="${r.y + 37}" fill="#0f172a" font-family="${MONO}" font-size="12.5" font-weight="bold">IEC 62061: ${r.sil}</text>
          <text x="566" y="${r.y + 37}" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="11.5">${r.pfh}</text>
        `).join("")}

        <!-- Right: Designated Categories B, 1, 2, 3, 4 -->
        ${box(628, 118, 528, 440, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="652" y="150" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">ISO 13849-1 Designated Architectures (Cat B – 4)</text>
        ${[
          { y: 184, cat: "Cat B / 1", max: "Up to PL c", desc: "Single channel (Input → Logic → Output); Cat 1 adds well-tried components.", c: "#64748b" },
          { y: 274, cat: "Cat 2", max: "Up to PL d", desc: "Single functional channel + periodic automatic Test Equipment (TE) channel.", c: "#0b5cad" },
          { y: 364, cat: "Cat 3", max: "Up to PL e", desc: "Dual-channel redundancy: single fault does NOT cause loss of safety function.", c: "#d97706" },
          { y: 454, cat: "Cat 4", max: "PL e (High DC)", desc: "Dual-channel + high diagnostic coverage (≥99%); detects fault accumulation.", c: "#059669" },
        ].map((c) => `
          <rect x="652" y="${c.y}" width="480" height="76" rx="8" fill="#ffffff" stroke="${c.c}" stroke-width="1.8"/>
          <rect x="664" y="${c.y + 14}" width="92" height="48" rx="6" fill="${c.c}"/>
          <text x="710" y="${c.y + 43}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">${c.cat}</text>
          <text x="772" y="${c.y + 28}" fill="${c.c}" font-family="${MONO}" font-size="12" font-weight="bold">${c.max}</text>
          <text x="772" y="${c.y + 50}" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(c.desc.slice(0, 50))}</text>
          <text x="772" y="${c.y + 66}" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(c.desc.slice(50).trim())}</text>
        `).join("")}
      `;

    case "obsolescence-lifecycle":
      return `
        <!-- Top: 4 OEM Lifecycle Phases -->
        <text x="48" y="134" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">1. Industrial Control Hardware OEM Lifecycle Phases</text>
        ${[
          { x: 48, p: "PHASE 1 · ACTIVE", s: "Full OEM supply, firmware\nupdates &amp; standard lead times", c: "#059669", bg: "#f0fdf4" },
          { x: 330, p: "PHASE 2 · MATURE", s: "Next-gen series launched;\nbegin cataloging critical SKUs", c: "#0b5cad", bg: "#eff6ff" },
          { x: 612, p: "PHASE 3 · LIMITED", s: "Last-time-buy notices;\nstock spares &amp; verify repairers", c: "#d97706", bg: "#fffbeb" },
          { x: 894, p: "PHASE 4 · OBSOLETE", s: "No OEM sales; rely on tested\nsurplus, repair, or retrofit", c: "#dc2626", bg: "#fef2f2" },
        ].map((ph, i) => `
          ${box(ph.x, 148, 258, 108, { fill: ph.bg, stroke: ph.c, sw: 2 })}
          <rect x="${ph.x}" y="148" width="258" height="34" rx="10" fill="${ph.c}"/>
          <text x="${ph.x + 129}" y="170" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">${ph.p}</text>
          ${ph.s.split("\n").map((l, li) => `<text x="${ph.x + 129}" y="${208 + li * 22}" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12">${l}</text>`).join("")}
          ${i < 3 ? `<line x1="${ph.x + 258}" y1="202" x2="${ph.x + 276}" y2="202" stroke="#475569" stroke-width="2.5" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}

        <!-- Bottom: 3-Strategy Comparison Matrix -->
        <text x="48" y="294" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">2. Comparing Response Options When Legacy PLC, HMI or Servo Hardware Fails</text>
        ${[
          { x: 48, title: "Tested Surplus Replacement", badge: "FASTEST RECOVERY (1–5 DAYS)", c: "#0b5cad", bg: "#eff6ff", pts: ["• Drop-in swap with zero PLC rewrite", "• Lowest production downtime cost", "• Must verify load-test report &amp; warranty", "• Ideal for critical breakdown recovery"] },
          { x: 422, title: "Component-Level Repair", badge: "BEST VALUE FOR SPARE POOL", c: "#059669", bg: "#f0fdf4", pts: ["• 30–60% lower cost than surplus purchase", "• Replaces aged caps, fans &amp; relays", "• 1–3 week turnaround (pair with spare)", "• Preserves exact firmware &amp; revision"] },
          { x: 796, title: "Full Control Retrofit", badge: "LONG-TERM 10–15 YR RESET", c: "#d97706", bg: "#fffbeb", pts: ["• Solves multi-part obsolescence at once", "• Adds modern safety &amp; cyber compliance", "• Highest capex + engineering validation", "• Schedule during planned annual shutdown"] },
        ].map((o) => `
          ${box(o.x, 310, 356, 246, { fill: "#ffffff", stroke: o.c, sw: 2 })}
          <rect x="${o.x}" y="310" width="356" height="58" rx="10" fill="${o.bg}"/>
          <text x="${o.x + 18}" y="335" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">${o.title}</text>
          <text x="${o.x + 18}" y="356" fill="${o.c}" font-family="${MONO}" font-size="11" font-weight="bold">${o.badge}</text>
          ${o.pts.map((p, i) => `<text x="${o.x + 18}" y="${398 + i * 36}" fill="#334155" font-family="${SANS}" font-size="12.5">${p}</text>`).join("")}
        `).join("")}
      `;

    case "vcocnc-fanuc-anatomy":
      return `
        <!-- Top: FANUC Part Number Anatomy -->
        ${box(44, 114, 1112, 224, { fill: "#ffffff", stroke: "#0b5cad", sw: 1.8 })}
        <text x="70" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">FANUC Part Number Structure (Example: A06B-6114-H205#H550)</text>
        <rect x="70" y="168" width="175" height="52" rx="8" fill="#0b5cad"/><text x="157" y="200" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="22" font-weight="bold">A06B</text>
        <text x="260" y="200" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="22">—</text>
        <rect x="276" y="168" width="175" height="52" rx="8" fill="#0369a1"/><text x="363" y="200" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="22" font-weight="bold">6114</text>
        <text x="466" y="200" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="22">—</text>
        <rect x="482" y="168" width="175" height="52" rx="8" fill="#059669"/><text x="569" y="200" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="22" font-weight="bold">H205</text>
        <rect x="676" y="168" width="185" height="52" rx="8" fill="#d97706"/><text x="768" y="200" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="20" font-weight="bold">#H550</text>
        <text x="157" y="242" text-anchor="middle" fill="#0b5cad" font-family="${SANS}" font-size="11.5" font-weight="bold">Hardware Family</text>
        <text x="363" y="242" text-anchor="middle" fill="#0369a1" font-family="${SANS}" font-size="11.5" font-weight="bold">Series / Generation</text>
        <text x="569" y="242" text-anchor="middle" fill="#059669" font-family="${SANS}" font-size="11.5" font-weight="bold">Current / Axis Rating</text>
        <text x="768" y="242" text-anchor="middle" fill="#b45309" font-family="${SANS}" font-size="11.5" font-weight="bold">Optional Revision / FW</text>

        <!-- Prefix Quick Key -->
        <rect x="890" y="156" width="242" height="162" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="908" y="180" fill="#0f172a" font-family="${MONO}" font-size="11.5" font-weight="bold">COMMON FANUC PREFIXES</text>
        <text x="908" y="204" fill="#334155" font-family="${MONO}" font-size="11.5">A06B · Drives &amp; Motors</text>
        <text x="908" y="226" fill="#334155" font-family="${MONO}" font-size="11.5">A16B / A20B · Main PCBs</text>
        <text x="908" y="248" fill="#334155" font-family="${MONO}" font-size="11.5">A02B / A03B · CNC &amp; I/O</text>
        <text x="908" y="270" fill="#334155" font-family="${MONO}" font-size="11.5">A05B · Robot Pendants</text>
        <text x="908" y="292" fill="#334155" font-family="${MONO}" font-size="11.5">A98L / A66L · Keys/Cables</text>
        <text x="70" y="290" fill="#475569" font-family="${SANS}" font-size="12">Always match the complete rating code (e.g. H205 vs. H206) and verify hardware suffix compatibility before installing on a common DC bus rack.</text>

        <!-- Bottom: Vcocnc 4-Stage Bench QC Workflow -->
        <text x="48" y="376" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Vcocnc Pre-Shipment Testing &amp; Fulfillment Pipeline (Kunshan · 5,000 sqm · Est. 2005)</text>
        ${[
          { x: 48, n: "01", t: "SKU &amp; Revision Match", s: "Photo verification of\nnameplate &amp; revision code", c: "#0b5cad" },
          { x: 330, n: "02", t: "Dedicated Test Rig", s: "Full power-up, bus check\n&amp; closed-loop motor run", c: "#059669" },
          { x: 612, n: "03", t: "Test Video &amp; Report", s: "Serial-matched QC proof\nprior to carrier dispatch", c: "#d97706" },
          { x: 894, n: "04", t: "ESD Pack &amp; Express", s: "Anti-static foam boxing\n+ 12-month warranty tag", c: "#334155" },
        ].map((s, i) => `
          ${box(s.x, 394, 258, 160, { fill: "#f8fafc", stroke: s.c, sw: 1.8 })}
          <rect x="${s.x + 16}" y="410" width="44" height="32" rx="6" fill="${s.c}"/>
          <text x="${s.x + 38}" y="431" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="13" font-weight="bold">${s.n}</text>
          <text x="${s.x + 74}" y="432" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">${s.t}</text>
          ${s.s.split("\n").map((l, li) => `<text x="${s.x + 18}" y="${476 + li * 24}" fill="#475569" font-family="${SANS}" font-size="12">${l}</text>`).join("")}
          ${i < 3 ? `<line x1="${s.x + 258}" y1="474" x2="${s.x + 276}" y2="474" stroke="#475569" stroke-width="2.5" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}
      `;

    case "vibocnc-mro-workflow":
      return `
        <text x="48" y="138" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Multi-Brand Control Board, PLC, HMI &amp; Module MRO Repair Lifecycle (Vibocnc · Est. 2007)</text>
        ${[
          { x: 48, n: "STAGE 1", t: "Fault Intake &amp; Triage", c: "#0b5cad", bg: "#eff6ff", items: ["Visual PCB &amp; trace audit", "Alarm &amp; failure logging", "Power rail short testing", "Repair quote approval"] },
          { x: 330, n: "STAGE 2", t: "Board-Level Repair", c: "#059669", bg: "#f0fdf4", items: ["Aged capacitor recapping", "Optocoupler &amp; IC swap", "Backlight / touch repair", "Relay &amp; fan preventive kit"] },
          { x: 612, n: "STAGE 3", t: "Functional Bench Soak", c: "#d97706", bg: "#fffbeb", items: ["Live PLC / CNC rack test", "Fieldbus &amp; I/O validation", "Thermal burn-in cycle", "Video proof &amp; QC sign-off"] },
          { x: 894, n: "STAGE 4", t: "ESD Dispatch &amp; MRO", c: "#7c3aed", bg: "#f5f3ff", items: ["IEC 61340 ESD shielding", "Global DHL / FedEx ship", "12-month repair warranty", "Spare stock replenishment"] },
        ].map((s, i) => `
          ${box(s.x, 156, 258, 286, { fill: s.bg, stroke: s.c, sw: 2 })}
          <rect x="${s.x}" y="156" width="258" height="36" rx="10" fill="${s.c}"/>
          <text x="${s.x + 129}" y="179" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">${s.n}</text>
          <text x="${s.x + 129}" y="220" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">${s.t}</text>
          ${s.items.map((it, idx) => `
            <rect x="${s.x + 16}" y="${242 + idx * 46}" width="226" height="36" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
            <text x="${s.x + 129}" y="${265 + idx * 46}" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="12">${it}</text>
          `).join("")}
          ${i < 3 ? `<line x1="${s.x + 258}" y1="299" x2="${s.x + 276}" y2="299" stroke="#334155" stroke-width="2.5" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}

        <!-- Bottom Multi-Brand Hardware Coverage -->
        ${box(44, 466, 1112, 90, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="496" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">Core Multi-Brand Automation Catalog &amp; MRO Coverage</text>
        ${["FANUC PCBs & I/O", "Siemens SIMATIC / HMI", "ABB Robotics & Modules", "Mitsubishi PLC / Servo", "Schneider & SICK"].map((b, i) => `
          <rect x="${68 + i * 214}" y="510" width="202" height="32" rx="6" fill="#ffffff" stroke="#0b5cad" stroke-width="1.4"/>
          <text x="${169 + i * 214}" y="531" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">${b}</text>
        `).join("")}
      `;

    case "ifr-robotics-2026-chart":
      return `
        <!-- Left Panel: 2025 Annual Installations (Thousands) -->
        ${box(44, 114, 540, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">2025 Annual Robot Installations (Top 6 Markets)</text>
        <text x="68" y="166" fill="#64748b" font-family="${SANS}" font-size="12">600,000+ global units installed (+11% YoY); China = 59% share</text>
        ${[
          { y: 196, name: "China", val: "354,000 (+20%)", w: 360, c: "#0b5cad" },
          { y: 252, name: "United States", val: "~38,500 (+12% · #2)", w: 72, c: "#059669" },
          { y: 308, name: "Japan", val: "36,219 (−19%)", w: 68, c: "#0284c7" },
          { y: 364, name: "South Korea", val: "30,000 (−1%)", w: 58, c: "#d97706" },
          { y: 420, name: "Germany", val: "&lt;25,000 (−8%)", w: 48, c: "#7c3aed" },
          { y: 476, name: "India", val: "~10,500 (+15%)", w: 28, c: "#ea580c" },
        ].map((r) => `
          <text x="68" y="${r.y + 18}" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">${r.name}</text>
          <rect x="178" y="${r.y}" width="382" height="28" rx="5" fill="#f1f5f9"/>
          <rect x="178" y="${r.y}" width="${r.w}" height="28" rx="5" fill="${r.c}"/>
          <text x="${r.w > 220 ? 190 : 186 + r.w}" y="${r.y + 19}" fill="${r.w > 220 ? '#ffffff' : '#0f172a'}" font-family="${MONO}" font-size="11.5" font-weight="bold">${r.val}</text>
        `).join("")}
        <text x="68" y="540" fill="#475569" font-family="${MONO}" font-size="11">IFR Forecast: 655,000 units (2026) → 806,000 units (2029)</text>

        <!-- Right Panel: Nov 2026 Robot Density per 10,000 Employees -->
        ${box(608, 114, 548, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="632" y="146" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Manufacturing Robot Density (Nov 2026 Data)</text>
        <text x="632" y="166" fill="#64748b" font-family="${SANS}" font-size="12">Operational industrial robots per 10,000 manufacturing employees</text>
        ${[
          { y: 192, name: "South Korea", v: 1066, c: "#0b5cad" },
          { y: 236, name: "Singapore", v: 873, c: "#0284c7" },
          { y: 280, name: "Germany", v: 469, c: "#059669" },
          { y: 324, name: "Japan", v: 452, c: "#0d9488" },
          { y: 368, name: "United States", v: 323, c: "#d97706" },
          { y: 412, name: "EU-27 Avg", v: 240, c: "#7c3aed" },
          { y: 456, name: "China", v: 193, c: "#ea580c" },
          { y: 500, name: "Global Avg", v: 152, c: "#475569" },
        ].map((d2) => {
          const bw = Math.round((d2.v / 1100) * 340);
          return `
            <text x="632" y="${d2.y + 18}" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">${d2.name}</text>
            <rect x="742" y="${d2.y}" width="388" height="26" rx="5" fill="#f1f5f9"/>
            <rect x="742" y="${d2.y}" width="${bw}" height="26" rx="5" fill="${d2.c}"/>
            <text x="${750 + bw}" y="${d2.y + 18}" fill="${d2.c}" font-family="${MONO}" font-size="11.5" font-weight="bold">${d2.v.toLocaleString()}</text>
          `;
        }).join("")}
      `;

    case "etg-1800-scenarios":
      return `
        ${[
          {
            x: 44, tag: "SCENARIO 1 · AVAILABLE NOW", title: "Protected Machine Perimeter", c: "#059669", bg: "#f0fdf4",
            badge: "IEC 62443-3-3 SL 2 · ZERO HW CHANGE",
            pts: ["• EtherCAT bus stays inside guarded cabinet", "• Secured main controller acts as boundary", "• 25 existing EtherCAT functions mapped", "• UL Solutions assessed; CRA-ready path"],
          },
          {
            x: 422, tag: "SCENARIO 2 · ROADMAP", title: "Exposed / Segmented Links", c: "#0b5cad", bg: "#eff6ff",
            badge: "INTER-CABINET &amp; ACCESSIBLE PORTS",
            pts: ["• Addresses external cables between panels", "• Adds cryptographic integrity protection", "• Maintains sub-ms real-time determinism", "• Guards against tap / rogue device insert"],
          },
          {
            x: 800, tag: "SCENARIO 3 · FUTURE SPEC", title: "Untrusted Shared Infrastructure", c: "#d97706", bg: "#fffbeb",
            badge: "END-TO-END DEVICE SECURITY",
            pts: ["• End-to-end authenticated EtherCAT frames", "• Designed for open or shared plant backbones", "• Supports next-gen secure field devices", "• Extends ETG.1800 toward higher SL targets"],
          },
        ].map((s) => `
          ${box(s.x, 126, 356, 316, { fill: "#ffffff", stroke: s.c, sw: 2 })}
          <rect x="${s.x}" y="126" width="356" height="62" rx="10" fill="${s.bg}"/>
          <text x="${s.x + 18}" y="150" fill="${s.c}" font-family="${MONO}" font-size="11" font-weight="bold">${s.tag}</text>
          <text x="${s.x + 18}" y="176" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">${s.title}</text>
          <rect x="${s.x + 18}" y="204" width="320" height="30" rx="6" fill="${s.c}"/>
          <text x="${s.x + 178}" y="224" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="10.5" font-weight="bold">${s.badge}</text>
          ${s.pts.map((p, i) => `<text x="${s.x + 18}" y="${266 + i * 38}" fill="#334155" font-family="${SANS}" font-size="12.5">${p}</text>`).join("")}
        `).join("")}

        ${box(44, 464, 1112, 92, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="494" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">Why ETG.1800 Matters for Machine Builders Ahead of EU CRA (Dec 2027)</text>
        <text x="68" y="518" fill="#334155" font-family="${SANS}" font-size="12">Heavy TLS encryption inside 100 μs motion loops breaks determinism. ETG.1800 proves how physical zone design + controller hardening + built-in EtherCAT</text>
        <text x="68" y="538" fill="#334155" font-family="${SANS}" font-size="12">topology verification satisfy IEC 62443 SL 2 today without replacing existing drives, servo amplifiers, or I/O terminals.</text>
      `;

    case "cra-timeline":
      return `
        <!-- Top: 4 CRA Rollout Milestones -->
        <text x="48" y="138" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">1. EU Cyber Resilience Act (Regulation (EU) 2024/2847) Enforcement Timeline</text>
        <line x1="90" y1="218" x2="1110" y2="218" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
        <line x1="90" y1="218" x2="770" y2="218" stroke="#0b5cad" stroke-width="5" stroke-linecap="round"/>
        ${[
          { x: 165, dt: "DEC 10, 2024", t: "Entry Into Force", s: "Official EU publication\n36-month transition begins", c: "#64748b", active: false },
          { x: 455, dt: "JUN 11, 2026", t: "Notified Bodies", s: "Conformity assessment\nbodies provisions apply", c: "#0284c7", active: false },
          { x: 745, dt: "SEP 11, 2026", t: "Reporting LIVE", s: "Mandatory 24h / 72h\nvulnerability notifications", c: "#d97706", active: true },
          { x: 1035, dt: "DEC 11, 2027", t: "Full Compliance", s: "Essential cyber rules &\nCE marking mandatory", c: "#dc2626", active: false },
        ].map((m) => `
          <circle cx="${m.x}" cy="218" r="${m.active ? 14 : 10}" fill="${m.c}" stroke="#fff" stroke-width="3"/>
          <rect x="${m.x - 115}" y="156" width="230" height="32" rx="6" fill="${m.c}"/>
          <text x="${m.x}" y="177" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">${m.dt}</text>
          <text x="${m.x}" y="256" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">${m.t}</text>
          ${m.s.split("\n").map((l, li) => `<text x="${m.x}" y="${276 + li * 18}" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="11.5">${l}</text>`).join("")}
        `).join("")}

        <!-- Bottom: Mandatory Article 14 Reporting Clock -->
        ${box(44, 336, 1112, 220, { fill: "#f8fafc", stroke: "#d97706", sw: 2 })}
        <text x="68" y="368" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">2. Mandatory Article 14 Reporting Clock (ENISA Single Reporting Platform + National CSIRT)</text>
        ${[
          { x: 68, clk: "≤ 24 HOURS", t: "Early Warning", s: "From awareness of actively\nexploited flaw or severe incident.\nIdentify affected EU states.", c: "#dc2626", bg: "#fef2f2" },
          { x: 432, clk: "≤ 72 HOURS", t: "Formal Notification", s: "Severity assessment, technical\nindicators &amp; available mitigations\nfor affected OT customers.", c: "#d97706", bg: "#fffbeb" },
          { x: 796, clk: "14 DAYS / 1 MO", t: "Final Report", s: "14 days after fix (vulnerability)\nor 1 month after notification\n(severe incident) + root cause.", c: "#0b5cad", bg: "#eff6ff" },
        ].map((r, i) => `
          ${box(r.x, 388, 332, 146, { fill: r.bg, stroke: r.c, sw: 1.8 })}
          <rect x="${r.x + 14}" y="402" width="134" height="28" rx="6" fill="${r.c}"/>
          <text x="${r.x + 81}" y="421" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">${r.clk}</text>
          <text x="${r.x + 162}" y="421" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">${r.t}</text>
          ${r.s.split("\n").map((l, li) => `<text x="${r.x + 16}" y="${456 + li * 22}" fill="#334155" font-family="${SANS}" font-size="12">${l}</text>`).join("")}
          ${i < 2 ? `<line x1="${r.x + 332}" y1="461" x2="${r.x + 356}" y2="461" stroke="#475569" stroke-width="2.5" marker-end="url(#arrDark)"/>` : ""}
        `).join("")}
      `;

    case "machinery-reg-2027":
      return `
        ${box(44, 114, 1112, 444, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <rect x="68" y="134" width="248" height="36" rx="6" fill="#f1f5f9"/><text x="192" y="157" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="12" font-weight="bold">COMPLIANCE AREA</text>
        <rect x="328" y="134" width="380" height="36" rx="6" fill="#64748b"/><text x="518" y="157" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">OLD DIRECTIVE 2006/42/EC</text>
        <rect x="720" y="134" width="412" height="36" rx="6" fill="#0b5cad"/><text x="926" y="157" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">REGULATION (EU) 2023/1230 (JAN 20, 2027)</text>
        ${[
          { y: 184, a: "Cybersecurity &amp; Corruption", o: "No explicit cybersecurity safety rule", n: "Mandatory protection of safety PLC/software &amp; remote links", c: "#dc2626" },
          { y: 256, a: "AI / Self-Evolving Safety", o: "Not addressed; deterministic logic assumed", n: "ML-based safety functions require Notified Body review", c: "#d97706" },
          { y: 328, a: "Manuals &amp; Declarations", o: "Paper instructions required by default", n: "Digital manuals &amp; DoC allowed (paper free if requested)", c: "#059669" },
          { y: 400, a: "Substantial Modification", o: "Fragmented national guidance for retrofits", n: "Modifier creating new hazard becomes legal manufacturer", c: "#0b5cad" },
          { y: 472, a: "Legal Enforcement", o: "Directive requiring national transposition", n: "Direct uniform EU-27 Regulation from Jan 20, 2027", c: "#7c3aed" },
        ].map((r) => `
          <rect x="68" y="${r.y}" width="248" height="58" rx="6" fill="#f8fafc" stroke="${r.c}" stroke-width="1.5"/>
          <text x="84" y="${r.y + 34}" fill="${r.c}" font-family="${SANS}" font-size="12.5" font-weight="bold">${r.a}</text>
          <rect x="328" y="${r.y}" width="380" height="58" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
          <text x="344" y="${r.y + 34}" fill="#475569" font-family="${SANS}" font-size="12">${r.o}</text>
          <rect x="720" y="${r.y}" width="412" height="58" rx="6" fill="#eff6ff" stroke="#93c5fd"/>
          <text x="736" y="${r.y + 34}" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">${r.n}</text>
        `).join("")}
      `;

    case "advisory-mitigation":
    default:
      return `
        <!-- Top Advisory Metadata Banner -->
        ${box(44, 114, 1112, 86, { fill: "#fef2f2", stroke: "#dc2626", sw: 2 })}
        <rect x="62" y="128" width="244" height="58" rx="8" fill="#dc2626"/>
        <text x="184" y="152" text-anchor="middle" fill="#fecaca" font-family="${MONO}" font-size="11">${esc(d.advisoryId)}</text>
        <text x="184" y="174" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="13.5" font-weight="bold">${esc(d.cve)}</text>
        <text x="328" y="146" fill="#991b1b" font-family="${MONO}" font-size="12" font-weight="bold">CLASS: ${esc(d.cwe)}</text>
        <text x="328" y="168" fill="#0f172a" font-family="${SANS}" font-size="12.5"><tspan font-weight="bold">Affected:</tspan> ${esc(d.affected)}</text>
        <text x="328" y="188" fill="#b45309" font-family="${SANS}" font-size="12" font-weight="bold">Status: ${esc(d.fixStatus)}</text>

        <!-- Left Column: Attack Path -->
        ${box(44, 220, 536, 336, { fill: "#ffffff", stroke: "#dc2626", sw: 1.8 })}
        <rect x="44" y="220" width="536" height="38" rx="10" fill="#991b1b"/>
        <text x="312" y="244" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12.5" font-weight="bold">EXPOSURE &amp; EXPLOIT CHAIN</text>
        ${(d.attackSteps || []).map((st, i) => `
          <rect x="68" y="${278 + i * 90}" width="488" height="66" rx="8" fill="#fef2f2" stroke="#fca5a5"/>
          <circle cx="96" cy="${311 + i * 90}" r="14" fill="#dc2626"/>
          <text x="96" y="${316 + i * 90}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="12" font-weight="bold">${i + 1}</text>
          <text x="122" y="${304 + i * 90}" fill="#991b1b" font-family="${SANS}" font-size="13.5" font-weight="bold">${esc(st.label)}</text>
          <text x="122" y="${326 + i * 90}" fill="#334155" font-family="${SANS}" font-size="12">${esc(st.detail)}</text>
          ${i < 2 ? `<line x1="312" y1="${344 + i * 90}" x2="312" y2="${362 + i * 90}" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrRed)"/>` : ""}
        `).join("")}

        <!-- Right Column: Defensive Mitigations -->
        ${box(608, 220, 548, 336, { fill: "#ffffff", stroke: "#059669", sw: 1.8 })}
        <rect x="608" y="220" width="548" height="38" rx="10" fill="#059669"/>
        <text x="882" y="244" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12.5" font-weight="bold">IMMEDIATE OT DEFENSIVE CONTROLS</text>
        ${(d.defenses || []).map((def, i) => `
          <rect x="632" y="${278 + i * 66}" width="500" height="52" rx="8" fill="#f0fdf4" stroke="#86efac"/>
          <rect x="646" y="${291 + i * 66}" width="26" height="26" rx="6" fill="#059669"/>
          <text x="659" y="${309 + i * 66}" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="13" font-weight="bold">✓</text>
          <text x="684" y="${309 + i * 66}" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">${esc(def)}</text>
        `).join("")}
      `;
  }
}
