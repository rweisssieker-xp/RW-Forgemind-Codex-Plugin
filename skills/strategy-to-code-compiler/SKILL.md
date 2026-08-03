---
name: strategy-to-code-compiler
description: ForgeMind strategy to code compiler workflow. Use when the user explicitly asks for strategy to code compiler.
---

# Strategy-to-Code Compiler

Primary journey: **Design**

Translate a goal into explicit non-goals, constraints, measurable outcomes, guardrails, and drift checks. Compile first; check a delivery record before release.

```text
forgemind forge strategy compile --input templates/forge/strategy.example.json
forgemind forge strategy check --strategy <strategy-id> --input templates/forge/strategy-delivery.example.json
```

Technical verification does not override strategic drift. A failed constraint or metric blocks alignment and must remain visible in the evidence.
