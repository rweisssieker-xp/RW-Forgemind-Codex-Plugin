---
name: federated-learning-network
description: ForgeMind federated learning network workflow. Use when the user explicitly asks for federated learning network.
---

# Federated Learning Network

Primary journey: **Learn**

Export only cohorts meeting the configured minimum size, verify every received bundle, then pool counts and metrics deterministically.

```text
forgemind forge federate export --input templates/forge/outcomes.example.json --min-cohort 5
forgemind forge federate aggregate --input <verified-bundles.json>
```

Suppressed cohorts must not reveal category, route, stack, or identifiers. The mechanism is k-anonymous aggregation with suppression, not differential privacy; never describe it as a formal differential-privacy guarantee.
