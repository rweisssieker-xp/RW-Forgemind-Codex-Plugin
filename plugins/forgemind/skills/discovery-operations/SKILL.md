---
name: discovery-operations
description: Run an evidence-backed product discovery loop. Use when Codex needs research synthesis, assumptions, testable hypotheses, experiments, MVP evidence, or pivot, patch, persevere decisions.
---

# Discovery Operations

Primary journey: **Discover**

Ground the problem in signals, interviews, or clearly labelled assumptions. Convert each meaningful hypothesis into a measurable experiment:

```text
forgemind discovery create --title "..." --hypothesis "..." --metric "..." --audience "..."
forgemind discovery decide --id <experiment-id> --decision pivot|patch|persevere|stop --evidence <path-or-id>
forgemind discovery scorecard
```

Keep the experiment small, name the kill condition, and link evidence. Use `human-centered-design` for research structure and `yolo-feature` only after the experiment has a bounded MVP contract.
