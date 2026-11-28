// Bespoke light-canvas engineering diagrams (Part I: Rust industrial protocol guides —
// Modbus RS-485 scheduling, OPC UA subscription pipeline, EtherCAT jitter, CANopen bus budget).
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

export function renderDiagramBodyI(d) {
  switch (d.type) {
    // ------------------------------------------------------------------ 1
    // Modbus RS-485: one owner task, serialised queue, silent interval
    case "modbus-rs485-scheduler": {
      const lane = 92;
      const reqs = [
        { slave: "SLAVE 1 · FLOW", period: "200 ms", t: "8 ms", color: "#059669" },
        { slave: "SLAVE 2 · DRIVE", period: "500 ms", t: "120 ms", color: "#dc2626" },
        { slave: "SLAVE 3 · METER", period: "2 s", t: "22 ms", color: "#0b5cad" },
      ];
      const left = 60;
      const w1 = 330;

      const callers = reqs
        .map((r, i) => {
          const y = 118 + i * lane;
          return `${box(left, y, w1, 74, { fill: "#ffffff", stroke: r.color, sw: 1.6 })}
            <rect x="${left}" y="${y}" width="6" height="74" rx="3" fill="${r.color}"/>
            ${label(left + 18, y + 24, r.slave, { size: 12, fill: "#0f172a", weight: "bold" })}
            ${label(left + 18, y + 42, `period ${r.period}`, { size: 9.8, fill: "#64748b" })}
            ${chip(left + 190, y + 30, 118, `RESP ${r.t}`, r.color, "#f8fafc")}`;
        })
        .join("");

      const mq = `${box(430, 118, 200, 248, { fill: "#f8fafc", stroke: "#94a3b8", sw: 1.5, dash: "5 4" })}
        ${label(530, 146, "mpsc CHANNEL", { size: 11.5, fill: "#0f172a", weight: "bold", anchor: "middle" })}
        ${label(530, 164, "bounded, one consumer", { size: 9.4, fill: "#64748b", anchor: "middle" })}
        ${[0, 1, 2, 3]
          .map((i) => `<rect x="456" y="${178 + i * 42}" width="148" height="30" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
            ${label(530, 198 + i * 42, i === 0 ? "REQ #4 (HEAD)" : `REQ #${5 + i}`, { size: 9.2, fill: i === 0 ? "#0b5cad" : "#94a3b8", anchor: "middle", mono: true })}`)
          .join("")}`;

      const owner = `${box(672, 148, 226, 188, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.8 })}
        <rect x="672" y="148" width="6" height="188" rx="3" fill="#0b5cad"/>
        ${label(694, 176, "OWNER TASK", { size: 12.5, fill: "#0b5cad", weight: "bold" })}
        ${label(694, 194, "the only writer on the wire", { size: 9.4, fill: "#475569" })}
        ${label(694, 222, "1 · recv request", { size: 10, fill: "#334155", mono: false })}
        ${label(694, 242, "2 · open / reuse port", { size: 10, fill: "#334155" })}
        ${label(694, 262, "3 · attach_slave", { size: 10, fill: "#334155" })}
        ${label(694, 282, "4 · read (500 ms cap)", { size: 10, fill: "#334155" })}
        ${label(694, 302, "5 · sleep 3.5 char gap", { size: 10, fill: "#334155" })}
        ${label(694, 322, "6 · oneshot reply", { size: 10, fill: "#334155" })}`;

      const lanes = [118, 190, 262]
        .map((y, i) => arrow(390, y + 37, 428, 190 + i * 40, reqs[i].color))
        .join("");
      const toOwner = arrow(632, 240, 670, 240, "#94a3b8");
      const wire = `${box(672, 368, 226, 108, { fill: "#fef2f2", stroke: "#dc2626", sw: 1.6 })}
        <rect x="672" y="368" width="6" height="108" rx="3" fill="#dc2626"/>
        ${label(694, 394, "RS-485 SEGMENT", { size: 12, fill: "#dc2626", weight: "bold" })}
        ${label(694, 412, "half duplex · 19200 8E1", { size: 9.4, fill: "#475569" })}
        ${label(694, 438, "60 req/s practical ceiling", { size: 10, fill: "#334155", mono: true })}
        ${label(694, 456, "turnaround + 3.5 char gap", { size: 9.4, fill: "#64748b" })}`;

      const notes = `${box(916, 118, 248, 358, { fill: "#ffffff", stroke: "#e2e8f0", sw: 1.4 })}
        ${label(936, 144, "WHY ONE OWNER", { size: 11, fill: "#0f172a", weight: "bold" })}
        ${["Two tasks writing the same", "port collide on the wire and", "both frames are lost.", "", "The queue is bounded so a", "dead slave becomes a", "timeout, not memory growth.", "", "Reopen on error: a USB", "adapter that re-enumerates", "after an ESD event recovers", "without a process restart."]
          .map((t, i) => label(936, 170 + i * 17, t, { size: 9.4, fill: "#334155" }))
          .join("")}`;

      return `<g>${callers}${mq}${owner}${wire}${lanes}${toOwner}${notes}</g>`;
    }

    // ------------------------------------------------------------------ 2
    // OPC UA: sampling vs publishing pipeline with queue and deadband
    case "opcua-subscription-pipeline": {
      const stages = [
        { x: 60, t: "SERVER OBJECT", s: "the real value", c: "#64748b", items: ["0–10 bar"] },
        { x: 268, t: "SAMPLING TICK", s: "100 ms", c: "#0b5cad", items: ["read object"] },
        { x: 476, t: "DEADBAND FILTER", s: "±0.02 bar", c: "#7c3aed", items: ["drop noise"] },
        { x: 684, t: "MONITORED QUEUE", s: "size N", c: "#dc2626", items: ["overflow = loss"] },
        { x: 892, t: "PUBLISH TICK", s: "500 ms", c: "#059669", items: ["deliver batch"] },
      ];
      const nodes = stages
        .map((st) => {
          const isQueue = st.t === "MONITORED QUEUE";
          return `${box(st.x, 150, 152, 128, { fill: "#ffffff", stroke: st.c, sw: 1.7, dash: isQueue ? "5 4" : null })}
            <rect x="${st.x}" y="150" width="152" height="26" rx="10" fill="${st.c}"/>
            <rect x="${st.x}" y="166" width="152" height="10" fill="${st.c}"/>
            ${label(st.x + 76, 168, st.t, { size: 9.8, fill: "#ffffff", weight: "bold", anchor: "middle" })}
            ${label(st.x + 76, 200, st.s, { size: 15, fill: st.c, weight: "bold", anchor: "middle", mono: true })}
            ${label(st.x + 76, 232, st.items[0], { size: 9.4, fill: "#475569", anchor: "middle" })}
            ${label(st.x + 76, 250, st.items[0] === "overflow = loss" ? "silent, no error" : "", { size: 9, fill: "#dc2626", anchor: "middle" })}`;
        })
        .join("");
      const flow = [0, 1, 2, 3]
        .map((i) => arrow(stages[i].x + 154, 214, stages[i + 1].x - 2, 214, "#475569"))
        .join("");

      // queue occupancy illustration
      const cells = [0, 1, 2, 3, 4]
        .map((i) => {
          const filled = i < 3;
          return `<rect x="${700 + i * 26}" y="296" width="20" height="26" rx="4" fill="${filled ? "#dbeafe" : "#f8fafc"}" stroke="${filled ? "#0b5cad" : "#cbd5e1"}" stroke-width="1.2"/>
            ${filled ? label(710 + i * 26, 313, `${i + 1}`, { size: 9, fill: "#0b5cad", anchor: "middle", mono: true }) : ""}`;
        })
        .join("");
      const queueCaption = `${label(684, 296, "queue occupancy at t", { size: 9.4, fill: "#64748b" })}
        ${cells}
        ${label(700, 344, "sampling faster than publishing fills the queue;", { size: 9.4, fill: "#334155" })}
        ${label(700, 360, "a full queue discards the OLDEST sample.", { size: 9.4, fill: "#dc2626", weight: "bold" })}`;

      // rule box
      const rule = `${box(60, 396, 500, 106, { fill: "#eff6ff", stroke: "#0b5cad", sw: 1.5 })}
        ${label(80, 420, "SIZING RULE", { size: 11, fill: "#0b5cad", weight: "bold" })}
        ${label(80, 446, "queue ≥ ceil(publishing / sampling)", { size: 13, fill: "#0f172a", weight: "bold", mono: true })}
        ${label(80, 468, "500 / 100 = 5 → queue 5 keeps every sample", { size: 9.8, fill: "#334155", mono: true })}
        ${label(80, 486, "queue 1 = deliberate decimation (documented)", { size: 9.8, fill: "#334155", mono: true })}`;

      const counters = `${box(580, 396, 336, 106, { fill: "#fef2f2", stroke: "#dc2626", sw: 1.5 })}
        ${label(600, 420, "KEEPALIVE / LIFETIME", { size: 11, fill: "#dc2626", weight: "bold" })}
        ${label(600, 446, "lifetime ≥ 3 × max_keepalive", { size: 12, fill: "#0f172a", weight: "bold", mono: true })}
        ${label(600, 468, "60 × 500 ms = 30 s survival window", { size: 9.8, fill: "#334155", mono: true })}
        ${label(600, 486, "transfer with send_initial_values = false", { size: 9.8, fill: "#334155", mono: true })}`;

      const timeline = `${label(60, 126, "ONE SUBSCRIPTION, TWO CLOCKS", { size: 11.5, fill: "#0f172a", weight: "bold" })}
        ${label(892, 126, "OPC UA · IEC 62541-4", { size: 9.4, fill: "#94a3b8", anchor: "start", mono: true })}`;

      return `<g>${timeline}${nodes}${flow}${queueCaption}${rule}${counters}</g>`;
    }

    // ------------------------------------------------------------------ 3
    // EtherCAT: jitter histogram, stock vs PREEMPT_RT, with tuning ladder
    case "ethercat-jitter-budget": {
      const X0 = 78;
      const X1 = 620;
      const Y0 = 456;
      const Y1 = 150;
      const TMAX = 400; // microseconds
      const HMAX = 100; // relative count

      const px = (t) => X0 + (t / TMAX) * (X1 - X0);
      const py = (h) => Y0 - (h / HMAX) * (Y0 - Y1);

      const bars = [
        { t0: 0, t1: 12, h: 92, c: "#059669", l: "PREEMPT_RT" },
        { t0: 12, t1: 40, h: 34, c: "#059669", l: "" },
        { t0: 40, t1: 90, h: 12, c: "#0b5cad", l: "" },
        { t0: 90, t1: 200, h: 6, c: "#dc2626", l: "" },
        { t0: 200, t1: 330, h: 3, c: "#dc2626", l: "stock kernel tail" },
      ];
      const bw = (t1, t0) => Math.max(2, px(t1) - px(t0) - 2);
      const hist = bars
        .map(
          (b) => `<rect x="${px(b.t0)}" y="${py(b.h)}" width="${bw(b.t1, b.t0)}" height="${Y0 - py(b.h)}" rx="2" fill="${b.c}" opacity="0.82"/>
            ${b.l ? label(px(b.t0) + 4, py(b.h) - 8, b.l, { size: 9, fill: b.c, weight: "bold" }) : ""}`,
        )
        .join("");

      const axes = `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#94a3b8" stroke-width="1.4"/>
        <line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#94a3b8" stroke-width="1.4"/>
        ${[0, 100, 200, 300, 400]
          .map(
            (t) =>
              `<line x1="${px(t)}" y1="${Y0}" x2="${px(t)}" y2="${Y0 + 5}" stroke="#94a3b8" stroke-width="1.2"/>
               ${label(px(t), Y0 + 20, `${t}`, { size: 9.4, fill: "#64748b", anchor: "middle", mono: true })}`,
          )
          .join("")}
        ${label((X0 + X1) / 2, Y0 + 42, "CYCLE JITTER (µs)", { size: 10, fill: "#334155", weight: "bold", anchor: "middle" })}
        ${label(Y1 - 12, 0, "", { size: 9 })}
        ${label(X0 - 8, Y1 + 6, "counts", { size: 9.2, fill: "#64748b", anchor: "end" })}`;

      // design limit line
      const limit = `<line x1="${px(25)}" y1="${Y1}" x2="${px(25)}" y2="${Y0}" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="6 4"/>
        ${label(px(25) + 6, Y1 + 14, "servo tolerance ≈ 25 µs", { size: 9.2, fill: "#b45309", weight: "bold" })}`;

      const ladder = [
        { t: "1 · isolcpus + nohz_full", s: "removes scheduler and tick", ok: true },
        { t: "2 · IRQ affinity off cycle cores", s: "NIC interrupt relocated", ok: true },
        { t: "3 · SCHED_FIFO prio 80", s: "no competing user tasks", ok: true },
        { t: "4 · mlockall MCL_FUTURE", s: "no page fault mid-cycle", ok: true },
        { t: "5 · zero-allocation loop", s: "no format!, no Vec growth", ok: true },
        { t: "6 · disable GRO/TSO/RX-usecs", s: "NIC latency for throughput", ok: true },
      ];
      const lad = ladder
        .map(
          (r, i) => `${box(672, 130 + i * 46, 490, 38, { fill: i % 2 ? "#f8fafc" : "#ffffff", stroke: "#e2e8f0", sw: 1.2 })}
            <circle cx="692" cy="${149 + i * 46}" r="7" fill="#059669"/>
            ${label(692, 152 + i * 46, "✓", { size: 9, fill: "#ffffff", anchor: "middle", weight: "bold" })}
            ${label(710, 145 + i * 46, r.t, { size: 10.4, fill: "#0f172a", weight: "bold" })}
            ${label(710, 160 + i * 46, r.s, { size: 9, fill: "#64748b" })}`,
        )
        .join("");

      const verdict = `${box(672, 418, 490, 84, { fill: "#ecfdf5", stroke: "#059669", sw: 1.6 })}
        ${label(692, 442, "WHAT THE WORST CYCLE COSTS", { size: 10.6, fill: "#047857", weight: "bold" })}
        ${label(692, 464, "One frame that arrives after the next produces a", { size: 9.6, fill: "#334155" })}
        ${label(692, 480, "velocity step the current loop cannot absorb.", { size: 9.6, fill: "#334155" })}`;

      const head = `${label(60, 126, "JITTER DISTRIBUTION, 1 ms CYCLE", { size: 11.5, fill: "#0f172a", weight: "bold" })}`;

      return `<g>${head}${axes}${hist}${limit}${lad}${verdict}</g>`;
    }

    // ------------------------------------------------------------------ 4
    // CANopen: bus budget waterfall + PDO/SDO channel split
    case "canopen-bus-budget": {
      const X0 = 60;
      const W = 540;
      const rows = [
        { t: "12 nodes × 3 PDOs × 2 directions", v: 72, c: "#0b5cad", d: "72 frames per cycle" },
        { t: "× 0.46 ms per 8-byte frame @ 250 kbit", v: 72, c: "#0b5cad", d: "≈ 33 ms of wire time" },
        { t: "available in a 2 ms cycle", v: 4, c: "#059669", d: "2 ms = 4 frame slots" },
      ];
      // Bars: the 33 ms demand saturates the budget bar, the 2 ms supply barely fills it.
      const bars = rows
        .map((r, i) => {
          const y = 140 + i * 78;
          const wpx = i < 2 ? W : Math.max(14, (2 / 33) * W);
          return `${label(X0, y, r.t, { size: 10.2, fill: "#0f172a", weight: "bold" })}
            <rect x="${X0}" y="${y + 10}" width="${W}" height="26" rx="6" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
            <rect x="${X0}" y="${y + 10}" width="${Math.max(10, wpx)}" height="26" rx="6" fill="${r.c}" opacity="0.85"/>
            ${label(X0 + 12, y + 28, r.d, { size: 9.6, fill: "#ffffff", weight: "bold", mono: true })}`;
        })
        .join("");

      const verdict = `${box(X0, 372, W, 118, { fill: "#fef2f2", stroke: "#dc2626", sw: 1.6 })}
        <rect x="${X0}" y="372" width="6" height="118" rx="3" fill="#dc2626"/>
        ${label(X0 + 24, 398, "ARITHMETIC IMPOSSIBILITY", { size: 11.5, fill: "#dc2626", weight: "bold" })}
        ${label(X0 + 24, 420, "A 2 ms cycle on this mapping cannot work at 250 kbit.", { size: 10, fill: "#334155" })}
        ${label(X0 + 24, 442, "Fixes, in order of cost: reduce PDO count,", { size: 10, fill: "#334155" })}
        ${label(X0 + 24, 462, "raise bitrate to 500 kbit, or lengthen the cycle.", { size: 10, fill: "#334155" })}
        ${label(X0 + 24, 482, "Not a tuning problem. Bus load budget is 50 %.", { size: 9.6, fill: "#b91c1c", weight: "bold" })}`;

      const split = `${box(640, 130, 522, 176, { fill: "#ffffff", stroke: "#0b5cad", sw: 1.6 })}
        ${label(662, 156, "ONE WIRE, TWO CHANNELS", { size: 11.5, fill: "#0b5cad", weight: "bold" })}
        ${label(662, 182, "PDO — process data, cyclic", { size: 10.4, fill: "#059669", weight: "bold" })}
        ${label(662, 200, "0x180+n / 0x200+n · 8 bytes · synchronous", { size: 9.2, fill: "#475569", mono: true })}
        ${label(662, 226, "SDO — configuration, request/response", { size: 10.4, fill: "#dc2626", weight: "bold" })}
        ${label(662, 244, "0x600+n / 0x580+n · segmented can block", { size: 9.2, fill: "#475569", mono: true })}
        <line x1="662" y1="262" x2="1140" y2="262" stroke="#e2e8f0" stroke-width="1.2"/>
        ${label(662, 284, "Never configure from the running cycle.", { size: 10, fill: "#0f172a", weight: "bold" })}`;

      const states = [
        { n: "PRE-OP", s: "SDO yes · PDO no", c: "#7c3aed" },
        { n: "OP", s: "PDO yes · running", c: "#059669" },
        { n: "STOPPED", s: "NMT + heartbeat only", c: "#dc2626" },
      ];
      const fsm = states
        .map(
          (s, i) => `${box(640, 330 + i * 52, 236, 42, { fill: "#ffffff", stroke: s.c, sw: 1.5 })}
            <rect x="640" y="${330 + i * 52}" width="5" height="42" rx="2" fill="${s.c}"/>
            ${label(660, 349 + i * 52, s.n, { size: 10.6, fill: s.c, weight: "bold", mono: true })}
            ${label(660, 364 + i * 52, s.s, { size: 8.8, fill: "#64748b" })}`,
        )
        .join("");
      const fsmNote = `${box(894, 330, 268, 158, { fill: "#f8fafc", stroke: "#94a3b8", sw: 1.4, dash: "5 4" })}
        ${label(912, 354, "HEARTBEAT RULE", { size: 10.4, fill: "#0f172a", weight: "bold" })}
        ${label(912, 378, "consumer timeout", { size: 9.4, fill: "#64748b" })}
        ${label(912, 396, "≥ 3 × producer period", { size: 11, fill: "#0b5cad", weight: "bold", mono: true })}
        ${label(912, 420, "100 ms producer → 300 ms", { size: 9.4, fill: "#334155", mono: true })}
        ${label(912, 442, "Shorter than that and one", { size: 9.4, fill: "#334155" })}
        ${label(912, 458, "lost frame drops the node to", { size: 9.4, fill: "#334155" })}
        ${label(912, 474, "Pre-OP mid-move.", { size: 9.4, fill: "#b91c1c", weight: "bold" })}`;

      const head = `${label(60, 116, "BUS LOAD BUDGET — WHERE THE CYCLE GOES", { size: 11.5, fill: "#0f172a", weight: "bold" })}`;

      return `<g>${head}${bars}${verdict}${split}${fsm}${fsmNote}</g>`;
    }

    default:
      return null;
  }
}
