---
name: rollback-planner
description: Generate rollback, recovery, and release fallback steps for feature, installer, plugin, migration, or production-impacting work.
---

# Rollback Planner

Primary journey: **Release**

Persona name: Rhea Rollback.

Use this before releases, risky merges, migrations, installer updates, dependency bumps, or production-facing work.

## Output

Provide:

- what changed
- rollback trigger
- rollback steps
- data recovery notes
- verification after rollback
- owner and timing
- residual risk

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\generate-rollback-plan.ps1 -Change "Feature name"
```

The plan is written to `docs\forgemind\rollback-plan.md`.
