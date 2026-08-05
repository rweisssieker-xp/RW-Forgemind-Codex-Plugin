---
name: release-readiness-score
description: ForgeMind release readiness score workflow. Use when the user explicitly asks for release readiness score.
---

# Release Readiness Score

Primary journey: **Release**

Persona name: Release Score.

Use this before release, handoff, PR creation, plugin packaging, or when the user asks whether something is ready.

## Score Model

Score 0-100:

- verification evidence: 20
- CI and packaging coverage: 15
- documentation and changelog: 15
- acceptance and traceability: 15
- security and data-risk review: 10
- runtime/install validation: 15
- clean working tree and handoff clarity: 10

## Output

Return:

- readiness score
- release decision: blocked, risky, ready with notes, or ready
- top blockers
- missing evidence
- next three actions

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\release-readiness-score.ps1
```

The script writes `.codex-orchestrator\reports\release-readiness-latest.json` and updates `docs\forgemind\release-readiness.md` when artifacts are initialized.
