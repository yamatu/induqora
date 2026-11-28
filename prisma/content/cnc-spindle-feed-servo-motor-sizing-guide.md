---
title: Sizing Spindle and Feed Servos for a Machine Design
slug: cnc-spindle-feed-servo-motor-sizing-guide
type: BLOG
category: motion-control-drives
author: edward
tags: Servo drives, Servo amplifiers, Motion control
publishedAt: 2026-11-26T14:45:00Z
excerpt: Servo sizing failures rarely show up as an alarm during commissioning — they show up six months later as intermittent following error, thermal drift or a drive that trips on a hot afternoon. This guide covers the torque-speed-inertia calculation, what the three sizing criteria actually constrain, and the specification mistakes that cause most oversizing.
seoTitle: CNC Spindle and Feed Servo Motor Sizing Guide
seoDescription: Continuous and peak torque calculation, inertia ratio limits, duty cycle, spindle power versus torque at base speed, and regulator sizing for machine tool axes.
coverImage: /media/2026/11/cover-cnc-spindle-feed-servo-motor-sizing-guide.jpg
coverAlt: Technical editorial illustration of a servo motor torque-speed curve with continuous and intermittent regions beside a ball screw axis load diagram
coverCaption: A servo that is large enough for the cut and too small for the acceleration is the most common sizing error in machine design.
---

A machine builder specifies an axis by asking what torque it takes to push the load. That calculation produces a motor that will hold position and cut steadily, and that trips on overload the first time the axis has to reverse at production feed. The missing term is not the load — it is the acceleration.

Servo sizing for machine tool axes is a three-way check: torque over the whole motion profile, speed at the required feed, and inertia relative to the motor's own rotor inertia. Satisfying one and not the others produces the characteristic failure modes that appear late: following error that grows with speed, drives that derate in a warm cabinet, and position accuracy that degrades as the machine wears.

## Start from the motion profile, not the cutting force

The profile decides what the motor must do. For a typical point-to-point move:

- **Acceleration torque** dominates and is proportional to total inertia divided by acceleration time. It is where most undersized axes fail.
- **Friction and cutting torque** are usually 10–25% of peak on a well-designed axis, and are what the motor must sustain continuously.
- **Gravity torque** applies to vertical axes only, and it must be present continuously — a `Z` axis motor that is sized for cutting but not for holding a heavy head will run hot even when idle.
- **Dwell and duty cycle** decide the thermal rating: a motor that meets peak torque in a 1-second move may not meet continuous torque if the same move repeats 40 times a minute.

The standard structure is to compute RMS torque over the cycle and compare it to the motor's continuous rating, and peak torque against the motor's peak rating with a margin. RMS torque, not average, is the thermal quantity — the square term is what makes intermittent duty so much harder than it looks.

## The three sizing criteria

**1. Continuous (thermal) torque.** Compute RMS torque over the worst repeating cycle, including a hot cabinet ambient. Derate the motor's catalogue continuous torque for the actual ambient and for the mounting condition (a motor bolted to a large steel casting conducts heat away far better than one on a plastic bracket). A 20% margin is normal; a 0% margin will fail in summer.

![Engineering diagram plotting servo torque against speed with a continuous thermal curve and a peak curve, a base speed line separating constant torque from constant power, tapping and large drilling marked at low speed and high-speed finishing at high speed, beside the three sizing criteria of continuous RMS torque, peak torque against the drive overload curve and speed at maximum feed, and a table of acceptable inertia ratios from 3 to 1 for high-accuracy positioning up to 10 to 1 for geared axes](/media/2026/11/diagram-cnc-spindle-feed-servo-motor-sizing-guide.png "Figure 1: The envelope the motor must cover, the three checks that must all pass, and the inertia ratio nobody agrees on.")

**2. Peak torque.** Peak is required at acceleration and at reversal. Available peak from the drive is typically 200–300% of continuous for a few seconds, and that duration matters: a 3-second peak rating does not support a motion profile that demands peak for 5 seconds. Check the drive's overload curve, not just the motor's peak figure — the drive current is often the real limit.

**3. Speed at the required feed.** For a ball screw axis, motor speed is `feed rate / lead`, so a 10 mm lead screw at 30 m/min needs 3000 rpm. Torque falls once the motor reaches base speed; above base speed it operates in the constant-power region and the available torque drops inversely with speed. Selecting a motor whose continuous torque at the top speed is below the cutting torque requirement produces an axis that is fine at low feed and weak at high feed — a symptom commonly misdiagnosed as a spindle problem.

## Inertia ratio: the criterion everyone argues about

Inertia ratio is load inertia divided by motor rotor inertia, both referred to the motor shaft. Low ratios give crisp response, high ratios give sluggish response and, at the limit, instability that no gain tuning can fix.

Typical guidance for machine tool axes:

| Axis type | Typical acceptable ratio |
|---|---|
| High-accuracy positioning, small ballscrew | 3:1 to 5:1 |
| General CNC feed axis with ballscrew | 5:1 to 10:1 |
| High-dynamic pick-and-place | 2:1 to 5:1 |
| Geared axis (ratio measured at motor) | up to 10:1, with a rigid gearbox |
| Belt drive or long ballscrew | 10:1 or higher only with a large motor and careful tuning |

Two traps in this table. First, the ratio is referred to the *motor* shaft, so a 10:1 gearbox divides load inertia by 100 — a geared axis can have a low ratio with a large load. Second, the ballscrew's own inertia is often the dominant term and it is a function of diameter to the fourth power: increasing a screw from 25 mm to 32 mm increases its inertia by 2.7×. Picking a larger screw for stiffness can therefore push the inertia ratio from comfortable to marginal with no change in the motor.

## Spindle sizing is a different problem

