---
title: OPC UA vs MQTT: How to Choose the Right Protocol for Industrial Data
slug: opc-ua-vs-mqtt
type: BLOG
category: industrial-networking
author: edward
tags: OPC UA, MQTT, Sparkplug, IIoT, Unified Namespace
publishedAt: 2026-10-07T09:00:00Z
featured: true
excerpt: OPC UA and MQTT are often presented as rivals, but they solve different problems. OPC UA models and secures machine data; MQTT moves messages efficiently to many consumers. This guide compares them on architecture, data modeling, security and performance — and explains when to use both.
seoTitle: OPC UA vs MQTT: Differences and When to Use Each
seoDescription: OPC UA vs MQTT compared on architecture, information modeling, security and scalability, plus how Sparkplug B and OPC UA PubSub over MQTT combine them.
coverImage: /media/2026/11/cover-opc-ua-vs-mqtt.jpg
coverAlt: Architectural graphic showing OPC UA machine-level semantic modeling paired with MQTT Sparkplug B broker distribution
coverCaption: Most modern plants combine both: OPC UA for structured machine interfaces on the floor and MQTT Sparkplug B for scalable enterprise distribution.
---
If you are connecting machines to SCADA, MES, a data platform or the cloud, two protocols dominate the conversation: **OPC UA** and **MQTT**. They are frequently framed as an either/or decision. In practice, they answer different questions:

- **OPC UA** answers *"What does this data mean, and how do I access it securely?"* It is a complete framework for describing industrial equipment and exchanging data with it.
- **MQTT** answers *"How do I get messages from many producers to many consumers efficiently?"* It is a lightweight transport that deliberately says nothing about what the messages contain.

Understanding that distinction makes most architecture decisions straightforward.

## What is OPC UA?

OPC Unified Architecture (OPC UA) is a platform-independent industrial interoperability framework maintained by the OPC Foundation and published internationally as **IEC 62541**. It succeeded "OPC Classic", which depended on Microsoft COM/DCOM.

Key characteristics:

- **Information modeling.** OPC UA servers expose an *address space* of nodes — objects, variables, methods and types — with relationships between them. Data arrives with its engineering units, ranges, data types and context.
- **Companion specifications.** Industry groups publish standard information models for specific equipment, such as machine tools, robotics, packaging machines and process instruments. A client can understand any compliant device without custom mapping.
- **Two communication patterns.** The classic *client/server* model (browse, read, write, subscribe, call methods) and a *PubSub* model (OPC UA Part 14) that can run over UDP or over message brokers including MQTT.
- **Built-in security.** Application authentication with X.509 certificates, message signing and encryption, and user authentication and authorization are part of the specification.

## What is MQTT?

MQTT is a lightweight publish/subscribe messaging protocol standardized by OASIS. Version 3.1.1 is also published as ISO/IEC 20922, and **MQTT 5.0** (2019) added features such as reason codes, message expiry, shared subscriptions and user properties.

Key characteristics:

- **Broker-based publish/subscribe.** Clients publish messages to *topics* on a central broker; other clients subscribe to topics. Producers and consumers never talk to each other directly.
- **Report by exception.** Devices publish only when data changes, which drastically reduces bandwidth compared with polling.
- **Outbound connections.** Edge devices connect *out* to the broker, which works well through firewalls and NAT — a significant advantage for remote assets.
- **Quality of Service levels.** QoS 0 (at most once), QoS 1 (at least once) and QoS 2 (exactly once).
- **Payload-agnostic.** MQTT carries bytes. Topic structure, payload format and semantics are entirely up to you.

That last point is MQTT's greatest strength and its biggest weakness in industrial settings: without conventions, every integration invents its own topic tree and JSON format.

## Sparkplug: adding industrial semantics to MQTT

If you are implementing an OPC UA subscriber rather than choosing a protocol, the sampling-versus-publishing arithmetic is covered in [Rust OPC UA clients](/blog/rust-opc-ua-client-subscription-recovery-guide).

**Sparkplug**, an Eclipse Foundation specification, fills that gap. It defines a topic namespace, a compact Protocol Buffers payload, and *state management* using birth and death certificates so that subscribers always know whether an edge node and its data are online and current. Sparkplug 3.0 has also been published as ISO/IEC 20237.

Sparkplug is popular in architectures built around a **Unified Namespace (UNS)** — a central broker where every system publishes its current state in a consistent hierarchy, typically modeled on ISA-95 levels (enterprise / site / area / line / cell).

## Side-by-side comparison

