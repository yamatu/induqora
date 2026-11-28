// Visual specifications for Batch 8 (4 Rust industrial protocol guides).
// Each article: 1 editorial cover 1200x675 JPEG + 1 bespoke engineering diagram 1200x640 PNG.

export const ARTICLE_VISUALS_BATCH8 = [
  {
    file: "rust-modbus-tokio-async-rs485-gateway-guide.md",
    slug: "rust-modbus-tokio-async-rs485-gateway-guide",
    category: "iiot-edge",
    cover: {
      kicker: "IIOT & EDGE · MODBUS GATEWAY",
      titleLine1: "RUST ASYNC",
      titleLine2: "MODBUS GATEWAY",
      subtitle: "RS-485 Turnaround · Serialised Queue · ABCD Word Order · Watchdog Reconnect",
      chips: ["19200 8E1", "500 ms CAP", "60 REQ/S"],
      motif: "network-ring",
      accent: "#38bdf8",
      accent2: "#f59e0b",
      alt: "Technical editorial illustration of a Rust Modbus gateway polling several RS-485 slaves through a single serialised request queue",
      caption: "A Modbus gateway is not a protocol translator. It is a scheduler that owns one wire.",
    },
    diagram: {
      type: "modbus-rs485-scheduler",
      figLabel: "FIG. 1",
      title: "One Wire, One Owner: How a Modbus Gateway Must Be Scheduled",
      subtitle:
        "Three pollers at three rates, one bounded queue, one task allowed to touch the port",
      source:
        "Modbus Application Protocol V1.1b3 · Modbus over Serial Line V1.02 · TIA-485-A · tokio-modbus 0.17.0",
      insertAfterH2: "The RTU half-duplex problem nobody mentions in the README",
      alt: "Diagram of a Modbus RS-485 gateway: three pollers for a flow meter at 200 milliseconds, a drive at 500 milliseconds and an energy meter at 2 seconds feeding a bounded mpsc queue, consumed by a single owner task that opens the port, attaches the slave, reads with a 500 millisecond cap and sleeps for the 3.5 character silent interval, connected to a half-duplex RS-485 segment with a practical ceiling of 60 requests per second",
      caption:
        "Figure 1: The queue is what turns a dead slave into a timeout instead of a stalled bus. Two tasks writing one port lose both frames.",
    },
  },
  {
    file: "rust-opc-ua-client-subscription-recovery-guide.md",
    slug: "rust-opc-ua-client-subscription-recovery-guide",
    category: "scada-hmi",
    cover: {
      kicker: "SCADA & HMI · OPC UA CLIENT",
      titleLine1: "OPC UA",
      titleLine2: "SUBSCRIPTIONS",
      subtitle: "Sampling vs Publishing · Queue Sizing · Keepalive · Session Reactivation",
      chips: ["500 ms PUBLISH", "QUEUE ≥ 5", "30 s LIFETIME"],
      motif: "hmi-console",
      accent: "#38bdf8",
      accent2: "#a78bfa",
      alt: "Technical editorial illustration of an OPC UA client subscription showing sampling ticks feeding a monitored item queue and a publishing tick",
      caption: "Between the sampling tick and the publish tick there is a queue. Everything that goes wrong happens in it.",
    },
    diagram: {
      type: "opcua-subscription-pipeline",
      figLabel: "FIG. 1",
      title: "Two Clocks and One Queue: Where OPC UA Data Disappears",
      subtitle:
        "Sampling, deadband, monitored-item queue and publishing are four separate places to lose a value",
      source: "IEC 62541-4 Services · IEC 62541-5 Information Model · opcua 0.12.0",
      insertAfterH2: "Sampling interval, publishing interval and the queue between them",
      alt: "OPC UA subscription pipeline diagram: a server object sampled every 100 milliseconds, filtered by a deadband of plus or minus 0.02 bar, buffered in a monitored item queue, then delivered on a 500 millisecond publish tick, with a queue occupancy illustration showing the oldest sample discarded when full, the sizing rule queue greater than or equal to publishing divided by sampling, and keepalive lifetime counters",
      caption:
        "Figure 1: A queue of 1 is a documented decision to decimate. A queue of 3 when the ratio is 5 is an undocumented decision to lose data.",
    },
  },
  {
    file: "rust-ethercat-preempt-rt-linux-jitter-guide.md",
    slug: "rust-ethercat-preempt-rt-linux-jitter-guide",
    category: "motion-control-drives",
    cover: {
      kicker: "MOTION CONTROL · ETHERCAT MASTER",
      titleLine1: "ETHERCAT ON",
      titleLine2: "PREEMPT_RT",
      subtitle: "Cycle Jitter · Core Isolation · mlockall · Distributed Clock SYNC0",
      chips: ["1 ms CYCLE", "5–20 µs p99", "SYNC0 = CYCLE"],
      motif: "servo-wave",
      accent: "#f59e0b",
      accent2: "#38bdf8",
      alt: "Technical editorial illustration of EtherCAT cycle jitter on a real-time Linux kernel with nuclear clock and servo waveform motifs",
      caption: "A software master does not fail on the average cycle. It fails on the worst one in a million.",
    },
    diagram: {
      type: "ethercat-jitter-budget",
      figLabel: "FIG. 1",
      title: "Jitter Is a Distribution, Not a Number",
      subtitle:
        "A stock kernel and a tuned PREEMPT_RT kernel share a mean and differ by two orders of magnitude in the tail",
      source:
        "ETG.1000 EtherCAT Specification · ETG.1020 Protocol Enhancements · ethercrab 0.7.1 · Linux PREEMPT_RT",
      insertAfterH2: "What the numbers actually look like",
      alt: "Histogram of EtherCAT cycle jitter in microseconds on a 1 millisecond cycle comparing a tuned PREEMPT_RT kernel concentrated below 40 microseconds with a stock kernel having a long tail beyond 200 microseconds, a dashed servo tolerance line at 25 microseconds, and a six-step tuning ladder from isolcpus through mlockall to zero-allocation loops and NIC offload settings",
      caption:
        "Figure 1: The mean is identical. The tail is what stalls a drive, and only the kernel configuration moves it.",
    },
  },
  {
    file: "rust-socketcan-canopen-cia301-pdo-sdo-guide.md",
    slug: "rust-socketcan-canopen-cia301-pdo-sdo-guide",
    category: "industrial-networking",
    cover: {
      kicker: "INDUSTRIAL NETWORKING · CANOPEN",
      titleLine1: "CANOPEN CIA 301",
      titleLine2: "FROM RUST",
      subtitle: "NMT States · PDO Mapping · SYNC Timing · Heartbeat · Bus Load Budget",
      chips: ["250 kbit", "8 BYTES/PDO", "LOAD < 50 %"],
      motif: "network-ring",
      accent: "#34d399",
      accent2: "#f59e0b",
      alt: "Technical editorial illustration of a CANopen bus with SYNC frames, PDO process data and a separate SDO configuration channel",
      caption: "PDOs carry the process. SDOs carry configuration. Confusing them is how a drive stops mid-cycle.",
    },
    diagram: {
      type: "canopen-bus-budget",
      figLabel: "FIG. 1",
      title: "When the Cycle Time Is Arithmetic, Not Tuning",
      subtitle:
        "72 frames per cycle at 250 kbit needs about 33 ms of wire time, so a 2 ms cycle cannot exist",
      source:
        "CiA 301 v4.2.0 · CiA 402 · ISO 11898-1:2015 · socketcan 4.0.0",
      insertAfterH2: "Mapping arithmetic that decides your bus load",
      alt: "CANopen bus load budget diagram: twelve nodes with three PDOs in each direction produce 72 frames per cycle occupying about 33 milliseconds of wire time at 250 kbit against a 2 millisecond cycle budget of four frame slots, marked as an arithmetic impossibility, with a panel showing the PDO and SDO channel split on one wire, the NMT state machine of pre-operational, operational and stopped, and the heartbeat rule that consumer timeout must be at least three producer periods",
      caption:
        "Figure 1: No amount of Rust, priority tuning or driver work makes 33 ms of frames fit in a 2 ms slot. The mapping changes, or the cycle does.",
    },
  },
];
