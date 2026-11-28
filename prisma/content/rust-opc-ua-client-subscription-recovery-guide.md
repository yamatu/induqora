---
title: Rust OPC UA Clients: Subscriptions, Sampling and Recovery
slug: rust-opc-ua-client-subscription-recovery-guide
type: BLOG
category: scada-hmi
author: edward
tags: OPC UA, IIoT, SCADA
publishedAt: 2026-11-28T02:22:00Z
excerpt: Most OPC UA client problems are configuration problems, not code problems. This guide explains the sampling-versus-publishing interval relationship, why a queue that is too small silently drops data, how keepalive and lifetime counters interact, and how to recover a session without losing the subscription.
seoTitle: Rust OPC UA Client: Subscriptions and Recovery
seoDescription: Configure OPC UA sampling and publishing intervals, size monitored-item queues correctly and recover subscriptions after a network drop using the opcua crate.
coverImage: /media/2026/11/cover-rust-opc-ua-client-subscription-recovery-guide.jpg
coverAlt: Technical editorial illustration of an OPC UA client subscription showing sampling ticks feeding a monitored item queue and a publishing tick
coverCaption: Between the sampling tick and the publish tick there is a queue. Everything that goes wrong happens in it.
---
An OPC UA subscription has two clocks, not one: the server samples a value at the sampling interval, and the subscription publishes whatever has queued up at the publishing interval. Nearly every "we are losing data" and "the client goes dead after a switch reboot" report traces back to a mismatch between those two clocks or to the keepalive and lifetime counters derived from them. The protocol is explicit about the arithmetic; most client code is not.

This guide covers the parts of a production OPC UA client that the quick-start examples skip, with the subscription API as published in the `opcua` crate 0.12.

## Sampling interval, publishing interval and the queue between them

Three parameters interact, and the failure mode of each is different:

![OPC UA subscription pipeline diagram: a server object sampled every 100 milliseconds, filtered by a deadband of plus or minus 0.02 bar, buffered in a monitored item queue, then delivered on a 500 millisecond publish tick, with a queue occupancy illustration showing the oldest sample discarded when full, the sizing rule queue greater than or equal to publishing divided by sampling, and keepalive lifetime counters](/media/2026/11/diagram-rust-opc-ua-client-subscription-recovery-guide.png "Figure 1: A queue of 1 is a documented decision to decimate. A queue of 3 when the ratio is 5 is an undocumented decision to lose data.")

| Parameter | What it controls | Wrong value causes |
| --- | --- | --- |
| Sampling interval | How often the server reads the underlying value | Data change missed between samples; server CPU load |
| Publishing interval | How often queued notifications are delivered | Latency; server load on many subscriptions |
| Queue size | How many samples are buffered between publishes | Silent loss when sampling is faster than publishing |

The relationship that matters: if sampling is faster than publishing, the queue fills. When it is full, the oldest notification is discarded — silently, by design, with no error to the client. A client configured with a 100 ms sampling interval, a 1000 ms publishing interval and a queue size of 1 therefore delivers one sample in ten and looks perfectly healthy.

The rule that avoids the trap: either set the queue size to at least `ceil(publishing / sampling)` so every sample survives to the publish, or deliberately set it to 1 and accept discarded intermediate samples as the intended behaviour. The dangerous configuration is a queue size between 2 and `ceil(publishing/sampling) - 1`, because it delivers *some* samples and drops others with no pattern the trend can reveal.

## Creating the subscription

In `opcua` 0.12 the subscription is created on the session with the timing parameters as explicit arguments:

```rust
fn create_subscription<CB>(
    &self,
    publishing_interval: f64,
    lifetime_count: u32,
    max_keep_alive_count: u32,
    max_notifications_per_publish: u32,
    priority: u8,
    publishing_enabled: bool,
    callback: CB,
) -> Result<u32, StatusCode>
where CB: OnSubscriptionNotification + Send + Sync + 'static;
```

The three counters are not arbitrary and the specification fixes their relationship:

- `lifetime_count` is how many publishing intervals may pass with no notification from the client before the server deletes the subscription. The specification requires it to be at least three times `max_keep_alive_count`.
- `max_keep_alive_count` is how many publishing intervals may pass with no data change before the server sends an empty keepalive message. The client must respond to keepalives to hold the subscription open.

A configuration that works well in practice on a plant network:

| Setting | Value | Reason |
| --- | --- | --- |
| Publishing interval | 500 ms | Matches the fastest tag most operators actually look at |
| Lifetime count | 60 (30 s) | Survives a switch reboot of a few seconds |
| Max keepalive count | 20 (10 s) | Detects a dead server long before the subscription dies |
| Max notifications per publish | 0 | Unlimited in one publish, avoids fragmentation |
| Priority | 0 | Priority is not honoured consistently across servers |

Set `lifetime_count` to exactly `3 × max_keep_alive_count` and you have the minimum the specification allows — which is also the tightest margin against a transient network stall. Doubling it costs nothing on the server and buys a much wider recovery window.

## Why a reconnect is not a re-subscription

When the TCP connection drops, the session is gone. A naive client reconnects, creates a new session, creates a new subscription and re-adds every monitored item. That works, but it also means every client on the site re-subscribes at once after a shared network event, and the server sees a spike exactly when it is least healthy.

OPC UA has a purpose-built mechanism for this: the session can be *reactivated* rather than recreated, and subscriptions can be *transferred* to the new session. The sequence is:

1. Reconnect the transport.
2. Call `ActivateSession` with the same session id and authentication token, before the session timeout expires.
3. Call `TransferSubscriptions` with the subscription ids and `send_initial_values = false`.
4. Only if the server returns `BadSubscriptionIdInvalid` for an id do you create a new subscription and re-add the monitored items for that id.

`send_initial_values = false` matters: with `true` the server re-sends the current value of every monitored item, which looks like a burst of changes to the historian and creates a false step in every trend. Use `true` only when you genuinely need to re-establish state after a long outage.

The recovery window is governed by `SessionTimeout` on the server, not by the subscription lifetime. A session that times out cannot be reactivated at all, so a client that intends to survive a 60-second outage must request a session timeout longer than that, which in turn means the server keeps session state for every client for that long.

## Certificates in a container

An OPC UA client with `SecurityPolicy` other than `None` needs a client certificate, and this is where containerised deployments fail most often:

- The application instance certificate has an expiry date. A certificate that expires at 03:00 on a Sunday takes the client down with a `BadCertificateExpired` that most applications log at debug level.
- The server must trust the client certificate. Trust is stored in the server, so adding a new client means a change on the server, not on the client — plan for it in deployment, not at 2 a.m.
- Certificate and private key must be readable by the container user. A mounted secret with mode `0600` owned by root will fail a process running as `node` with a confusing `BadSecurityChecksFailed`.

The practical pattern is a startup check that reads the certificate, logs its subject and expiry, and refuses to start if it expires within the deployment window. Failing loudly at boot beats failing silently at 03:00.

```bash
# Startup guard: refuse to launch with a certificate that expires soon.
# Works with the PEM the crate itself writes, no Rust API needed.
END=$(openssl x509 -in /app/pki/own/cert.der -inform DER -noout -enddate | cut -d= -f2)
DAYS=$(( ( $(date -d "$END" +%s) - $(date +%s) ) / 86400 ))
[ "$DAYS" -lt 30 ] && { echo "OPC UA client cert expires in $DAYS days" >&2; exit 1; }
```

## Deadband: the filter that decides your historian size

A monitored item can carry a data-change filter, so the server only sends a notification when the value moves by more than a threshold. This is the single most effective control over historian growth, and it is usually left at the default of zero.

| Deadband type | Unit | Use for |
| --- | --- | --- |
| Absolute | Engineering units | Temperatures, pressures with a known noise band |
| Percent | % of EU range | Values whose range differs per tag |
| None | — | Counters, states, anything where every change matters |

Set the deadband just above the measurement noise, not just below the resolution you care about. A pressure transmitter with ±0.02 bar of noise and a 0.1 bar deadband sends nothing during steady state and still catches real transitions — roughly a 50 to 200 times reduction in stored points on a typical process tag.

## What to verify before you call it done

A client is ready for production when you can answer these with a test, not an opinion:

- Kill the network for 20 seconds: does the session reactivate and the subscription transfer, with no gap in the historian other than the outage itself?
- Restart the OPC UA server: does the client reconnect and recreate subscriptions, and does it back off rather than reconnect-storm?
- Watch a value for an hour with the client's own timestamp and the server's timestamp displayed: is the difference stable, or growing?
- Publish a value faster than the publishing interval and confirm the queue behaviour matches what you intended rather than what you assumed.

A gateway built this way is still a read path. It is not a control path, and OPC UA subscriptions should not be used to close a control loop: publishing intervals are best-effort, and a queue that discards under load gives you no timing guarantee at all. Use it for supervisory data, and a deterministic fieldbus for anything that moves.

=== takeaways
Sampling interval and publishing interval are separate clocks; a queue smaller than the ratio between them drops samples silently and looks healthy.
Size the monitored-item queue to at least ceil(publishing / sampling), or deliberately to 1 — the values in between lose data without a detectable pattern.
Set lifetime_count to at least three times max_keep_alive_count, and prefer double the minimum so a brief network stall does not delete the subscription.
Recover by activating the session and transferring subscriptions with send_initial_values = false, rather than recreating everything and causing a burst of false change events.
Certificate expiry and trust lists are the usual cause of containerised OPC UA clients failing in production; check expiry at startup and fail loudly.
Use a data-change deadband slightly above measurement noise to cut historian growth by one to two orders of magnitude.

=== faqs
Q: Why does my OPC UA client miss data when the values change quickly?
A: Almost always the queue size. If the sampling interval is shorter than the publishing interval, the server buffers samples and discards the oldest when the queue is full, with no error. Set the queue to at least ceil(publishing / sampling) or set it to 1 deliberately.

Q: Should I reconnect or reactivate after a network drop?
A: Reactivate the session and transfer the subscriptions if the session has not timed out. Recreating everything works but causes a re-subscribe storm across all clients after a shared network event.

Q: What happens if the session times out before I reconnect?
A: The session state is gone and reactivation fails with a bad session id. You must create a new session and new subscriptions. That is why the requested SessionTimeout, not the subscription lifetime, governs how long an outage you can survive.

Q: Why does my trend show a big step every time the client reconnects?
A: You are transferring subscriptions with send_initial_values = true, so the server re-sends the current value of every monitored item. Use false unless you specifically need to re-establish state.

Q: Is OPC UA fast enough to close a control loop?
A: No. Publishing is best-effort and queues discard data under load, so there is no timing guarantee. Use a deterministic fieldbus or motion bus for anything that closes a loop, and OPC UA for supervisory data.

Q: How do I stop my historian growing so fast?
A: Use a data-change deadband set slightly above the measurement noise band. On typical process tags that reduces stored points by one to two orders of magnitude without losing real transitions.

=== sources
IEC 62541-4, *OPC Unified Architecture — Part 4: Services*, Subscription and MonitoredItem service sets.
IEC 62541-5, *OPC Unified Architecture — Part 5: Information Model*.
OPC Foundation, *OPC UA Specification Part 4: Services*, 1.05.
opcua 0.12.0 crate source, docs.rs and crates.io.
