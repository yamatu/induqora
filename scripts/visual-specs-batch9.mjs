// Visual specifications for Batch 9 (4 field instrumentation and signal guides).
// Each article: 1 editorial cover 1200x675 JPEG + 1 bespoke engineering diagram 1200x640 PNG.

export const ARTICLE_VISUALS_BATCH9 = [
  {
    file: "io-link-master-port-configuration-iec-61131-9-guide.md",
    slug: "io-link-master-port-configuration-iec-61131-9-guide",
    category: "industrial-networking",
    cover: {
      kicker: "INDUSTRIAL NETWORKING · IO-LINK",
      titleLine1: "IO-LINK PORTS",
      titleLine2: "ONE DEVICE EACH",
      subtitle: "COM1/2/3 Rates · 400 µs Floor · 20 m Cable · Class A vs B · Data Storage",
      chips: ["230.4 KBAUD", "20 M MAX", "PORT = ADDRESS"],
      motif: "network-ring",
      accent: "#0ea5e9",
      accent2: "#f59e0b",
      alt: "Technical editorial illustration of an IO-Link master with four ports each connected point to point to one sensor, with cycle time and parameter storage annotated",
      caption: "IO-Link is not a fieldbus. Every port owns exactly one device, and that changes how you troubleshoot it.",
    },
    diagram: {
      type: "iolink-port-cycle",
      figLabel: "FIG. 1",
      title: "Four Ports, Four Independent Cycles: IO-Link Port Engineering",
      subtitle:
        "One master, one device per port, and the cycle time that decides whether you get samples or retries",
      source:
        "IEC 61131-9 · IEC 60947-5-2 · IO-Link Interface and System Specification · Wikipedia: IO-Link",
      insertAfterH2: "The three baud rates and the 400 microsecond floor",
      alt: "Diagram of an IO-Link master with four ports: port one a photo sensor at COM2 with a 2 millisecond cycle, port two a pressure switch at COM2 with 3 milliseconds, port three a class B valve at COM3 set to 1 millisecond which is below its 2.4 millisecond minimum and flagged as an error, port four an IO hub at COM1 with 5 milliseconds, alongside notes on the 400 microsecond transmission floor and the 20 metre cable limit",
      caption:
        "Figure 1: Port 3 is configured below its device minimum. The port still reports data; what it does not report is that it is retrying.",
    },
  },
  {
    file: "hart-protocol-4-20ma-loop-commissioning-guide.md",
    slug: "hart-protocol-4-20ma-loop-commissioning-guide",
    category: "process-automation-dcs",
    cover: {
      kicker: "PROCESS AUTOMATION · HART",
      titleLine1: "HART ON A",
      titleLine2: "4-20 mA LOOP",
      subtitle: "Bell 202 FSK · Point-to-Point vs Multidrop · 3.8 / 20.5 mA Fault Bands",
      chips: ["ADDRESS 0", "4 mA FIXED", "1200 BIT/S"],
      motif: "process-loop",
      accent: "#7c3aed",
      accent2: "#059669",
      alt: "Technical editorial illustration of a two-wire 4-20 mA current loop carrying a superimposed HART frequency shift keyed digital signal",
      caption: "One pair of wires carries the measurement and the confession. Reading both is the whole point of HART.",
    },
    diagram: {
      type: "hart-current-loop",
      figLabel: "FIG. 1",
      title: "Two Signals, One Pair: How HART Shares a 4-20 mA Loop",
      subtitle:
        "The analogue current carries the process value; the FSK digital channel carries everything else, including the diagnostics",
      source:
        "HART Communication Protocol · Bell 202 · Current loop · Wikipedia: HART, Current loop",
      insertAfterH2: "Point-to-point versus multidrop",
      alt: "Diagram of a HART loop from a two-wire transmitter through a cable pair and a 250 ohm sense resistor to an analogue input and a HART modem, with fault bands at 3.8 milliamps and 20.5 milliamps marked outside the live 4 to 20 milliamp range, and multidrop address ranges by HART revision",
      caption:
        "Figure 1: The analogue band is self-monitoring only if the input block flags 3.8 and 20.5 mA instead of clamping to 0 and 100 percent.",
    },
  },
  {
    file: "pt100-rtd-2-3-4-wire-lead-resistance-error-guide.md",
    slug: "pt100-rtd-2-3-4-wire-lead-resistance-error-guide",
    category: "process-automation-dcs",
    cover: {
      kicker: "PROCESS AUTOMATION · RTD WIRING",
      titleLine1: "PT100 LEAD",
      titleLine2: "RESISTANCE ERROR",
      subtitle: "0.385 Ω/°C · Two-Wire Offset · Three-Wire Matching · Four-Wire Exact",
      chips: ["0.385 Ω/°C", "6.7 Ω / 100 M", "+17 °C"],
      motif: "process-loop",
      accent: "#dc2626",
      accent2: "#0b5cad",
      alt: "Technical editorial illustration comparing two, three and four wire Pt100 connections across a cable run, with the resulting temperature error annotated",
      caption: "The sensor is accurate to a tenth of a degree. The cable is where the error lives.",
    },
    diagram: {
      type: "pt100-lead-resistance",
      figLabel: "FIG. 1",
      title: "Two, Three and Four Wire: What Lead Resistance Actually Costs",
      subtitle:
        "At 0.385 ohm per degree, one ohm of cable is 2.6 degrees of error on every reading",
      source:
        "IEC 60751 · ASTM E1137 · Callendar-Van Dusen · Wikipedia: Resistance thermometer",
      insertAfterH2: "Three-wire connection and its one condition",
      alt: "Diagram comparing two-wire, three-wire and four-wire Pt100 connections with their error for a 100 metre 0.5 square millimetre copper run: two-wire adds about 6.7 ohm giving roughly 17 degrees, three-wire cancels only if leads match, four-wire eliminates lead resistance, with the Callendar-Van Dusen coefficients and a precision resistor substitution test",
      caption:
        "Figure 1: Three-wire is not compensation, it is conditional cancellation. One extra terminal in a leg defeats it.",
    },
  },
  {
    file: "thermocouple-cold-junction-compensation-drift-guide.md",
    slug: "thermocouple-cold-junction-compensation-drift-guide",
    category: "process-automation-dcs",
    cover: {
      kicker: "PROCESS AUTOMATION · THERMOCOUPLES",
      titleLine1: "COLD JUNCTION",
      titleLine2: "COMPENSATION",
      subtitle: "Two Junctions · 41 µV/°C · Extension Polarity · Cumulative Drift",
      chips: ["TYPE K", "41 µV/°C", "CJC ON"],
      motif: "process-loop",
      accent: "#f59e0b",
      accent2: "#dc2626",
      alt: "Technical editorial illustration of a thermocouple hot junction in a process and a cold junction at a terminal block, with cold junction compensation shown as a measured correction",
      caption: "The sensor does not measure temperature. It measures a difference, and the terminal block is half the measurement.",
    },
    diagram: {
      type: "thermocouple-cjc",
      figLabel: "FIG. 1",
      title: "The Terminal Block Is Half the Measurement",
      subtitle:
        "Hot junction, extension wire and cold junction: where the error enters and why it drifts after a year",
      source:
        "IEC 60584-1 · IEC 60584-3 · Wikipedia: Thermocouple",
      insertAfterH2: "Extension wire, compensating wire and the colour codes",
      alt: "Diagram of a thermocouple measurement chain: hot junction in the process at 41 microvolts per degree, extension wire that must match type and polarity, cold junction at the terminal block at 25 to 45 degrees, and an input card measuring the terminal temperature for cold junction compensation, alongside the drift mechanisms and the commissioning checks",
      caption:
        "Figure 1: A disabled CJC produces an error exactly equal to the cabinet temperature, and nothing in the diagnostics says so.",
    },
  },
];
