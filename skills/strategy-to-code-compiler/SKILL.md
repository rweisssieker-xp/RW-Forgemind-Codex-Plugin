---
name: strategy-to-code-compiler
description: Compile strategy into machine-checkable constraints, acceptance rules, telemetry, policy additions, and drift checks. Use when delivery must remain aligned with product strategy.
---

# Strategy-to-Code Compiler

Primary journey: **Design**

Translate a goal into explicit non-goals, constraints, measurable outcomes, guardrails, and drift checks. Compile first; check a delivery record before release.

```text
forgemind forge strategy compile --input templates/forge/strategy.example.json
forgemind forge strategy check --strategy <strategy-id> --input templates/forge/strategy-delivery.example.json
```

Technical verification does not override strategic drift. A failed constraint or metric blocks alignment and must remain visible in the evidence.
