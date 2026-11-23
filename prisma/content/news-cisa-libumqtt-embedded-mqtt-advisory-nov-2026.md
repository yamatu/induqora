---
title: CISA Flags Unpatched Integer Underflow in Embedded MQTT Library libumqtt (CVE-2026-125132)
slug: cisa-libumqtt-embedded-mqtt-integer-underflow-cve-2026-125132
type: NEWS
category: iiot-edge
author: edword
tags: MQTT, IIoT, Edge computing, OT security, CISA advisories, Cyber Resilience Act
publishedAt: 2026-11-23T05:30:00Z
excerpt: CISA advisory ICSA-26-323-03 highlights CVE-2026-125132, an unpatched integer underflow in the lightweight C library libumqtt (<=1.1.1) used in embedded Linux gateways and IIoT devices — underscoring why SBOM tracking and broker isolation matter.
seoTitle: CISA Warns of Unpatched libumqtt Flaw (CVE-2026-125132)
seoDescription: CISA ICSA-26-323-03 discloses an unpatched integer underflow (CVE-2026-125132) in libumqtt <=1.1.1 affecting embedded IIoT gateways, plus SBOM mitigations.
---
On **November 19, 2026**, CISA published ICS Advisory **ICSA-26-323-03** covering **CVE-2026-125132**, a remotely exploitable **integer underflow (CWE-191)** in **libumqtt** versions **1.1.1 and earlier** — a lightweight, OpenWrt-oriented C MQTT client library embedded in Linux-based cellular routers, telemetry nodes and compact IIoT edge gateways.

Because CISA noted that the upstream repository maintainers **did not respond to coordination requests**, there is currently **no official upstream patch**, leaving OEMs and plant operators to assess exposure via software inventories and apply network-level mitigations.

## Vulnerability details at a glance

| Attribute | Details (per CISA ICSA-26-323-03) |
|---|---|
| **CISA Advisory** | ICSA-26-323-03 (published November 19, 2026) |
| **CVE Identifier** | CVE-2026-125132 |
| **Weakness Class** | CWE-191 — Integer Underflow (Wrap or Wraparound) |
| **Affected Software** | `libumqtt` versions **<= 1.1.1** |
| **CVSS v3.1 Vector** | `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:H` (Network-exploitable, low complexity, no authentication, high availability impact) |
| **Patch Status** | **No upstream fix available** (maintainer unresponsive during CISA disclosure) |
| **Impacted Sectors** | Critical Manufacturing, Energy, Transportation Systems, Water and Wastewater, IT |

Successful exploitation of the integer underflow allows a remote attacker able to send crafted MQTT packets to trigger **denial of service (crash/hang), memory corruption or information disclosure** on the embedded client device. On resource-constrained OpenWrt or Yocto Linux field gateways running without full memory-safety mitigations, malformed broker responses or spoofed network traffic can knock telemetry gateways offline or corrupt in-memory state.

## Why small C libraries are a growing supply-chain risk for IIoT

As factories deploy [Unified Namespace (UNS)](/blog/unified-namespace-uns-architecture-practical-guide) architectures and connect thousands of field assets through [industrial edge gateways](/blog/industrial-edge-gateways-selection-deployment-guide), MQTT has become the default transport between the shop floor and enterprise analytics. While flagship brokers and major client SDKs maintain active security teams, compact C libraries pulled into embedded Linux images years ago frequently go unmaintained.

This exact scenario is a major focus of the **EU Cyber Resilience Act (CRA)**:

- Manufacturers shipping gateways, routers or smart sensors into the EU must maintain accurate **Software Bills of Materials (SBOMs)** so they can answer within hours whether a third-party library like `libumqtt` is compiled into any shipping firmware.
- Under the CRA's [reporting obligations active since September 11, 2026](/news/eu-cyber-resilience-act-reporting-obligations-apply) — and full lifecycle-maintenance duties starting December 11, 2027 — relying on an unresponsive open-source maintainer does not excuse a hardware vendor from patching or replacing vulnerable components in its own firmware.

## Practical actions for OEMs and plant OT teams

1. **Check firmware SBOMs and OpenWrt/Yocto manifests.** OEMs building Linux gateways should search build recipes and root filesystems for `libumqtt` (<=1.1.1). If present, evaluate patching the packet-length parsing bounds internally or migrating to an actively maintained MQTT client library (such as Eclipse Paho C or Mosquitto's `libmosquitto`) with active security stewardship.
2. **Enforce TLS with server certificate validation.** Because `libumqtt` is an MQTT *client* library, enforcing TLS and strictly validating the broker's certificate prevents an on-path attacker on an untrusted WAN or plant subnet from injecting spoofed MQTT packets into the client.
3. **Never connect field gateways directly to untrusted brokers or public networks.** Route outbound MQTT traffic over an encrypted VPN tunnel or dedicated industrial DMZ to an authenticated internal broker, as outlined in our comparison of [OPC UA vs MQTT](/blog/opc-ua-vs-mqtt).
4. **Monitor edge-gateway disconnects.** Configure broker Last Will and Testament (LWT) alerts or Sparkplug `NDEATH` notifications so repeated gateway crashes or unexpected reconnect loops surface immediately in OT monitoring rather than silently blinding production dashboards.

=== takeaways
CISA advisory ICSA-26-323-03 (November 19, 2026) discloses CVE-2026-125132, a remotely exploitable integer underflow (CWE-191) in embedded MQTT C library libumqtt versions 1.1.1 and earlier.
Exploitation can cause denial of service, memory corruption or information disclosure with low attack complexity and no authentication required.
No upstream patch is currently available because the open-source maintainer did not respond to CISA's coordination efforts.
Gateway OEMs should audit firmware SBOMs for libumqtt and migrate to actively maintained MQTT client libraries, while plant operators should enforce TLS broker verification and isolate IIoT gateways behind firewalls and VPNs.

=== faqs
Q: What is CVE-2026-125132 in libumqtt?
A: CVE-2026-125132 is an integer underflow vulnerability (CWE-191) in libumqtt versions 1.1.1 and earlier that allows a remote, unauthenticated attacker to cause denial of service, memory corruption or information disclosure on embedded devices using the library.

Q: Is there an official patch for libumqtt CVE-2026-125132?
A: As of CISA's November 19, 2026 advisory, no official upstream patch is available because the repository owners did not respond to CISA's disclosure outreach. Device manufacturers must either patch the library in-house or migrate to a maintained MQTT client library.

Q: How can plant operators reduce risk if an embedded edge gateway uses a vulnerable MQTT client?
A: Isolate the gateway on a segmented OT/IIoT VLAN, restrict outbound connections solely to a trusted internal MQTT broker over TLS with certificate verification (or inside a VPN), and alert on unexpected gateway crashes or reconnect cycles.

=== sources
CISA ICS Advisory ICSA-26-323-03 — libumqtt (Nov 19, 2026) | https://www.cisa.gov/news-events/ics-advisories/icsa-26-323-03
MITRE CWE-191 — Integer Underflow (Wrap or Wraparound) | https://cwe.mitre.org/data/definitions/191.html
OASIS MQTT Version 5.0 Standard | https://mqtt.org/
Regulation (EU) 2024/2847 (EU Cyber Resilience Act) | https://eur-lex.europa.eu/eli/reg/2024/2847/oj
