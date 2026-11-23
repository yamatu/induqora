---
title: Diagnosing Servo Drive Alarms: Overcurrent, Overvoltage, Regeneration and Encoder Faults
slug: servo-drive-alarm-troubleshooting-cnc-maintenance
type: BLOG
category: motion-control-drives
author: edword
tags: Servo drives, Servo amplifiers, Motion control, FANUC, Automation repair, CNC spare parts
publishedAt: 2026-11-02T09:00:00Z
excerpt: When a CNC machine or packaging axis stops with a servo drive alarm, swapping the amplifier without finding the root cause often destroys the replacement unit too. Learn a methodical field workflow for overcurrent, DC bus overvoltage, regeneration, overload and encoder faults.
seoTitle: Diagnosing Servo Drive Alarms: Practical Field Guide
seoDescription: Field troubleshooting guide for CNC and servo drive alarms: overcurrent, DC bus overvoltage, braking resistor faults, thermal overload and encoder EMI noise.
---
Few faults stop a machine shop or automated production line faster than a tripped **servo drive** (or **servo amplifier**). Under pressure to restart production, the most expensive reflex in plant maintenance is immediately ordering a replacement amplifier, bolting it into the rack and powering up — only to watch a shorted motor cable or failed brake blow the brand-new IGBT stage in half a second.

Whether you maintain FANUC Alpha/Beta CNC amplifiers, Siemens SINAMICS, Rockwell Kinetix, Yaskawa Sigma or Mitsubishi MR-J drives, almost all servo faults fall into **five physical root-cause families**. A structured 20-minute diagnostic sequence separates a genuine amplifier hardware failure from a motor, cable, power-supply or mechanical fault before any spare part is put at risk.

> **Safety warning:** Servo DC bus capacitors commonly hold **300 V to 700+ V DC** for several minutes after main power is locked out. Always verify zero volts across the DC bus terminals (`+`/`-`) with a CAT III/IV meter before disconnecting motor leads or touching braking resistors.

## Quick reference: the five major servo alarm families

| Alarm Family | Typical Vendor Codes / Labels | Most Likely External Causes | Likely Internal Drive Causes |
|---|---|---|---|
| **1. Overcurrent / Short Circuit** | OC, HC, `AL-08 / AL-09` (FANUC high current), `F30001` (Siemens), `E04` | Phase-to-phase or phase-to-ground cable short, degraded motor stator insulation, failed holding brake not releasing | Shorted IGBT power module, failed gate-driver board, faulty current-sense Hall sensor |
| **2. DC Bus Overvoltage / Regen** | OV, `AL-07` / `AL-01` regen, `F30002`, `A.400` | High incoming AC line voltage, open/blown external braking resistor, deceleration ramp too aggressive, mechanical jam forcing rapid stop | Failed regen braking transistor, dried-out DC bus electrolytic capacitors |
| **3. Overload / Overtemperature** | OL, OH, `AL-400` / `AL-414` / `AL-436`, `A.710 / A.720` | Binding ballscrew or linear guide, misaligned coupling, clogged cabinet filter/fan, motor brake dragging, wrong servo tuning causing hunting | Seized internal cooling fan, dried thermal paste on IGBT heatsink, failing power-module thermistor |
| **4. Encoder / Feedback Fault** | ENC, `AL-300 / AL-350 / AL-351` (SPC/APC), `A.810 / A.820` | Broken encoder cable in drag chain, damaged shield grounding (EMI from PWM motor leads), dead absolute-encoder backup battery (3.6 V / 6 V), oil ingress into encoder housing | Faulty feedback receiver IC on amplifier control board |
| **5. DC Bus Undervoltage / Phase Loss** | UV, `AL-04` / `AL-06`, `F30003`, `A.410` | Tripped upstream breaker, blown input fuse, loose 3-phase terminal, single-phasing utility dip, faulty main contactor auxiliary | Failed pre-charge resistor/relay or bridge rectifier inside power supply module |

## Step-by-step field diagnostic workflow

### Step 1: Record the exact alarm history before cycling power

Power-cycling clears volatile diagnostic registers on many older drives. Before resetting anything:

- Photograph the **exact CNC/PLC alarm number AND the LED/7-segment code directly on the servo amplifier and power supply module** (on multi-axis CNC racks like FANUC, the control screen alarm often points to a specific amplifier LED code that isolates *which* module tripped).
- Note **when** the fault occurred: at power-on (before servo enable), the exact instant the axis enabled, during rapid acceleration, during deceleration, or randomly mid-cycle?

### Step 2: Isolate Overcurrent faults BEFORE installing a spare drive

If the drive trips on **Overcurrent / IPM Fault** immediately upon enable:

1. **Lock out power and verify 0 V DC on the bus.**
2. **Disconnect the U/V/W motor power cable at the drive terminals.**
3. **Megohmmeter (insulation resistance) test — cable + motor ONLY (NEVER connect a megger to the servo drive!):**
   - Test U, V and W to protective earth (PE) at **500 V DC** (check motor datasheet; never exceed rated voltage). Healthy dry windings and cables typically measure **> 50–100 MΩ**; anything below **1–2 MΩ** indicates moisture, coolant ingress or chafed cable insulation inside the cable carrier.
   - If resistance is low, unplug the connector at the motor and test the **cable** and **motor** separately to pinpoint which one failed.
4. **Winding phase balance test (milliohm / low-ohm meter):** Measure `U–V`, `V–W` and `W–U`. All three readings should agree within **~2%–5%**. A significant imbalance points to a turn-to-turn stator short.
5. **Diode check on the disconnected drive output stage:** With a multimeter in diode mode, check the freewheeling diodes from `U/V/W` to `DC+` and `DC-`. Identical ~0.35–0.55 V forward drop in one direction and open/OL in reverse is normal; a dead short (`0.00 V`) on any leg confirms a blown IGBT inside the amplifier.

### Step 3: Troubleshoot DC Bus Overvoltage and Regeneration alarms

When a heavy spindle or vertical axis decelerates rapidly, the motor acts as a generator and pumps kinetic energy back onto the DC bus.

- **Measure incoming 3-phase AC voltage** across all three phase pairs. Sustained voltage > 10% above nominal reduces DC bus headroom dramatically.
- **Measure the external regeneration (braking) resistor** disconnected from the drive: compare actual ohms against the nameplate specification. An open circuit (infinite ohms) means the resistor burned open — often because the drive's internal regen IGBT shorted earlier! Check the regen transistor before installing a new resistor.
- **Inspect deceleration ramps and mechanical inertia:** Has someone shortened cycle time in the PLC/CNC program recently, increasing peak braking energy beyond the resistor's wattage rating?

### Step 4: Separate mechanical overload from electrical failure

If an axis trips on **Overload (I²t)** after running for minutes or hours:

- Monitor **live motor torque/current percentage** on the CNC/drive diagnostic screen during steady jog moves in both directions. Comparing against baseline commissioning logs (or a twin machine) reveals binding mechanical ways, dry ballscrews, misaligned couplings or a **24 V DC holding brake failing to release fully** (confirm actual 24 V at the brake coil under load — voltage drop through long drag-chain wires can leave a brake partially dragging!).
- Check **cabinet ambient temperature** (keep below 40–45 °C), door filters and the small cooling fans bolted to the servo amplifier heatsink. On older CNC amplifiers, a stalled $20 fan quietly bakes DC bus capacitors until the drive fails permanently.

### Step 5: Cure intermittent Encoder and EMI faults

Intermittent feedback alarms — especially ones that trigger only when an adjacent spindle or VFD starts — are overwhelmingly **cabling and shielding problems**, not bad encoders:

1. **Inspect drag-chain flex cables:** Flex fatigue breaks fine twisted pairs inside intact-looking outer jackets. Replace with genuine continuous-flex rated cable.
2. **Verify 360-degree shield bonding:** Motor power cables carry high-dv/dt PWM pulses. Keep motor power and encoder cables physically separated (at least 100–200 mm where routed parallel, crossing only at 90 degrees), and bond cable shields with **360-degree metal clamps** to the grounded backplate — never long unshielded "pigtail" drain wires, which act like antennas at switching frequencies.
3. **Check absolute encoder backup batteries:** On CNC axes using battery-backed absolute pulse coders, replace lithium batteries **with control power ON** on a preventive schedule (typically every 12–24 months) to prevent lost home positions (`APC` alarms).
4. **Swap-test cautiously:** On identical twin axes (for example, X and Y using identical drive and motor ratings), swapping feedback cables can confirm whether the fault follows the motor/cable or stays with the amplifier — *only* after confirming no short circuits exist.

