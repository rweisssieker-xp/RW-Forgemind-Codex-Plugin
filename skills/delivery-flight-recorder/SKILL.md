---
name: delivery-flight-recorder
description: ForgeMind delivery flight recorder workflow. Use when the user explicitly asks for delivery flight recorder.
---

# Delivery Flight Recorder

Primary journey: **Verify**

Every Trust Fabric action appends a redacted, hash-linked event and anchors the current head. Verify the chain before relying on it.

```text
forgemind forge flight verify
forgemind forge flight replay
forgemind forge flight list
```

Replay reconstructs recorded state only; it never re-executes commands. An invalid chain is evidence of mutation, deletion, reordering, or a broken anchor and must block trusted replay.
