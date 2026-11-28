---
title: IEC 62443 Zones and Conduits: Practical OT Network Segmentation Design
slug: iec-62443-zones-and-conduits-ot-segmentation-guide
type: BLOG
category: ot-cybersecurity
author: edward
tags: Zones and conduits, IEC 62443, OT security, ICS security, Network segmentation
publishedAt: 2026-11-26T02:00:00Z
excerpt: Flat plant networks allow a single phishing email or infected contractor laptop to halt an entire factory. Learn how to apply IEC 62443-3-2 zones, conduits, and Target Security Levels (SL-T) to segment PLCs, safety systems, SCADA servers, and DMZ services without breaking operations.
seoTitle: IEC 62443 Zones & Conduits: OT Segmentation Guide
seoDescription: How to design IEC 62443-3-2 zones and conduits for industrial plants: SL-T mapping, SIS isolation, firewall rule matrices, DMZ design, and audit checklists.
coverImage: /media/2026/11/cover-iec-62443-zones-and-conduits-ot-segmentation-guide.jpg
coverAlt: Technical editorial illustration of segmented OT plant security zones separated by firewall conduits, an industrial DMZ, and an isolated safety zone
coverCaption: IEC 62443-3-2 partitions factory networks into risk-aligned zones joined only by explicitly allowlisted, monitored conduits.
---
Most industrial ransomware and OT intrusion post-mortems share the same root enabler: a flat Layer 2/Layer 3 network where corporate laptops, engineering workstations, SCADA servers, and field PLCs sit only a single permissive firewall rule — or no firewall at all — apart. When attackers compromise IT Active Directory, lateral movement into manufacturing takes minutes.

Within the [IEC 62443 industrial cybersecurity framework](/blog/iec-62443-explained), **IEC 62443-3-2** (Security Risk Assessment for System Design) addresses this directly through **Zones and Conduits**. Rather than chasing a single perimeter firewall around an entire factory, asset owners partition the plant into trust boundaries governed by shared risk, then explicitly engineer, filter, and monitor every communication path crossing between them.

## What IEC 62443 actually means by Zones and Conduits

Engineers coming from the traditional [Purdue Model vs Zero Trust](/blog/purdue-model-vs-zero-trust-ot-network-segmentation) debate sometimes mistake zones for simple VLANs. In IEC 62443-3-2, a VLAN is merely an implementation tool; **zones and conduits are risk-driven architectural objects**:

- **Zone:** A grouping of physical or logical assets (PLCs, HMIs, drives, RTUs, servers, or engineering stations) that share the **same security requirements** and **Target Security Level (SL-T)**. Inside a zone, assets trust one another at that baseline level, though high-criticality zones may add internal micro-segmentation.
- **Conduit:** A logical grouping of communication channels connecting two or more zones. A conduit defines permitted protocols, directions, authentication, encryption, and inspection controls. Crucially, **not all conduits are Ethernet cables** — a USB flash drive used for firmware updates, a vendor cellular modem, or a serial RS-485 link bridging two zones is also a conduit and must be documented and controlled.

### The five mandatory separation principles in IEC 62443-3-2

Before drawing firewall rules, IEC 62443-3-2 requires separating assets when their risk profiles fundamentally diverge:

1. **Separate Safety Instrumented Systems (SIS) from Basic Process Control Systems (BPCS):** Controllers running [IEC 61511 SIL-rated safety functions](/blog/safety-instrumented-systems-iec-61511-sil-guide) must sit in an isolated Safety Zone. Compromise of a SCADA HMI or DCS station must never permit unauthorized write access or logic download to a safety PLC.
2. **Separate IT/Enterprise from OT via an Industrial DMZ (IDMZ):** Direct routing between corporate Level 4 subnets and plant-floor Level 1–2 controllers is prohibited. All data exchange (historian replication, MES orders, patch servers, remote jump hosts) terminates in the DMZ.
3. **Isolate wireless and temporary maintenance access:** Plant Wi-Fi (tablets, AGVs, barcode scanners) and vendor remote-access entry points sit in dedicated zones with strict inspection before reaching control networks.
4. **Group by operational blast radius, not just physical room:** Two packaging lines sharing a floor should occupy distinct Cell/Area Zones so a compromised workstation on Line A cannot propagate to Line B.
5. **Keep legacy unpatchable equipment in tightly wrapped zones:** Older PLCs or Windows-embedded HMIs that cannot run modern TLS or endpoint protection require compensating perimeter controls inside a dedicated legacy zone.

## Mapping Risk to Target Security Levels (SL-T 1 through SL-T 4)

Every zone receives a **Target Security Level (SL-T)** derived from worst-case unmitigated consequence (safety, environmental release, downtime cost, regulatory impact) and threat likelihood:

