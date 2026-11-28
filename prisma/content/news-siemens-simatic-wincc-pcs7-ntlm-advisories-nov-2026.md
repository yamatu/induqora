---
title: CISA and Siemens Issue November 2026 Advisories for SIMATIC WinCC, PCS 7 and Process Historian
slug: cisa-siemens-simatic-wincc-pcs7-ntlm-advisories-nov-2026
type: NEWS
category: scada-hmi
author: edward
tags: SCADA, HMI, DCS, OT security, CISA advisories, Vulnerability management, Siemens SIMATIC
publishedAt: 2026-11-21T16:00:00Z
excerpt: On November 17, 2026, CISA published multiple ICS advisories for Siemens SCADA and DCS software, highlighting an NTLM authentication relay flaw (CVE-2026-58114) across WinCC, PCS 7 and Process Historian plus a WinCC Graphics Designer code execution issue (CVE-2026-59082).
seoTitle: CISA & Siemens WinCC / PCS 7 Advisories (Nov 2026)
seoDescription: CISA Nov 17, 2026 advisories ICSA-26-321-08 and ICSA-26-321-09 cover NTLM relay and active-content flaws in Siemens SIMATIC WinCC, PCS 7 and Process Historian.
coverImage: /media/2026/11/cover-cisa-siemens-simatic-wincc-pcs7-ntlm-advisories-nov-2026.jpg
coverAlt: SCADA security advisory graphic covering November 2026 CISA and Siemens SIMATIC WinCC and PCS 7 NTLM advisories
coverCaption: Pending vendor patches for several WinCC and PCS 7 branches, enforcing SMB signing and blocking outbound NTLM mitigates credential relay.
---
On **November 17, 2026**, the U.S. Cybersecurity and Infrastructure Security Agency (**CISA**) published a cluster of industrial control system (ICS) advisories covering **Siemens SIMATIC** supervisory and process control software, including **SIMATIC WinCC**, **SIMATIC PCS 7**, **SIMATIC BATCH**, **SIMATIC Process Historian** and **SIMATIC Information Server**.

Two advisories deserve immediate attention from SCADA, HMI and DCS administrators because **vendor patches are not yet available for several widely deployed versions**, making configuration hardening and network controls essential right now.

## Advisory breakdown: what is affected

| CISA Advisory | CVE ID | Affected Products | Vulnerability Type | Fix Status (as of Nov 17, 2026) |
|---|---|---|---|---|
| **ICSA-26-321-08** | **CVE-2026-58114** | SIMATIC WinCC V7.5 / V8.0 / V8.1; WinCC Runtime Professional V17–V21; SIMATIC PCS 7 V9.1; SIMATIC BATCH V9.1; Process Historian 2020 & 2022; Information Server 2020 & 2022 | NTLM relay authentication bypass (machine-in-the-middle session takeover) | Fixes in preparation for supported lines; **no fix planned** for legacy releases — manual SQL encryption recommended |
| **ICSA-26-321-09** | **CVE-2026-59082** | SIMATIC WinCC V7.5, V8.0 and V8.1 (Graphics Designer prior to V8.2) | Implicit active content execution on opening project/graphics files (arbitrary code execution) | Fixes in preparation; restrict file handling to trusted sources and qualified staff |

![SCADA security diagram illustrating CVE-2026-58114 NTLM relay and CVE-2026-59082 Graphics Designer risks across SIMATIC WinCC, PCS 7, and Process Historian with four interim network and Windows hardening controls](/media/2026/11/diagram-cisa-siemens-simatic-wincc-pcs7-ntlm-advisories-nov-2026.png "Figure 1: Blocking outbound SMB/NTLM and restricting untrusted Graphics Designer files substantially reduces exposure while awaiting version-specific Siemens patches.")

### 1. NTLM authentication relay across WinCC, PCS 7 and historians (ICSA-26-321-08)

According to CISA advisory **ICSA-26-321-08**, affected SIMATIC SCADA and DCS products fail to adequately protect remote user authentication using the deprecated **NTLM** protocol (**CVE-2026-58114**). An unauthenticated remote attacker who achieves an on-path (machine-in-the-middle) position on the plant network can relay NTLM credentials to impersonate a legitimate user and execute arbitrary code or commands with that user's privileges — particularly against backend services such as the **Microsoft SQL Server** database used by WinCC.

Because SCADA servers, engineering stations and Process Historians sit at the supervisory layer across many critical manufacturing and process sites, an attacker who compromises a single poorly segmented workstation on the same Layer 2/3 subnet could leverage NTLM relay to reach the database tier.

### 2. WinCC Graphics Designer active content execution (ICSA-26-321-09)

