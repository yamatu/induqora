---
title: Purdue Model vs Zero Trust in OT Networks: Practical Segmentation for Modern Plants
slug: purdue-model-vs-zero-trust-ot-network-segmentation
type: BLOG
category: ot-cybersecurity
author: edword
tags: OT security, ICS security, IEC 62443, Zones and Conduits, IIoT, Edge computing
publishedAt: 2026-10-25T09:00:00Z
excerpt: Has IIoT killed the Purdue Model, or can Zero Trust replace firewalls on the plant floor? Learn how Purdue levels, IEC 62443 zones and conduits, industrial DMZs and Zero Trust identity controls combine into a realistic OT defense architecture.
seoTitle: Purdue Model vs Zero Trust in OT Security: Practical Guide
seoDescription: Compare the Purdue Model and Zero Trust in OT cybersecurity: combine Level 0–5 IDMZ boundaries, IEC 62443 cell zones and identity-aware vendor remote access.
---
Every few years, a security conference slide declares that **"the Purdue Model is dead"** and must be replaced immediately by **Zero Trust**. Controls engineers look at twenty-year-old PLCs that cannot run TLS certificates — let alone an endpoint identity agent — and quietly ignore the slide deck.

Both sides miss the practical reality of modern industrial plants. **The Purdue Model and Zero Trust are not opposites.** Purdue gives you the **macro-segmentation and physical/network blast-radius boundaries** that legacy OT hardware depends on; Zero Trust strengthens **how humans, engineering workstations, edge gateways and cloud services cross those boundaries**.

## What the Purdue Model actually defines

Originally developed as the Purdue Enterprise Reference Architecture (PERA) and standardized alongside **ISA-95** and **ISA-99 / IEC 62443**, the Purdue Model separates a factory into hierarchical functional levels with strict traffic control between enterprise IT and plant-floor OT:

| Level | Functional Layer | Typical Assets | Security Characteristics |
|---|---|---|---|
| **Level 5** | Enterprise Network | Corporate ERP, email, internet gateway, cloud SaaS | Standard IT security, identity providers, frequent patching |
| **Level 4** | Business Planning & Logistics | Plant scheduling, ERP interface, corporate BI | IT-managed; must never talk directly to PLCs |
| **Level 3.5** | **Industrial DMZ (IDMZ)** | Data historians (mirror), jump hosts, patch/AV mirrors, MQTT/OPC UA brokers | **Termination zone** — zero direct routing allowed between Level 4 and Level 3 |
| **Level 3** | Site Operations & Control | SCADA servers, MES, engineering workstations, AD/DNS for OT, local historians | Supervisory layer; tightly restricted outbound and inbound conduits |
| **Level 2** | Area Supervisory Control | Local HMIs, operator terminals, line-level SCADA | Communicates with Level 1 controllers and Level 3 servers |
| **Level 1** | Basic Control | PLCs, DCS controllers, RTUs, safety PLCs, robot controllers | Deterministic real-time logic; legacy protocols, decades-long lifecycles |
| **Level 0** | Physical Process | Sensors, actuators, valves, VFDs, servo drives | Field-level I/O and hardwired safety circuits |

The single most valuable rule in the entire Purdue Model is **Level 3.5 (the IDMZ)**: no TCP session ever crosses directly from corporate IT (Level 4) to plant control (Level 3 or below). Instead, data is **brokered** in the IDMZ — a Level 3 historian pushes replicated data out to an IDMZ mirror, and Level 4 enterprise users query only the IDMZ mirror.

## Why pure Purdue struggles in 2026 factories

Traditional strict-Purdue implementations break down in three places on modern shop floors:

