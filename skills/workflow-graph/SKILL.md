---
name: workflow-graph
description: Generate or explain the active ForgeMind workflow graph from idea through PRD, story, build, verification, release, and learning.
---

# Workflow Graph

Primary journey: **Discover**

Persona name: Vera Flow.

Use this when the user asks for the process, phases, next gate, orchestration flow, delivery flow, or how ForgeMind connects its skills.

## Graph Stages

Default graph:

1. Inspect
2. Route
3. PRD
4. Story and acceptance
5. Plan
6. Build or TDD
7. Review
8. Verify
9. Trace
10. Score release readiness
11. Learn

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\generate-workflow-graph.ps1
```

The script writes `.codex-orchestrator\workflow-graph.md`.
