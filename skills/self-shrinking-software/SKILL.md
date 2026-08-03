---
name: self-shrinking-software
description: ForgeMind self shrinking software workflow. Use when the user explicitly asks for self shrinking software.
---

# Self-Shrinking Software

Primary journey: **Design**

Inventory capabilities with usage, outcome contribution, complexity, protected behavior, preservation tests, and rollback steps.

```text
forgemind forge shrink analyze --input templates/forge/shrink.example.json
```

The command produces a plan and always reports `sourceMutation: false`. It must retain essential or valuable capabilities and cannot recommend removal without preservation tests and rollback evidence.
