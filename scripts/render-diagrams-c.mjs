// Bespoke light-canvas engineering diagrams (Part C: Power Quality, Cabinet Thermal, Motor Efficiency, VFD & Motor Repair)
// Canvas working area inside diagram frame: x=36..1164, y=104..576 (width 1128, height 472)

const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function box(x, y, w, h, { fill = "#ffffff", stroke = "#cbd5e1", sw = 1.6, rx = 10 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

export function renderDiagramBodyC(d) {
  switch (d.type) {
    /* =====================================================================
     * 1A. VFD HARMONICS: WAVEFORM & SPECTRUM VS IEEE 519-2022
     * ===================================================================== */
    case "harmonics-spectrum": {
      // Left panel: Current waveforms (x=48..508, y=126..556)
      // Pure sine wave vs 6-pulse twin-peak current pulse
      const sinePts = [];
      const pulsePts = [];
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * Math.PI * 2;
        const x = 86 + (i / 120) * 392;
        const ys = 310 - Math.sin(t) * 95;
        sinePts.push(`${x.toFixed(1)},${ys.toFixed(1)}`);
        // Realistic 6-pulse double-hump current waveform (5th + 7th harmonics)
        const raw =
          Math.sin(t) -
          0.42 * Math.sin(5 * t) +
          0.22 * Math.sin(7 * t) -
          0.1 * Math.sin(11 * t) +
          0.06 * Math.sin(13 * t);
        // Clamp near zero-crossing to mimic discontinuous rectifier conduction
        const env = Math.pow(Math.abs(Math.sin(t)), 0.45);
        const yp = 310 - raw * env * 96;
        pulsePts.push(`${x.toFixed(1)},${yp.toFixed(1)}`);
      }

      // Right panel: Harmonic bar chart (x=532..1154, y=126..556)
      const orders = [
        { h: "5th", bare: 58, rx3: 28, afe: 2.2, lim: 7.0 },
        { h: "7th", bare: 38, rx3: 14, afe: 1.6, lim: 7.0 },
        { h: "11th", bare: 14, rx3: 7.2, afe: 1.3, lim: 3.5 },
        { h: "13th", bare: 10, rx3: 4.8, afe: 1.0, lim: 3.5 },
        { h: "17th", bare: 6.5, rx3: 3.1, afe: 0.8, lim: 2.5 },
        { h: "19th", bare: 5.0, rx3: 2.3, afe: 0.7, lim: 2.5 },
      ];
      const baseY = 486;
      const maxH = 265; // corresponds to 65%
      const yScale = (pct) => baseY - (Math.min(pct, 65) / 65) * maxH;

      const barsSvg = orders
        .map((o, idx) => {
          const gx = 594 + idx * 90;
          const bw = 20;
          const b1 = (o.bare / 65) * maxH;
          const b2 = (o.rx3 / 65) * maxH;
          const b3 = (o.afe / 65) * maxH;
          const yLim = yScale(o.lim);
          return `
            <rect x="${gx}" y="${(baseY - b1).toFixed(1)}" width="${bw}" height="${b1.toFixed(1)}" rx="3" fill="#dc2626"/>
            <text x="${gx + 10}" y="${(baseY - b1 - 6).toFixed(1)}" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="10" font-weight="bold">${o.bare}%</text>

            <rect x="${gx + 23}" y="${(baseY - b2).toFixed(1)}" width="${bw}" height="${b2.toFixed(1)}" rx="3" fill="#f59e0b"/>
            <text x="${gx + 33}" y="${(baseY - b2 - 6).toFixed(1)}" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="10">${o.rx3}%</text>

            <rect x="${gx + 46}" y="${(baseY - b3).toFixed(1)}" width="${bw}" height="${b3.toFixed(1)}" rx="3" fill="#059669"/>
            <text x="${gx + 56}" y="${(baseY - b3 - 6).toFixed(1)}" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="10">${o.afe}%</text>

            <line x1="${gx - 6}" y1="${yLim.toFixed(1)}" x2="${gx + 72}" y2="${yLim.toFixed(1)}" stroke="#0b5cad" stroke-width="2.2" stroke-dasharray="5,3"/>
            <text x="${gx + 33}" y="508" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="12" font-weight="bold">${o.h}</text>
            <text x="${gx + 33}" y="524" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="10">Lim ${o.lim}%</text>
          `;
        })
        .join("");

      return `
        <!-- Left Panel: Waveform Comparison -->
        ${box(48, 124, 464, 434, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="156" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Input Phase Current Waveform (1 AC Cycle)</text>
        <text x="68" y="177" fill="#64748b" font-family="${SANS}" font-size="12">Six-pulse diode rectifier twin pulses vs. clean sinusoidal load</text>

        ${box(68, 194, 424, 232, { fill: "#ffffff", stroke: "#e2e8f0", rx: 8 })}
        <line x1="84" y1="310" x2="480" y2="310" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4,4"/>
        <line x1="86" y1="212" x2="86" y2="412" stroke="#cbd5e1" stroke-width="1.2"/>
        <polyline points="${sinePts.join(" ")}" fill="none" stroke="#059669" stroke-width="2.6" stroke-dasharray="7,4"/>
        <polyline points="${pulsePts.join(" ")}" fill="none" stroke="#dc2626" stroke-width="3.2"/>

        <text x="94" y="218" fill="#059669" font-family="${MONO}" font-size="11" font-weight="bold">-- Clean Sine / AFE (&lt;4% THDi)</text>
        <text x="94" y="236" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">— Bare 6-Pulse VFD (~85–105% THDi)</text>
        <text x="476" y="328" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="10">360° (16.7 / 20 ms)</text>

        <!-- Summary KPI callouts under waveform -->
        ${box(68, 442, 134, 98, { fill: "#fef2f2", stroke: "#fca5a5", rx: 8 })}
        <text x="135" y="468" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="11" font-weight="bold">BARE 6-PULSE</text>
        <text x="135" y="498" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="22" font-weight="bold">~90%</text>
        <text x="135" y="522" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="11">Typical THDi</text>

        ${box(213, 442, 134, 98, { fill: "#fffbeb", stroke: "#fcd34d", rx: 8 })}
        <text x="280" y="468" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11" font-weight="bold">3% REACTOR</text>
        <text x="280" y="498" text-anchor="middle" fill="#d97706" font-family="${MONO}" font-size="22" font-weight="bold">~38%</text>
        <text x="280" y="522" text-anchor="middle" fill="#78350f" font-family="${SANS}" font-size="11">Typical THDi</text>

        ${box(358, 442, 134, 98, { fill: "#ecfdf5", stroke: "#6ee7b7", rx: 8 })}
        <text x="425" y="468" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">ACTIVE AFE</text>
        <text x="425" y="498" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="22" font-weight="bold">&lt;3.5%</text>
        <text x="425" y="522" text-anchor="middle" fill="#064e3b" font-family="${SANS}" font-size="11">Typical THDi</text>

        <!-- Right Panel: Harmonic Spectrum -->
        ${box(530, 124, 622, 434, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="552" y="156" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Characteristic Odd Harmonic Spectrum (% of Fundamental)</text>
        <text x="552" y="177" fill="#64748b" font-family="${SANS}" font-size="12">Dashed blue bars = IEEE 519-2022 Table 2 limits for typical factory PCC (Isc / IL = 20–50)</text>

        <!-- Legend -->
        <rect x="552" y="190" width="12" height="12" rx="2" fill="#dc2626"/>
        <text x="570" y="200" fill="#334155" font-family="${SANS}" font-size="11.5">Bare 6-Pulse</text>
        <rect x="668" y="190" width="12" height="12" rx="2" fill="#f59e0b"/>
        <text x="686" y="200" fill="#334155" font-family="${SANS}" font-size="11.5">3% AC Line Reactor</text>
        <rect x="822" y="190" width="12" height="12" rx="2" fill="#059669"/>
        <text x="840" y="200" fill="#334155" font-family="${SANS}" font-size="11.5">Active Front End (AFE)</text>
        <line x1="992" y1="196" x2="1020" y2="196" stroke="#0b5cad" stroke-width="2.4" stroke-dasharray="5,3"/>
        <text x="1026" y="200" fill="#0b5cad" font-family="${SANS}" font-size="11.5" font-weight="bold">IEEE 519 Limit</text>

        <!-- Grid lines -->
        ${[0, 15, 30, 45, 60]
          .map((v) => {
            const y = yScale(v).toFixed(1);
            return `
              <line x1="584" y1="${y}" x2="1132" y2="${y}" stroke="${v === 0 ? "#475569" : "#e2e8f0"}" stroke-width="${v === 0 ? 1.5 : 1}"/>
              <text x="576" y="${Number(y) + 4}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="10.5">${v}%</text>
            `;
          })
          .join("")}

        ${barsSvg}
        <text x="858" y="546" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="11">Note: IEEE 519 limits apply to Total Demand Distortion (TDD) at the PCC, not single-drive THDi at partial load.</text>
      `;
    }

    /* =====================================================================
     * 1B. HARMONICS PCC SINGLE-LINE & SELECTION LADDER
     * ===================================================================== */
    case "harmonics-pcc-ladder":
      return `
        <!-- Top Half: PCC Single-Line Architecture -->
        ${box(48, 120, 1104, 186, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="148" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Point of Common Coupling (PCC) Measurement Boundary &amp; Worked Example</text>

        <!-- Utility -->
        ${box(68, 170, 176, 114, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <text x="156" y="198" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">UTILITY XFMR</text>
        <text x="156" y="220" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="13" font-weight="bold">1,500 kVA · 480V</text>
        <text x="156" y="241" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11.5">Z = 5.75%</text>
        <text x="156" y="264" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">Isc ≈ 31,374 A</text>

        <line x1="244" y1="227" x2="312" y2="227" stroke="#0b5cad" stroke-width="3.5" marker-end="url(#arrBlue)"/>

        <!-- PCC Node -->
        ${box(318, 162, 232, 130, { fill: "#fef3c7", stroke: "#d97706", sw: 2.5 })}
        <rect x="318" y="162" width="232" height="30" rx="8" fill="#d97706"/>
        <text x="434" y="182" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">PCC METERING BUS</text>
        <text x="434" y="214" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="12.5" font-weight="bold">Peak Demand IL = 1,200 A</text>
        <text x="434" y="236" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="12.5" font-weight="bold">Isc / IL = 26.1 (Tier 20–50)</text>
        <text x="434" y="260" text-anchor="middle" fill="#78350f" font-family="${SANS}" font-size="11.5">IEEE 519 Limit: TDD ≤ 8.0%</text>
        <text x="434" y="278" text-anchor="middle" fill="#78350f" font-family="${SANS}" font-size="11.5">Voltage Limit: THDv ≤ 8.0%</text>

        <!-- Branches from PCC -->
        <line x1="550" y1="204" x2="632" y2="204" stroke="#059669" stroke-width="2.8" marker-end="url(#arrGreen)"/>
        <line x1="550" y1="254" x2="632" y2="254" stroke="#dc2626" stroke-width="2.8" marker-end="url(#arrRed)"/>

        <!-- Linear Loads -->
        ${box(638, 166, 224, 58, { fill: "#ecfdf5", stroke: "#059669", sw: 1.8 })}
        <text x="750" y="191" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">LINEAR LOADS (750 A)</text>
        <text x="750" y="211" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="11.5">DOL Motors, Heaters, Lighting</text>

        <!-- VFD Loads -->
        ${box(638, 232, 224, 62, { fill: "#fef2f2", stroke: "#dc2626", sw: 1.8 })}
        <text x="750" y="256" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="12" font-weight="bold">VFD LOADS (450 A / 37.5%)</text>
        <text x="750" y="277" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="11.5">Injects 5th, 7th, 11th, 13th</text>

        <!-- Result Box -->
        <line x1="862" y1="263" x2="906" y2="263" stroke="#475569" stroke-width="2.4" marker-end="url(#arrDark)"/>
        ${box(912, 166, 222, 128, { fill: "#ffffff", stroke: "#0b5cad", sw: 2 })}
        <text x="1023" y="192" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="11.5" font-weight="bold">RESULTING PCC TDD</text>
        <text x="928" y="218" fill="#dc2626" font-family="${MONO}" font-size="11.5" font-weight="bold">Bare 6-Pulse: 31.9% ✗</text>
        <text x="928" y="240" fill="#d97706" font-family="${MONO}" font-size="11.5" font-weight="bold">5% Reactor:   12.0% ✗</text>
        <text x="928" y="262" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">Passive Flt:   2.6% ✓</text>
        <text x="928" y="282" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">AFE Drive:     1.5% ✓</text>

        <!-- Bottom Half: Mitigation Selection Ladder -->
        <text x="48" y="340" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Harmonic Mitigation Selection Ladder by VFD Share of Plant Demand</text>
        ${[
          { x: 48, tier: "TIER 1 · <15% VFDs", title: "3% AC Line Reactor", thdi: "35–45% THDi", cost: "1.1× Cost", desc: "Baseline spike & diode protection; keeps PCC TDD <8% on stiff utility bus.", c: "#0b5cad", bg: "#eff6ff" },
          { x: 328, tier: "TIER 2 · 15–25% VFDs", title: "5% Reactor / DC Choke", thdi: "28–35% THDi", cost: "1.15× Cost", desc: "Lower cost than filters; check 2–3% bus voltage drop under full torque.", c: "#0284c7", bg: "#f0f9ff" },
          { x: 608, tier: "TIER 3 · 25–45% VFDs", title: "Passive Filter / 18-Pulse", thdi: "5–8% THDi", cost: "1.5–2.5× Cost", desc: "Meets IEEE 519 <8% TDD. Disconnect filter caps below 20% load on generators.", c: "#d97706", bg: "#fffbeb" },
          { x: 888, tier: "TIER 4 · >45% / WEAK GRID", title: "AFE Drive or Central AHF", thdi: "<3–5% THDi", cost: "2.0–2.6× Cost", desc: "Strict <5% TDD compliance, dynamic cancellation & 4-quadrant regeneration.", c: "#059669", bg: "#ecfdf5" },
        ]
          .map(
            (t) => `
          ${box(t.x, 356, 264, 206, { fill: t.bg, stroke: t.c, sw: 2 })}
          <rect x="${t.x}" y="356" width="264" height="32" rx="8" fill="${t.c}"/>
          <text x="${t.x + 132}" y="377" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">${esc(t.tier)}</text>
          <text x="${t.x + 132}" y="416" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">${esc(t.title)}</text>
          <rect x="${t.x + 18}" y="430" width="110" height="28" rx="6" fill="#ffffff" stroke="${t.c}"/>
          <text x="${t.x + 73}" y="448" text-anchor="middle" fill="${t.c}" font-family="${MONO}" font-size="11" font-weight="bold">${esc(t.thdi)}</text>
          <rect x="${t.x + 138}" y="430" width="108" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="${t.x + 192}" y="448" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="11" font-weight="bold">${esc(t.cost)}</text>
          <text x="${t.x + 18}" y="484" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(t.desc.slice(0, 38))}</text>
          <text x="${t.x + 18}" y="504" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(t.desc.slice(38, 76))}</text>
          <text x="${t.x + 18}" y="524" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(t.desc.slice(76))}</text>
        `
          )
          .join("")}
      `;

    /* =====================================================================
     * 2A. CABINET THERMAL BALANCE CROSS-SECTION & DERATING
     * ===================================================================== */
    case "cabinet-thermal-balance":
      return `
        <!-- Left: Control Cabinet Cross-Section -->
        ${box(48, 122, 628, 438, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">IEC 60890 Control Cabinet Heat-Balance Cross-Section</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Heat Equation: Q_cool = Q_v (Internal Losses) − k · A_e · (T_i − T_a)</text>

        <!-- External Ambient Badge -->
        ${box(68, 220, 124, 86, { fill: "#fff7ed", stroke: "#f59e0b", sw: 1.8 })}
        <text x="130" y="246" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="11.5" font-weight="bold">PLANT AMBIENT</text>
        <text x="130" y="274" text-anchor="middle" fill="#ea580c" font-family="${MONO}" font-size="20" font-weight="bold">Ta = 42°C</text>
        <text x="130" y="295" text-anchor="middle" fill="#9a3412" font-family="${SANS}" font-size="10.5">Hot Summer Floor</text>

        <!-- Inward Heat Arrow when Ta > Ti -->
        <line x1="194" y1="264" x2="236" y2="264" stroke="#dc2626" stroke-width="3" marker-end="url(#arrRed)"/>
        <text x="130" y="330" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">If Ta &gt; Ti: Heat enters!</text>
        <text x="130" y="346" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">+184 W wall gain</text>

        <!-- Cabinet Shell -->
        <rect x="244" y="196" width="276" height="338" rx="8" fill="#ffffff" stroke="#334155" stroke-width="3.5"/>
        <rect x="250" y="202" width="264" height="58" rx="4" fill="#fee2e2" opacity="0.65"/>
        <text x="382" y="222" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="11" font-weight="bold">TOP HOT ZONE (Target Ti ≤ 35°C)</text>

        <!-- PLC Rack -->
        ${box(266, 236, 232, 54, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.8, rx: 6 })}
        <text x="382" y="259" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">PLC + Ethernet Switch</text>
        <text x="382" y="278" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="11">55 W loss · Max 55–60°C</text>

        <!-- SMPS -->
        ${box(266, 304, 232, 52, { fill: "#f0fdf4", stroke: "#059669", sw: 1.8, rx: 6 })}
        <text x="382" y="327" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="12" font-weight="bold">24V DC SMPS (91% Eff)</text>
        <text x="382" y="345" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="11">45 W loss · Arrhenius 10°C cap life</text>

        <!-- VFD with Through-Panel Heatsink -->
        ${box(266, 372, 232, 86, { fill: "#fffbeb", stroke: "#d97706", sw: 2, rx: 6 })}
        <text x="382" y="398" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="12.5" font-weight="bold">2× 15 kW VFDs (97% Eff)</text>
        <text x="382" y="419" text-anchor="middle" fill="#78350f" font-family="${SANS}" font-size="11.5">920 W total (~30 W / kW)</text>
        <text x="382" y="439" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">Derates 1–2.5%/°C &gt; 40°C</text>

        <!-- Rear Flange Heatsink Fin Graphic -->
        <rect x="520" y="382" width="22" height="66" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
        <line x1="542" y1="392" x2="554" y2="392" stroke="#475569" stroke-width="2"/>
        <line x1="542" y1="406" x2="554" y2="406" stroke="#475569" stroke-width="2"/>
        <line x1="542" y1="420" x2="554" y2="420" stroke="#475569" stroke-width="2"/>
        <line x1="542" y1="434" x2="554" y2="434" stroke="#475569" stroke-width="2"/>
        <text x="562" y="408" fill="#059669" font-family="${MONO}" font-size="10.5" font-weight="bold">FLANGE MOUNT</text>
        <text x="562" y="424" fill="#334155" font-family="${SANS}" font-size="10.5">Rejects 70–80%</text>
        <text x="562" y="439" fill="#334155" font-family="${SANS}" font-size="10.5">VFD heat outside!</text>

        <!-- Closed Loop AC on Side -->
        ${box(534, 206, 126, 134, { fill: "#e0f2fe", stroke: "#0284c7", sw: 2 })}
        <text x="597" y="232" text-anchor="middle" fill="#0369a1" font-family="${MONO}" font-size="11.5" font-weight="bold">CLOSED-LOOP</text>
        <text x="597" y="248" text-anchor="middle" fill="#0369a1" font-family="${MONO}" font-size="11.5" font-weight="bold">CABINET AC</text>
        <text x="597" y="274" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="13" font-weight="bold">1,800 W</text>
        <text x="597" y="294" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">(6,150 BTU/h)</text>
        <text x="597" y="320" text-anchor="middle" fill="#059669" font-family="${SANS}" font-size="10.5" font-weight="bold">Setpoint: 35°C</text>

        <!-- Cold bottom strip -->
        <rect x="266" y="476" width="232" height="40" rx="6" fill="#e0f2fe" stroke="#38bdf8"/>
        <text x="382" y="500" text-anchor="middle" fill="#0369a1" font-family="${MONO}" font-size="11" font-weight="bold">MOUNT BRAKE RESISTORS EXTERNALLY</text>

        <!-- Right Panel Top: Wall Material k-Factor -->
        ${box(696, 122, 456, 206, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="716" y="150" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Enclosure Wall Transfer Factor k [W/(m²·K)]</text>
        <text x="716" y="170" fill="#64748b" font-family="${SANS}" font-size="11.5">Bare stainless &amp; fiberglass shed far less passive heat</text>
        ${[
          { y: 192, label: "Painted Mild Steel", k: 5.5, w: 230, c: "#0b5cad" },
          { y: 228, label: "Anodized Aluminum", k: 5.8, w: 242, c: "#059669" },
          { y: 264, label: "Bare 304/316 Stainless", k: 4.1, w: 172, c: "#d97706" },
          { y: 300, label: "Fiberglass / GRP", k: 3.5, w: 146, c: "#dc2626" },
        ]
          .map(
            (m) => `
          <text x="716" y="${m.y + 14}" fill="#334155" font-family="${SANS}" font-size="12" font-weight="bold">${m.label}</text>
          <rect x="876" y="${m.y}" width="${m.w}" height="20" rx="4" fill="${m.c}"/>
          <text x="${884 + m.w}" y="${m.y + 14}" fill="${m.c}" font-family="${MONO}" font-size="12" font-weight="bold">${m.k}</text>
        `
          )
          .join("")}

        <!-- Right Panel Bottom: VFD Temperature Derating -->
        ${box(696, 344, 456, 216, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="716" y="372" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Typical VFD Current Derating Above 40°C</text>
        <line x1="744" y1="516" x2="1124" y2="516" stroke="#475569" stroke-width="1.5"/>
        <line x1="744" y1="396" x2="744" y2="516" stroke="#475569" stroke-width="1.5"/>
        <rect x="744" y="396" width="190" height="120" fill="#ecfdf5" opacity="0.6"/>
        <rect x="934" y="396" width="190" height="120" fill="#fef2f2" opacity="0.65"/>
        <polyline points="744,412 934,412 1030,456 1120,500" fill="none" stroke="#dc2626" stroke-width="3.5"/>
        <circle cx="934" cy="412" r="5.5" fill="#059669"/>
        <circle cx="1030" cy="456" r="5.5" fill="#d97706"/>
        <circle cx="1120" cy="500" r="5.5" fill="#dc2626"/>
        <text x="840" y="438" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11.5" font-weight="bold">100% RATED FLA</text>
        <text x="934" y="402" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="11" font-weight="bold">40°C Knee</text>
        <text x="1030" y="444" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11">85% @ 50°C</text>
        <text x="1095" y="488" text-anchor="end" fill="#991b1b" font-family="${MONO}" font-size="11">Trip &gt;55°C</text>
        <text x="744" y="536" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">20°C</text>
        <text x="839" y="536" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">30°C</text>
        <text x="934" y="536" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="10.5" font-weight="bold">40°C</text>
        <text x="1030" y="536" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">50°C</text>
        <text x="1120" y="536" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10.5">60°C</text>
      `;

    /* =====================================================================
     * 2B. COOLING STRATEGY SELECTION MATRIX
     * ===================================================================== */
    case "cooling-strategy-matrix":
      return `
        <!-- Left 2D Selection Map -->
        ${box(48, 122, 742, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="72" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Cabinet Cooling Selection Map: ΔT (Ti − Ta) vs. Internal Heat Load (W)</text>

        <!-- Plot area: x=130..760 (0..5000W), y=176..506 (+20K top to -15K bottom) -->
        <!-- Zero ΔT line at y = 176 + (20/35)*330 = 364.6 -->
        <!-- Zone 1: Natural Convection (0..450W, ΔT >= +8K -> y=176..289) -->
        <rect x="130" y="176" width="104" height="118" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
        <text x="182" y="226" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">NATURAL</text>
        <text x="182" y="242" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">CONVECTION</text>
        <text x="182" y="262" text-anchor="middle" fill="#047857" font-family="${SANS}" font-size="10.5">&lt; 300 W</text>

        <!-- Zone 2: Filtered Fan / Air-to-Air HX (300..2500W, ΔT +5K..+20K) -->
        <rect x="234" y="176" width="300" height="142" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="384" y="226" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="13" font-weight="bold">FILTERED FAN (NEMA 12)</text>
        <text x="384" y="248" text-anchor="middle" fill="#0369a1" font-family="${MONO}" font-size="12" font-weight="bold">OR AIR-TO-AIR HX (NEMA 4X)</text>
        <text x="384" y="272" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="11.5">Requires clean/cooler plant air (Ti &gt; Ta + 5 to 8 K)</text>
        <text x="384" y="292" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">Airflow: V̇(m³/h) = 3.1 × Q_net / ΔT</text>

        <!-- Zone 3: High-Power Air-to-Water HX (Right strip >2500W) -->
        <rect x="534" y="176" width="226" height="330" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.5"/>
        <text x="647" y="310" text-anchor="middle" fill="#5b21b6" font-family="${MONO}" font-size="13" font-weight="bold">AIR-TO-WATER</text>
        <text x="647" y="330" text-anchor="middle" fill="#5b21b6" font-family="${MONO}" font-size="13" font-weight="bold">HEAT EXCHANGER</text>
        <text x="647" y="354" text-anchor="middle" fill="#4c1d95" font-family="${SANS}" font-size="11.5">or Large 3–6 kW AC</text>
        <text x="647" y="378" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">Heavy VFD / CNC bays</text>
        <text x="647" y="398" text-anchor="middle" fill="#64748b" font-family="${MONO}" font-size="10.5">Zero dust ingress</text>

        <!-- Zone 4: Closed-Loop Compressor AC (Ti <= Ta + 5K, i.e., y=318..506, x=130..534) -->
        <rect x="130" y="318" width="404" height="188" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
        <text x="332" y="408" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="14" font-weight="bold">CLOSED-LOOP CABINET AIR CONDITIONER</text>
        <text x="332" y="432" text-anchor="middle" fill="#78350f" font-family="${SANS}" font-size="12">Mandatory whenever Ti ≤ Ta (hot factory) OR NEMA 4X sealed washdown</text>
        <text x="332" y="454" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="11.5" font-weight="bold">Worked Example: Qv=1,320 W, ΔT=−7 K → 1,800 W AC</text>

        <!-- Zero ΔT Horizontal Reference Line -->
        <line x1="126" y1="365" x2="764" y2="365" stroke="#dc2626" stroke-width="2.4" stroke-dasharray="6,4"/>
        <text x="136" y="357" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">ΔT = 0 K (Ti = Ta) — Passive / Fan Limit!</text>

        <!-- Worked Example Plotted Point (1320W -> x=130+1320/5000*630 = 296, ΔT=-7K -> y=365 + 7/15*141 = 431) -->
        <circle cx="296" cy="478" r="8" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
        <text x="312" y="482" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">Worked Case (1,320 W, −7 K)</text>

        <!-- Axes Labels -->
        <text x="122" y="182" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="10.5">+20 K</text>
        <text x="122" y="274" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="10.5">+10 K</text>
        <text x="122" y="369" text-anchor="end" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">0 K</text>
        <text x="122" y="460" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="10.5">−10 K</text>
        <text x="130" y="528" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">0 W</text>
        <text x="234" y="528" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">500 W</text>
        <text x="384" y="528" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">1,500 W</text>
        <text x="534" y="528" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">2,500 W</text>
        <text x="748" y="528" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="11">5,000+ W</text>
        <text x="445" y="550" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">Total Internal Component Heat Load Q_v (Watts)</text>

        <!-- Right Quick Sizing Rules Card -->
        ${box(810, 122, 342, 438, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="830" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">5 Field Thermal Rules</text>
        ${[
          { n: "01", t: "Setpoint = 35°C (95°F)", d: "Avoids dew-point condensation while staying below 40°C VFD knee.", c: "#0b5cad" },
          { n: "02", t: "Door Interlock Switch", d: "Auto-stops cabinet AC if panel door is left propped open.", c: "#dc2626" },
          { n: "03", t: "Derate Fans 35–40%", d: "Filter mats clog fast; oversize nominal CFM for real shop pressure.", c: "#d97706" },
          { n: "04", t: "External Brake Resistors", d: "Never dump 500–3,000 W braking energy inside a sealed panel.", c: "#059669" },
          { n: "05", t: "Check L35/L45 Curve", d: "AC cooling rating drops ~10–15% at 42–45°C plant ambient.", c: "#7c3aed" },
        ]
          .map(
            (r, idx) => `
          ${box(828, 170 + idx * 74, 306, 64, { fill: "#ffffff", stroke: "#e2e8f0", rx: 8 })}
          <rect x="838" y="${182 + idx * 74}" width="34" height="38" rx="6" fill="${r.c}"/>
          <text x="855" y="${206 + idx * 74}" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">${r.n}</text>
          <text x="884" y="${196 + idx * 74}" fill="#0f172a" font-family="${SANS}" font-size="12.5" font-weight="bold">${r.t}</text>
          <text x="884" y="${214 + idx * 74}" fill="#475569" font-family="${SANS}" font-size="10.8">${r.d.slice(0, 38)}</text>
          <text x="884" y="${227 + idx * 74}" fill="#475569" font-family="${SANS}" font-size="10.8">${r.d.slice(38)}</text>
        `
          )
          .join("")}
      `;

    /* =====================================================================
     * 3A. IEC 60034-30-1 EFFICIENCY CURVES & 10-YEAR TCO
     * ===================================================================== */
    case "iec-efficiency-tco": {
      const powers = ["0.75", "3.0", "7.5", "22", "75", "110", "200"];
      const xs = [110, 200, 290, 380, 470, 560, 650];
      const yMap = (eff) => 492 - ((eff - 78) / 22) * 290; // 78%..100% -> 492..202
      const ie2 = [79.6, 85.5, 88.7, 91.6, 94.0, 94.5, 95.1];
      const ie3 = [82.5, 87.7, 90.4, 93.0, 95.0, 95.4, 96.0];
      const ie4 = [85.7, 90.4, 92.6, 94.5, 96.0, 96.3, 96.7];
      const ie5 = [88.5, 92.3, 94.1, 95.6, 96.8, 97.0, 97.3];

      const curve = (arr, color, dashed = false) => {
        const pts = arr.map((v, i) => `${xs[i]},${yMap(v).toFixed(1)}`).join(" ");
        const dots = arr
          .map((v, i) => `<circle cx="${xs[i]}" cy="${yMap(v).toFixed(1)}" r="4.2" fill="${color}"/>`)
          .join("");
        return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3"${dashed ? ' stroke-dasharray="6,4"' : ""}/>${dots}`;
      };

      return `
        <!-- Left Panel: IEC 60034-30-1 Curves -->
        ${box(48, 122, 652, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">IEC 60034-30-1 Nominal Motor Efficiency (50 Hz, 4-Pole)</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Each IE class upgrade reduces motor electrical losses by roughly 15–20%</text>

        <!-- EU IE4 Mandate Highlight Band (75–200 kW) -->
        <rect x="456" y="198" width="210" height="294" fill="#fef3c7" opacity="0.45" stroke="#f59e0b" stroke-dasharray="4,3"/>
        <text x="561" y="476" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="10.5" font-weight="bold">EU 2019/1781: IE4 MANDATORY</text>
        <text x="561" y="489" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="9.5">(75–200 kW since Jul 2023)</text>

        <!-- Grid Lines -->
        ${[80, 85, 90, 95, 100]
          .map((v) => {
            const y = yMap(v).toFixed(1);
            return `
              <line x1="94" y1="${y}" x2="674" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
              <text x="86" y="${Number(y) + 4}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="11">${v}%</text>
            `;
          })
          .join("")}
        <line x1="94" y1="492" x2="674" y2="492" stroke="#475569" stroke-width="1.5"/>

        ${curve(ie2, "#94a3b8", true)}
        ${curve(ie3, "#0b5cad")}
        ${curve(ie4, "#d97706")}
        ${curve(ie5, "#059669")}

        ${powers
          .map(
            (p, i) => `
          <text x="${xs[i]}" y="512" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="11">${p}</text>
        `
          )
          .join("")}
        <text x="380" y="534" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">Rated Motor Output Power (kW)</text>

        <!-- Curve Labels / Legend -->
        <rect x="112" y="190" width="332" height="32" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="124" y="210" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">— IE5</text>
        <text x="196" y="210" fill="#d97706" font-family="${MONO}" font-size="11.5" font-weight="bold">— IE4</text>
        <text x="268" y="210" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">— IE3</text>
        <text x="340" y="210" fill="#64748b" font-family="${MONO}" font-size="11.5" font-weight="bold">-- IE2</text>

        <!-- End Value Callouts at 200 kW -->
        <text x="660" y="${yMap(97.3) - 4}" fill="#059669" font-family="${MONO}" font-size="10.5" font-weight="bold">97.3%</text>
        <text x="660" y="${yMap(96.0) + 12}" fill="#0b5cad" font-family="${MONO}" font-size="10.5" font-weight="bold">96.0%</text>

        <!-- Right Panel: 10-Year Motor TCO Breakdown -->
        ${box(720, 122, 432, 438, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="742" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">10-Year Continuous Motor TCO</text>
        <text x="742" y="172" fill="#64748b" font-family="${SANS}" font-size="12">75 kW pump · 6,000 hrs/yr · $0.12/kWh</text>

        <!-- Stacked Horizontal TCO Bar (100% width = 388 px) -->
        <text x="742" y="210" fill="#0f172a" font-family="${MONO}" font-size="12" font-weight="bold">LIFECYCLE COST SHARE (~$468,000)</text>
        <rect x="742" y="222" width="372" height="44" rx="6" fill="#0b5cad"/>
        <text x="928" y="250" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="16" font-weight="bold">ELECTRICITY: ~96.2%</text>
        <rect x="1116" y="222" width="10" height="44" fill="#f59e0b"/>
        <rect x="1128" y="222" width="6" height="44" fill="#059669"/>

        <rect x="742" y="280" width="188" height="62" rx="8" fill="#fffbeb" stroke="#fcd34d"/>
        <text x="836" y="303" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11.5" font-weight="bold">PURCHASE CAPEX</text>
        <text x="836" y="328" text-anchor="middle" fill="#d97706" font-family="${MONO}" font-size="17" font-weight="bold">~2.3% ($7–9k)</text>

        <rect x="942" y="280" width="188" height="62" rx="8" fill="#ecfdf5" stroke="#6ee7b7"/>
        <text x="1036" y="303" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11.5" font-weight="bold">MAINTENANCE</text>
        <text x="1036" y="328" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="17" font-weight="bold">~1.5% ($5–7k)</text>

        <!-- 10-Yr Energy Savings Cards -->
        ${box(742, 360, 388, 180, { fill: "#ffffff", stroke: "#cbd5e1", rx: 8 })}
        <text x="760" y="388" fill="#0f172a" font-family="${SANS}" font-size="13.5" font-weight="bold">10-Year Energy Bill Comparison (75 kW Pump)</text>
        ${[
          { y: 406, lbl: "Legacy IE2 Fixed", val: "$460.6k", w: 230, c: "#94a3b8" },
          { y: 438, lbl: "New IE3 Fixed", val: "$454.8k", w: 227, c: "#0b5cad" },
          { y: 470, lbl: "New IE4 Fixed", val: "$450.0k", w: 224, c: "#d97706" },
          { y: 502, lbl: "VFD + IE5 (80% Flow)", val: "$296.6k", w: 148, c: "#059669" },
        ]
          .map(
            (b) => `
          <text x="760" y="${b.y + 14}" fill="#334155" font-family="${SANS}" font-size="11.5" font-weight="bold">${b.lbl}</text>
          <rect x="894" y="${b.y}" width="${b.w}" height="20" rx="4" fill="${b.c}"/>
          <text x="${900 + b.w}" y="${b.y + 14}" fill="${b.c}" font-family="${MONO}" font-size="11.5" font-weight="bold">${b.val}</text>
        `
          )
          .join("")}
      `;
    }

    /* =====================================================================
     * 3B. AFFINITY CUBE LAW & MOTOR ARCHITECTURES
     * ===================================================================== */
    case "affinity-cube-law": {
      const flows = [40, 50, 60, 70, 80, 90, 100];
      const fx = (f) => 116 + ((f - 40) / 60) * 510;
      const fy = (p) => 492 - (p / 110) * 288;
      const throttlePts = flows.map((f) => `${fx(f).toFixed(1)},${fy(66 + 0.34 * f).toFixed(1)}`).join(" ");
      const vfdImPts = flows.map((f) => `${fx(f).toFixed(1)},${fy(Math.pow(f / 100, 3) * 100 + 8).toFixed(1)}`).join(" ");
      const vfdIe5Pts = flows.map((f) => `${fx(f).toFixed(1)},${fy(Math.pow(f / 100, 3) * 100 + 3).toFixed(1)}`).join(" ");

      return `
        <!-- Left Chart: Affinity Law Power vs Flow -->
        ${box(48, 122, 622, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Centrifugal Pump/Fan Power vs. Flow (Affinity Cube Law: P ∝ N³)</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Throttling valves waste energy as friction; VFD speed control slashes cubic shaft power</text>

        ${[0, 25, 50, 75, 100]
          .map((p) => {
            const y = fy(p).toFixed(1);
            return `
              <line x1="106" y1="${y}" x2="640" y2="${y}" stroke="${p === 0 ? "#475569" : "#e2e8f0"}" stroke-width="${p === 0 ? 1.5 : 1}"/>
              <text x="98" y="${Number(y) + 4}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="11">${p}%</text>
            `;
          })
          .join("")}

        <polyline points="${throttlePts}" fill="none" stroke="#dc2626" stroke-width="3.2" stroke-dasharray="7,4"/>
        <polyline points="${vfdImPts}" fill="none" stroke="#0b5cad" stroke-width="3"/>
        <polyline points="${vfdIe5Pts}" fill="none" stroke="#059669" stroke-width="3.4"/>

        <!-- 80% Flow Savings Annotation -->
        <line x1="${fx(80)}" y1="${fy(93.2)}" x2="${fx(80)}" y2="${fy(54.2)}" stroke="#d97706" stroke-width="2.4" marker-end="url(#arrDark)" marker-start="url(#arrDark)"/>
        <rect x="336" y="274" width="112" height="52" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
        <text x="392" y="295" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="11.5" font-weight="bold">AT 80% FLOW</text>
        <text x="392" y="314" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="12" font-weight="bold">~42% SAVED!</text>

        <!-- Legend -->
        <text x="122" y="206" fill="#dc2626" font-family="${MONO}" font-size="11.5" font-weight="bold">-- Discharge Throttle Valve (Fixed Speed)</text>
        <text x="122" y="226" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">— VFD + IE3 Induction Motor</text>
        <text x="122" y="246" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">— VFD + IE5 SynRM (Lowest Partial-Load Loss)</text>

        ${flows.map((f) => `<text x="${fx(f)}" y="514" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="11">${f}%</text>`).join("")}
        <text x="372" y="538" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">Process Flow / Speed (% of Rated)</text>

        <!-- Right Panel: Motor Architecture Comparison Cards -->
        ${box(692, 122, 460, 438, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="712" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">High-Efficiency Motor Topologies Compared</text>
        ${[
          {
            y: 174,
            name: "AC Induction (IM · IE3 / IE4)",
            tag: "DOL OR VFD",
            c: "#0b5cad",
            bg: "#eff6ff",
            l1: "Rotor: Aluminum or copper squirrel cage (has slip I²R losses)",
            l2: "Part-load eff drops ~6–10%; lowest upfront cost & universal spares",
          },
          {
            y: 300,
            name: "Synchronous Reluctance (SynRM · IE5)",
            tag: "MAGNET-FREE · VFD",
            c: "#059669",
            bg: "#ecfdf5",
            l1: "Rotor: Laminated steel flux barriers — ZERO rotor cage losses!",
            l2: "Runs 15–30°C cooler at bearings; flat efficiency down to 40% speed",
          },
          {
            y: 426,
            name: "Permanent Magnet (IPM / PMSM · IE5)",
            tag: "HIGH TORQUE DENSITY",
            c: "#7c3aed",
            bg: "#f5f3ff",
            l1: "Rotor: Embedded NdFeB / ferrite magnets; smallest frame size",
            l2: "Highest partial-load eff; watch rare-earth cost & back-EMF safety",
          },
        ]
          .map(
            (m) => `
          ${box(712, m.y, 420, 112, { fill: m.bg, stroke: m.c, sw: 1.8 })}
          <text x="728" y="${m.y + 28}" fill="${m.c}" font-family="${SANS}" font-size="14" font-weight="bold">${m.name}</text>
          <rect x="728" y="${m.y + 38}" width="142" height="22" rx="4" fill="${m.c}"/>
          <text x="799" y="${m.y + 53}" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="10.5" font-weight="bold">${m.tag}</text>
          <text x="728" y="${m.y + 78}" fill="#0f172a" font-family="${SANS}" font-size="11.5">${m.l1}</text>
          <text x="728" y="${m.y + 98}" fill="#334155" font-family="${SANS}" font-size="11.5">${m.l2}</text>
        `
          )
          .join("")}
      `;
    }

    /* =====================================================================
     * 4A. VFD POWER STAGE & 12-POINT DIODE TEST MAP
     * ===================================================================== */
    case "vfd-diode-test-map":
      return `
        <!-- Safety Warning Banner -->
        <rect x="48" y="116" width="1104" height="36" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="1.6"/>
        <text x="600" y="139" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="12.5" font-weight="bold">⚠ LOTO FIRST: DISCONNECT L1/L2/L3 &amp; U/V/W, WAIT 5–15 MIN, CONFIRM DC+ TO DC− &lt; 5V DC BEFORE DIODE TESTING</text>

        <!-- Stage 1: Input Rectifier -->
        ${box(48, 170, 290, 250, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <rect x="48" y="170" width="290" height="34" rx="8" fill="#0b5cad"/>
        <text x="193" y="192" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12.5" font-weight="bold">1. 6-PULSE INPUT RECTIFIER</text>
        <!-- AC Terminals -->
        ${[
          { y: 244, lbl: "L1" },
          { y: 294, lbl: "L2" },
          { y: 344, lbl: "L3" },
        ]
          .map(
            (t) => `
          <rect x="64" y="${t.y - 14}" width="42" height="28" rx="4" fill="#ffffff" stroke="#0b5cad" stroke-width="1.5"/>
          <text x="85" y="${t.y + 4}" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">${t.lbl}</text>
          <line x1="106" y1="${t.y}" x2="152" y2="${t.y}" stroke="#334155" stroke-width="2"/>
          <circle cx="152" cy="${t.y}" r="4" fill="#0b5cad"/>
        `
          )
          .join("")}
        <!-- Stylized Diode Symbols -->
        <rect x="166" y="220" width="154" height="72" rx="6" fill="#ffffff" stroke="#93c5fd"/>
        <text x="243" y="242" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">UPPER DIODES (→ DC+)</text>
        <text x="243" y="262" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">Red(+) L1/L2/L3 → Blk DC+</text>
        <text x="243" y="280" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">OK: 0.35–0.65V | Rev: OL</text>

        <rect x="166" y="304" width="154" height="72" rx="6" fill="#ffffff" stroke="#93c5fd"/>
        <text x="243" y="326" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">LOWER DIODES (DC− →)</text>
        <text x="243" y="346" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">Red(+) DC− → Blk L1/L2/L3</text>
        <text x="243" y="364" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">OK: 0.35–0.65V | Rev: OL</text>
        <text x="193" y="405" text-anchor="middle" fill="#475569" font-family="${SANS}" font-size="10.5">*Note: SCR inputs (&gt;30 kW) read OL unpowered</text>

        <!-- DC Bus Rails Connecting Stages -->
        <line x1="338" y1="226" x2="774" y2="226" stroke="#dc2626" stroke-width="5"/>
        <text x="556" y="216" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="12" font-weight="bold">DC+ RAIL (+560–650V OPERATING)</text>
        <line x1="338" y1="382" x2="774" y2="382" stroke="#0f172a" stroke-width="5"/>
        <text x="556" y="402" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="12" font-weight="bold">DC− RAIL (COMMON NEGATIVE BUS)</text>

        <!-- Stage 2: DC Bus Caps & Brake Chopper -->
        ${box(386, 240, 340, 130, { fill: "#fffbeb", stroke: "#d97706", sw: 2 })}
        <text x="556" y="264" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="12" font-weight="bold">2. PRE-CHARGE, DC CAPS &amp; BRAKE</text>
        <rect x="404" y="278" width="146" height="78" rx="6" fill="#ffffff" stroke="#fcd34d"/>
        <text x="477" y="298" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="11" font-weight="bold">DC+ to DC− CHECK</text>
        <text x="477" y="318" text-anchor="middle" fill="#059669" font-family="${SANS}" font-size="11">Rises smoothly → OL</text>
        <text x="477" y="338" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">0.00V = BUS SHORT!</text>

        <rect x="562" y="278" width="148" height="78" rx="6" fill="#ffffff" stroke="#fcd34d"/>
        <text x="636" y="298" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="11" font-weight="bold">BRAKE CHOPPER (B−)</text>
        <text x="636" y="318" text-anchor="middle" fill="#059669" font-family="${SANS}" font-size="11">B− → DC+: 0.35–0.6V</text>
        <text x="636" y="338" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">B− to DC− 0V = SHORT</text>

        <!-- Stage 3: Output IGBT Inverter -->
        ${box(774, 170, 378, 250, { fill: "#ecfdf5", stroke: "#059669", sw: 2 })}
        <rect x="774" y="170" width="378" height="34" rx="8" fill="#059669"/>
        <text x="963" y="192" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12.5" font-weight="bold">3. 6-IGBT INVERTER (FREEWHEEL DIODES)</text>

        <rect x="792" y="220" width="234" height="72" rx="6" fill="#ffffff" stroke="#6ee7b7"/>
        <text x="909" y="242" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">UPPER IGBTs (U/V/W → DC+)</text>
        <text x="909" y="262" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">Red(+) U,V,W → Blk(−) DC+</text>
        <text x="909" y="280" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">OK: 0.30–0.60V | Rev: OL</text>

        <rect x="792" y="304" width="234" height="72" rx="6" fill="#ffffff" stroke="#6ee7b7"/>
        <text x="909" y="326" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">LOWER IGBTs (DC− → U/V/W)</text>
        <text x="909" y="346" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">Red(+) DC− → Blk(−) U,V,W</text>
        <text x="909" y="364" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">OK: 0.30–0.60V | Rev: OL</text>

        ${[
          { y: 244, lbl: "U" },
          { y: 294, lbl: "V" },
          { y: 344, lbl: "W" },
        ]
          .map(
            (t) => `
          <line x1="1026" y1="${t.y}" x2="1086" y2="${t.y}" stroke="#334155" stroke-width="2"/>
          <rect x="1086" y="${t.y - 14}" width="46" height="28" rx="4" fill="#ffffff" stroke="#059669" stroke-width="1.8"/>
          <text x="1109" y="${t.y + 4}" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="12.5" font-weight="bold">${t.lbl}</text>
        `
          )
          .join("")}
        <text x="963" y="405" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="10.5">All 3 phases must match within ±0.03 V</text>

        <!-- Bottom Failure Forensics Strip -->
        ${box(48, 438, 1104, 126, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="466" fill="#0f172a" font-family="${SANS}" font-size="14" font-weight="bold">Instant Verdict Guide (Multimeter in DIODE Mode — Never Use Standard Ω Only)</text>
        ${[
          { x: 68, title: "0.30–0.65V Fwd / OL Rev", desc: "Healthy silicon junction; still verify gate drivers & motor cable before startup.", c: "#059669", bg: "#ecfdf5" },
          { x: 432, title: "0.00–0.05V Both Ways", desc: "Dead semiconductor short! Check gate resistors (Rg) & optocouplers before swapping IGBT.", c: "#dc2626", bg: "#fef2f2" },
          { x: 796, title: "OL Both Ways (on Diode)", desc: "Blown open bond wire, open internal bus fuse, or open pre-charge resistor.", c: "#d97706", bg: "#fffbeb" },
        ]
          .map(
            (c) => `
          ${box(c.x, 480, 344, 70, { fill: c.bg, stroke: c.c, sw: 1.6, rx: 8 })}
          <text x="${c.x + 14}" y="503" fill="${c.c}" font-family="${MONO}" font-size="12" font-weight="bold">${c.title}</text>
          <text x="${c.x + 14}" y="523" fill="#334155" font-family="${SANS}" font-size="11">${c.desc.slice(0, 50)}</text>
          <text x="${c.x + 14}" y="539" fill="#334155" font-family="${SANS}" font-size="11">${c.desc.slice(50)}</text>
        `
          )
          .join("")}
      `;

    /* =====================================================================
     * 4B. DC BUS CAPACITOR REFORMING VOLTAGE RAMP & CIRCUIT
     * ===================================================================== */
    case "cap-reforming-ramp":
      return `
        <!-- Left Chart: Stepped Reforming Voltage vs Leakage Current -->
        ${box(48, 122, 650, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Stepped DC Bus Capacitor Reforming Profile (2–5 Yr Shelf Spare)</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Gradual DC voltage ramp heals thinned Al₂O₃ dielectric oxide without boiling electrolyte</text>

        <!-- Plot Axes: x=106..668, y=206..486 -->
        ${[0, 25, 50, 75, 100]
          .map((pct) => {
            const y = (486 - (pct / 100) * 260).toFixed(1);
            return `
              <line x1="106" y1="${y}" x2="668" y2="${y}" stroke="${pct === 0 ? "#475569" : "#e2e8f0"}" stroke-width="${pct === 0 ? 1.5 : 1}"/>
              <text x="98" y="${Number(y) + 4}" text-anchor="end" fill="#0b5cad" font-family="${MONO}" font-size="11">${pct}%</text>
            `;
          })
          .join("")}

        <!-- Blue Stepped Voltage Curve (25% -> 50% -> 75% -> 100%) -->
        <polyline points="106,486 106,421 226,421 226,356 346,356 346,291 466,291 466,226 668,226" fill="none" stroke="#0b5cad" stroke-width="3.6"/>
        <text x="166" y="411" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">25% (160V)</text>
        <text x="286" y="346" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">50% (325V)</text>
        <text x="406" y="281" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">75% (490V)</text>
        <text x="567" y="216" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">100% RATED (650V DC)</text>

        <!-- Orange Leakage Current Spikes & Decay Curve -->
        <path d="M 106,486 L 112,350 Q 145,455 224,474 L 232,330 Q 268,450 344,472 L 352,320 Q 388,448 464,471 L 472,315 Q 515,448 666,476" fill="none" stroke="#ea580c" stroke-width="2.8"/>

        <!-- Safe Leakage Band -->
        <line x1="106" y1="468" x2="668" y2="468" stroke="#059669" stroke-width="1.8" stroke-dasharray="5,3"/>
        <text x="664" y="460" text-anchor="end" fill="#059669" font-family="${MONO}" font-size="10.5" font-weight="bold">Target Leakage &lt; 5 mA (Oxide Healed ✓)</text>

        <!-- Time X Labels -->
        <text x="106" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">0 min</text>
        <text x="226" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">30–60m</text>
        <text x="346" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">60–120m</text>
        <text x="466" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">90–180m</text>
        <text x="652" y="508" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="11">150–300+ min</text>

        <!-- Legend -->
        <rect x="118" y="522" width="540" height="26" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="134" y="539" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">— Applied DC Bus Voltage (%)</text>
        <text x="380" y="539" fill="#ea580c" font-family="${MONO}" font-size="11" font-weight="bold">— Cap Leakage Current (mA decay)</text>

        <!-- Right Top: Bench Reforming Circuit -->
        ${box(718, 122, 434, 212, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="738" y="150" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Safe Current-Limited Bench Circuit</text>
        ${box(738, 174, 118, 86, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.8, rx: 6 })}
        <text x="797" y="204" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="11" font-weight="bold">VARIABLE DC</text>
        <text x="797" y="224" text-anchor="middle" fill="#334155" font-family="${MONO}" font-size="11">0–650V PSU</text>
        <text x="797" y="244" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="10">Isolated</text>

        <line x1="856" y1="196" x2="886" y2="196" stroke="#dc2626" stroke-width="2.5"/>
        <rect x="886" y="182" width="100" height="28" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
        <text x="936" y="200" text-anchor="middle" fill="#92400e" font-family="${MONO}" font-size="10.5" font-weight="bold">1–10 kΩ 100W</text>
        <line x1="986" y1="196" x2="1014" y2="196" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrRed)"/>

        <line x1="856" y1="242" x2="1014" y2="242" stroke="#0f172a" stroke-width="2.5"/>
        <circle cx="936" cy="242" r="14" fill="#ffffff" stroke="#059669" stroke-width="2"/>
        <text x="936" y="246" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="10" font-weight="bold">mA</text>

        ${box(1020, 174, 112, 86, { fill: "#ecfdf5", stroke: "#059669", sw: 1.8, rx: 6 })}
        <text x="1076" y="204" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">VFD DC BUS</text>
        <text x="1076" y="224" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">DC+ / DC−</text>
        <text x="1076" y="244" text-anchor="middle" fill="#334155" font-family="${SANS}" font-size="10">No AC Mains</text>

        <text x="738" y="290" fill="#dc2626" font-family="${MONO}" font-size="11" font-weight="bold">ABORT IF:</text>
        <text x="806" y="290" fill="#334155" font-family="${SANS}" font-size="11.5">Current fails to drop after 2 hrs OR</text>
        <text x="738" y="310" fill="#334155" font-family="${SANS}" font-size="11.5">capacitor case warms &gt;5°C above ambient → Recap!</text>

        <!-- Right Bottom: Storage Schedule Summary -->
        ${box(718, 350, 434, 210, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="738" y="378" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Shelf-Spare Storage Thresholds (≤30°C)</text>
        ${[
          { y: 396, age: "< 1 Year", act: "Normal energization (no-load check)", c: "#059669", bg: "#ecfdf5" },
          { y: 434, age: "1–2 Years", act: "Apply 100% AC no-load for 30–60 min", c: "#0b5cad", bg: "#eff6ff" },
          { y: 472, age: "2–5 Years", act: "Mandatory stepped 25→100% reforming", c: "#d97706", bg: "#fffbeb" },
          { y: 510, age: "> 5 Years", act: "Measure ESR/Cap or proactively recap", c: "#dc2626", bg: "#fef2f2" },
        ]
          .map(
            (s) => `
          <rect x="738" y="${s.y}" width="92" height="30" rx="5" fill="${s.c}"/>
          <text x="784" y="${s.y + 20}" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">${esc(s.age)}</text>
          <rect x="838" y="${s.y}" width="294" height="30" rx="5" fill="${s.bg}" stroke="${s.c}" stroke-opacity="0.4"/>
          <text x="850" y="${s.y + 20}" fill="#0f172a" font-family="${SANS}" font-size="12">${esc(s.act)}</text>
        `
          )
          .join("")}
      `;

    /* =====================================================================
     * 5A. VFD COMMON-MODE EDM BEARING FLUTING & MITIGATION
     * ===================================================================== */
    case "edm-bearing-fluting":
      return `
        <!-- Left Panel: Parasitic Shaft Voltage & EDM Discharge -->
        ${box(48, 122, 620, 438, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">VFD Common-Mode Capacitive Coupling &amp; EDM Fluting Path</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="12">High dV/dt PWM pulses charge the rotor shaft until grease film arcs (&gt;5–15 V)</text>

        <!-- Motor Frame Outer Box -->
        <rect x="130" y="200" width="460" height="236" rx="14" fill="#ffffff" stroke="#334155" stroke-width="3"/>
        <text x="360" y="222" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11.5" font-weight="bold">GROUNDED MOTOR STATOR FRAME (PE)</text>

        <!-- Stator Windings Top & Bottom -->
        <rect x="210" y="236" width="300" height="38" rx="6" fill="#eff6ff" stroke="#0b5cad" stroke-width="2"/>
        <text x="360" y="260" text-anchor="middle" fill="#0b5cad" font-family="${MONO}" font-size="12" font-weight="bold">STATOR WINDING (V_CM ≠ 0)</text>

        <!-- Capacitive Coupling C_wr Arrows -->
        <line x1="310" y1="274" x2="310" y2="306" stroke="#d97706" stroke-width="2.4" stroke-dasharray="4,2" marker-end="url(#arrDark)"/>
        <line x1="410" y1="274" x2="410" y2="306" stroke="#d97706" stroke-width="2.4" stroke-dasharray="4,2" marker-end="url(#arrDark)"/>
        <text x="360" y="296" text-anchor="middle" fill="#b45309" font-family="${MONO}" font-size="11" font-weight="bold">C_wr Coupling</text>

        <!-- Rotor & Shaft -->
        <rect x="236" y="308" width="248" height="44" rx="6" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
        <text x="360" y="335" text-anchor="middle" fill="#0f172a" font-family="${MONO}" font-size="12" font-weight="bold">ROTOR (V_shaft = 10–40 Vpk)</text>
        <rect x="86" y="320" width="150" height="20" fill="#64748b"/>
        <rect x="484" y="320" width="156" height="20" fill="#64748b"/>
        <text x="106" y="312" fill="#334155" font-family="${MONO}" font-size="10.5" font-weight="bold">NDE</text>
        <text x="614" y="312" text-anchor="end" fill="#334155" font-family="${MONO}" font-size="10.5" font-weight="bold">DE SHAFT</text>

        <!-- NDE Bearing (Insulated Callout) -->
        <rect x="164" y="302" width="38" height="56" rx="5" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2.2"/>
        <text x="183" y="334" text-anchor="middle" fill="#5b21b6" font-family="${MONO}" font-size="9.5" font-weight="bold">INSUL</text>
        <text x="183" y="376" text-anchor="middle" fill="#5b21b6" font-family="${SANS}" font-size="10.5" font-weight="bold">Ceramic / Oxide</text>
        <text x="183" y="390" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="10">(≥75 kW NDE)</text>

        <!-- DE Bearing with EDM Arc Warning -->
        <rect x="518" y="302" width="38" height="56" rx="5" fill="#fef2f2" stroke="#dc2626" stroke-width="2.2"/>
        <text x="537" y="334" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10" font-weight="bold">EDM⚡</text>

        <!-- Shaft Grounding Ring next to DE Bearing -->
        <rect x="568" y="298" width="14" height="64" rx="3" fill="#059669"/>
        <text x="566" y="378" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="10.5" font-weight="bold">SHAFT GROUND RING</text>
        <text x="566" y="392" text-anchor="middle" fill="#065f46" font-family="${SANS}" font-size="10">Drains V_shaft &lt;2V</text>

        <!-- Ground Symbol under Frame -->
        <line x1="360" y1="436" x2="360" y2="458" stroke="#059669" stroke-width="3"/>
        <line x1="336" y1="458" x2="384" y2="458" stroke="#059669" stroke-width="3"/>
        <line x1="344" y1="466" x2="376" y2="466" stroke="#059669" stroke-width="2.4"/>
        <line x1="352" y1="474" x2="368" y2="474" stroke="#059669" stroke-width="2"/>

        <!-- Washboard Fluting Zoom Box -->
        ${box(68, 486, 580, 58, { fill: "#fef2f2", stroke: "#fca5a5", rx: 8 })}
        <text x="86" y="510" fill="#991b1b" font-family="${MONO}" font-size="12" font-weight="bold">ISO 15243 FLUTING SIGNATURE:</text>
        <text x="306" y="510" fill="#7f1d1d" font-family="${SANS}" font-size="11.5">Evenly spaced parallel washboard ridges across raceway</text>
        <text x="86" y="531" fill="#7f1d1d" font-family="${SANS}" font-size="11.5">Causes high-pitched audible whine &amp; repeat bearing failure every 3–12 months.</text>

        <!-- Right Panel: Mitigation Blueprint by Motor Size -->
        ${box(690, 122, 462, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="712" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Proven Protection Blueprint by Frame Size</text>

        ${[
          {
            y: 174,
            band: "SMALL / MEDIUM (< 75 kW / 100 HP)",
            mech: "Dominant Mechanism: Capacitive EDM Discharge",
            fix1: "• Install conductive microfiber Shaft Grounding Ring (SGR)",
            fix2: "• Add Common-Mode ferrite core at VFD output (cuts I_CM 40%)",
            fix3: "• Lower VFD carrier frequency to 2–4 kHz where noise permits",
            c: "#0b5cad",
            bg: "#eff6ff",
          },
          {
            y: 312,
            band: "LARGE MOTORS (≥ 75 kW / ≥ 100 HP)",
            mech: "Mechanism: Capacitive EDM + Circulating Shaft Loops",
            fix1: "• Install Insulated Bearing (ceramic/oxide) on NDE to break loop",
            fix2: "• MUST pair with DE Shaft Grounding Ring (protects gearbox/pump!)",
            fix3: "• Bond motor frame with wide flat braided HF strap + 360° EMC gland",
            c: "#059669",
            bg: "#ecfdf5",
          },
        ]
          .map(
            (b) => `
          ${box(712, b.y, 418, 124, { fill: b.bg, stroke: b.c, sw: 2 })}
          <rect x="712" y="${b.y}" width="418" height="30" rx="8" fill="${b.c}"/>
          <text x="728" y="${b.y + 20}" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">${esc(b.band)}</text>
          <text x="728" y="${b.y + 52}" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">${esc(b.mech)}</text>
          <text x="728" y="${b.y + 74}" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(b.fix1)}</text>
          <text x="728" y="${b.y + 94}" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(b.fix2)}</text>
          <text x="728" y="${b.y + 114}" fill="#334155" font-family="${SANS}" font-size="11.5">${esc(b.fix3)}</text>
        `
          )
          .join("")}

        <!-- Critical Warning Card -->
        ${box(712, 452, 418, 92, { fill: "#fffbeb", stroke: "#d97706", sw: 2 })}
        <text x="728" y="478" fill="#92400e" font-family="${MONO}" font-size="12" font-weight="bold">⚠ NEVER INSTALL NDE INSULATED BEARING ALONE</text>
        <text x="728" y="500" fill="#78350f" font-family="${SANS}" font-size="11.5">Without a DE shaft grounding ring, shaft charge simply exits</text>
        <text x="728" y="518" fill="#78350f" font-family="${SANS}" font-size="11.5">harder through the DE bearing or flutes the coupled gearbox!</text>
      `;

    /* =====================================================================
     * 5B. REFLECTED WAVE PEAK VOLTAGE VS CABLE LENGTH & SHIELD GROUNDING
     * ===================================================================== */
    case "reflected-wave-curve": {
      // Plot x=116..668 (0..300m), y=200..490 (500V..1800V)
      const cx = (m) => 116 + (m / 300) * 552;
      const cy = (v) => 490 - ((v - 500) / 1300) * 290;
      const rawPts = [
        [0, 680],
        [8, 980],
        [15, 1240],
        [25, 1380],
        [50, 1460],
        [100, 1520],
        [200, 1580],
        [300, 1620],
      ]
        .map(([m, v]) => `${cx(m).toFixed(1)},${cy(v).toFixed(1)}`)
        .join(" ");
      const dvdtPts = [
        [0, 680],
        [25, 780],
        [75, 890],
        [150, 960],
        [225, 1010],
        [300, 1040],
      ]
        .map(([m, v]) => `${cx(m).toFixed(1)},${cy(v).toFixed(1)}`)
        .join(" ");
      const sinePts = [
        [0, 680],
        [150, 675],
        [300, 670],
      ]
        .map(([m, v]) => `${cx(m).toFixed(1)},${cy(v).toFixed(1)}`)
        .join(" ");

      return `
        <!-- Left Chart: Reflected Wave Peak Voltage -->
        ${box(48, 122, 650, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Reflected Wave Peak Voltage vs. Cable Length (480V VFD)</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Fast IGBT 0.1 µs rise time reaches ~2× DC bus overshoot within 15–30 m</text>

        ${[600, 1000, 1400, 1600, 1800]
          .map((v) => {
            const y = cy(v).toFixed(1);
            return `
              <line x1="116" y1="${y}" x2="668" y2="${y}" stroke="${v === 1000 || v === 1600 ? "#94a3b8" : "#e2e8f0"}" stroke-width="${v === 1000 || v === 1600 ? 1.5 : 1}"${v === 1000 || v === 1600 ? ' stroke-dasharray="6,3"' : ""}/>
              <text x="108" y="${Number(y) + 4}" text-anchor="end" fill="#475569" font-family="${MONO}" font-size="10.5">${v}V</text>
            `;
          })
          .join("")}
        <line x1="116" y1="490" x2="668" y2="490" stroke="#475569" stroke-width="1.5"/>

        <!-- NEMA MG 1 Threshold Labels -->
        <text x="664" y="${cy(1600) - 6}" text-anchor="end" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">NEMA MG 1 Part 31 Limit (1,600V Inverter Duty)</text>
        <text x="664" y="${cy(1000) - 6}" text-anchor="end" fill="#d97706" font-family="${MONO}" font-size="10.5" font-weight="bold">NEMA MG 1 Part 30 Limit (1,000V Standard Motor)</text>

        <polyline points="${rawPts}" fill="none" stroke="#dc2626" stroke-width="3.5"/>
        <polyline points="${dvdtPts}" fill="none" stroke="#0b5cad" stroke-width="3.2"/>
        <polyline points="${sinePts}" fill="none" stroke="#059669" stroke-width="3.2"/>

        <text x="380" y="${cy(1530) - 10}" fill="#dc2626" font-family="${MONO}" font-size="11.5" font-weight="bold">Unfiltered IGBT (0.1 µs)</text>
        <text x="410" y="${cy(950) - 10}" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">dV/dt Output Filter</text>
        <text x="410" y="${cy(672) - 10}" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">Sine-Wave Filter (~680V)</text>

        ${[0, 50, 100, 150, 200, 250, 300]
          .map((m) => `<text x="${cx(m)}" y="512" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="11">${m}m</text>`)
          .join("")}
        <text x="392" y="538" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">VFD-to-Motor Cable Length (Meters)</text>

        <!-- Right Panel: Settling the Shield Grounding Debate -->
        ${box(718, 122, 434, 438, { fill: "#f8fafc", stroke: "#cbd5e1" })}
        <text x="738" y="152" fill="#0f172a" font-family="${SANS}" font-size="15" font-weight="bold">Shield Grounding: Analog vs. VFD Power</text>
        <text x="738" y="172" fill="#64748b" font-family="${SANS}" font-size="12">Why VFD motor cables break the 4–20 mA single-end rule</text>

        <!-- Box 1: 4-20mA Analog -->
        ${box(738, 194, 394, 154, { fill: "#ffffff", stroke: "#0b5cad", sw: 2 })}
        <rect x="738" y="194" width="394" height="30" rx="8" fill="#0b5cad"/>
        <text x="754" y="214" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">4–20 mA / ANALOG SIGNAL → GROUND 1 END</text>
        <text x="754" y="246" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">Low Frequency (DC – 60 Hz Hum)</text>
        <text x="754" y="268" fill="#334155" font-family="${SANS}" font-size="11.5">• Ground shield at PLC cabinet end ONLY</text>
        <text x="754" y="288" fill="#334155" font-family="${SANS}" font-size="11.5">• Tape &amp; isolate field sensor shield end</text>
        <text x="754" y="308" fill="#dc2626" font-family="${SANS}" font-size="11.5">• Both ends = 60 Hz ground loop drifts signal</text>
        <text x="754" y="330" fill="#64748b" font-family="${MONO}" font-size="10.5">Keep ≥300 mm away from VFD motor trays</text>

        <!-- Box 2: VFD Power Cable -->
        ${box(738, 366, 394, 174, { fill: "#ecfdf5", stroke: "#059669", sw: 2.2 })}
        <rect x="738" y="366" width="394" height="30" rx="8" fill="#059669"/>
        <text x="754" y="386" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">VFD POWER CABLE → BOND 360° BOTH ENDS</text>
        <text x="754" y="418" fill="#065f46" font-family="${SANS}" font-size="12" font-weight="bold">High Frequency (100 kHz – 30 MHz PWM)</text>
        <text x="754" y="440" fill="#0f172a" font-family="${SANS}" font-size="11.5">• Clamp shield 360° to VFD unpainted subpanel</text>
        <text x="754" y="460" fill="#0f172a" font-family="${SANS}" font-size="11.5">• Use 360° brass EMC gland at motor peckerhead</text>
        <text x="754" y="480" fill="#dc2626" font-family="${SANS}" font-size="11.5">• NO pigtails! (15 cm pigtail = open at 10 MHz)</text>
        <text x="754" y="502" fill="#065f46" font-family="${MONO}" font-size="10.5" font-weight="bold">1-end floating shield turns into RF antenna!</text>
        <text x="754" y="524" fill="#334155" font-family="${SANS}" font-size="11">Use 3-phase + 3-symmetrical-ground VFD cable</text>
      `;
    }

    /* =====================================================================
     * 6A. IEEE 43-2013 PI CURVES & 40°C TEMPERATURE CORRECTION KT
     * ===================================================================== */
    case "ieee43-pi-temp": {
      // Left: PI resistance curve (1..10 min)
      const tx = (m) => 108 + (m / 10) * 440;
      const ry = (val) => 486 - (val / 350) * 266; // 0..350 MΩ
      const goodPts = [
        [0.5, 78],
        [1, 110],
        [2, 165],
        [4, 230],
        [6, 272],
        [8, 298],
        [10, 312],
      ]
        .map(([m, v]) => `${tx(m).toFixed(1)},${ry(v).toFixed(1)}`)
        .join(" ");
      const wetPts = [
        [0.5, 42],
        [1, 46],
        [2, 48],
        [4, 50],
        [6, 51],
        [8, 51],
        [10, 52],
      ]
        .map(([m, v]) => `${tx(m).toFixed(1)},${ry(v).toFixed(1)}`)
        .join(" ");

      // Right: K_T temperature correction curve (10°C..80°C)
      const temps = [10, 20, 30, 40, 50, 60, 70, 80];
      const kx = (t) => 674 + ((t - 10) / 70) * 430;
      const ky = (kt) => 486 - (Math.log2(kt / 0.125) / 7) * 260; // log2 scale: 0.125 (2^-3) to 16 (2^4) -> 7 decades of 2!
      const ktPts = temps
        .map((t) => {
          const kt = Math.pow(0.5, (40 - t) / 10);
          return `${kx(t).toFixed(1)},${ky(kt).toFixed(1)}`;
        })
        .join(" ");

      return `
        <!-- Left Panel: IEEE 43 10-Minute PI Curves -->
        ${box(48, 122, 536, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="68" y="152" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">Polarization Index (PI = IR₁₀m / IR₁m) Curve</text>
        <text x="68" y="172" fill="#64748b" font-family="${SANS}" font-size="11.5">Clean dry insulation climbs steadily; moisture flattens the curve</text>

        ${[0, 100, 200, 300]
          .map((v) => {
            const y = ry(v).toFixed(1);
            return `
              <line x1="108" y1="${y}" x2="554" y2="${y}" stroke="${v === 0 ? "#475569" : "#e2e8f0"}" stroke-width="${v === 0 ? 1.5 : 1}"/>
              <text x="100" y="${Number(y) + 4}" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="10.5">${v}MΩ</text>
            `;
          })
          .join("")}

        <line x1="${tx(1)}" y1="210" x2="${tx(1)}" y2="486" stroke="#94a3b8" stroke-dasharray="4,3"/>
        <line x1="${tx(10)}" y1="210" x2="${tx(10)}" y2="486" stroke="#94a3b8" stroke-dasharray="4,3"/>

        <polyline points="${goodPts}" fill="none" stroke="#059669" stroke-width="3.6"/>
        <polyline points="${wetPts}" fill="none" stroke="#dc2626" stroke-width="3.4" stroke-dasharray="7,4"/>

        <circle cx="${tx(1)}" cy="${ry(110)}" r="5" fill="#059669"/>
        <circle cx="${tx(10)}" cy="${ry(312)}" r="5" fill="#059669"/>
        <circle cx="${tx(1)}" cy="${ry(46)}" r="5" fill="#dc2626"/>
        <circle cx="${tx(10)}" cy="${ry(52)}" r="5" fill="#dc2626"/>

        <rect x="240" y="218" width="224" height="44" rx="6" fill="#ecfdf5" stroke="#6ee7b7"/>
        <text x="352" y="237" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11.5" font-weight="bold">HEALTHY DRY: PI = 2.84 ✓</text>
        <text x="352" y="254" text-anchor="middle" fill="#047857" font-family="${SANS}" font-size="10.5">Meets IEEE 43 Class B/F/H (≥2.0)</text>

        <rect x="240" y="392" width="224" height="44" rx="6" fill="#fef2f2" stroke="#fca5a5"/>
        <text x="352" y="411" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="11.5" font-weight="bold">WET / DIRTY: PI = 1.13 ✗</text>
        <text x="352" y="428" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="10.5">Wash &amp; bake at 105–120°C before run</text>

        ${[0, 1, 2, 4, 6, 8, 10]
          .map((m) => `<text x="${tx(m)}" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="10.5">${m}m</text>`)
          .join("")}
        <text x="330" y="534" text-anchor="middle" fill="#64748b" font-family="${SANS}" font-size="11">*Exception: If IR₁m &gt; 5,000 MΩ (VPI), PI may be low yet healthy</text>

        <!-- Right Panel: 40°C Temperature Correction Curve -->
        ${box(604, 122, 548, 438, { fill: "#ffffff", stroke: "#cbd5e1" })}
        <text x="624" y="152" fill="#0f172a" font-family="${SANS}" font-size="14.5" font-weight="bold">IEEE 43 Temp Correction Factor KT (Ref = 40°C)</text>
        <text x="624" y="172" fill="#64748b" font-family="${SANS}" font-size="11.5">R_40°C = KT × R_T  |  Insulation halves every +10°C rise!</text>

        ${[0.125, 0.25, 0.5, 1, 2, 4, 8, 16]
          .map((k) => {
            const y = ky(k).toFixed(1);
            return `
              <line x1="674" y1="${y}" x2="1114" y2="${y}" stroke="${k === 1 ? "#0b5cad" : "#e2e8f0"}" stroke-width="${k === 1 ? 1.8 : 1}"${k === 1 ? ' stroke-dasharray="5,3"' : ""}/>
              <text x="666" y="${Number(y) + 4}" text-anchor="end" fill="${k === 1 ? "#0b5cad" : "#64748b"}" font-family="${MONO}" font-size="10.5">${k}×</text>
            `;
          })
          .join("")}

        <polyline points="${ktPts}" fill="none" stroke="#0b5cad" stroke-width="3.6"/>
        ${temps
          .map((t) => {
            const kt = Math.pow(0.5, (40 - t) / 10);
            return `<circle cx="${kx(t)}" cy="${ky(kt)}" r="4.8" fill="${t === 80 ? "#059669" : t === 10 ? "#dc2626" : "#0b5cad"}"/>
            <text x="${kx(t)}" y="508" text-anchor="middle" fill="#475569" font-family="${MONO}" font-size="10.5">${t}°C</text>`;
          })
          .join("")}

        <!-- Hot vs Cold Worked Callout Boxes -->
        <rect x="688" y="210" width="218" height="62" rx="6" fill="#ecfdf5" stroke="#059669"/>
        <text x="797" y="230" text-anchor="middle" fill="#065f46" font-family="${MONO}" font-size="11" font-weight="bold">HOT MOTOR (80°C)</text>
        <text x="797" y="248" text-anchor="middle" fill="#047857" font-family="${SANS}" font-size="11">12 MΩ raw × 16 = 192 MΩ</text>
        <text x="797" y="264" text-anchor="middle" fill="#059669" font-family="${MONO}" font-size="10.5" font-weight="bold">HEALTHY — DO NOT SCRAP!</text>

        <rect x="886" y="400" width="218" height="62" rx="6" fill="#fef2f2" stroke="#dc2626"/>
        <text x="995" y="420" text-anchor="middle" fill="#991b1b" font-family="${MONO}" font-size="11" font-weight="bold">COLD SPARE (10°C)</text>
        <text x="995" y="438" text-anchor="middle" fill="#7f1d1d" font-family="${SANS}" font-size="11">20 MΩ raw × 0.125 = 2.5 MΩ</text>
        <text x="995" y="454" text-anchor="middle" fill="#dc2626" font-family="${MONO}" font-size="10.5" font-weight="bold">FAIL (&lt;5 MΩ) — WET WINDING!</text>

        <text x="894" y="534" text-anchor="middle" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">Measured Stator Winding Temperature (°C)</text>
      `;
    }

    /* =====================================================================
     * 6B. 3-PHASE MOTOR OFFLINE DIAGNOSTIC & REWIND VS REPLACE TREE
     * ===================================================================== */
    case "motor-rewind-decision":
      return `
        <!-- Top Row: 3 Mandatory Offline Electrical Gates -->
        ${box(48, 128, 326, 134, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <rect x="48" y="128" width="326" height="30" rx="8" fill="#0b5cad"/>
        <text x="211" y="148" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">STEP 1 · LOTO &amp; ISOLATE VFD</text>
        <text x="64" y="182" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">Disconnect U/V/W at Drive</text>
        <text x="64" y="204" fill="#334155" font-family="${SANS}" font-size="11.5">• Isolate cable vs. motor peckerhead</text>
        <text x="64" y="224" fill="#dc2626" font-family="${SANS}" font-size="11.5" font-weight="bold">• Never Megger into VFD IGBTs!</text>
        <text x="64" y="244" fill="#475569" font-family="${SANS}" font-size="11">• Ground RTD/thermistor shields</text>

        <line x1="374" y1="195" x2="424" y2="195" stroke="#0b5cad" stroke-width="3" marker-end="url(#arrBlue)"/>

        ${box(432, 128, 326, 134, { fill: "#f0f9ff", stroke: "#0284c7", sw: 2 })}
        <rect x="432" y="128" width="326" height="30" rx="8" fill="#0284c7"/>
        <text x="595" y="148" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">STEP 2 · PHASE BALANCE &amp; RIC</text>
        <text x="448" y="182" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">4-Wire Kelvin Milliohm + Inductance</text>
        <text x="448" y="204" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">OK: &lt; 2% Resistance Deviation</text>
        <text x="448" y="224" fill="#d97706" font-family="${SANS}" font-size="11.5">2–5%: Check terminal lugs/crimps</text>
        <text x="448" y="244" fill="#dc2626" font-family="${SANS}" font-size="11.5">&gt;5%: Open strand / turn-to-turn short</text>

        <line x1="758" y1="195" x2="808" y2="195" stroke="#0284c7" stroke-width="3" marker-end="url(#arrBlue)"/>

        ${box(816, 128, 336, 134, { fill: "#fffbeb", stroke: "#d97706", sw: 2 })}
        <rect x="816" y="128" width="336" height="30" rx="8" fill="#d97706"/>
        <text x="984" y="148" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="11.5" font-weight="bold">STEP 3 · IEEE 43 MEGGER &amp; PI</text>
        <text x="832" y="182" fill="#0f172a" font-family="${SANS}" font-size="12" font-weight="bold">500V DC (&lt;1kV) Corrected to 40°C</text>
        <text x="832" y="204" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">PASS: ≥ 5 MΩ (100MΩ FW) &amp; PI ≥ 2.0</text>
        <text x="832" y="224" fill="#d97706" font-family="${SANS}" font-size="11.5">PI 1.0–1.5 + Good Ω: Wet / Dirty</text>
        <text x="832" y="244" fill="#dc2626" font-family="${SANS}" font-size="11.5">&lt;1 MΩ or Dead Ground: Failed Stator</text>

        <!-- Vertical Arrows Down to Outcomes -->
        <line x1="211" y1="262" x2="211" y2="322" stroke="#059669" stroke-width="2.6" marker-end="url(#arrGreen)"/>
        <line x1="595" y1="262" x2="595" y2="322" stroke="#d97706" stroke-width="2.6" marker-end="url(#arrDark)"/>
        <line x1="984" y1="262" x2="984" y2="322" stroke="#dc2626" stroke-width="2.6" marker-end="url(#arrRed)"/>

        <!-- Outcome 1: Wash & Bake -->
        ${box(48, 330, 344, 230, { fill: "#ecfdf5", stroke: "#059669", sw: 2 })}
        <rect x="48" y="330" width="344" height="32" rx="8" fill="#059669"/>
        <text x="220" y="351" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">OUTCOME A · RECOVERABLE (NO REWIND)</text>
        <text x="66" y="388" fill="#065f46" font-family="${SANS}" font-size="13" font-weight="bold">Clean, Wash, Bake &amp; Bearing Service</text>
        <text x="66" y="414" fill="#334155" font-family="${SANS}" font-size="11.5">• Trigger: Balanced Ω (&lt;2%), no ground short,</text>
        <text x="66" y="432" fill="#334155" font-family="${SANS}" font-size="11.5">  but low IR / PI from moisture or oil mist</text>
        <text x="66" y="458" fill="#0f172a" font-family="${SANS}" font-size="11.5">• Solvent/detergent wash + oven bake at</text>
        <text x="66" y="476" fill="#065f46" font-family="${MONO}" font-size="11.5" font-weight="bold">  105–120°C until IR &gt; 100 MΩ @ 40°C</text>
        <text x="66" y="502" fill="#334155" font-family="${SANS}" font-size="11.5">• Dip &amp; bake varnish + new bearings/seals</text>
        <text x="66" y="534" fill="#059669" font-family="${MONO}" font-size="11.5" font-weight="bold">Cost: ~15–25% of new · Fastest turnaround</text>

        <!-- Outcome 2: ANSI/EASA AR100 Rewind -->
        ${box(414, 330, 362, 230, { fill: "#fffbeb", stroke: "#d97706", sw: 2 })}
        <rect x="414" y="330" width="362" height="32" rx="8" fill="#d97706"/>
        <text x="595" y="351" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">OUTCOME B · EASA AR100 CERTIFIED REWIND</text>
        <text x="432" y="388" fill="#92400e" font-family="${SANS}" font-size="13" font-weight="bold">Best for &gt;50–100 HP, Custom &amp; Servo Frames</text>
        <text x="432" y="414" fill="#334155" font-family="${SANS}" font-size="11.5">• Repair quote ≤ 55–65% of replacement cost</text>
        <text x="432" y="436" fill="#0f172a" font-family="${SANS}" font-size="11.5">• Core-loss (loop) test PASSES (no hot spots)</text>
        <text x="432" y="460" fill="#dc2626" font-family="${MONO}" font-size="11.5" font-weight="bold">• Burnout oven STRICTLY ≤ 360–370°C</text>
        <text x="432" y="482" fill="#334155" font-family="${SANS}" font-size="11.5">• EASA/AEMT study: efficiency within ±0.1%</text>
        <text x="432" y="504" fill="#334155" font-family="${SANS}" font-size="11.5">• Upgrade wire to NEMA Part 31 + VPI + SGR</text>
        <text x="432" y="534" fill="#b45309" font-family="${MONO}" font-size="11.5" font-weight="bold">Audit: Demand AR100 chart + surge report</text>

        <!-- Outcome 3: Replace with New IE3/IE4/IE5 -->
        ${box(798, 330, 354, 230, { fill: "#eff6ff", stroke: "#0b5cad", sw: 2 })}
        <rect x="798" y="330" width="354" height="32" rx="8" fill="#0b5cad"/>
        <text x="975" y="351" text-anchor="middle" fill="#ffffff" font-family="${MONO}" font-size="12" font-weight="bold">OUTCOME C · REPLACE WITH IE3 / IE4 / IE5</text>
        <text x="816" y="388" fill="#0b5cad" font-family="${SANS}" font-size="13" font-weight="bold">Best for &lt;50 HP Std or Legacy IE1/IE2</text>
        <text x="816" y="414" fill="#334155" font-family="${SANS}" font-size="11.5">• Standard frames &lt;15–50 HP (rewind &gt;60%)</text>
        <text x="816" y="436" fill="#334155" font-family="${SANS}" font-size="11.5">• Damaged/welded stator lamination iron</text>
        <text x="816" y="458" fill="#0f172a" font-family="${SANS}" font-size="11.5">• Legacy IE1/IE2 running &gt;4,000 hrs/yr:</text>
        <text x="816" y="478" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">  IE4 / VFD+IE5 pays back in 1–3 yrs</text>
        <text x="816" y="504" fill="#334155" font-family="${SANS}" font-size="11.5">• Verify voltage unbalance ≤1% on startup</text>
        <text x="816" y="534" fill="#0b5cad" font-family="${MONO}" font-size="11.5" font-weight="bold">Check: EU 2019/1781 &amp; DOE 10 CFR 431</text>
      `;

    default:
      return null;
  }
}
