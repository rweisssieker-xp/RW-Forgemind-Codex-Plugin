---
name: autonomous-product-loop
description: Run a governed signal-to-scale product loop with measured guardrails, trust contracts, delivery proof, and explicit scale, iterate, or rollback decisions.
---

# Autonomous Product Loop

Primary journey: **Learn**

Progress only through the sealed state machine: signal, hypothesis, experiment, delivery, then measurement. Experiments require a trust contract; delivery requires proof and a trust attestation.

```text
forgemind forge loop create --input templates/forge/product-loop.example.json
forgemind forge loop advance --loop <loop-revision-id> --input templates/forge/loop-event.example.json
forgemind forge loop status --loop <loop-revision-id>
```

Scale only when the success metric passes and every guardrail holds. Any guardrail failure chooses rollback; unproven success chooses iterate.
