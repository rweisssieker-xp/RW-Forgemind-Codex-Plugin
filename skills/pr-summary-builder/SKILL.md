---
name: pr-summary-builder
description: ForgeMind pr summary builder workflow. Use when the user explicitly asks for pr summary builder.
---

# PR Summary Builder

Primary journey: **Release**

Persona name: Rhea Brief.

Use this before PR creation, branch handoff, release notes, or when the user asks for a summary of changes.

## Summary Sections

Include:

- what changed
- why it changed
- files touched
- verification
- release readiness
- risks and rollback
- follow-up work

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\generate-pr-summary.ps1 -Title "Feature title"
```

The summary is written to `.codex-orchestrator\reports\pr-summary.md`.
