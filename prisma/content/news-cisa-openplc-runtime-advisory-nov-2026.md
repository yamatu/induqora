---
title: CISA Warns of Unauthenticated Admin Account Creation Flaw in OpenPLC Runtime (CVE-2026-126088)
slug: cisa-openplc-runtime-race-condition-cve-2026-126088
type: NEWS
category: plc-controllers
author: edword
tags: IEC 61131-3, OT security, ICS security, CISA advisories, Vulnerability management
publishedAt: 2026-11-22T20:00:00Z
excerpt: CISA issued ICS Advisory ICSA-26-323-01 on November 19, 2026 warning of a race condition (CVE-2026-126088) in Autonomy Logic OpenPLC Runtime versions 4.2.4 and earlier that lets unauthenticated remote attackers create admin accounts. Version 4.3.0 fixes the flaw.
seoTitle: CISA OpenPLC Runtime Flaw CVE-2026-126088: Patch to 4.3.0
seoDescription: CISA ICSA-26-323-01 warns of CVE-2026-126088 in OpenPLC Runtime <=4.2.4 allowing unauthenticated admin creation. Upgrade to 4.3.0 and harden soft-PLC access.
---
On **November 19, 2026**, the U.S. Cybersecurity and Infrastructure Security Agency (**CISA**) published ICS Advisory **ICSA-26-323-01**, warning operators of a high-severity race condition in **Autonomy Logic OpenPLC Runtime** (**CVE-2026-126088**) that could allow remote, unauthenticated attackers to create administrative accounts on vulnerable soft-PLC deployments.

OpenPLC is one of the most widely adopted open-source [IEC 61131-3](/blog/iec-61131-3-programming-languages-explained) PLC runtimes, used across industrial testbeds, Linux-based edge controllers, Raspberry Pi and embedded gateways, as well as light manufacturing, energy, transportation and water-sector monitoring pilots.

## Technical summary of CVE-2026-126088

| Field | Details (per CISA ICSA-26-323-01) |
|---|---|
| **CISA Advisory** | ICSA-26-323-01 (published November 19, 2026) |
| **CVE Identifier** | CVE-2026-126088 |
| **Weakness Class** | CWE-362 — Concurrent Execution using Shared Resource with Improper Synchronization (Race Condition) |
| **Affected Versions** | Autonomy Logic OpenPLC Runtime **4.2.4 and earlier** |
| **Fixed Version** | **OpenPLC Runtime 4.3.0** or later |
| **CVSS v3.1 Vector** | `AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H` (High confidentiality, integrity and availability impact; no privileges or user interaction required) |
| **Affected Sectors** | Critical Manufacturing, Energy, Transportation Systems, Water and Wastewater Systems |

According to CISA's advisory — reported by security researcher Noureddin Lutfi — OpenPLC Runtime versions **4.2.4 and prior** contain an improper synchronization flaw during administrative user initialization. When multiple concurrent HTTP requests reach the account-creation check before the first administrative user is committed to storage, **multiple concurrent requests pass the existence check**, enabling the creation of **several unauthenticated admin accounts**.

Because administrative access to a soft-PLC runtime typically grants full control over uploading compiled IEC 61131-3 logic, starting and stopping the controller scan cycle, modifying I/O mappings and changing protocol listeners (such as Modbus TCP or DNP3), unauthorized admin creation equates to full controller compromise.

## Why soft-PLCs require the same hardening as hardware PLCs

Linux-based soft-PLCs and containerized IEC 61131-3 runtimes have become popular on industrial edge PCs because they cut hardware cost and integrate easily with Python, MQTT and OPC UA services. However, they also inherit web-application failure modes — such as HTTP API concurrency bugs, exposed management dashboards and weak TLS termination — that traditional closed-firmware hardware PLCs historically did not expose on port 8080.

As the [EU Cyber Resilience Act (CRA)](/news/eu-cyber-resilience-act-reporting-obligations-apply) moves toward full product-security enforcement in December 2027, both commercial OEMs embedding open-source runtimes and plant teams deploying Linux controllers must treat soft-PLC management planes as **high-value Level 1/2 OT interfaces**, not harmless developer utilities.

## Immediate remediation steps

1. **Upgrade immediately to OpenPLC Runtime 4.3.0 or later** on every production, lab and pilot node.
2. **Audit existing administrative accounts** on any host that previously ran version 4.2.4 or earlier — particularly if the management web interface was ever reachable on a shared plant or corporate VLAN — and rotate credentials.
3. **Restrict management interface reachability.** Bind the OpenPLC web interface to a dedicated management VLAN or localhost (accessed only via an SSH tunnel or MFA-authenticated VPN), never to the public internet or untrusted corporate networks.
4. **Place soft-PLCs inside segmented OT zones.** Apply [IEC 62443 zones and conduits](/blog/iec-62443-explained) and firewall allow-lists so only authorized engineering workstations can reach management ports, while fieldbus traffic stays isolated from administrative HTTP endpoints.
5. **Track open-source runtimes in your OT asset inventory.** Soft-PLCs running on industrial PCs or single-board computers are frequently missed by traditional PLC discovery tools; include them in your regular vulnerability-tracking workflow alongside Siemens, Rockwell and Schneider controllers.

=== takeaways
CISA advisory ICSA-26-323-01 (November 19, 2026) warns of CVE-2026-126088, a CWE-362 race condition in Autonomy Logic OpenPLC Runtime versions 4.2.4 and earlier.
Exploiting the race condition allows multiple concurrent unauthenticated requests to pass the user-existence check and create unauthorized admin accounts on the soft-PLC runtime.
Autonomy Logic fixed the vulnerability in OpenPLC Runtime version 4.3.0; operators should upgrade immediately and audit existing accounts on previously exposed instances.
Soft-PLC web management interfaces grant full control over PLC logic and I/O and must be isolated inside segmented OT zones, never exposed directly to corporate networks or the internet.

=== faqs
Q: What is CVE-2026-126088 in OpenPLC Runtime?
A: CVE-2026-126088 is a race condition (CWE-362) in Autonomy Logic OpenPLC Runtime versions 4.2.4 and earlier that lets multiple concurrent unauthenticated requests bypass the account-existence check before a user is committed, allowing unauthorized admin accounts to be created.

Q: Which OpenPLC Runtime version fixes CVE-2026-126088?
A: Autonomy Logic resolved CVE-2026-126088 in OpenPLC Runtime version 4.3.0. CISA advises users to upgrade to version 4.3.0 or later.

Q: How should engineers secure Linux-based soft-PLC runtimes like OpenPLC?
A: Keep the runtime patched, restrict its web management port to an isolated management VLAN or localhost behind an MFA-protected VPN, audit admin users after upgrades, and segment fieldbus traffic from IT networks following IEC 62443 zones and conduits.

=== sources
CISA ICS Advisory ICSA-26-323-01 — Autonomy Logic OpenPLC Runtime (Nov 19, 2026) | https://www.cisa.gov/news-events/ics-advisories/icsa-26-323-01
MITRE CWE-362 — Concurrent Execution using Shared Resource with Improper Synchronization | https://cwe.mitre.org/data/definitions/362.html
NIST SP 800-82 Rev. 3: Guide to Operational Technology (OT) Security | https://csrc.nist.gov/pubs/sp/800/82/r3/final