In a companion advisory (**ICSA-26-321-09**), CISA warned that **Graphics Designer in SIMATIC WinCC V7.5, V8.0 and V8.1** (versions before V8.2) implicitly executes active content when opening files (**CVE-2026-59082**). If an engineer opens a tampered graphics or project file supplied via email, removable media or an untrusted contractor handoff, the flaw can result in arbitrary code execution on the engineering workstation.

## Practical mitigations while patches are pending

Because several affected product versions currently have no patch available — and older releases such as PCS 7 V9.1 or WinCC V7.5 often cannot be upgraded mid-campaign on continuous process units — asset owners should prioritize compensating controls:

1. **Encrypt WinCC SQL Server connections.** Follow Siemens' documented procedure (Support ID `109818202`) to manually enforce TLS encryption on the SQL Server database communications used by WinCC, PCS 7 and Process Historian, eliminating cleartext or downgradeable authentication paths.
2. **Restrict NTLM and harden the supervisory VLAN.** Where architecture permits, move Windows-domain supervisory nodes toward Kerberos authentication, enable SMB signing and Extended Protection for Authentication (EPA), and apply Layer 2 switch port security (DHCP snooping, Dynamic ARP Inspection) to prevent on-path positioning.
3. **Enforce strict zone boundaries.** Isolate SCADA servers, historians and engineering stations from corporate IT networks using [IEC 62443 zones and conduits](/blog/iec-62443-explained) and a dedicated industrial DMZ — see [Purdue Model vs Zero Trust OT segmentation](/blog/purdue-model-vs-zero-trust-ot-network-segmentation).
4. **Lock down engineering station file workflows.** Never open third-party WinCC `.pdl` or project archive files directly on production engineering stations. Validate contractor deliverables in an isolated staging VM first, and restrict engineering workstations to named, qualified personnel.
5. **Track lifecycle exposure.** Sites still running WinCC V7.5 or PCS 7 V9.1 — where vendors increasingly decline to backport fixes for legacy protocol weaknesses — should factor cybersecurity end-of-support into their next turnaround upgrade plan alongside [SCADA vs DCS architecture decisions](/blog/scada-vs-dcs-differences).

Induqora's reporting on these advisories is based exclusively on published CISA and Siemens guidance; plant teams should verify specific product build numbers and mitigation compatibility in a test environment before applying database encryption changes on live process systems.

=== takeaways
On November 17, 2026, CISA issued ICS advisories ICSA-26-321-08 (CVE-2026-58114) and ICSA-26-321-09 (CVE-2026-59082) covering Siemens SIMATIC WinCC, PCS 7, BATCH, Process Historian and Information Server.
CVE-2026-58114 is an NTLM relay authentication bypass that lets an on-path attacker impersonate a legitimate user against accessible services such as WinCC's SQL Server database.
CVE-2026-59082 affects Graphics Designer in SIMATIC WinCC V7.5, V8.0 and V8.1, allowing arbitrary code execution via implicit active content execution when opening untrusted files.
Because fixes are not yet available for several versions — and not planned for certain legacy lines — Siemens recommends manually enabling encrypted SQL Server communication, restricting file handling to trusted sources and tightening OT network segmentation.

=== faqs
Q: Which Siemens products are affected by CVE-2026-58114 in CISA advisory ICSA-26-321-08?
A: Affected software includes SIMATIC WinCC V7.5, V8.0 and V8.1, SIMATIC WinCC Runtime Professional V17 through V21, SIMATIC PCS 7 V9.1, SIMATIC BATCH V9.1, SIMATIC Process Historian 2020 and 2022, and SIMATIC Information Server 2020 and 2022.

Q: How can plant engineers mitigate CVE-2026-58114 before a vendor patch is installed?
A: Siemens recommends manually configuring the SQL Server database used by WinCC for encrypted communications, while CISA recommends isolating supervisory networks behind firewalls, preventing on-path network access on the OT VLAN and auditing remote access via VPNs.

Q: What is the risk of CVE-2026-59082 in SIMATIC WinCC Graphics Designer?
A: In SIMATIC WinCC V7.5, V8.0 and V8.1 (versions prior to V8.2), Graphics Designer implicitly executes active content when opening files, which can allow arbitrary code execution if an operator or engineer opens a maliciously crafted file.

=== sources
CISA ICS Advisory ICSA-26-321-08 — Siemens SIMATIC (Nov 17, 2026) | https://www.cisa.gov/news-events/ics-advisories/icsa-26-321-08
CISA ICS Advisory ICSA-26-321-09 — Siemens SIMATIC WinCC (Nov 17, 2026) | https://www.cisa.gov/news-events/ics-advisories/icsa-26-321-09
Siemens ProductCERT and Industrial Security Advisories | https://www.siemens.com/global/en/products/services/cert.html
