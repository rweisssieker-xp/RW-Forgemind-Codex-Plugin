---
name: decision-log
description: ForgeMind decision log workflow. Use when the user explicitly asks for decision log.
---

# Decision Log

Primary journey: **Learn**

Persona name: Decision Record.

Use this after architecture decisions, product scope decisions, release tradeoffs, rejected ideas, or workflow policy changes.

## Decision Format

Capture:

- decision
- context
- rationale
- alternatives considered
- impact
- review date

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\record-decision.ps1 -Decision "Use X" -Rationale "Because Y"
```

The entry is appended to `.codex-orchestrator\memory\decisions.md`.
