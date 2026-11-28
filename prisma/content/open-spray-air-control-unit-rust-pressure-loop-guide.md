---
title: Open Spray Air Control Unit: Rust Pressure Loop Design
slug: open-spray-air-control-unit-rust-pressure-loop-guide
type: BLOG
category: robotics
author: edward
tags: Robotics, Motion control, Industrial Ethernet, CAN bus
publishedAt: 2026-11-27T04:30:00Z
excerpt: A paint robot's air control unit is a closed box, and that is the whole problem: the setpoint goes in, but nothing comes back. Here is what a closed-loop spray air controller actually has to do, why open loop drifts, and how to build the pressure loop, valve calibration and fieldbus hand-off in Rust.
seoTitle: Open Spray Air Control Unit: Rust Pressure Loop Design
seoDescription: How an open spray air control unit closes the pressure loop: Rust PI control with dead time, proportional valve calibration, CAN and RS-485, RAPID hand-off.
coverImage: /media/2026/11/cover-open-spray-air-control-unit-rust-pressure-loop-guide.jpg
coverAlt: Technical editorial illustration of a paint robot air control unit showing atomising and shaping air channels with a proportional valve and pressure transducer in a closed control loop
coverCaption: The setpoint is not the pressure. In a spray booth the gap between them is what ruins a colour match.
---

A paint robot does not apply paint. It applies a pattern: a fan of atomised droplets with a width, a velocity and a distribution, and the quality of the finished film is decided almost entirely by the air that shaped it. Atomising air breaks the paint into droplets, shaping air flattens the spray into a fan, and the ratio between the two sets transfer efficiency and overspray. Move either pressure by 10% and the film thickness changes, the metallic flake orientation changes, and the colour no longer matches the door next to it.

On most installed paint cells that air is regulated by a closed module: air in, setpoint in, and no measurement out. The controller trusts the regulator. When the booth filter loads, when the paint temperature drifts, when a hose is replaced with a longer one, the setpoint stays the same and the actual pressure does not. Nobody notices until a batch is scrapped or a customer rejects a colour match.

This article is about building the missing piece: an open air control unit that closes the pressure loop, exposes the data, and still behaves as a well-mannered peripheral to the robot controller. It includes working control code, the fieldbus hand-off, and an honest account of where the safety and regulatory boundary sits, because that boundary is the part most hobby-scale spray projects get wrong.

## What the air control unit actually regulates

A spray air panel is not one pressure loop. It is four to eight independent ones that share a supply and must not interact, which is why the pneumatic plumbing matters as much as the control code.

| Channel | What it sets | Typical range | Why it is closed-loop |
| --- | --- | --- | --- |
| Atomising air | Droplet size distribution, film build rate | 0.5–4 bar | Drives transfer efficiency; small errors show as dry spray or runs |
| Shaping / horn air | Fan width and edge softness | 0.3–3 bar | Sets overlap between strokes; overlap errors show as banding |
| Bell / turbine air | Rotation speed of a rotary atomiser | 2–6 bar | Speed sets droplet size on bell applicators |
| Trigger / dosing air | Metering pump or colour-change valve actuation | 2–6 bar | Timing errors show as a heavy start of stroke |
| Flush / solvent | Cleaning between colours | 1–4 bar | Under-flush causes colour carry-over |

Two properties make this harder than a tank level loop. First, the plant is mostly dead time: a proportional valve, a few metres of hose and a chamber volume behave like a first-order lag plus a transport delay of 30–200 ms. Second, the actuator is imperfect in a specific way. A proportional pressure regulator has hysteresis, typically 1–3% of full scale, so the same command produces different pressures depending on whether you arrived from above or below. An open-loop controller cannot see either problem. A closed loop sees both, but only if it is tuned for the delay instead of against it.

## Where the closed box ends

The unit most associated with ABB paint robots is the ACU family: the Air Control Unit that sits between the IRC5P controller and the applicator. Its job is exactly the list above, executed inside ABB's process architecture.