| Security Level | Threat Actor Profile Protected Against | Typical Plant Zones | Key Technical Controls (IEC 62443-3-3) |
|---|---|---|---|
| **SL-T 1** | Casual or coincidental misuse / operator error | Non-critical utilities, local building monitoring | Basic VLAN isolation, physical cabinet locks, standard passwords |
| **SL-T 2** | Intentional attack using simple means, low resources, generic skills | Standard Cell/Area PLC zones, Site SCADA/HMI, IDMZ | Stateful industrial firewalls, MFA on remote access, RBAC, centralized logging, allowlisted conduits |
| **SL-T 3** | Sophisticated attack using IACS-specific skills and moderate resources | Core DCS/SCADA control zones, Safety (SIS) zones, critical infrastructure | Deep Packet Inspection (DPI) for CIP/S7/Modbus/OPC UA, jump hosts with session recording, network IDS, hardware root-of-trust/signed firmware |
| **SL-T 4** | Nation-state / advanced persistent threat with extensive ICS resources | High-hazard chemical, nuclear, grid transmission SIS/control cores | Unidirectional security gateways (data diodes), air-gapped engineering stations, strict physical + cryptographic controls |

A common mistake is declaring the entire plant "SL-T 3" in policy documents. Achieving SL-T 3 requires stringent cryptographic, identity, and protocol-inspection controls under IEC 62443-3-3 that legacy Level 1 controllers cannot natively satisfy. Assigning realistic per-zone targets (for example, **SL-T 2** on standard manufacturing cells and **SL-T 3** on the IDMZ and SIS zones) concentrates budget where risk is highest.

## Reference conduit matrix for a modern manufacturing plant

Once zones are defined, every allowed traffic flow is documented in a **Conduit Security Requirements Matrix**. Anything not explicitly listed is **denied by default** at the zone boundary firewall:

![Plant OT segmentation architecture diagram showing Enterprise IT, Industrial DMZ, Site SCADA, Cell PLC zones, and Safety SIS zone linked by numbered allowlisted conduits C-01 through C-06](/media/2026/11/diagram-iec-62443-zones-and-conduits-ot-segmentation-guide.png "Figure 1: Reference IEC 62443-3-2 Zone and Conduit topology showing Target Security Levels (SL-T), outbound-only OT-to-IDMZ replication, and isolated Safety (SIS) controls.")

| Conduit ID | Source Zone → Destination Zone | Permitted Protocols & Ports | Control Enforcement |
|---|---|---|---|
| **C-01** | Enterprise IT → IDMZ | HTTPS (443) to Jump Host / BI Portal; SQL/HTTPS to Replica Historian | Next-Gen Firewall + Phishing-resistant MFA; **zero direct IT → OT routing** |
| **C-02** | Site SCADA/Historian → IDMZ | Outbound-only Historian Mirroring (e.g., TLS 5450 / OPC UA 4840 / MQTTS 8883) | Initiated **only from OT into IDMZ** (or via hardware data diode) |
| **C-03** | Site SCADA → Cell/Area PLC Zones | OPC UA (4840), EtherNet/IP CIP (44818), PROFINET/S7 (102) | Stateful + Industrial DPI allowlisting read/write function codes per IP |
| **C-04** | Engineering Jump Zone → Cell/Area PLCs | Vendor engineering protocols (TIA Portal, Studio 5000) | Time-bound firewall rule or Privileged Access Management (PAM) approval + video recording |
| **C-05** | Cell/Area PLC ↔ Cell/Area PLC | Explicit peer-to-peer interlock tags only (e.g., CIP Produced/Consumed or dedicated hardwired I/O) | Inter-cell firewall allowlist; block broadcast/multicast leakage across cells |
| **C-06** | Safety (SIS) Zone → Site SCADA | Read-only diagnostic status & trip alarms | Read-only DPI filter or unidirectional gateway; physical key-switch required for SIS downloads |

### Industrial firewalls vs. unidirectional gateways (data diodes)

Software-configured firewalls provide flexible bidirectional filtering with Industrial Deep Packet Inspection (DPI), letting security engineers permit `Modbus Function Code 3 (Read Holding Registers)` while blocking `Function Code 6/16 (Write Registers)` across a monitoring conduit. However, firewalls still depend on correct rule hygiene and patched firmware.

For **high-consequence zones** — such as streaming live process telemetry from a Safety Zone or DCS core to corporate cloud analytics — a **hardware unidirectional gateway (data diode)** enforces physics-level isolation: an optical LED transmitter on the OT side and a photodiode receiver on the DMZ side with no return fiber path at all. Even a fully compromised enterprise network physically cannot send a single packet back into the plant.

## Five real-world segmentation anti-patterns that fail audits

During OT security assessments, five recurring mistakes quietly invalidate otherwise impressive network diagrams:

1. **Dual-homed HMIs and historians bridging two zones:** An HMI workstation with NIC 1 plugged into the PLC network and NIC 2 plugged into the corporate LAN bypasses the IDMZ firewall completely. Remove dual-homed hosts and broker all traffic through the firewall/DMZ.
2. **Sharing one Active Directory domain across IT and OT:** When OT domain controllers replicate directly with corporate Active Directory, a corporate Kerberoasting or Domain Admin compromise immediately grants administrative control over every OT Windows server. Deploy a standalone OT Active Directory forest (or local/OT-specific identity directory) with no two-way trust to corporate AD.
3. **Leaving "ANY/ANY" temporary commissioning rules in place:** Integrators routinely open temporary broad firewall rules during startup and forget to close them. Enforce mandatory expiration dates and quarterly firewall rule reviews.
4. **Ignoring unmanaged Layer 2 links and cellular OEM modems:** A single machine builder's 4G remote-support router plugged straight into a cell switch creates an unmonitored backdoor directly into an SL-T 2 zone. Route all vendor support through the plant's central IDMZ remote-access gateway with operator-approved session toggling.
5. **Forgetting physical and removable-media conduits:** A perfectly segmented network still falls if maintenance technicians move unfiltered USB drives from office PCs directly into control-panel HMIs. Pair network conduits with USB port locks and dedicated malware-scanning kiosks inside the maintenance zone.

## Step-by-step brownfield rollout without stopping production

You do not need a greenfield plant shutdown to implement IEC 62443 zones and conduits. Experienced OT teams phase segmentation safely over four stages:

1. **Passive asset and traffic discovery (0% downtime risk):** Mirror core switch SPAN ports into a passive OT network sensor for 30 days to inventory every PLC, HMI, drive, protocol, and east-west conversation — including monthly batch jobs and backup schedules.
2. **Draft the Zone & Conduit Diagram and SL-T table:** Group assets by production line and risk consequence, review with controls and reliability engineers so deterministic machine communications (such as [PROFINET, EtherNet/IP, or EtherCAT](/blog/profinet-vs-ethernet-ip-vs-ethercat)) remain inside their cell boundary without added router jitter.
3. **Deploy firewalls in transparent / monitor-only mode first:** Insert industrial firewalls at cell boundaries and the IDMZ in Layer 2 transparent (bridge) mode with logging enabled. Tune the allowlist until zero legitimate traffic triggers an alert over a full production and maintenance cycle.
4. **Enforce default-deny per zone, starting at the IT/OT boundary:** Lock down the IDMZ first (eliminating the largest external attack vector), then enforce Safety Zone isolation, and finally tighten inter-cell east-west conduits one maintenance window at a time.

=== takeaways
IEC 62443-3-2 zones group assets by shared risk and Target Security Level (SL-T 1–4), while conduits explicitly govern every network, wireless, serial, and removable-media path between them.
Safety Instrumented Systems (SIS) must sit in an isolated zone with read-only diagnostic conduits to SCADA, and all IT-to-OT traffic must terminate inside an Industrial DMZ.
Eliminate dual-homed workstations, shared IT/OT Active Directory forests, and unmonitored OEM cellular modems — they silently bypass firewall segmentation.
Roll out brownfield segmentation safely by starting with 30-day passive traffic discovery, inserting transparent monitoring firewalls, and enforcing default-deny rules one zone at a time.

=== faqs
Q: How are IEC 62443 zones different from Purdue Model levels?
A: The Purdue Model organizes systems vertically by functional hierarchy (Levels 0 to 5), whereas IEC 62443 zones partition assets both vertically and horizontally by risk and blast radius. In practice, engineers combine them: Purdue levels define vertical tiers (such as separating the IDMZ from control networks), while IEC 62443 splits Level 1–2 horizontally into independent Cell/Area Zones and a dedicated Safety Zone.

Q: Will inserting firewalls between zones break real-time PLC or motion control?
A: Only if placed in the wrong boundary. Real-time cyclic I/O (PROFINET IRT, EtherCAT, CIP Motion) must stay inside a single Cell/Area Zone on Layer 2 switches. Firewalls sit on the conduits between cells, between cells and Site SCADA, and at the Industrial DMZ, where sub-millisecond determinism is not required.

Q: Can legacy PLCs that do not support encryption or authentication meet IEC 62443?
A: Yes. IEC 62443 explicitly allows compensating countermeasures at the zone boundary. By placing legacy PLCs in a dedicated zone behind an industrial firewall with Deep Packet Inspection (DPI), strict IP/function-code allowlisting, passive IDS monitoring, and physical cabinet locks, an asset owner can achieve the zone's Target Security Level without replacing functioning hardware.

Q: How often should Zones and Conduits diagrams be reviewed?
A: Review and update the Zone & Conduit architecture whenever a new production line, remote-access tool, historian connection, or cloud/IIoT gateway is added, and at least annually as part of formal Management of Change (MoC) and OT cybersecurity audits.

=== sources
ISA/IEC 62443-3-2 — Security Risk Assessment for System Design | https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards
NIST SP 800-82 Rev. 3 — Guide to Operational Technology (OT) Security | https://csrc.nist.gov/pubs/sp/800/82/r3/final
CISA — Cross-Sector Cybersecurity Performance Goals & OT Segmentation Guidance | https://www.cisa.gov/topics/industrial-control-systems