A spindle motor is specified by power and torque at the required cutting conditions, not by inertia. The relationship that matters is that power is torque × speed: a spindle that has adequate power at 12 000 rpm may have inadequate torque at 1000 rpm, which is where large-diameter taps, drills and face mills operate.

The practical consequences:

- **Drilling and tapping specify torque at low speed.** A 30 mm indexable drill in steel needs substantial torque at 400–800 rpm. Check the motor's continuous torque at that speed, not just its rated power.
- **High-speed milling specifies power at high speed**, where the constant-power region applies. Almost all small-diameter high-speed work scales with spindle power.
- **Base speed (base frequency) is the pivot.** Below it, torque is roughly constant and power rises with speed; above it, power is constant and torque falls. Machines that do both heavy low-speed and light high-speed work need either a wide constant-power range or a two-range gearbox. A single-speed motor chosen for high-rpm power will disappoint on the tap; one chosen for low-rpm torque will run out of power at 15 000 rpm.
- **Acceleration of the spindle itself** is part of the duty cycle on machines with rapid spindle start-stop (tool change, tapping). A large spindle with high inertia takes seconds to accelerate and consumes peak current each time.

Catalogue "rated power" for a spindle is almost always measured at maximum speed with the motor cold. Sizing on the rated power alone is the most common spindle specification error.

## Regulator and drive selection

The drive must supply the current the motor demands at the operating point, including peak, and must tolerate the ambient. Three points that are frequently missed:

1. **Regenerative energy.** Decelerating a heavy axis or spindle returns energy to the DC bus. Without a brake resistor, an active front end or a shared DC bus with other axes absorbing the energy, the drive trips on overvoltage during deceleration — and the trip appears only on the fastest decel, which may only occur on one program.
2. **Cabinet thermal design.** Drives derate with ambient temperature and altitude, and the derating is not linear. A cabinet designed at 40 °C with 2 kW of drive losses needs the airflow to be verified, not assumed. Filter fans clog, and a cabinet that passed commissioning in winter throttles in summer.
3. **Cable length and shielding.** Long motor cables increase capacitive leakage current and can trigger earth-fault trips; long encoder cables limit the achievable clock rate. Both are installation constraints that appear as random faults years later, and both have specified limits in the drive manual that are routinely exceeded.

## A sizing checklist that prevents late failures

1. Define the motion profile explicitly: mass, friction, external forces, acceleration time, and duty cycle with the worst repeating case.
2. Compute continuous RMS torque, then apply the ambient derating factor.
3. Compute peak torque and check it against the drive's overload curve duration, not only the motor's peak value.
4. Compute the required motor speed at maximum feed, and verify continuous torque at that speed.
5. Compute inertia ratio referred to the motor shaft, including the ballscrew, coupling and workpiece.
6. Check vertical axes for continuous holding torque and brake rating.
7. For spindles, specify torque at the lowest cutting speed and power at the highest, separately.
8. Verify regeneration handling for the fastest deceleration in any program.
9. Record the assumptions on the sizing sheet — ambient, friction coefficient, duty cycle — because those are the numbers that will be wrong, and knowing which one is wrong turns a mysterious overheating case into a five-minute diagnosis.

Oversizing is not free insurance. A much larger motor has much larger rotor inertia, which raises the inertia ratio, which demands more from the servo loop; it also costs efficiency at light load and increases the cabinet heat. The target is the smallest motor that meets all three criteria with margin — which is also the one that will be easiest to tune.

=== takeaways
Servo sizing is a three-way check: RMS torque against the continuous rating with ambient derating, peak torque against the drive overload curve, and inertia ratio referred to the motor shaft.
Acceleration torque dominates most CNC axis profiles; sizing on cutting force alone produces an axis that fails on reversal, not on the cut.
Ballscrew inertia scales with diameter to the fourth power, so choosing a larger screw for stiffness can make the inertia ratio marginal with no motor change.
Spindle motors must be specified as torque at the lowest cutting speed and power at the highest speed; rated power alone is measured at maximum rpm.
Regenerative energy on fast deceleration and cabinet thermal derating are the two most commonly omitted constraints, and both produce faults that appear only under specific program conditions.

=== faqs
Q: Is a lower inertia ratio always better?
A: Not in absolute terms, but among motors that meet torque and speed requirements, the lower ratio is easier to tune and responds faster. The practical implication is that a smaller motor with a shorter, lighter axis often outperforms a larger motor on a heavy axis, which is why machine design should minimize moving mass before selecting the motor.

Q: Why does my Z axis trip on overcurrent only when moving up?
A: Moving up requires torque to lift the load against gravity plus acceleration, while moving down requires less and may even regenerate. An axis that trips only on up-moves is either undersized for the lifting torque or missing a counterbalance. Both are sizing issues, not tuning issues.

Q: Can I fix an undersized axis with drive tuning?
A: Only within narrow limits. Tuning improves damping and reduces following error at a given load, but it cannot create torque. If the drive is current-limited during acceleration, no parameter change will help; the mechanical solution is a counterbalance, reduced moving mass, a shorter lead, or a larger motor.

Q: What does base speed mean in spindle selection?
A: It is the speed at which the motor reaches its maximum voltage and transitions from constant torque to constant power. Below base speed you can get high torque at low speed; above it, power stays roughly constant while torque falls. Applications that need both — heavy tapping and high-speed finishing — usually need a wide constant-power range or a mechanical gear range.

=== sources
ISO 10791-2:2015 — Test conditions for machining centres, Part 2: Geometric tests for machines with vertical spindle |
IEC 60034-1:2022 — Rotating electrical machines, Part 1: Rating and performance |
IEC 61800-5-2:2016 — Adjustable speed electrical power drive systems, Functional safety |
FANUC AC Servo Motor and Amplifier series specification manuals — continuous/peak torque and overload duty |
