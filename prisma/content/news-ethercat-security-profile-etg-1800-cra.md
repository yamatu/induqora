---
title: ETG Releases ETG.1800 EtherCAT Security Profile for IEC 62443 SL 2 and EU CRA Readiness
slug: etg-releases-ethercat-security-profile-etg-1800-cra-compliance
type: NEWS
category: industrial-networking
author: edward
tags: EtherCAT, IEC 62443, Cyber Resilience Act, Industrial Ethernet, OT security, EU regulation
publishedAt: 2026-11-22T18:00:00Z
featured: true
excerpt: The EtherCAT Technology Group has published ETG.1800 v1.0, showing how 25 existing EtherCAT functions satisfy IEC 62443-3-3 Security Level 2 without protocol or hardware changes roughly one year ahead of full EU Cyber Resilience Act enforcement.
seoTitle: ETG Releases ETG.1800 EtherCAT Security Profile for CRA
seoDescription: ETG.1800 v1.0 maps 25 existing EtherCAT functions to IEC 62443-3-3 Security Level 2, giving OEMs a hardware-free path toward EU Cyber Resilience Act readiness.
coverImage: /media/2026/11/cover-etg-releases-ethercat-security-profile-etg-1800-cra-compliance.jpg
coverAlt: EtherCAT industrial Ethernet security profile illustration showing ETG.1800 compliance with IEC 62443 SL 2 without hardware redesign
coverCaption: ETG.1800 v1.0 gives machine builders a hardware-free blueprint for mapping deployed EtherCAT architectures to IEC 62443-3-3 SL 2.
---
The **EtherCAT Technology Group (ETG)** has published version 1.0 of the **ETG.1800 EtherCAT Security Profile** in November 2026, providing machine builders and device manufacturers with a formal specification for meeting **IEC 62443-3-3 Security Level 2 (SL 2)** requirements without modifying the underlying EtherCAT protocol or replacing field hardware.

The release follows UL Solutions' assessment and certification of EtherCAT technology in early 2026 and arrives roughly one year before the main cybersecurity requirements and CE marking obligations of the [EU Cyber Resilience Act (CRA)](/news/eu-cyber-resilience-act-reporting-obligations-apply) take effect on **December 11, 2027**.

## Why fieldbus cybersecurity is a hard problem under CRA

Under both [IEC 62443](/blog/iec-62443-explained) and the EU CRA, manufacturers of connected machinery and industrial components must perform a formal risk assessment and demonstrate proportionate technical protection. For conventional industrial Ethernet and fieldbus systems, meeting those expectations has typically forced an awkward trade-off:

- Either treat the entire machine network as a physically locked "secure zone" — difficult when servo drives, remote I/O and sensors are distributed across a large machine frame with accessible cabling — or
- Add cryptographic security extensions into new device hardware, which often introduces cyclic latency, heavier configuration workflows and forced hardware replacement across existing machine designs.

## Three blueprint threat scenarios in ETG.1800

Recognizing that threat levels vary by installation, ETG.1800 structures risk assessment around **three standardized blueprint scenarios** that OEMs and plant operators can use as templates for machine-specific risk evaluations:

![Three-tier EtherCAT security architecture diagram depicting Scenario 1 (protected machine perimeter with existing hardware achieving IEC 62443 SL 2 via 25 EtherCAT functions), Scenario 2 (segmented/external bus links), and Scenario 3 (untrusted shared infrastructure roadmap)](/media/2026/11/diagram-etg-releases-ethercat-security-profile-etg-1800-cra-compliance.png "Figure 1: Existing EtherCAT devices satisfy IEC 62443-3-3 SL 2 under Scenario 1 by pairing secured controller perimeters with EtherCAT's deterministic topology checks.")

| Blueprint Scenario | Assumed Environment & Threat Model | Target Security Level | Required Changes to Existing EtherCAT Devices |
|---|---|---|---|
| **Scenario 1 (Available now in v1.0)** | Non-public production hall; intentional attacker with simple means and generic skills | IEC 62443-3-3 **SL 2** | **None** — fulfilled by 25 existing EtherCAT functions (configuration adjustments where needed) |
| **Scenario 2 (In development)** | Elevated attacker capability with moderate resources and IACS-specific skills | IEC 62443-3-3 **SL 3** | Software extensions in **MainDevice** and configuration tool only; no SubDevice changes |
| **Scenario 3 (In development)** | High-assurance environments requiring data confidentiality in addition to integrity | **SL 3 + Confidentiality** | Software support for device authentication and encryption in MainDevice and SubDevices; no ESC silicon changes |

## How existing EtherCAT hardware achieves SL 2

