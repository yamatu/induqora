// Bespoke light-canvas engineering diagrams (Part J: field instrumentation signals —
// IO-Link port cycle, HART overlay on a current loop, Pt100 lead resistance, thermocouple CJC).
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

function chip(x, y, w, t, color, tint) {
  return `<rect x="${x}" y="${y}" width="${w}" height="20" rx="5" fill="${tint}" stroke="${color}" stroke-width="0.9"/>
    ${label(x + w / 2, y + 14, t, { size: 9.2, fill: color, anchor: "middle", mono: true, weight: "bold" })}`;
}

function arrow(x1, y1, x2, y2, color = "#475569", marker = "arrDark") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-end="url(#${marker})"/>`;
}

export function renderDiagramBodyJ(d) {
  switch (d.type) {
    // ------------------------------------------------------------------ 1
    // IO-Link: one master, four ports, one device each, cycle budget
    case "iolink-port-cycle": {
      const ports = [
        { p: "PORT 1", dev: "PHOTO SENSOR", rate: "COM2", cyc: "2.0 ms", min: "2.0", c: "#059669", ok: true },
        { p: "PORT 2", dev: "PRESSURE SW", rate: "COM2", cyc: "3.0 ms", min: "2.4", c: "#059669", ok: true },
        { p: "PORT 3", dev: "VALVE (CLS B)", rate: "COM3", cyc: "1.0 ms", min: "2.4", c: "#dc2626", ok: false },
        { p: "PORT 4", dev: "IO HUB", rate: "COM1", cyc: "5.0 ms", min: "4.8", c: "#f59e0b", ok: true },
      ];

      const devs = ports
        .map((pt, i) => {
          const y = 128 + i * 104;
          const mark = pt.ok ? "" : `<rect x="300" y="${y}" width="4" height="78" rx="2" fill="#dc2626"/>`;
          return `${box(60, y, 268, 78, { fill: pt.ok ? "#ffffff" : "#fef2f2", stroke: pt.c, sw: 1.6 })}
            ${mark}
            <rect x="60" y="${y}" width="6" height="78" rx="3" fill="${pt.c}"/>
            ${label(80, y + 24, pt.p, { size: 11.5, fill: "#0f172a", weight: "bold" })}
            ${label(80, y + 43, pt.dev, { size: 9.8, fill: "#475569" })}
            ${chip(186, y + 16, 54, pt.rate, pt.c, "#f8fafc")}
            ${label(80, y + 64, `cycle ${pt.cyc} · min ${pt.min} ms`, { size: 9.2, fill: pt.ok ? "#64748b" : "#dc2626", mono: true })}`;
        })
        .join("");

      const master = `${box(372, 128, 190, 366, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.8 })}
        <rect x="372" y="128" width="6" height="366" rx="3" fill="#0b5cad"/>
        ${label(394, 158, "IO-LINK MASTER", { size: 12.5, fill: "#0b5cad", weight: "bold" })}
        ${label(394, 176, "one port, one device", { size: 9.4, fill: "#475569" })}
        ${label(394, 204, "No address to set.", { size: 10, fill: "#334155" })}
        ${label(394, 222, "The port is the address.", { size: 10, fill: "#334155" })}
        ${label(394, 250, "Per-port settings:", { size: 9.6, fill: "#0f172a", weight: "bold" })}
        ${label(394, 270, "rate COM1/2/3", { size: 9.6, fill: "#475569", mono: true })}
        ${label(394, 288, "cycle time", { size: 9.6, fill: "#475569", mono: true })}
        ${label(394, 306, "data storage on/off", { size: 9.6, fill: "#475569", mono: true })}
        ${label(394, 334, "Uplink to PLC:", { size: 9.6, fill: "#0f172a", weight: "bold" })}
        ${label(394, 354, "PROFINET · EtherNet/IP", { size: 9.6, fill: "#475569", mono: true })}
        ${label(394, 372, "EtherCAT", { size: 9.6, fill: "#475569", mono: true })}
        ${label(394, 402, "Value status travels", { size: 9.4, fill: "#64748b" })}
        ${label(394, 418, "with the value.", { size: 9.4, fill: "#64748b" })}`;

      const links = ports
        .map((pt, i) => arrow(330, 167 + i * 104, 370, 167 + i * 104, pt.ok ? "#94a3b8" : "#dc2626"))
        .join("");

      const notes = `${box(590, 128, 286, 216, { fill: "#ffffff", stroke: "#e2e8f0", sw: 1.4 })}
        ${label(610, 154, "CYCLE TIME RULE", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${label(610, 176, "Set the port cycle at least", { size: 9.6, fill: "#334155" })}
        ${label(610, 192, "1 ms above the device", { size: 9.6, fill: "#334155" })}
        ${label(610, 208, "datasheet minimum.", { size: 9.6, fill: "#334155" })}
        ${label(610, 234, "Below the minimum the port", { size: 9.6, fill: "#dc2626" })}
        ${label(610, 250, "reports retries, not samples.", { size: 9.6, fill: "#dc2626" })}
        ${label(610, 280, "230.4 kbaud floor:", { size: 9.6, fill: "#0f172a", weight: "bold" })}
        ${label(610, 298, "400 µs transmission time", { size: 9.6, fill: "#475569", mono: true })}
        ${label(610, 316, "is physics, not a cycle.", { size: 9.4, fill: "#64748b" })}`;

      const limits = `${box(590, 360, 286, 134, { fill: "#f8fafc", stroke: "#94a3b8", sw: 1.4, dash: "5 4" })}
        ${label(610, 386, "PHYSICAL LIMITS", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${label(610, 408, "Cable: unshielded, 20 m max", { size: 9.6, fill: "#334155" })}
        ${label(610, 426, "Rates: 4.8 / 38.4 / 230.4 kbaud", { size: 9.6, fill: "#334155" })}
        ${label(610, 444, "Class A ≤4 pins · Class B M12 5-pin", { size: 9.6, fill: "#334155" })}
        ${label(610, 466, "Beyond 20 m it works on the", { size: 9.4, fill: "#dc2626" })}
        ${label(610, 482, "bench and fails near a VFD.", { size: 9.4, fill: "#dc2626" })}`;

      return `<g>${devs}${master}${links}${notes}${limits}</g>`;
    }

    // ------------------------------------------------------------------ 2
    // HART: digital FSK riding on the 4-20 mA current, fault bands
    case "hart-current-loop": {
      const nodes = [
        { x: 60, t: "TRANSMITTER", s: "2-wire, loop powered", c: "#0b5cad", items: ["range 0–10 bar", "address 0"] },
        { x: 240, t: "CABLE PAIR", s: "twisted, unshielded", c: "#64748b", items: ["loop resistance", "counts toward budget"] },
        { x: 420, t: "SENSE RESISTOR", s: "250 Ω typical", c: "#f59e0b", items: ["5 V at 20 mA", "needed for HART"] },
        { x: 600, t: "ANALOG INPUT", s: "DCS or PLC", c: "#059669", items: ["4–20 mA = 0–100 %", "flag 3.8 / 20.5"] },
        { x: 780, t: "HART MODEM", s: "Bell 202 FSK", c: "#7c3aed", items: ["±0.5 mA signal", "1200 bit/s"] },
      ];
      const cards = nodes
        .map((n) => `${box(n.x, 140, 156, 150, { fill: "#ffffff", stroke: n.c, sw: 1.7 })}
          <rect x="${n.x}" y="140" width="156" height="26" rx="10" fill="${n.c}"/>
          <rect x="${n.x}" y="156" width="156" height="10" fill="${n.c}"/>
          ${label(n.x + 78, 158, n.t, { size: 9, fill: "#ffffff", weight: "bold", anchor: "middle" })}
          ${label(n.x + 78, 190, n.s, { size: 9.2, fill: "#475569", anchor: "middle" })}
          ${label(n.x + 78, 216, n.items[0], { size: 9, fill: "#334155", anchor: "middle" })}
          ${label(n.x + 78, 234, n.items[1], { size: 9, fill: "#334155", anchor: "middle" })}`)
        .join("");
      const flow = [0, 1, 2, 3]
        .map((i) => arrow(nodes[i].x + 158, 215, nodes[i + 1].x - 2, 215, "#475569"))
        .join("");

      // analogue staircase with fault bands
      const yOf = (mA) => 560 - (mA / 22) * 190;
      const bands = [
        { mA: 3.8, t: "3.8 mA UNDER-RANGE", c: "#dc2626" },
        { mA: 20.5, t: "20.5 mA OVER-RANGE", c: "#dc2626" },
      ]
        .map(
          (b) => `<line x1="60" y1="${yOf(b.mA)}" x2="700" y2="${yOf(b.mA)}" stroke="${b.c}" stroke-width="1.2" stroke-dasharray="6 4"/>
            ${label(706, yOf(b.mA) + 4, b.t, { size: 9.2, fill: b.c, weight: "bold", mono: true })}`
        )
        .join("");
      const live = `<line x1="60" y1="${yOf(4)}" x2="700" y2="${yOf(4)}" stroke="#059669" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="60" y1="${yOf(20)}" x2="700" y2="${yOf(20)}" stroke="#059669" stroke-width="1" stroke-dasharray="3 3"/>
        ${label(706, yOf(4) + 4, "4 mA = 0 %", { size: 9.2, fill: "#059669", mono: true })}
        ${label(706, yOf(20) + 4, "20 mA = 100 %", { size: 9.2, fill: "#059669", mono: true })}
        ${label(60, yOf(12) + 4, "ANALOGUE PRESENT", { size: 9.4, fill: "#0b5cad", weight: "bold" })}
        ${label(60, 500, "the FSK digital signal rides on top of this current,", { size: 9.4, fill: "#7c3aed" })}
        ${label(60, 516, "so a good 12.00 mA says nothing about the digital channel", { size: 9.4, fill: "#7c3aed" })}`;

      const notes = `${box(880, 140, 250, 158, { fill: "#ffffff", stroke: "#e2e8f0", sw: 1.4 })}
        ${label(900, 166, "POINT-TO-POINT", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${label(900, 188, "address 0 · one device", { size: 9.6, fill: "#334155" })}
        ${label(900, 206, "analogue carries PV", { size: 9.6, fill: "#334155" })}
        ${label(900, 224, "digital carries the rest", { size: 9.6, fill: "#334155" })}
        ${label(900, 252, "MULTIDROP", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${label(900, 274, "current fixed at 4 mA", { size: 9.6, fill: "#dc2626" })}
        ${label(900, 292, "PV digital only", { size: 9.6, fill: "#334155" })}`;

      const addr = `${box(880, 318, 250, 176, { fill: "#f8fafc", stroke: "#94a3b8", sw: 1.4, dash: "5 4" })}
        ${label(900, 344, "ADDRESS BY REVISION", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${label(900, 368, "rev 3–5", { size: 9.6, fill: "#475569", mono: true })}
        ${label(1080, 368, "1 – 15", { size: 9.6, fill: "#0b5cad", mono: true, anchor: "end" })}
        ${label(900, 390, "rev 6", { size: 9.6, fill: "#475569", mono: true })}
        ${label(1080, 390, "1 – 63", { size: 9.6, fill: "#0b5cad", mono: true, anchor: "end" })}
        ${label(900, 412, "rev 7", { size: 9.6, fill: "#475569", mono: true })}
        ${label(1080, 412, "0 – 63", { size: 9.6, fill: "#0b5cad", mono: true, anchor: "end" })}
        ${label(900, 440, "The address plan must satisfy", { size: 9.4, fill: "#334155" })}
        ${label(900, 456, "the oldest device on the pair.", { size: 9.4, fill: "#334155" })}
        ${label(900, 480, "Mixed revisions are legal.", { size: 9.2, fill: "#64748b" })}`;

      return `<g>${cards}${flow}${bands}${live}${notes}${addr}</g>`;
    }

    // ------------------------------------------------------------------ 3
    // Pt100: 2-wire, 3-wire, 4-wire lead resistance
    case "pt100-lead-resistance": {
      const rows = [
        { n: "2-WIRE", lead: "0.385 Ω/°C", err: "lead fully included", ohms: "6.7 Ω @ 100 m", deg: "+17 °C", c: "#dc2626", w: 2 },
        { n: "3-WIRE", lead: "cancels if matched", err: "mismatch passes through", ohms: "±0.5 Ω", deg: "±1.3 °C", c: "#f59e0b", w: 3 },
        { n: "4-WIRE", lead: "no current in sense", err: "eliminated", ohms: "0 Ω", deg: "0 °C", c: "#059669", w: 4 },
      ];
      const schemes = rows
        .map((r, i) => {
          const y = 128 + i * 128;
          const wires = Array.from({ length: r.w })
            .map(
              (_, k) =>
                `<line x1="${96 + k * 14}" y1="${y + 26}" x2="${96 + k * 14}" y2="${y + 90}" stroke="${r.c}" stroke-width="2.2"/>`
            )
            .join("");
          return `${box(60, y, 300, 108, { fill: "#ffffff", stroke: r.c, sw: 1.7 })}
            <rect x="60" y="${y}" width="6" height="108" rx="3" fill="${r.c}"/>
            ${label(80, y + 24, r.n, { size: 12, fill: "#0f172a", weight: "bold" })}
            ${wires}
            ${label(170, y + 40, "sensor", { size: 9, fill: "#64748b" })}
            ${label(170, y + 58, r.lead, { size: 9.2, fill: "#475569" })}
            ${label(170, y + 76, r.err, { size: 9, fill: "#94a3b8" })}`;
        })
        .join("");

      const table = `${box(392, 128, 300, 364, { fill: "#ffffff", stroke: "#cbd5e1", sw: 1.5 })}
        ${label(414, 156, "ERROR FOR REALISTIC CABLE", { size: 10.5, fill: "#0f172a", weight: "bold" })}
        ${label(414, 178, "0.5 mm² copper, 100 m run", { size: 9.2, fill: "#64748b" })}
        ${rows
          .map(
            (r, i) => `${label(414, 212 + i * 34, r.n, { size: 9.8, fill: r.c, weight: "bold", mono: true })}
            ${label(560, 212 + i * 34, r.ohms, { size: 9.6, fill: "#475569", mono: true, anchor: "end" })}
            ${label(668, 212 + i * 34, r.deg, { size: 10.4, fill: r.c, weight: "bold", mono: true, anchor: "end" })}`
          )
          .join("")}
        <line x1="414" y1="330" x2="668" y2="330" stroke="#e2e8f0" stroke-width="1"/>
        ${label(414, 356, "Sensitivity", { size: 9.4, fill: "#0f172a", weight: "bold" })}
        ${label(668, 356, "0.385 Ω/°C", { size: 10, fill: "#0b5cad", mono: true, anchor: "end" })}
        ${label(414, 382, "One ohm of lead", { size: 9.4, fill: "#334155" })}
        ${label(414, 398, "= 2.6 °C of error", { size: 9.4, fill: "#dc2626" })}
        ${label(414, 424, "Copper drifts 0.4 %/°C,", { size: 9.2, fill: "#64748b" })}
        ${label(414, 440, "so the offset moves with", { size: 9.2, fill: "#64748b" })}
        ${label(414, 456, "cabinet temperature.", { size: 9.2, fill: "#64748b" })}
        ${label(414, 480, "Callendar–Van Dusen:", { size: 9.2, fill: "#0f172a", weight: "bold" })}
        ${label(414, 496, "A 3.9083e-3 · B -5.775e-7", { size: 8.8, fill: "#475569", mono: true })}`;

      const notes = `${box(724, 128, 406, 200, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.6 })}
        ${label(746, 154, "THREE-WIRE HAS ONE CONDITION", { size: 10.5, fill: "#0b5cad", weight: "bold" })}
        ${label(746, 178, "Compensation cancels lead resistance only", { size: 9.6, fill: "#334155" })}
        ${label(746, 194, "when the three leads match.", { size: 9.6, fill: "#334155" })}
        ${label(746, 220, "Same cable · same length · same", { size: 9.6, fill: "#334155" })}
        ${label(746, 236, "number of terminals in each leg.", { size: 9.6, fill: "#334155" })}
        ${label(746, 264, "An extra terminal in one leg is the", { size: 9.4, fill: "#dc2626" })}
        ${label(746, 280, "most common cause of a three-wire", { size: 9.4, fill: "#dc2626" })}
        ${label(746, 296, "loop reading a couple of degrees high.", { size: 9.4, fill: "#dc2626" })}`;

      const check = `${box(724, 360, 406, 132, { fill: "#f8fafc", stroke: "#94a3b8", sw: 1.4, dash: "5 4" })}
        ${label(746, 386, "PROVE IT IN ONE STEP", { size: 10.5, fill: "#0f172a", weight: "bold" })}
        ${label(746, 410, "Substitute a precision resistor at the", { size: 9.6, fill: "#334155" })}
        ${label(746, 426, "transmitter terminals:", { size: 9.6, fill: "#334155" })}
        ${label(746, 450, "100.00 Ω = 0 °C", { size: 9.8, fill: "#0b5cad", mono: true })}
        ${label(746, 468, "138.51 Ω = 100 °C", { size: 9.8, fill: "#0b5cad", mono: true })}
        ${label(950, 450, "read correct → wiring is the fault", { size: 9.2, fill: "#059669" })}
        ${label(950, 468, "read wrong → transmitter config", { size: 9.2, fill: "#dc2626" })}`;

      return `<g>${schemes}${table}${notes}${check}</g>`;
    }

    // ------------------------------------------------------------------ 4
    // Thermocouple: hot junction + cold junction + compensation chain
    case "thermocouple-cjc": {
      const hot = `${box(60, 140, 240, 130, { fill: "#fef2f2", stroke: "#dc2626", sw: 1.7 })}
        <rect x="60" y="140" width="6" height="130" rx="3" fill="#dc2626"/>
        ${label(82, 168, "HOT JUNCTION", { size: 12, fill: "#dc2626", weight: "bold" })}
        ${label(82, 188, "in the process", { size: 9.4, fill: "#475569" })}
        ${label(82, 214, "Type K · 41 µV/°C", { size: 10.4, fill: "#0f172a", mono: true })}
        ${label(82, 236, "−200 to +1350 °C", { size: 9.4, fill: "#475569", mono: true })}
        ${label(82, 258, "measures a DIFFERENCE", { size: 9.2, fill: "#dc2626" })}`;

      const wire = `${box(324, 140, 240, 130, { fill: "#ffffff", stroke: "#0b5cad", sw: 1.7 })}
        <rect x="324" y="140" width="6" height="130" rx="3" fill="#0b5cad"/>
        ${label(346, 168, "EXTENSION WIRE", { size: 12, fill: "#0b5cad", weight: "bold" })}
        ${label(346, 188, "same alloy pair", { size: 9.4, fill: "#475569" })}
        ${label(346, 214, "polarity must match:", { size: 9.4, fill: "#334155" })}
        ${label(346, 232, "reversed = 2× error", { size: 9.4, fill: "#dc2626", mono: true })}
        ${label(346, 256, "Copper only if the joint", { size: 9, fill: "#64748b" })}
        ${label(346, 270, "is isothermal + compensated", { size: 9, fill: "#64748b" })}`;

      const cj = `${box(588, 140, 240, 130, { fill: "#fffbeb", stroke: "#f59e0b", sw: 1.7 })}
        <rect x="588" y="140" width="6" height="130" rx="3" fill="#f59e0b"/>
        ${label(610, 168, "COLD JUNCTION", { size: 12, fill: "#b45309", weight: "bold" })}
        ${label(610, 188, "at the terminal block", { size: 9.4, fill: "#475569" })}
        ${label(610, 214, "25–45 °C in a cabinet", { size: 9.8, fill: "#0f172a", mono: true })}
        ${label(610, 236, "uncompensated → that error", { size: 9.4, fill: "#dc2626" })}
        ${label(610, 258, "is the reading error", { size: 9.4, fill: "#dc2626" })}`;

      const card = `${box(852, 140, 278, 130, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.7 })}
        <rect x="852" y="140" width="6" height="130" rx="3" fill="#0b5cad"/>
        ${label(874, 168, "INPUT CARD / TRANSMITTER", { size: 11.5, fill: "#0b5cad", weight: "bold" })}
        ${label(874, 190, "CJC sensor measures the", { size: 9.4, fill: "#334155" })}
        ${label(874, 206, "terminal temperature", { size: 9.4, fill: "#334155" })}
        ${label(874, 232, "E_total = E_meas + E_ref(T_cj)", { size: 9.2, fill: "#0f172a", mono: true })}
        ${label(874, 254, "then polynomial per IEC 60584", { size: 9, fill: "#64748b" })}`;

      const chain = [240, 324, 588, 852]
        .slice(0, 3)
        .map((x, i) => arrow(x + 4, 205, [324, 588, 852][i] - 4, 205, "#475569"))
        .join("");

      const drift = `${box(60, 300, 520, 192, { fill: "#ffffff", stroke: "#e2e8f0", sw: 1.4 })}
        ${label(82, 328, "WHY IT READS LOW AFTER A YEAR", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${[
          "Base-metal types drift cumulatively at",
          "elevated temperature: compositional",
          "change, oxidation, carburisation.",
          "",
          "Type K: Mn and Al migrate from the",
          "negative wire to the positive wire.",
          "",
          "Green rot destroys Type K in reducing",
          "atmospheres — Type N is the alternative.",
          "",
          "A thermocouple is a consumable with a",
          "bounded accuracy, not a reference.",
        ]
          .map((t, i) => label(82, 352 + i * 12.5, t, { size: 9.2, fill: t.startsWith("Type K") ? "#dc2626" : "#334155" }))
          .join("")}`;

      const verify = `${box(610, 300, 520, 192, { fill: "#f8fafc", stroke: "#94a3b8", sw: 1.4, dash: "5 4" })}
        ${label(632, 328, "COMMISSIONING CHECKS", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${[
          "1  card type = actual thermocouple type",
          "2  CJC enabled, reads terminal temp ±1 °C",
          "3  extension type + polarity verified",
          "4  no copper inserted without compensation",
          "5  verify at operating temperature, not ambient",
          "6  log CJC temp as a diagnostic tag",
        ]
          .map((t, i) => label(632, 356 + i * 22, t, { size: 9.6, fill: "#334155", mono: true }))
          .join("")}
        ${label(632, 470, "A rising CJC at stable process = cabinet cooling fault", { size: 9.2, fill: "#0b5cad" })}`;

      return `<g>${hot}${wire}${cj}${card}${chain}${drift}${verify}</g>`;
    }

    default:
      return null;
  }
}
