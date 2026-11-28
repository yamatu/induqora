// Visual specifications for Batch 7 (1 robotics guide: open spray air control unit in Rust).
// 1 editorial cover 1200x675 JPEG + 2 bespoke engineering diagrams 1200x640 PNG.

export const ARTICLE_VISUALS_BATCH7 = [
  {
    file: "open-spray-air-control-unit-rust-pressure-loop-guide.md",
    slug: "open-spray-air-control-unit-rust-pressure-loop-guide",
    category: "robotics",
    cover: {
      kicker: "ROBOTICS · PAINT PROCESS EQUIPMENT",
      titleLine1: "OPEN SPRAY AIR",
      titleLine2: "CONTROL UNIT",
      subtitle: "Closed Pressure Loop · Rust Control Core · Dead Time · CAN & RS-485",
      chips: ["0.3–4 bar", "100 Hz LOOP", "θ = 30–150 ms"],
      motif: "robot-arm",
      accent: "#38bdf8",
      accent2: "#f59e0b",
      alt: "Technical editorial illustration of a paint robot air control unit showing atomising and shaping air channels with a proportional valve and pressure transducer in a closed control loop",
      caption: "The setpoint is not the pressure. In a spray booth the gap between them is what ruins a colour match.",
    },
    diagram: {
      type: "spray-air-loop-architecture",
      figLabel: "FIG. 1",
      title: "Open Spray Air Control Unit: Four Layers and One Safety Boundary",
      subtitle:
        "Supervision, control core, I/O and pneumatics have different change frequencies and different certification obligations",
      source:
        "ISO 10218-1:2011 · EN 50176:2009 · Directive 2014/34/EU (ATEX) · ISO 11898-1:2015 · Modbus Application Protocol V1.1b3",
      insertAfterH2: "Loop architecture",
      alt: "Layered architecture of an open spray air control unit: web recipe and historian supervision at the top, a 100 Hz Rust control core in the middle, ADC and proportional valve drivers with CAN 2.0B and RS-485 below, and the pneumatic plant of filter-regulator, proportional valve, pressure sensor and atomising or shaping air outlets, with a dashed safety boundary between the control layer and the pneumatics",
      caption:
        "Figure 1: Four layers, one boundary. Everything above the dashed line is software you can rewrite; everything below it obeys ATEX, EN 50176 and the robot's own safety circuit.",
    },
    diagram2: {
      type: "spray-air-step-response",
      figLabel: "FIG. 2",
      title: "Step Response, Dead Time and the Settle Band That Gets Deleted",
      subtitle:
        "Tuning cannot remove transport delay — only trigger feed-forward shortens the deviation the operator actually sees",
      source:
        "Skogestad, SIMC rules, J. Process Control 13(4), 2003 · Åström & Hägglund, Advanced PID Control, ISA, 2006",
      insertAfterH2: "Choosing the loop rate, and a tuning rule that respects dead time",
      alt: "Step response comparison for a spray air pressure loop: setpoint step, measured pressure with 60 milliseconds of dead time and a first-order rise, the same loop with trigger feed-forward reducing the initial deviation, a plus or minus 5 percent settle band, and a panel showing the SIMC tuning rule and why 100 hertz is chosen",
      caption:
        "Figure 2: Tuning does not remove dead time, it only stops the controller fighting it. Feed-forward at trigger is what actually removes the first-stroke deviation.",
    },
  },
];
