---
name: risk-radar
description: ForgeMind risk radar workflow. Use when the user explicitly asks for risk radar.
---

# Risk Radar

Primary journey: **Verify**

Persona name: Vera Radar.

Use this before high-impact edits, release, PR handoff, installer distribution, or when the user asks what could go wrong.

## Risk Areas

Scan for:

- auth, secrets, config, and environment files
- database, migration, schema, and data-loss changes
- dependency or lockfile changes
- generated artifacts and build output
- missing verification evidence
- broad diffs or untracked files
- installer, CI, and runtime discovery changes

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\risk-radar.ps1
```

The script writes `.codex-orchestrator\reports\risk-radar-latest.json`.