The current replacement part, ACU-01B, is listed under part number 3HNA024871-001 for the IRB 5400, IRB 5500 and IRB 580 series on IRC5P controllers, and is available as a spare through [the Vibocnc parts catalogue](https://vibocnc.com/products/3HNA024871-001). The published description claims 4–8 digital and analog control channels, Ethernet, CAN 2.0B and RS-485 interfaces, a 210 × 160 × 140 mm metal enclosure and a 5 kg mass.

Treat those numbers as vendor claims, not a datasheet. The same listing shows two different part numbers (3HNA024871-001 in the title, 3BSE011181R1 in the specification block), a protection rating given as both IP20 and IP65, and a supply given as both 24 VDC and 100–240 VAC. Any of those could be right; they cannot all be. If you are ordering a replacement, match the nameplate on the failed unit before you buy, which is the same advice the vendor gives.

More important than the specification is the architecture: the ACU is a closed appliance. You set a pressure, it holds a pressure, and you cannot instrument the loop or change the tuning. That is fine for a production cell that has been validated. It is a poor fit for three situations:

- **Obsolete cells.** When the module is no longer supported and the cell is still earning, a documented open replacement is a maintenance strategy rather than an experiment.
- **Process development.** Establishing a pressure-to-film-thickness window needs logged traces at 50 Hz, not four numbers read off a gauge.
- **Retrofit monitoring.** Reading the analog setpoint lines and logging actual pressure adds traceability without touching the control path.

Those three cases are what the design below targets. Replacing an ACU on a live production paint robot with unproven hardware is not on the list, and the compliance section explains why.

## Why open loop drifts, in numbers

Three mechanisms move the actual pressure away from the setpoint over a shift, and all three are invisible without a sensor.

**Supply and downstream impedance.** A regulator holds pressure relative to its own reference, but the flow through the nozzle depends on the pressure difference across it. Booth downdraft, filter loading and a partially blocked atomiser all change that difference. A 0.2 bar drop across a loaded shaping-air filter is a 5–8% pattern width change.

**Temperature and viscosity.** Atomising performance depends on paint viscosity, which roughly halves per 10 °C rise for many solvent-borne coatings. The air setpoint stays constant while the droplet spectrum moves.

**Actuator hysteresis.** Come up to 2.0 bar from 1.2 bar and you get 2.0 bar. Come down to 2.0 bar from 2.8 bar and you get 1.94 bar. Over hundreds of strokes per shift, the pattern drift is a systematic band, not noise.

A closed loop fixes the first two by construction and the third only if the controller is aware of it, which is what the calibration section handles.

## Loop architecture

![Layered architecture of an open spray air control unit: web recipe and historian supervision at the top, a 100 Hz Rust control core in the middle, ADC and proportional valve drivers with CAN 2.0B and RS-485 below, and the pneumatic plant of filter-regulator, proportional valve, pressure sensor and atomising or shaping air outlets, with a dashed safety boundary between the control layer and the pneumatics](/media/2026/11/diagram-open-spray-air-control-unit-rust-pressure-loop-guide.png "Figure 1: Four layers, one boundary. Everything above the dashed line is software you can rewrite; everything below it obeys ATEX, EN 50176 and the robot's own safety circuit.")

The design separates four layers deliberately, because they have different change frequencies and different certification requirements:

1. **Supervision.** Web UI for setpoints, recipes, alarm history, trend curves and CSV export. Changes rarely and holds no control authority.
2. **Control core.** One real-time task per channel at 100 Hz, deterministic, no allocations in the loop, no network I/O in the loop.
3. **I/O and fieldbus.** ADC sampling, valve drive, CAN 2.0B to remote I/O blocks, RS-485 Modbus RTU to valve terminals, Ethernet to the robot.
4. **Pneumatics.** Filter-regulator, proportional valve, pressure sensor, atomiser. This is the layer that carries the safety obligations.

Keeping the control core free of network calls is not stylistic. A blocking socket read inside a 10 ms loop turns a network hiccup into a pressure excursion.

## Choosing the loop rate, and a tuning rule that respects dead time

The plant is first-order-plus-dead-time (FOPDT): process gain `K`, time constant `τ`, dead time `θ`. For a 3 m hose and a small chamber, expect `θ` of 30–80 ms and `τ` of 80–250 ms. A hose of 10 m pushes `θ` toward 150 ms because the pressure wave alone needs about 3 ms per metre.

Two consequences follow:

- **Sample rate.** 100 Hz (10 ms) gives at least a dozen samples inside the dominant lag and is comfortably beyond what the pneumatics can follow. Sampling faster buys nothing; sampling at 10 Hz loses the transient that matters at trigger.
- **Tuning.** With `θ/τ` around 0.3–0.6, PID is unjustified and aggressive tuning is dangerous. The SIMC rule gives a PI controller that is stable with this much delay:

```
Kc = (1/K) · τ / (τc + θ)
Ti = min(τ, 4 · (τc + θ))
```

where `τc` is the closed-loop time constant you are willing to accept. Setting `τc = θ` gives a response that reaches setpoint in roughly three dead times with no overshoot, which for a 50 ms delay is 150 ms, faster than an operator can see and well inside a stroke.

![Step response comparison for a spray air pressure loop: setpoint step, measured pressure with 60 milliseconds of dead time and a first-order rise, the same loop with trigger feed-forward reducing the initial deviation, a plus or minus 5 percent settle band, and a panel showing the SIMC tuning rule and why 100 hertz is chosen](/media/2026/11/diagram2-open-spray-air-control-unit-rust-pressure-loop-guide.png "Figure 2: Tuning does not remove dead time, it only stops the controller fighting it. Feed-forward at trigger is what actually removes the first-stroke deviation.")

## Implementation in Rust

The control core is small enough to read in one sitting. The pieces that matter are the sample path, the controller, and the valve model.

```rust
// One pressure channel, sampled at 100 Hz from a 16-bit ADC.
pub struct Sample {
    pub t_us: u64,        // monotonic timestamp
    pub bar: f32,         // calibrated pressure
}

pub struct Channel {
    pub id: u8,
    pub sp_bar: f32,          // setpoint from recipe
    pub pid: Pid,
    pub valve: ValveModel,
    pub ff_bar: f32,          // feed-forward contribution
}
```

The controller itself is a PI with derivative on measurement (kept but normally zero), conditional-integration anti-windup, and a filtered derivative in case a future channel needs it:

```rust
pub struct Pid {
    kp: f32,
    ti: f32,
    td: f32,
    n: f32,          // derivative filter factor, 8..20
    out_min: f32,    // 0.0 %
    out_max: f32,    // 100.0 %
    i_term: f32,
    d_pv: f32,
    prev_pv: f32,
    primed: bool,
}

impl Pid {
    pub fn update(&mut self, sp: f32, pv: f32, dt: f32) -> f32 {
        if !self.primed {
            self.prev_pv = pv;
            self.primed = true;
        }
        let err = sp - pv;
        let p = self.kp * err;

        // Derivative on measurement, filtered: avoids setpoint-step kick.
        let raw_d = if self.td > 0.0 {
            (pv - self.prev_pv) / dt
        } else {
            0.0
        };
        let alpha = dt / (self.td / self.n + dt);
        self.d_pv += alpha * (raw_d - self.d_pv);
        let d = -self.kp * self.td * self.d_pv;
        self.prev_pv = pv;

        // Conditional integration: integrate only if it does not deepen saturation.
        let i_next = if self.ti > 0.0 {
            self.i_term + self.kp * dt / self.ti * err
        } else {
            self.i_term
        };
        let u_unsat = p + i_next + d;
        let u = u_unsat.clamp(self.out_min, self.out_max);
        let saturated = u != u_unsat;
        let pushing_out = (u_unsat > self.out_max && err > 0.0)
            || (u_unsat < self.out_min && err < 0.0);
        if !(saturated && pushing_out) {
            self.i_term = i_next;
        }
        u
    }
}
```

Two details matter more than the gains. The `primed` flag prevents a derivative spike on the first sample after a recipe change, and `pushing_out` prevents the classic failure where a valve sits at 100% for two seconds during colour change, winds the integrator up, and overshoots 1.5 bar on the way back.

The SIMC tuning is a function of the identified plant, not a magic number:

```rust
/// Skogestad SIMC PI tuning for a first-order-plus-dead-time plant.
/// k: process gain (bar out / % valve), tau: time constant s, theta: dead time s.
pub fn simc_pi(k: f32, tau: f32, theta: f32, tc: f32) -> (f32, f32) {
    let kc = (1.0 / k) * tau / (tc + theta);
    let ti = tau.min(4.0 * (tc + theta));
    (kc, ti)
}

// Example: 0.035 bar/%, tau = 0.18 s, theta = 0.06 s, tc = 0.06 s
// -> kc = 21.4, ti = 0.48 s
```

## Valve calibration and hysteresis

A proportional pressure regulator is a mechanical device with a deadband and a direction-dependent characteristic. Modelling it explicitly is cheaper than tuning around it.

```rust
pub struct ValveModel {
    /// Calibration points, ascending command percent -> measured bar.
    table_up: Vec<(f32, f32)>,    // arrived from below
    table_down: Vec<(f32, f32)>,  // arrived from above
    last_cmd: f32,
    pub deadband_pct: f32,        // e.g. 1.5 % FS
}

impl ValveModel {
    /// Convert a desired pressure to a valve command, split by direction.
    pub fn to_command(&self, want_bar: f32) -> f32 {
        let rising = want_bar >= self.last_cmd_pressure_hint();
        let table = if rising { &self.table_up } else { &self.table_down };
        let mut cmd = interp_inverse(table, want_bar);
        // Overshoot the deadband so small corrections actually move the valve.
        if (want_bar - self.last_cmd_pressure_hint()).abs() > 0.0 && self.deadband_pct > 0.0 {
            cmd += if rising { self.deadband_pct / 2.0 } else { -self.deadband_pct / 2.0 };
        }
        cmd.clamp(0.0, 100.0)
    }
}
```

Calibration is a commissioning procedure, not a factory constant: step the command from 0 to 100% in 5% increments, record settled pressure, then step back down and record again. The gap between the two tables is the hysteresis, and it is usually 1–3% of full scale on a good regulator and much worse on a tired one. A regulator whose hysteresis exceeds 4% will not hold a spray pattern no matter how good the loop is, and the honest answer is to replace it rather than to keep tuning.

## Fieldbus: three links with three different jobs

| Link | Purpose | What it carries | Why this choice |
| --- | --- | --- | --- |
| Ethernet TCP to robot | Setpoints, trigger, status, alarms | Compact JSON or fixed binary frames at 10–20 Hz | Non-deterministic traffic belongs off the motion path; the robot times the trigger, not the pressure profile |
| CAN 2.0B (ISO 11898) | Remote I/O and valve terminals | 8-byte frames at 250–500 kbit/s | Deterministic arbitration, cheap, survives a paint booth's electrical noise |
| RS-485 Modbus RTU | Valve terminals, sensors, legacy devices | Registers at 115200 8N1 | Universally supported, half-duplex, one transaction at a time |

A CAN frame that carries a setpoint and its own integrity check is small enough to keep the bus quiet:

```rust
/// 8-byte CAN payload: channel, setpoint in mbar, flags, CRC-16.
pub fn encode_air_cmd(channel: u8, setpoint_mbar: u16, trigger: bool) -> [u8; 8] {
    let flags: u8 = if trigger { 0x01 } else { 0x00 };
    let mut f = [0u8; 8];
    f[0] = channel;
    f[1..3].copy_from_slice(&setpoint_mbar.to_le_bytes());
    f[3] = flags;
    let crc = crc16_ccitt(&f[0..4]);
    f[4..6].copy_from_slice(&crc.to_le_bytes());
    f[6] = 0x00; // reserved
    f[7] = 0x00; // rolling counter, filled by the driver
    f
}
```

Two fieldbus rules earn their keep in a booth. Keep the Ethernet hand-off **idempotent**: the robot resends the full channel state every 50 ms, and the controller applies it even if a frame was missed, so a dropped packet delays a setpoint by 50 ms instead of losing it. Keep RS-485 **strictly serialised** with a per-device mutex; two concurrent tasks on a half-duplex bus produce corrupted frames that look like flaky hardware for weeks.

## The robot side

The robot should own timing and the controller should own pressure. In RAPID, the trigger is a digital output and the setpoint is a socket write, with the air commanded *before* the gun opens:

```rapid
MODULE SprayAir
    VAR socketdev s;
    VAR string cmd;

    PROC SetAir(num ch, num mbar)
        cmd := "SP," + NumToStr(ch, 0) + "," + NumToStr(mbar, 0) + "\n";
        SocketSend s \Str := cmd;
    ENDPROC

    PROC main()
        SocketCreate s;
        SocketConnect s, "192.168.1.50", 5000;

        SetAir 1, 2500;      ! atomising air 2.5 bar
        SetAir 2, 1200;      ! shaping air 1.2 bar
        WaitTime 0.15;       ! let the loop settle before paint flows

        SetDO doSprayOn, 1;
        MoveL pStart, v200, fine, tSprayGun;
        MoveL pEnd,   v200, z1,   tSprayGun;
        SetDO doSprayOn, 0;

        SocketClose s;
    ENDPROC
ENDMODULE
```

The `WaitTime` is the part people delete. It is the dead time plus the settling time of the loop, and without it the first 100 ms of every stroke is sprayed at the previous colour's pressure, which is exactly the heavy start-of-stroke defect that paint engineers spend days chasing.

The better version of this interface is **EGM-style streaming**, where the controller sends the pressure setpoint alongside a position reference so the two arrive together. That is the architecture the [CMU Manufacturing Futures Institute ABB OmniCore ROS 2 stack](https://github.com/cmu-mfi/abb_omnicore_ros2) uses for external guidance on OmniCore controllers, and it is worth reading before designing your own streaming interface. On IRC5 controllers, EGM requires the corresponding RobotWare option, and on a paint robot the process equipment is not part of the motion path, so a plain socket is usually the right level of ambition.

## Fault handling: what a spray cell actually needs

The failure modes that matter are not exotic, and every one of them is a pressure or a timing problem that was never instrumented.

- **Sensor plausibility.** A pressure transducer that reads 0.00 bar steady while the valve is at 60% is broken, not idle. Alarm on "no response to command", not on absolute value.
- **Regulator runaway.** Valve command at 100% with pressure below 80% of setpoint for 500 ms means a supply fault or a stuck valve. Stop the stroke, not the robot.
- **Channel independence.** Watch the cross-coupling: a step on shaping air that moves atomising air by more than 5% means the panel plumbing shares an undersized regulator.
- **Trigger/settle violation.** If the settle timer expires before pressure is inside a ±5% band, log it as a quality event with the trace attached. That record is what turns a scrap argument into a process note.
- **Historian granularity.** Store 50 Hz traces for the last 30 strokes and 1 Hz aggregates for 90 days. Full-rate history forever is a disk problem disguised as a feature.

## The compliance boundary, stated plainly

This is where most open spray projects should stop and read the standards. A paint booth is a hazardous area. Solvent vapour makes it electrically classified, electrostatic atomisers are governed by EN 50176, and the robot itself falls under ISO 10218 and a cell-level risk assessment. The controller described here is a **non-safety, non-certified device**.

Concretely:

- The air control unit must **not** carry any safety function. Emergency stop, guard interlock, safe torque off and the paint-supply shut-off belong to the certified safety circuit, never to a general-purpose computer.
- Hardware installed inside the classified zone must be rated for it. An IP20 enclosure with a Raspberry-class SBC is a bench device, not a booth device. IP65 is the floor for washdown exposure; the classification document decides the rest.
- Replacing a type-approved appliance on a production cell changes the cell's conformity. That is an engineering change requiring a risk assessment, not a maintenance swap.
- ATEX equipment must be certified as a unit. You cannot assemble certified parts into an uncertified whole and call it compliant.

The defensible positions are: a bench rig for process development, a monitoring-only box that reads existing signals, and a documented pilot on a cell that is not producing customer parts. Everything else needs a machine builder and a notified body, not a weekend and a Rust toolchain.

## Commissioning checklist

1. Leak-test the panel at 1.5× maximum working pressure for 10 minutes with the valves closed.
2. Verify each pressure transducer against a calibrated gauge at 0, 25, 50, 75 and 100% of range.
3. Run the valve calibration sweep up and down; record the hysteresis table and replace any regulator above 4%.
4. Identify `K`, `τ` and `θ` from a step test on each channel, then compute SIMC gains; do not copy gains between channels.
5. Confirm the settle time from trigger to ±5% band, per channel, and set the RAPID `WaitTime` above the slowest one.
6. Test a 4-hour soak with 200 strokes: no integrator windup, no accumulated drift, no alarm storms.
7. Simulate sensor failure, valve failure and Ethernet loss during a stroke, and confirm the cell fails to a safe state with the paint supply closed.

## Reference implementations worth reading

There is no established open-source project that integrates Rust, an ABB paint robot and an air control unit end to end. The parts that do exist are genuinely useful, and the gaps are worth knowing before you start.

| Project | Language / licence | What it gives you | Caveat |
| --- | --- | --- | --- |
| [robohouse-delft/abbegm-rs](https://github.com/robohouse-delft/abbegm-rs) | Rust, licence not declared | ABB Externally Guided Motion in Rust, synchronous and Tokio async, joint and Cartesian space | GitHub only, not published on crates.io; pin a git revision, and the undeclared licence needs resolving before commercial use |
| [cmu-mfi/abb_omnicore_ros2](https://github.com/cmu-mfi/abb_omnicore_ros2) | C++, Apache-2.0 | OmniCore hardware interface, robot descriptions, EGM-integrated launch files | ROS 2 stack, not a drop-in for Rust; read it for architecture |
| ABB Robot Web Services | REST over HTTPS | Robot state, IO, task control, program execution | Undocumented rate limits; no real-time guarantee, so not for pressure streaming |
| ABB EGM | RobotWare option | Real-time motion guidance from an external PC | Requires the option licence, and on paint robots the process air is outside its scope |

Read `abbegm-rs` for the frame encoding and the async/sync split, `abb_omnicore_ros2` for how a real integrator separates hardware interface from process logic, and keep the pneumatic loop in a plain Tokio task you fully control.

=== takeaways
The setpoint is not the pressure. Supply impedance, paint temperature and valve hysteresis all move the actual value, and only a sensor sees it.
With 30–150 ms of pneumatic dead time, PI plus a dead-time-aware tuning rule is the correct choice; faster sampling does not help and aggressive tuning destabilises.
Feed-forward at trigger removes the first-stroke deviation that no amount of tuning can, because dead time is not a controller problem.
Model the valve's hysteresis explicitly. A regulator above 4% hysteresis is a hardware problem, not a tuning problem.
The robot times the stroke, the controller holds the pressure, and the Ethernet link between them carries idempotent state rather than profiles.
The air control unit must never carry a safety function, and anything inside a classified booth zone must be rated for it.

=== faqs
Q: Can I drive an existing ABB ACU-01B from my own software?
A: No. It is a closed appliance. You can read its analog setpoint lines and log them, which is a legitimate retrofit monitoring approach, but you cannot change its loop or its firmware. An open controller is a replacement or a parallel bench rig, not an override.

Q: Is Rust a reasonable choice here?
A: Yes, for the control core. You get deterministic timing, no garbage collection in the loop, and a strong type system for the protocol layer. The ecosystem cost is real, though: no maintained ABB RWS client and no published EGM crate, so expect to write and own that code.

Q: How often should the loop run?
A: 100 Hz is ample for pneumatics with 80–250 ms lags. Above 1 kHz you are measuring sensor noise, not controlling anything.

Q: Do I need the derivative term?
A: Almost never. Derivative amplifies the transducer noise that a paint booth generates in abundance, and with `θ/τ` around 0.3–0.6 the PI response is already at the delay-limited optimum.

Q: What does this buy over a mechanical regulator?
A: Traceability and drift correction. The regulator holds a pressure against its own reference; the loop holds the pressure at the point of use and leaves a record of every stroke. For a colour-match dispute, that record is the deliverable.

Q: Can this run in the booth?
A: Only with appropriately rated hardware and a risk assessment. The reference design is a bench, monitoring or pilot device. Production use on a certified cell requires a machine builder and the relevant conformity work.

=== sources
ISO 10218-1:2011 and ISO 10218-2:2011 — Industrial robots, safety requirements.
EN 50176:2009 — Automatic electrostatic spraying equipment for flammable coating materials.
Directive 2014/34/EU (ATEX) — Equipment intended for use in explosive atmospheres.
ISO 11898-1:2015 — CAN data link layer and physical signalling.
Modbus Organization, *Modbus Application Protocol Specification V1.1b3*, 2012.
Skogestad, S., *Simple analytic rules for model reduction and PID controller tuning*, Journal of Process Control 13(4), 2003.
Åström, K. J. and Hägglund, T., *Advanced PID Control*, ISA, 2006.