## Repair vs replacement: making the right maintenance call

Once electrical testing confirms the **servo amplifier itself** has failed (blown IGBT, failed power-supply stage, corroded capacitors or dead control board), decide between **buying a replacement** and **sending the unit for board-level repair**:

- **Machine down with zero standby spare:** Source a functionally tested replacement matching the **exact complete nameplate part number including suffix and hardware revision** — for example, checking the full `A06B-6xxx-Hxxx` code on FANUC units, as covered in our [obsolete spare-parts sourcing and repair guide](/blog/obsolete-automation-spare-parts-sourcing-repair-guide) and [Vcocnc](/blog/vcocnc-fanuc-spare-parts-repair-supplier-china) / [Vibocnc](/blog/vibocnc-cnc-automation-parts-repair-service-china) supplier profiles.
- **Repairing the failed unit as your next shelf spare:** Professional component-level repair (replacing IGBTs, optocouplers, aging electrolytic capacitors and cooling fans, followed by closed-loop load testing) typically costs **30%–50% of a replacement** and rebuilds your spare stock while extending the life of legacy CNC lines.

And if you are specifying new axes from scratch, understanding drive physics up front — see [VFD vs Servo Drive selection](/blog/vfd-vs-servo-drive-selection-guide) — avoids undersized regeneration capacity and fragile feedback layouts from day one.

=== takeaways
Always isolate motor winding insulation, cable integrity and holding-brake release before installing a replacement servo amplifier, or an external short can immediately destroy the new drive.
Verify zero volts on the DC bus capacitors with a rated meter before disconnecting motor leads or braking resistors, and never apply a megohmmeter directly to servo drive terminals.
Intermittent encoder faults are most often caused by flex-fatigued drag-chain cables, missing 360-degree shield clamps or PWM noise coupling from adjacent motor power cables rather than failed encoders.
Chronic overload alarms commonly trace back to mechanical binding, dragging 24 V holding brakes or clogged amplifier cooling fans rather than defective power electronics.
When replacing or repairing a confirmed faulty amplifier, always match the complete nameplate part number and suffix, and consider repairing the failed unit to restore shelf spare inventory.

=== faqs
Q: Why does a replacement servo drive fail immediately after installation?
A: The most common reason is an undiagnosed external fault — such as a phase-to-ground short in a chafed motor cable, moisture in the motor stator windings, a shorted braking resistor circuit or a mechanical lockup. Always megger-test the disconnected cable and motor and verify winding balance before powering up a spare drive.

Q: Can I test a servo motor with a megohmmeter while it is connected to the servo drive?
A: No. High test voltage (typically 500 V or 1,000 V DC) from an insulation tester will permanently damage the servo drive's IGBT power stage and sensing circuitry. Always disconnect the U/V/W leads completely from the drive before testing the cable and motor.

Q: What causes a servo drive DC bus overvoltage alarm during deceleration?
A: Rapid deceleration turns the servo motor into a generator, pumping energy back onto the drive's DC bus. Overvoltage trips occur when the deceleration ramp is too short for the load inertia, the external braking resistor is open or improperly sized, incoming AC mains voltage is too high, or the drive's internal regeneration transistor has failed.

Q: How do I tell if an encoder fault is caused by electrical noise (EMI)?
A: EMI-induced encoder faults typically appear intermittently when the servo enables or when nearby spindles, contactors or VFDs switch on, while disappearing when the axis is moved slowly by hand with power off. Separating motor and encoder cables, restoring 360-degree shield clamping to earth and replacing damaged drag-chain cables resolves most noise-related faults.

=== sources
IEC 61800-5-1: Adjustable speed electrical power drive systems — Part 5-1: Safety requirements — Electrical, thermal and energy
IEC 61800-3: Adjustable speed electrical power drive systems — Part 3: EMC requirements and specific test methods
IEEE Std 43-2013: IEEE Recommended Practice for Testing Insulation Resistance of Electric Machinery | https://standards.ieee.org/
FANUC, Siemens SINAMICS and Yaskawa Sigma Maintenance & Troubleshooting Reference Documentation