1. **Flat networks inside Level 1 and Level 2:** Many factories built a strong firewall between IT and OT, then left 400 PLCs, HMIs, cameras and drives sitting in one flat `/16` OT subnet. Once ransomware or a compromised contractor laptop lands inside Level 2/3, lateral movement across every production line is trivial.
2. **IIoT edge devices bypassing vertical layers:** Cellular 5G gateways, cloud-connected vibration sensors and OEM remote-service routers punch straight from Level 0/1 to the public internet — bypassing the IDMZ entirely, exactly the exposure pattern highlighted in [recent EU cyber incidents targeting commercial refrigeration controllers](/news/enisa-eu-warning-cyber-incidents-refrigeration-control-systems-2026).
3. **Always-on VPNs for remote maintenance:** Handing an OEM vendor a broad VPN into the OT network violates least privilege — once inside the perimeter, the vendor can see dozens of unrelated machines.

## What Zero Trust brings (and where it hits OT physics)

Zero Trust (formalized in **NIST SP 800-207**) rests on three principles: **verify explicitly**, **use least-privilege access** and **assume breach**.

| Zero Trust Principle | Works Great in OT At... | Breaks or Needs Adaptation At... |
|---|---|---|
| **Strong user identity + MFA + per-session approval** | Remote maintenance access, IDMZ jump hosts, SCADA/MES logins, engineering station privilege elevation | Shared local operator HMI screens where operators must react to alarms in seconds without typing a 20-character password |
| **Device identity & mutual TLS (mTLS)** | Edge gateways, MQTT brokers, OPC UA servers, IT-to-IDMZ conduits | Legacy Level 1 PLCs, serial Modbus RTU slaves and hardwired field devices lacking cryptographic hardware |
| **Micro-segmentation (east-west isolation)** | Cell-to-cell firewalls, managed OT switches with VLAN/ACL enforcement, IEC 62443 zones | Deterministic real-time fieldbuses (EtherCAT, PROFINET IRT) where deep firewall inspection would destroy cycle jitter |
| **Continuous verification & monitoring** | Passive OT network monitoring (Zeek/Nozomi/Claroty/Dragos) watching east-west anomalies | Active IT vulnerability scanners that crash fragile legacy PLC TCP stacks |

## Combining both: IEC 62443 Zones and Conduits + Zero Trust Controls

Rather than debating Purdue vs Zero Trust as mutually exclusive religions, high-maturity industrial security teams map them together using [IEC 62443-3-2 zones and conduits](/blog/iec-62443-explained):

### 1. Keep the IDMZ (Purdue Level 3.5) as your north-south choke point

All traffic between corporate IT / cloud and the plant floor — historian replication, [Unified Namespace MQTT broker bridges](/blog/unified-namespace-uns-architecture-practical-guide), patch repositories, antivirus signatures and remote vendor access — terminates inside the IDMZ. Zero direct routing from Level 4 to Level 1–3.

### 2. Add east-west cell segmentation inside Level 1–2

Break a flat OT network into **per-line or per-cell zones** (Packaging Line 1, CNC Bay A, Boiler Utilities, Safety SIS Zone). Put a stateful OT firewall or Layer 3 switch ACL at each conduit so Line 1's PLC cannot initiate SMB, RDP or Modbus TCP sessions into Line 2's PLC. Even if one contractor laptop introduces malware in CNC Bay A, blast radius stops at the cell boundary.

### 3. Apply Zero Trust strictly to Remote Access (SRA)

Replace permanent VPNs and cellular contractor modems with **Zero Trust Secure Remote Access**:

- Vendor authenticates with named identity + hardware/app MFA to an IDMZ broker.
- Plant operations approves a **time-bounded access window** (e.g., 2 hours for Machine #14 only).
- Protocol-level access (RDP/VNC/HTTPS/engineering tunnel) is scoped exclusively to the single target engineering host or jump box — never the full subnet.
- Full session recording logs every screen action and file transfer for audit and incident forensics.

### 4. Eliminate shadow IIoT cellular backdoors

Route all IIoT telemetry through managed [industrial edge gateways](/blog/industrial-edge-gateways-selection-deployment-guide) sitting on dedicated IIoT/DMZ VLANs using outbound-only TLS/mTLS connections to an approved broker. Audit cabinets quarterly for unauthorized 4G/5G OEM service routers.

### 5. Enforce passive east-west monitoring

Deploy passive SPAN/TAP sensors on core OT switches so you detect abnormal behavior immediately — new MAC addresses, unauthorized PLC firmware downloads, NTLM relay attempts (such as [CVE-2026-58114 on SIMATIC supervisory networks](/news/cisa-siemens-simatic-wincc-pcs7-ntlm-advisories-nov-2026)) or unexpected Modbus write commands.

## A practical five-step segmentation roadmap

For a brownfield factory starting with a flat OT network:

1. **Inventory every connected asset** passively before touching a single firewall rule (include utility skids, HVAC, printers and soft-PLCs).
2. **Build or harden the IDMZ** so corporate IT cannot route directly to Level 3 SCADA or Level 1 PLCs.
3. **Replace legacy contractor VPNs and cellular modems** with identity-verified, time-bound, recorded remote access.
4. **Segment highest-consequence zones first** — isolate the [Safety Instrumented System (SIS)](/blog/safety-instrumented-systems-iec-61511-sil-guide), then separate plant utilities from core production lines, then split production lines into cell VLANs during scheduled turnarounds.
5. **Test firewall rules in log-only mode** for 2–4 weeks across full shift cycles (including month-end ERP syncs and backup jobs) before flipping conduits to deny-by-default.

=== takeaways
The Purdue Model and Zero Trust complement rather than replace each other in industrial cybersecurity: Purdue provides network blast-radius boundaries while Zero Trust secures identities, gateways and remote sessions crossing them.
The Industrial DMZ (Level 3.5) remains essential so corporate IT and cloud applications never route directly to plant-floor PLCs or SCADA servers.
Pure Zero Trust endpoint agents cannot run on legacy PLCs or real-time fieldbuses; instead, IEC 62443 zones and conduits enforce east-west cell isolation and protocol filtering around legacy equipment.
Zero Trust delivers its highest immediate OT ROI on vendor remote access — replacing shared always-on VPNs with named MFA identities, time-limited approvals, single-asset scoping and session recording.
Eliminating unmanaged OEM cellular routers and deploying passive OT network monitoring close the largest gaps left by traditional perimeter-only defenses.

=== faqs
Q: Is the Purdue Model obsolete for Industry 4.0 and IIoT?
A: No. While strict layer-by-layer data polling has given way to event-driven edge gateways and Unified Namespaces, the Purdue Model's core security principle — terminating IT/OT and cloud connections inside an Industrial DMZ (Level 3.5) rather than routing straight to PLCs — remains foundational for protecting legacy OT hardware.

Q: Can Zero Trust be implemented directly on PLCs and field devices?
A: Rarely on existing hardware. Most legacy PLCs lack the CPU, OS and cryptographic stack needed for endpoint Zero Trust agents or mutual TLS. Instead, factories apply Zero Trust at the surrounding conduits — using identity-aware remote access, authenticated edge gateways, OT firewall allow-lists and IEC 62443 cell segmentation.

Q: What is the difference between north-south and east-west OT segmentation?
A: North-south segmentation controls traffic moving vertically between corporate IT, the IDMZ, SCADA and the plant floor. East-west segmentation divides the plant floor horizontally into isolated cell or line zones so malware or a compromised contractor laptop on one production line cannot spread sideways to other lines.

Q: How does the Purdue Model map to IEC 62443?
A: IEC 62443-3-2 generalizes the Purdue Model into flexible security zones and conduits based on risk assessment. Each Purdue level — or individual production cell, utility skid or SIS — becomes a zone with a target Security Level (SL 1–4), connected only through controlled, monitored conduits.

=== sources
NIST SP 800-82 Rev. 3: Guide to Operational Technology (OT) Security | https://csrc.nist.gov/pubs/sp/800/82/r3/final
NIST SP 800-207: Zero Trust Architecture | https://csrc.nist.gov/pubs/sp/800/207/final
ISA/IEC 62443 Series of Standards — International Society of Automation | https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards
CISA — Improving Industrial Control Systems Cybersecurity with Defense-in-Depth Strategies | https://www.cisa.gov/resources-tools/resources/ics-recommended-practices
