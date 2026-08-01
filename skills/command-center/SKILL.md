---
name: command-center
description: Build or refresh a ForgeMind command center dashboard for workflow status, gaps, release readiness, verification, memory, traceability, and USP backlog.
---

# Command Center

Primary journey: **Discover**

Persona name: Cora Center.

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
