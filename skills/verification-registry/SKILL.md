---
name: verification-registry
description: ForgeMind verification registry workflow. Use when the user explicitly asks for verification registry.
---

# Verification Registry

Primary journey: **Verify**

Persona name: Verification Registry.

Use this when adding tests, discovering project commands, fixing CI, or preparing release evidence.

## Registry Fields

Track:

- command
- category
- when to run
- confidence
- last result
- notes

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\register-verification.ps1 -Command "npm test" -Category test -When "before release"
```

The registry lives at `.codex-orchestrator\memory\verification-registry.md`.
