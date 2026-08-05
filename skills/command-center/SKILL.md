---
name: command-center
description: ForgeMind command center workflow. Use when the user explicitly asks for command center.
---

# Command Center

Primary journey: **Discover**

Persona name: Command Center.

Use this when the user asks for a dashboard, overview, command center, project cockpit, current state, or all ForgeMind evidence in one place.

## Contents

Show:

- project profile
- workflow status and graph
- verification report
- gap scan
- release readiness score
- runtime discovery status
- traceability
- USP backlog
- learning, mistakes, preferences, and self-update proposals

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\generate-dashboard.ps1
```

The dashboard is written to `.codex-orchestrator\dashboard\index.html`.
