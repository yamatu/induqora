---
title: IEC 62443 Explained: A Practical Guide to Industrial Cybersecurity Standards
slug: iec-62443-explained
type: BLOG
category: ot-cybersecurity
author: edward
tags: IEC 62443, OT security, ICS security, Zones and Conduits
publishedAt: 2026-09-23T09:00:00Z
excerpt: IEC 62443 is the leading international standard series for securing industrial automation and control systems. This guide explains how the series is organized, what security levels and foundational requirements mean, and how asset owners, integrators and product suppliers each apply it.
seoTitle: IEC 62443 Explained: Industrial Cybersecurity Guide
seoDescription: Understand the IEC 62443 series: its structure, roles, zones and conduits, the seven foundational requirements, security levels SL 1–4 and how to get started.
coverImage: /media/2026/11/cover-iec-62443-explained.jpg
coverAlt: Layered industrial cybersecurity shield graphic representing IEC 62443 zones, conduits, and security levels
coverCaption: IEC 62443 divides industrial cybersecurity responsibility across asset owners, system integrators, and product manufacturers.
---
**IEC 62443** is a series of international standards for the cybersecurity of industrial automation and control systems (IACS). Developed by the ISA99 committee and published jointly by ISA and the IEC, it is the reference framework for OT security in manufacturing, process industries, energy, water and building automation. It is increasingly referenced by regulation and procurement requirements.

Unlike IT-centric frameworks, IEC 62443 is built around the realities of operational technology: availability and safety come first, equipment lifetimes are measured in decades, and responsibility is split between the companies that make products, the companies that integrate them, and the companies that operate them.

## How the series is organized

The standard is divided into four groups:

| Group | Focus | Key documents |
|---|---|---|
| **1 — General** | Concepts, terminology, models, metrics | 62443-1-1 (concepts and models) |
| **2 — Policies and procedures** | Security programs for asset owners and service providers, patch management | 62443-2-1 (asset owner security program), 62443-2-4 (requirements for service providers / integrators) |
| **3 — System** | Requirements for the integrated control system | 62443-3-2 (risk assessment, zones and conduits), 62443-3-3 (system security requirements and security levels) |
| **4 — Component** | Requirements for products | 62443-4-1 (secure product development lifecycle), 62443-4-2 (technical security requirements for components) |

## Three roles, shared responsibility

A key idea of IEC 62443 is that no single party can secure an industrial system alone:

- **Asset owners** (plant operators) are responsible for their overall security program, risk assessment and operation — mainly parts 2-1 and 3-2.
- **System integrators and service providers** design, deploy and maintain systems that meet the required security level — mainly parts 2-4 and 3-3.
- **Product suppliers** develop components (PLCs, HMIs, switches, software) using a secure development lifecycle and with the required security capabilities — parts 4-1 and 4-2.

## Zones and conduits

The architectural heart of IEC 62443 is segmentation into **zones** and **conduits**:

- A **zone** is a group of assets that share the same security requirements — for example, a safety instrumented system, a production cell or the SCADA servers.
- A **conduit** is the communication path between zones, where traffic is controlled and monitored, for example by firewalls or data diodes.

Part 3-2 describes how to partition a system, assess the risk of each zone, and assign a **target security level**. This replaces the flat "one big network" that still exists in many plants with a defensible architecture where an incident in one zone does not automatically spread to others.

## Security levels (SL 1–4)

Security levels describe the type of threat a zone, system or component must withstand:

![Structured diagram of the four IEC 62443 series groups (General, Asset Owner 2-x, System Integrator 3-x, Product Supplier 4-x) paired with Security Levels SL 1 through SL 4 threat profiles](/media/2026/11/diagram-iec-62443-explained.png "Figure 1: Achieving plant resilience requires aligning component security (4-2), system architecture (3-3), and operational governance (2-1) to target Security Levels.")

