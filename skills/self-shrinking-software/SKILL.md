---
name: self-shrinking-software
description: Find low-value complexity and create reversible, evidence-backed removal experiments without changing source. Use to reduce software safely while protecting behavior.
---

# Self-Shrinking Software

Primary journey: **Design**

Inventory capabilities with usage, outcome contribution, complexity, protected behavior, preservation tests, and rollback steps.

```text
forgemind forge shrink analyze --input templates/forge/shrink.example.json
```

The command produces a plan and always reports `sourceMutation: false`. It must retain essential or valuable capabilities and cannot recommend removal without preservation tests and rollback evidence.