Unlike industrial protocols that process frames through a general-purpose TCP/IP software stack on every node, EtherCAT processes frames on the fly in dedicated hardware (EtherCAT SubDevice Controllers, or ESCs) within a closed cyclic loop controlled by a single MainDevice. As discussed in our comparison of [PROFINET, EtherNet/IP and EtherCAT](/blog/profinet-vs-ethernet-ip-vs-ethercat), that hardware-driven architecture already minimizes the attack surface on field nodes.

In ETG.1800 v1.0, the specification documents **25 existing EtherCAT system functions** — already defined in core EtherCAT standards — that collectively address the applicable IEC 62443-3-3 system requirements for Blueprint Scenario 1. According to Dr. Guido Beckmann, Chair of the ETG Technical Committee, a large share of typical factory installations map cleanly onto Scenario 1 and can achieve conformity without hardware redesign, relying instead on documented configuration hardening and risk-assessment mapping.

## Roadmap for Scenario 2 and Scenario 3

For machines operating in higher-risk environments — such as critical infrastructure, exposed outdoor equipment or multi-tenant facilities — ETG confirmed a staged roadmap:

- **Scenario 2 (SL 3):** Software-based security extensions implemented in the EtherCAT MainDevice and engineering configuration tools, leaving installed SubDevices unchanged.
- **Scenario 3 (SL 3 plus confidentiality):** Protocol extensions adding explicit device authentication and payload encryption in MainDevice and SubDevice firmware, while preserving compatibility with existing EtherCAT SubDevice Controller hardware.

## Practical takeaways for OEMs and integrators

Machine builders preparing simultaneously for the **January 20, 2027** [EU Machinery Regulation (EU) 2023/1230](/news/eu-machinery-regulation-2023-1230-january-2027) (which mandates protection against corruption of safety-related control systems) and the **December 11, 2027** CRA deadline should take three immediate steps:

1. **Map each machine family to ETG.1800's blueprint scenarios** during your IEC 62443-3-2 risk assessment rather than assuming every internal motion bus requires full link encryption.
2. **Audit MainDevice configuration settings** — unused Ethernet ports, diagnostic interfaces, mailbox routing and remote engineering paths on the PLC or IPC remain the primary entry points into an EtherCAT segment.
3. **Document the security boundary explicitly** in machine technical files so notified bodies and end-user security teams can trace how fieldbus controls satisfy both Machinery Regulation and CRA obligations.

=== takeaways
The EtherCAT Technology Group (ETG) published ETG.1800 EtherCAT Security Profile v1.0 in November 2026 following UL Solutions certification of EtherCAT technology earlier in 2026.
ETG.1800 defines three blueprint risk scenarios covering IEC 62443-3-3 Security Level 2, Security Level 3, and Security Level 3 with data confidentiality.
For typical factory installations (Blueprint Scenario 1), 25 existing EtherCAT system functions fulfil applicable IEC 62443-3-3 SL 2 requirements without protocol or hardware changes.
Staged ETG extensions for SL 3 and encrypted communications are in development to run in software without requiring new EtherCAT SubDevice Controller silicon.
The profile gives machine builders a documented compliance building block roughly one year before full EU Cyber Resilience Act requirements apply on December 11, 2027.

=== faqs
Q: What is the ETG.1800 EtherCAT Security Profile?
A: ETG.1800 is a specification released by the EtherCAT Technology Group in November 2026 that maps EtherCAT system capabilities to IEC 62443-3-3 cybersecurity requirements across three threat scenarios, helping OEMs and plant operators prepare for EU Cyber Resilience Act compliance.

Q: Do existing EtherCAT devices need new hardware to meet IEC 62443 SL 2 under ETG.1800?
A: No. For Blueprint Scenario 1 (typical non-public factory environments requiring SL 2), ETG.1800 uses 25 existing EtherCAT system functions already built into the standard, requiring only appropriate risk assessment and configuration settings rather than hardware replacement.

Q: How does ETG plan to support IEC 62443 SL 3 and encryption on EtherCAT?
A: ETG is developing staged software extensions: Scenario 2 (SL 3) adds software functions to the MainDevice and configuration tool with no SubDevice changes, while Scenario 3 adds firmware-based device authentication and data encryption to both MainDevice and SubDevices without changing SubDevice Controller hardware.

=== sources
EtherCAT Technology Group — ETG releases EtherCAT Security Profile as foundation for CRA compliance (Nov 2026) | https://www.ethercat.org/en/press/etg_722719C125CB4F4094BFCB403086AF63.htm
Regulation (EU) 2024/2847 (EU Cyber Resilience Act), Official Journal of the European Union | https://eur-lex.europa.eu/eli/reg/2024/2847/oj
ISA/IEC 62443 Series of Standards | https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards
