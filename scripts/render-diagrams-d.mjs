// Bespoke light-canvas engineering diagrams (Part D: Batch 3 — Sparkplug B, IEC 62443 Zones, SCADA Historian, EtherNet/IP CIP)
// Canvas working area inside diagram frame: x=36..1164, y=104..576

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function box(x, y, w, h, { fill = "#ffffff", stroke = "#cbd5e1", sw = 1.6, rx = 10 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

export function renderDiagramBodyD(d) {
  switch (d.type) {
    case "sparkplug-b-lifecycle":
      return `
        <!-- Top Banner: Topic Structure -->
        ${box(44, 108, 1112, 82, { fill: "#f8fafc", stroke: "#0b5cad", sw: 1.8 })}
        <text x="64" y="132" fill="#0b5cad" font-family="${SANS}" font-size="13" font-weight="bold">SPARKPLUG B TOPIC NAMESPACE (ISO/IEC 20237)</text>
        ${[
          { x: 64, w: 120, t: "spBv1.0", s: "Namespace", c: "#0f172a" },
          { x: 204, w: 185, t: "{group_id}", s: "Site / Area Group", c: "#0b5cad" },
          { x: 409, w: 235, t: "{message_type}", s: "NBIRTH | NDATA | NDEATH | NCMD", c: "#d97706" },
          { x: 664, w: 225, t: "{edge_node_id}", s: "EoN Gateway / PLC", c: "#059669" },
          { x: 909, w: 225, t: "[/{device_id}]", s: "Optional Downstream Device", c: "#7c3aed" },
        ].map((seg, i) => `
          ${i > 0 ? `<text x="${seg.x - 10}" y="164" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="16" font-weight="bold">/</text>` : ""}
          <rect x="${seg.x}" y="142" width="${seg.w}" height="38" rx="6" fill="#ffffff" stroke="${seg.c}" stroke-width="1.6"/>
          <text x="${seg.x + seg.w / 2}" y="159" text-anchor="middle" fill="${seg.c}" font-family="${MONO}" font-size="12" font-weight="bold">${seg.t}</text>
          <text x="${seg.x + seg.w / 2}" y="174" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="9.5">${seg.s}</text>
        `).join("")}

        <!-- Left: Session Lifecycle Sequence -->
        ${box(44, 206, 686, 360, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="64" y="232" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">State-Aware Session Handshake &amp; Disconnect Detection</text>

        <!-- Actors -->
        ${[
          { x: 112, t: "EoN Edge Node", s: "PLC / Gateway", c: "#059669" },
          { x: 386, t: "MQTT Broker", s: "TLS 8883 (LWT)", c: "#0b5cad" },
          { x: 636, t: "Primary SCADA", s: "Host Application", c: "#7c3aed" },
        ].map((a) => `
          <rect x="${a.x - 68}" y="246" width="136" height="42" rx="7" fill="${a.c}"/>
          <text x="${a.x}" y="264" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="12" font-weight="bold">${a.t}</text>
          <text x="${a.x}" y="280" text-anchor="middle" fill="#e2e8f0" font-family="${SANS}" font-size="10">${a.s}</text>
          <line x1="${a.x}" y1="288" x2="${a.x}" y2="548" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="5 4"/>
        `).join("")}

        <!-- Flow 1: STATE Online -->
        <line x1="636" y1="316" x2="394" y2="316" stroke="#7c3aed" stroke-width="2" marker-end="url(#arrDark)"/>
        <rect x="434" y="298" width="172" height="22" rx="4" fill="#f5f3ff"/>
        <text x="520" y="313" text-anchor="middle" fill="#6d28d9" font-family="${MONO}" font-size="10.5" font-weight="bold">STATE: online=true (Retained)</text>

        <!-- Flow 2: CONNECT with LWT -->
        <line x1="112" y1="354" x2="378" y2="354" stroke="#059669" stroke-width="2" marker-end="url(#arrGreen)"/>
        <rect x="130" y="335" width="234" height="22" rx="4" fill="#ecfdf5"/>
        <text x="247" y="350" text-anchor="middle" fill="#047857" font-family="${MONO}" font-size="10.5" font-weight="bold">CONNECT + LWT NDEATH (bdSeq=1)</text>

        <!-- Flow 3: NBIRTH / DBIRTH -->
        <line x1="112" y1="396" x2="628" y2="396" stroke="#0b5cad" stroke-width="2.2" marker-end="url(#arrBlue)"/>
        <rect x="164" y="376" width="388" height="22" rx="4" fill="#eff6ff"/>
        <text x="358" y="391" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="10.5" font-weight="bold">NBIRTH / DBIRTH (Full Tag Schema + Aliases, bdSeq=1, seq=0)</text>

        <!-- Flow 4: NDATA / DDATA RBE -->
        <line x1="112" y1="438" x2="628" y2="438" stroke="#059669" stroke-width="2.2" marker-end="url(#arrGreen)"/>
        <rect x="192" y="418" width="332" height="22" rx="4" fill="#f0fdf4"/>
        <text x="358" y="433" text-anchor="middle" fill="#047857" font-family="${MONO}" font-size="10.5" font-weight="bold">DDATA (Changed Metrics Only, Alias IDs, seq=1..N)</text>

        <!-- Flow 5: Cable cut -> NDEATH -->
        <rect x="64" y="466" width="96" height="24" rx="5" fill="#fef2f2" stroke="#dc2626"/>
        <text x="112" y="482" text-anchor="middle" fill="#dc2626" font-family="${SANS}" font-size="10.5" font-weight="bold">LINK LOST</text>
        <line x1="386" y1="498" x2="628" y2="498" stroke="#dc2626" stroke-width="2.4" marker-end="url(#arrRed)"/>
        <rect x="412" y="478" width="204" height="22" rx="4" fill="#fef2f2"/>
        <text x="514" y="493" text-anchor="middle" fill="#b91c1c" font-family="${MONO}" font-size="10.5" font-weight="bold">Broker fires NDEATH (bdSeq=1)</text>
        <text x="514" y="528" text-anchor="middle" fill="#b91c1c" font-family="${SANS}" font-size="11" font-weight="bold">All child tags marked STALE immediately</text>

        <!-- Right: Bandwidth Comparison Card -->
        ${box(750, 206, 406, 360, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="772" y="232" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Monthly WAN Data (500 Tags @ 1s)</text>
        <text x="772" y="252" fill="#64748b" font-family="${SANS}" font-size="11.5">Report-by-Exception (10% change/s) + Protobuf</text>

        ${[
          { y: 280, label: "Polled JSON (All 500 tags/s)", val: "~72.0 GB/mo", w: 344, c: "#dc2626", bg: "#fef2f2" },
          { y: 354, label: "Sparkplug B RBE (Full Names)", val: "~6.2 GB/mo (-91%)", w: 46, c: "#d97706", bg: "#fffbeb" },
          { y: 428, label: "Sparkplug B RBE + Aliases", val: "~2.3 GB/mo (-97%)", w: 22, c: "#059669", bg: "#ecfdf5" },
        ].map((b) => `
          <text x="772" y="${b.y}" fill="#1e293b" font-family="${SANS}" font-size="12" font-weight="bold">${b.label}</text>
          <rect x="772" y="${b.y + 10}" width="360" height="28" rx="6" fill="#f1f5f9"/>
          <rect x="772" y="${b.y + 10}" width="${b.w}" height="28" rx="6" fill="${b.c}"/>
          <text x="${b.w > 180 ? 786 : 782 + b.w}" y="${b.y + 29}" fill="${b.w > 180 ? "#ffffff" : b.c}" font-family="${MONO}" font-size="11.5" font-weight="bold">${b.val}</text>
        `).join("")}

        <!-- Bottom note inside right card -->
        <rect x="772" y="492" width="360" height="58" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="786" y="514" fill="#0f172a" font-family="${SANS}" font-size="11.5" font-weight="bold">Key Security &amp; Reliability Rules:</text>
        <text x="786" y="532" fill="#475569" font-family="${SANS}" font-size="10.8">• Never enable MQTT Retain on NBIRTH/NDATA</text>
        <text x="786" y="546" fill="#475569" font-family="${SANS}" font-size="10.8">• Restrict NCMD/DCMD ACLs; tag backfill is_historical</text>
      `;

    case "zones-conduits-topology":
      return `
        <!-- Left Architecture Tiers -->
        <!-- Enterprise IT -->
        ${box(44, 110, 650, 74, { fill: "#f8fafc", stroke: "#475569", sw: 1.8 })}
        <rect x="58" y="124" width="112" height="46" rx="7" fill="#475569"/>
        <text x="114" y="145" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">ENTERPRISE</text>
        <text x="114" y="162" text-anchor="middle" fill="#e2e8f0" font-family="${SANS}" font-size="10">Level 4–5</text>
        <text x="186" y="142" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">Corporate IT Zone (ERP, BI, Cloud, Users)</text>
        <text x="186" y="164" fill="#475569" font-family="${SANS}" font-size="11.5">Separate Corporate AD · Zero direct routing permitted to OT Control Zones</text>

        <!-- Conduit C-01 -->
        <line x1="250" y1="184" x2="250" y2="216" stroke="#0b5cad" stroke-width="2.4" marker-end="url(#arrBlue)"/>
        <rect x="266" y="188" width="290" height="22" rx="5" fill="#eff6ff" stroke="#0b5cad"/>
        <text x="411" y="203" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="10.5" font-weight="bold">C-01: HTTPS 443 + MFA (IT → IDMZ Only)</text>

        <!-- IDMZ -->
        ${box(44, 218, 650, 82, { fill: "#fffbeb", stroke: "#d97706", sw: 2 })}
        <rect x="58" y="234" width="112" height="50" rx="7" fill="#d97706"/>
        <text x="114" y="255" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">IDMZ · SL-T 3</text>
        <text x="114" y="273" text-anchor="middle" fill="#fef3c7" font-family="${SANS}" font-size="10">Level 3.5</text>
        <text x="186" y="250" fill="#92400e" font-family="${SANS}" font-size="13.5" font-weight="bold">Industrial DMZ (Buffer &amp; Broker Zone)</text>
        <text x="186" y="271" fill="#78350f" font-family="${SANS}" font-size="11.5">Replica Historian · PAM Jump Host · Patch WSUS · Outbound MQTT Broker</text>
        <text x="186" y="288" fill="#b45309" font-family="${SANS}" font-size="10.5">All sessions terminate here — no pass-through TCP between IT and OT</text>

        <!-- Conduit C-02 (OT -> IDMZ outbound) & C-04 (Jump -> OT) -->
        <line x1="210" y1="336" x2="210" y2="304" stroke="#059669" stroke-width="2.4" marker-end="url(#arrGreen)"/>
        <rect x="56" y="308" width="144" height="22" rx="4" fill="#ecfdf5" stroke="#059669"/>
        <text x="128" y="323" text-anchor="middle" fill="#047857" font-family="${MONO}" font-size="10" font-weight="bold">C-02: OT→IDMZ Push</text>
        <line x1="470" y1="300" x2="470" y2="334" stroke="#d97706" stroke-width="2.4" marker-end="url(#arrDark)"/>
        <rect x="482" y="308" width="204" height="22" rx="4" fill="#fffbeb" stroke="#d97706"/>
        <text x="584" y="323" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="10" font-weight="bold">C-04: PAM Jump (Time-Bound)</text>

        <!-- Site Operations / SCADA -->
        ${box(44, 338, 650, 78, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <rect x="58" y="352" width="112" height="50" rx="7" fill="#0b5cad"/>
        <text x="114" y="373" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">SITE · SL-T 2</text>
        <text x="114" y="391" text-anchor="middle" fill="#dbeafe" font-family="${SANS}" font-size="10">Level 3</text>
        <text x="186" y="369" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">Site Operations &amp; SCADA Zone</text>
        <text x="186" y="390" fill="#334155" font-family="${SANS}" font-size="11.5">SCADA Servers · Tier-1 Historian · Standalone OT AD · NTP · Passive IDS</text>

        <!-- Conduits to Cells & Safety -->
        <line x1="145" y1="416" x2="145" y2="452" stroke="#0b5cad" stroke-width="2.2" marker-end="url(#arrBlue)"/>
        <line x1="365" y1="416" x2="365" y2="452" stroke="#0b5cad" stroke-width="2.2" marker-end="url(#arrBlue)"/>
        <line x1="585" y1="452" x2="585" y2="420" stroke="#dc2626" stroke-width="2.4" marker-end="url(#arrRed)"/>
        <text x="255" y="440" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="10" font-weight="bold">C-03: Industrial DPI (OPC UA / CIP / S7)</text>
        <text x="585" y="444" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10" font-weight="bold">C-06: Read-Only</text>

        <!-- Bottom 3 Zones: Cell A, Cell B, Safety SIS -->
        ${box(44, 456, 204, 110, { fill: "#f0fdf4", stroke: "#059669", sw: 1.8 })}
        <rect x="56" y="468" width="180" height="24" rx="5" fill="#059669"/>
        <text x="146" y="484" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11" font-weight="bold">CELL ZONE A · SL-T 2</text>
        <text x="146" y="512" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="11.5" font-weight="bold">Line 1 PLCs, VFDs, HMI</text>
        <text x="146" y="532" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="10.5">Real-time L2 fieldbus</text>
        <text x="146" y="550" text-anchor="middle" fill="#047857" font-family="${SANS}" font-size="10">Blast radius isolated</text>

        ${box(266, 456, 204, 110, { fill: "#f0fdf4", stroke: "#059669", sw: 1.8 })}
        <rect x="278" y="468" width="180" height="24" rx="5" fill="#059669"/>
        <text x="368" y="484" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11" font-weight="bold">CELL ZONE B · SL-T 2</text>
        <text x="368" y="512" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="11.5" font-weight="bold">Line 2 PLCs, Robots</text>
        <text x="368" y="532" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="10.5">C-05 explicit interlocks</text>
        <text x="368" y="550" text-anchor="middle" fill="#047857" font-family="${SANS}" font-size="10">No lateral L2 bridge</text>

        ${box(488, 456, 206, 110, { fill: "#fef2f2", stroke: "#dc2626", sw: 2 })}
        <rect x="500" y="468" width="182" height="24" rx="5" fill="#dc2626"/>
        <text x="591" y="484" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11" font-weight="bold">SAFETY (SIS) · SL-T 3</text>
        <text x="591" y="512" text-anchor="middle" fill="#991b1b" font-family="${SANS}" font-size="11.5" font-weight="bold">SIL-Rated Safety PLCs</text>
        <text x="591" y="532" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="10.5">Physical key-switch lock</text>
        <text x="591" y="550" text-anchor="middle" fill="#b91c1c" font-family="${SANS}" font-size="10">No SCADA write path</text>

        <!-- Right Panel: Conduit Allowlist & Anti-patterns -->
        ${box(716, 110, 440, 456, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="738" y="138" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Conduit Enforcement Checklist</text>
        <text x="738" y="158" fill="#64748b" font-family="${SANS}" font-size="11.5">Default-deny everything not explicitly listed</text>

        ${[
          { y: 174, id: "C-01", t: "Enterprise → IDMZ", d: "HTTPS 443 + MFA; terminate at Jump/Mirror", c: "#475569" },
          { y: 230, id: "C-02", t: "OT → IDMZ Replication", d: "Outbound TLS push or hardware data diode", c: "#059669" },
          { y: 286, id: "C-03", t: "SCADA → Cell PLCs", d: "Industrial DPI allowlisting function codes", c: "#0b5cad" },
          { y: 342, id: "C-06", t: "Safety SIS → SCADA", d: "Read-only diagnostics; block logic writes", c: "#dc2626" },
        ].map((r) => `
          <rect x="738" y="${r.y}" width="396" height="46" rx="7" fill="#f8fafc" stroke="${r.c}" stroke-width="1.4"/>
          <rect x="748" y="${r.y + 9}" width="52" height="28" rx="5" fill="${r.c}"/>
          <text x="774" y="${r.y + 27}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11" font-weight="bold">${r.id}</text>
          <text x="812" y="${r.y + 21}" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">${r.t}</text>
          <text x="812" y="${r.y + 38}" fill="#475569" font-family="${SANS}" font-size="10.8">${r.d}</text>
        `).join("")}

        <rect x="738" y="406" width="396" height="142" rx="8" fill="#fef2f2" stroke="#fca5a5"/>
        <text x="754" y="430" fill="#991b1b" font-family="${SANS}" font-size="12.5" font-weight="bold">Top Segmentation Audit Failures to Eliminate</text>
        <text x="754" y="454" fill="#7f1d1d" font-family="${SANS}" font-size="11.2">✗ Dual-homed HMIs/historians bridging IT &amp; OT NICs</text>
        <text x="754" y="476" fill="#7f1d1d" font-family="${SANS}" font-size="11.2">✗ Shared Corporate + OT Active Directory trust</text>
        <text x="754" y="498" fill="#7f1d1d" font-family="${SANS}" font-size="11.2">✗ Unmonitored OEM cellular modems inside cells</text>
        <text x="754" y="520" fill="#7f1d1d" font-family="${SANS}" font-size="11.2">✗ Permanent "ANY/ANY" commissioning firewall rules</text>
        <text x="754" y="540" fill="#7f1d1d" font-family="${SANS}" font-size="11.2">✗ Unscanned USB drives crossing zone boundaries</text>
      `;

    case "historian-sdt-pipeline":
      return `
        <!-- Left: 3-Stage Ingestion & DMZ Mirroring Architecture -->
        ${box(44, 110, 560, 456, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="66" y="138" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Two-Tier Historian &amp; Store-and-Forward Flow</text>
        <text x="66" y="158" fill="#64748b" font-family="${SANS}" font-size="11.5">Zero-loss buffering at edge + outbound-only OT→IDMZ mirroring</text>

        <!-- Stage 1 -->
        ${box(66, 174, 516, 86, { fill: "#f0fdf4", stroke: "#059669", sw: 1.8 })}
        <rect x="80" y="188" width="96" height="58" rx="7" fill="#059669"/>
        <text x="128" y="213" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">EDGE L1–2</text>
        <text x="128" y="231" text-anchor="middle" fill="#d1fae5" font-family="${SANS}" font-size="10">Collector</text>
        <text x="192" y="204" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">PLC / OPC UA Collector + Exception Filter</text>
        <text x="192" y="224" fill="#334155" font-family="${SANS}" font-size="11">1. Source UTC timestamp + OPC quality code</text>
        <text x="192" y="242" fill="#047857" font-family="${SANS}" font-size="11" font-weight="bold">2. Local SSD Store-and-Forward (72h queue, 2× upset margin)</text>

        <line x1="324" y1="260" x2="324" y2="294" stroke="#059669" stroke-width="2.4" marker-end="url(#arrGreen)"/>
        <text x="340" y="282" fill="#047857" font-family="${MONO}" font-size="10.5" font-weight="bold">TLS / Sparkplug B (live + throttled backfill)</text>

        <!-- Stage 2 -->
        ${box(66, 298, 516, 86, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.8 })}
        <rect x="80" y="312" width="96" height="58" rx="7" fill="#0b5cad"/>
        <text x="128" y="337" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">TIER 1 OT</text>
        <text x="128" y="355" text-anchor="middle" fill="#dbeafe" font-family="${SANS}" font-size="10">Level 3</text>
        <text x="192" y="328" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">Primary Control Historian (SDT Engine)</text>
        <text x="192" y="348" fill="#334155" font-family="${SANS}" font-size="11">Applies Swinging Door Trending + RAID/NVMe hot archives</text>
        <text x="192" y="366" fill="#0b5cad" font-family="${SANS}" font-size="11">Serves HMI trends &amp; operators ONLY — zero IT inbound ports</text>

        <line x1="324" y1="384" x2="324" y2="418" stroke="#d97706" stroke-width="2.4" marker-end="url(#arrDark)"/>
        <text x="340" y="406" fill="#b45309" font-family="${MONO}" font-size="10.5" font-weight="bold">Outbound-Only Mirror / Data Diode (L3 → IDMZ)</text>

        <!-- Stage 3 -->
        ${box(66, 422, 516, 84, { fill: "#fffbeb", stroke: "#d97706", sw: 1.8 })}
        <rect x="80" y="436" width="96" height="56" rx="7" fill="#d97706"/>
        <text x="128" y="460" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="11.5" font-weight="bold">TIER 2 DMZ</text>
        <text x="128" y="478" text-anchor="middle" fill="#fef3c7" font-family="${SANS}" font-size="10">Level 3.5</text>
        <text x="192" y="452" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">Enterprise Mirror Historian / Lakehouse Feed</text>
        <text x="192" y="472" fill="#334155" font-family="${SANS}" font-size="11">Serves BI, ERP, MES reporting &amp; ML pipelines safely</text>
        <text x="192" y="490" fill="#92400e" font-family="${SANS}" font-size="11">Heavy ad-hoc SQL queries cannot slow plant operations</text>

        <text x="324" y="544" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">Buffer Math: 10k tags × 0.25 ev/s × 32 B × 72h × 2 ≈ 45–50 GB SSD</text>

        <!-- Right: Swinging Door Trending Visual -->
        ${box(626, 110, 530, 456, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="648" y="138" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Swinging Door Trending (SDT) Mechanics</text>
        <text x="648" y="158" fill="#64748b" font-family="${SANS}" font-size="11.5">Discards redundant points inside ±CompDev linear slope corridor</text>

        <!-- Plot area -->
        <rect x="662" y="182" width="466" height="214" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
        <!-- Axes -->
        <line x1="686" y1="376" x2="1112" y2="376" stroke="#64748b" stroke-width="1.5"/>
        <line x1="686" y1="198" x2="686" y2="376" stroke="#64748b" stroke-width="1.5"/>
        <text x="1090" y="391" text-anchor="end" fill="#64748b" font-family="${SANS}" font-size="10.5">Time (UTC)</text>
        <text x="676" y="210" text-anchor="end" fill="#64748b" font-family="${SANS}" font-size="10.5">PV</text>

        <!-- Swinging door shaded wedge from P0(712,330) to P4(964,250) -->
        <polygon points="712,330 964,226 964,274" fill="#dbeafe" opacity="0.65"/>
        <line x1="712" y1="330" x2="1030" y2="200" stroke="#0b5cad" stroke-width="1.4" stroke-dasharray="5 4"/>
        <line x1="712" y1="330" x2="1030" y2="262" stroke="#0b5cad" stroke-width="1.4" stroke-dasharray="5 4"/>

        <!-- Interpolated archived line P0 -> P4 -> P5 -->
        <polyline points="712,330 964,250 1074,312" fill="none" stroke="#0b5cad" stroke-width="2.6"/>

        <!-- Raw discarded points -->
        ${[
          { x: 774, y: 314, l: "P1" },
          { x: 836, y: 286, l: "P2" },
          { x: 900, y: 274, l: "P3" },
        ].map((p) => `
          <circle cx="${p.x}" cy="${p.y}" r="5" fill="#94a3b8" stroke="#ffffff" stroke-width="1.5"/>
          <text x="${p.x}" y="${p.y + 18}" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10">${p.l}</text>
        `).join("")}

        <!-- Archived points P0, P4 -->
        <circle cx="712" cy="330" r="6.5" fill="#059669" stroke="#ffffff" stroke-width="2"/>
        <text x="712" y="352" text-anchor="middle" fill="#047857" font-family="${MONO}" font-size="10.5" font-weight="bold">P0 (Saved)</text>

        <circle cx="964" cy="250" r="6.5" fill="#059669" stroke="#ffffff" stroke-width="2"/>
        <text x="964" y="218" text-anchor="middle" fill="#047857" font-family="${MONO}" font-size="10.5" font-weight="bold">P4 (Archived)</text>

        <!-- Trigger point P5 outside doors -->
        <circle cx="1074" cy="312" r="6.5" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
        <text x="1062" y="336" text-anchor="middle" fill="#b91c1c" font-family="${MONO}" font-size="10.5" font-weight="bold">P5 (Crosses)</text>

        <!-- CompDev bracket -->
        <line x1="978" y1="226" x2="978" y2="274" stroke="#d97706" stroke-width="2"/>
        <text x="986" y="254" fill="#b45309" font-family="${MONO}" font-size="10" font-weight="bold">±CompDev</text>

        <!-- Tuning rules box -->
        <rect x="662" y="412" width="466" height="136" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="680" y="436" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">Critical SDT Configuration Rules</text>
        <text x="680" y="460" fill="#047857" font-family="${SANS}" font-size="11.2" font-weight="bold">✓ Analog Process Tags:</text>
        <text x="838" y="460" fill="#334155" font-family="${SANS}" font-size="11.2">CompDev ≈ 0.1–0.25% span; ExcDev ≈ 0.5× CompDev</text>
        <text x="680" y="484" fill="#dc2626" font-family="${SANS}" font-size="11.2" font-weight="bold">✗ Discrete / Alarms / IDs:</text>
        <text x="844" y="484" fill="#334155" font-family="${SANS}" font-size="11.2">Set Step=ON and CompDev=0 (never interpolate!)</text>
        <text x="680" y="508" fill="#0b5cad" font-family="${SANS}" font-size="11.2" font-weight="bold">✓ Heartbeat &amp; Clock:</text>
        <text x="822" y="508" fill="#334155" font-family="${SANS}" font-size="11.2">Set CompMax (1–8h) &amp; sync all nodes to UTC NTP</text>
        <text x="680" y="532" fill="#64748b" font-family="${SANS}" font-size="10.8">Result: Typical 5:1 to 20:1 archive reduction with bounded accuracy.</text>
      `;

    case "ethernetip-cip-tuning":
      return `
        <!-- Top Row: Explicit vs Implicit Path -->
        ${box(44, 108, 1112, 146, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="64" y="134" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">EtherNet/IP Dual-Channel CIP Transport (Originator PLC ↔ Field Adapter)</text>

        <!-- PLC Box -->
        <rect x="64" y="150" width="184" height="86" rx="8" fill="#0f172a"/>
        <text x="156" y="182" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="13" font-weight="bold">PLC / Scanner</text>
        <text x="156" y="202" text-anchor="middle" fill="#94a3b8" font-family="${MONO}" font-size="10.5">Originator (EN2T/EN4TR)</text>
        <text x="156" y="220" text-anchor="middle" fill="#38bdf8" font-family="${SANS}" font-size="10">Bounded by Rated PPS</text>

        <!-- Target Box -->
        <rect x="948" y="150" width="188" height="86" rx="8" fill="#0b5cad"/>
        <text x="1042" y="182" text-anchor="middle" fill="#fff" font-family="${SANS}" font-size="13" font-weight="bold">I/O · VFD · Servo</text>
        <text x="1042" y="202" text-anchor="middle" fill="#dbeafe" font-family="${MONO}" font-size="10.5">Target Adapter</text>
        <text x="1042" y="220" text-anchor="middle" fill="#fef3c7" font-family="${SANS}" font-size="10">Unicast Preferred (1-to-1)</text>

        <!-- Explicit Line -->
        <line x1="254" y1="174" x2="940" y2="174" stroke="#475569" stroke-width="2" marker-end="url(#arrDark)" marker-start="url(#arrDark)"/>
        <rect x="348" y="158" width="496" height="24" rx="5" fill="#f1f5f9" stroke="#64748b"/>
        <text x="596" y="174" text-anchor="middle" fill="#1e293b" font-family="${MONO}" font-size="11" font-weight="bold">EXPLICIT · TCP 44818 · Forward_Open, HMI, MSG, Diagnostics (DSCP 27)</text>

        <!-- Implicit Line -->
        <line x1="254" y1="216" x2="940" y2="216" stroke="#d97706" stroke-width="2.6" marker-end="url(#arrDark)" marker-start="url(#arrDark)"/>
        <rect x="330" y="200" width="532" height="24" rx="5" fill="#fffbeb" stroke="#d97706"/>
        <text x="596" y="216" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11" font-weight="bold">IMPLICIT CYCLIC I/O · UDP 2222 · Runs @ RPI · Timeout = 4× RPI (DSCP 43)</text>

        <!-- Bottom Left: RPI PPS Sizing Comparison -->
        ${box(44, 272, 548, 294, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="66" y="300" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">RPI Packet-Rate Math (40-Device Machine Cell)</text>
        <text x="66" y="320" fill="#64748b" font-family="${MONO}" font-size="11">PPS per Connection = 2 × (1,000 ms / RPI_ms)</text>

        <!-- Bar 1: All at 2 ms -->
        <text x="66" y="352" fill="#991b1b" font-family="${SANS}" font-size="12" font-weight="bold">All 40 Devices Left at 2 ms RPI (Overloads Mid-Range PLC)</text>
        <rect x="66" y="362" width="504" height="30" rx="6" fill="#fef2f2"/>
        <rect x="66" y="362" width="490" height="30" rx="6" fill="#dc2626"/>
        <text x="80" y="382" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">40,000 Packets/Sec — High 0x0203 Timeout Risk</text>

        <!-- Bar 2: Tiered RPI -->
        <text x="66" y="418" fill="#047857" font-family="${SANS}" font-size="12" font-weight="bold">Tiered RPI Matched to Physical Process (-92% PPS Load)</text>
        <rect x="66" y="428" width="504" height="30" rx="6" fill="#f1f5f9"/>
        <rect x="66" y="428" width="44" height="30" rx="6" fill="#059669"/>
        <text x="122" y="448" fill="#047857" font-family="${MONO}" font-size="12" font-weight="bold">~3,200 PPS — Plentiful CPU &amp; HMI Headroom</text>

        <!-- Tiered Legend Grid -->
        ${[
          { x: 66, y: 476, w: 244, t: "Motion / Safety: 1–10 ms", c: "#dc2626" },
          { x: 326, y: 476, w: 244, t: "VFDs / Valves: 20–50 ms", c: "#d97706" },
          { x: 66, y: 516, w: 244, t: "Analog Sensors: 100–250 ms", c: "#0b5cad" },
          { x: 326, y: 516, w: 244, t: "Inter-PLC Tags: 50–100 ms", c: "#059669" },
        ].map((item) => `
          <rect x="${item.x}" y="${item.y}" width="${item.w}" height="30" rx="6" fill="#f8fafc" stroke="${item.c}" stroke-width="1.4"/>
          <text x="${item.x + 12}" y="${item.y + 19}" fill="${item.c}" font-family="${MONO}" font-size="11" font-weight="bold">${item.t}</text>
        `).join("")}

        <!-- Bottom Right: Managed Switch QoS & IGMP Rules -->
        ${box(612, 272, 544, 294, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="634" y="300" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">ODVA Switch QoS (DSCP) &amp; Multicast Safeguards</text>

        ${[
          { y: 316, dscp: "DSCP 59", name: "CIP Sync (IEEE 1588 PTP Event)", q: "Strict Prio", c: "#dc2626" },
          { y: 356, dscp: "DSCP 47", name: "CIP Safety & PTP General", q: "Queue High", c: "#d97706" },
          { y: 396, dscp: "DSCP 43", name: "Implicit Cyclic I/O (UDP 2222)", q: "Queue High", c: "#0b5cad" },
          { y: 436, dscp: "DSCP 27", name: "Explicit HMI / MSG (TCP 44818)", q: "Queue Med", c: "#059669" },
          { y: 476, dscp: "DSCP 0", name: "Cameras / File Transfers / IT", q: "Best Effort", c: "#64748b" },
        ].map((q) => `
          <rect x="634" y="${q.y}" width="500" height="32" rx="6" fill="#f8fafc" stroke="${q.c}" stroke-width="1.3"/>
          <rect x="642" y="${q.y + 5}" width="76" height="22" rx="4" fill="${q.c}"/>
          <text x="680" y="${q.y + 20}" text-anchor="middle" fill="#fff" font-family="${MONO}" font-size="10.5" font-weight="bold">${q.dscp}</text>
          <text x="732" y="${q.y + 20}" fill="#0f172a" font-family="${SANS}" font-size="11.5" font-weight="bold">${q.name}</text>
          <text x="1122" y="${q.y + 20}" text-anchor="end" fill="${q.c}" font-family="${MONO}" font-size="10.5" font-weight="bold">${q.q}</text>
        `).join("")}

        <rect x="634" y="518" width="500" height="36" rx="6" fill="#eff6ff" stroke="#0b5cad"/>
        <text x="884" y="540" text-anchor="middle" fill="#0b5cad" font-family="${SANS}" font-size="11" font-weight="bold">Mandatory: IGMP Snooping + 1 Querier/VLAN · PortFast · Auto-Neg · DLR &lt;30 nodes</text>
      `;

    default:
      return null;
  }
}