| Level | Protection against |
|---|---|
| **SL 1** | Casual or coincidental violation |
| **SL 2** | Intentional violation using simple means, low resources, generic skills and low motivation |
| **SL 3** | Intentional violation using sophisticated means, moderate resources, IACS-specific skills and moderate motivation |
| **SL 4** | Intentional violation using sophisticated means, extended resources, IACS-specific skills and high motivation |

The standard distinguishes between the **target** security level (what risk assessment says a zone needs), the **capability** security level (what components and systems can deliver) and the **achieved** security level (what is actually in place).

## The seven foundational requirements

All system and component requirements in parts 3-3 and 4-2 are grouped under seven **foundational requirements (FRs)**:

1. **FR 1 — Identification and authentication control:** identify and authenticate all users, software processes and devices.
2. **FR 2 — Use control:** enforce assigned privileges once a user is authenticated.
3. **FR 3 — System integrity:** protect against unauthorized manipulation of data and software.
4. **FR 4 — Data confidentiality:** protect information from unauthorized disclosure.
5. **FR 5 — Restricted data flow:** segment the system and restrict unnecessary data flow via zones and conduits.
6. **FR 6 — Timely response to events:** detect and respond to security violations, including logging and monitoring.
7. **FR 7 — Resource availability:** ensure the system remains available, including against denial-of-service conditions.

## Certification

Products, development processes and systems can be certified against IEC 62443 by accredited bodies. The **ISASecure** program, for example, offers certification for development lifecycles (62443-4-1), components (62443-4-2) and systems (62443-3-3). For buyers, requiring certified components is a practical way to raise the baseline of a new project.

## Where to start: a pragmatic roadmap for asset owners

1. **Build an asset inventory.** You cannot protect what you do not know exists. Include firmware versions and network connections.
2. **Map data flows and define zones and conduits.** Start coarse — enterprise, DMZ, supervisory, control, safety — and refine.
3. **Run a risk assessment per zone** following 62443-3-2 and set target security levels.
4. **Close the biggest gaps first:** remote access, flat networks, shared accounts and unmanaged removable media are common high-risk issues.
5. **Put requirements into contracts.** Reference 62443-2-4 for integrators and 62443-4-1/4-2 for product suppliers.
6. **Establish a security program** according to 62443-2-1 so improvements are sustained, measured and reviewed.

=== takeaways
IEC 62443 is the international standard series for cybersecurity of industrial automation and control systems, developed by ISA99 and published by ISA and the IEC.
The series has four groups: general concepts (1-x), policies and procedures (2-x), system requirements (3-x) and component requirements (4-x).
IEC 62443 assigns responsibilities to three roles: asset owners, system integrators/service providers, and product suppliers.
Systems are segmented into zones with common security requirements, connected through controlled communication paths called conduits.
Security levels SL 1 to SL 4 describe increasing attacker capability, and requirements are grouped into seven foundational requirements.

=== faqs
Q: What is IEC 62443?
A: IEC 62443 is a series of international standards that define requirements and processes for securing industrial automation and control systems. It covers security programs for operators, requirements for integrators, system-level security requirements and secure development and technical requirements for products.

Q: What is the difference between IEC 62443-3-3 and 62443-4-2?
A: IEC 62443-3-3 defines security requirements for an integrated control system, while IEC 62443-4-2 defines technical security requirements for the individual components in it, such as controllers, HMIs, network devices and software applications.

Q: What are zones and conduits in IEC 62443?
A: A zone is a logical or physical group of assets that share the same security requirements. A conduit is a communication channel between zones whose traffic is controlled and monitored. Segmenting a system into zones and conduits limits how far an attack can spread.

Q: Is IEC 62443 mandatory?
A: IEC 62443 is a voluntary standard, but it is widely required by customers in procurement contracts and is referenced by regulators and sector guidelines. It is also commonly used to demonstrate compliance with broader cybersecurity regulations.

=== sources
ISA/IEC 62443 Series of Standards — International Society of Automation | https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards
ISASecure certification programs | https://isasecure.org/
NIST SP 800-82 Rev. 3: Guide to Operational Technology (OT) Security | https://csrc.nist.gov/pubs/sp/800/82/r3/final