| Criterion | OPC UA (client/server) | MQTT (+ Sparkplug) |
|---|---|---|
| Primary purpose | Interoperability and information modeling | Efficient message distribution |
| Communication model | Client/server; PubSub also available | Publish/subscribe via broker |
| Data semantics | Rich, standardized (companion specs) | None in MQTT; basic in Sparkplug |
| Connection direction | Client connects to server (often inbound to the machine) | Clients connect outbound to broker |
| Security | Certificates, signing, encryption, user roles built in | TLS plus broker authentication and ACLs |
| Scaling to many consumers | Each client holds sessions with each server | Broker fans out to any number of subscribers |
| Footprint | Heavier; nano/micro profiles exist | Very light |
| Typical home | Machine and cell level, vendor-neutral device access | Edge-to-enterprise and edge-to-cloud data distribution |

## When to choose OPC UA

- You need **vendor-neutral access** to PLCs, CNCs, robots or instruments, with rich context and browsable structure.
- You need **commands and methods**, not just telemetry — for example, writing setpoints or starting a job with confirmation.
- A **companion specification** already exists for your equipment class.
- You are integrating at the **machine-to-machine or machine-to-SCADA level** inside a plant network.

## When to choose MQTT

- Many consumers — historians, analytics, MES, cloud services — need the same data.
- Devices are **remote or bandwidth-constrained**, such as oil and gas wellheads, water utilities or mobile equipment.
- You are building a **Unified Namespace** or an event-driven architecture.
- You want to **decouple** producers from consumers so systems can be added without touching the edge.

## The common answer: use both

Most modern architectures combine the two:

![Hybrid industrial architecture diagram showing PLCs and CNC machines exposing structured OPC UA data models to edge gateways, which publish report-by-exception MQTT Sparkplug B topics to a central broker serving Historian, MES, and Analytics](/media/2026/11/diagram-opc-ua-vs-mqtt.png "Figure 1: Pairing OPC UA at the machine boundary with an MQTT Sparkplug B broker avoids point-to-point polling bottlenecks while preserving data context.")

1. **OPC UA at the edge** to read structured data from controllers and machines.
2. An **edge gateway** that normalizes data and publishes it via **MQTT/Sparkplug** to a broker.
3. **Enterprise and cloud applications** subscribe to the broker.

OPC UA PubSub over MQTT is another bridge between the two worlds: it keeps OPC UA's information model while using an MQTT broker for transport.

## Security checklist for either protocol

- Never expose OPC UA servers or MQTT brokers directly to the internet.
- Use OPC UA security mode *SignAndEncrypt* and manage certificates deliberately — avoid blanket "trust all" settings.
- For MQTT, require TLS, unique credentials per client, and topic-level access control lists.
- Place brokers and gateways in a DMZ or dedicated zone, consistent with an IEC 62443 zones-and-conduits design.

=== takeaways
OPC UA is an industrial interoperability framework (IEC 62541) that provides information modeling, standardized companion specifications and built-in security.
MQTT is a lightweight, broker-based publish/subscribe protocol standardized by OASIS that is payload-agnostic and efficient for distributing data to many consumers.
Sparkplug adds a standard topic namespace, payload encoding and online/offline state management to MQTT for industrial use.
OPC UA suits vendor-neutral machine access and commands; MQTT suits edge-to-enterprise data distribution and Unified Namespace architectures.
Most modern IIoT architectures use both: OPC UA to collect structured data at the edge and MQTT to distribute it.

=== faqs
Q: Is MQTT replacing OPC UA?
A: No. The two protocols solve different problems. OPC UA provides standardized information models and secure device access, while MQTT efficiently distributes messages to many subscribers. Most industrial architectures use them together, often with an edge gateway translating OPC UA data into MQTT messages.

Q: Can OPC UA run over MQTT?
A: Yes. OPC UA Part 14 defines a PubSub communication model that can use MQTT brokers as a transport while keeping OPC UA's data encoding and information model.

Q: What is Sparkplug B?
A: Sparkplug B is a specification from the Eclipse Foundation that defines MQTT topic structure, a Protocol Buffers payload format and state management for industrial devices. It makes MQTT data self-describing and lets subscribers know when devices go offline.

Q: Which is more secure, OPC UA or MQTT?
A: OPC UA has more security functions built into the specification, including certificate-based application authentication, signing, encryption and user authorization. MQTT relies on TLS and broker features such as authentication and access control lists. Both can be deployed securely, and both are insecure if misconfigured.

=== sources
OPC Foundation — OPC UA overview and specifications | https://opcfoundation.org/
IEC 62541: OPC Unified Architecture (International Electrotechnical Commission)
MQTT: The Standard for IoT Messaging | https://mqtt.org/
Eclipse Sparkplug specification | https://sparkplug.eclipse.org/
OASIS MQTT Version 5.0 specification (OASIS Standard, 2019)
