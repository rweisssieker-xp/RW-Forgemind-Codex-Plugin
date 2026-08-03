---
name: gap-scanner
description: ForgeMind gap scanner workflow. Use when the user explicitly asks for gap scanner.
---

# Gap Scanner

Primary journey: **Verify**

Persona name: Gale Audit.

Use this when the user asks what is missing, what remains before release, or how complete a plugin, app, branch, story, or feature is.

## Inputs

Inspect:

- current git status and changed files
- `.codex-orchestrator/reports/verification-latest.json`
- `CHANGELOG.md`, README files, install docs, release docs
- story, acceptance, traceability, and release-readiness artifacts
- CI workflow files
- plugin manifests, hooks, skills, scripts, and templates when present

## Output

Report:

- blocking gaps
- high-value missing work
- optional polish
- evidence found
- recommended next action

Prefer precise file references and avoid generic advice.

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\gap-scan.ps1
```

The script writes `.codex-orchestrator\reports\gap-scan-latest.json`.
