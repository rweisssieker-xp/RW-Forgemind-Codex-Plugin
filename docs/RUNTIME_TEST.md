# Runtime Test Checklist

Use this after reloading Codex.

Run the portable preflight first on Windows, macOS, or Linux:

```text
node bin/forgemind.mjs doctor
node bin/forgemind.mjs validate
node bin/forgemind.mjs legacy runtime-discovery-test --json
```

## Discovery

1. Restart or reload Codex.
2. Confirm the marketplace entry appears as `ForgeMind`.
3. Confirm the source path resolves to `./plugins/forgemind`.
4. Confirm no stale pre-ForgeMind plugin identity appears.

## Skill Trigger Tests

Run these prompts in a test thread:

```text
ForgeMind Help: show commands, modes, and when to use which workflow.
```

Expected: outputs the ForgeMind journey and command menu without implementing code.

```text
Workflow Init: initialize ForgeMind for this project.
```

Expected: initializes or describes project profile, memory, verification baseline, risks, and next workflow command.

Also confirm these artifacts exist or are proposed when file writes are allowed: `docs/forgemind/prd.md`, `docs/forgemind/epics.md`, `docs/forgemind/stories/`, `docs/forgemind/acceptance/`, `docs/forgemind/traceability.md`, `docs/forgemind/release-readiness.md`, `docs/forgemind/rollback-plan.md`, `docs/forgemind/differentiation-matrix.md`, `.codex-orchestrator/workflow-status.md`, `.codex-orchestrator/workflow-graph.md`, `.codex-orchestrator/memory/usp-backlog.md`, `.codex-orchestrator/memory/outcome-memory.md`, and `.codex-orchestrator/memory/verification-registry.md`.

```text
Workflow Status: show current phase, mode, blockers, verification, and next action.
```

Expected: reports phase, mode, active skill, done, next, blockers, verification, and risks.

```text
Skill Router: recommend the best ForgeMind skill with confidence, alternatives, risk, and next action.
```

Expected: selects one primary skill, gives confidence, lists alternatives, risk level, and escalation trigger.

```text
Workflow Graph: show the ForgeMind workflow graph and next gate.
```

Expected: explains or generates the ForgeMind flow from project intelligence through release readiness and learning.

```text
Workflow Menu: recommend the best ForgeMind specialist for this task.
```

Expected: recommends a primary agent role and optional supporting agents.

Expected persona names include Orchestration Flow, Product Scope, Architecture Review, Delivery Build, Quality Check, Work Planning, Security Review, Value Signals, Innovation Design, Radical Design, and Release Delivery.

```text
PRD Builder: create a product requirements document for this feature.
```

Expected: outputs product summary, users, goals, scope, requirements, risks, metrics, and open questions.

```text
Epic Story Builder: convert this PRD or feature into epics, user stories, tasks, and implementation order.
```

Expected: outputs epics, stories, acceptance criteria, dependencies, test notes, and MVP cut line.

```text
Acceptance Criteria Builder: create acceptance criteria, test cases, definition of done, and verification checklist.
```

Expected: outputs observable criteria, positive and negative tests, app smoke test, and verification checklist.

```text
Delivery Orchestrator: route this coding task.
```

Expected: routes through project intelligence, planning, verification, and reporting.

```text
ForgeMind Autopilot: inspect, route, decide, act, verify, learn, and report. Ask only on risk escalation.
```

Expected: selects autonomy level, chooses subskills, creates a task queue, verifies before completion, and reports residual risk.

```text
Innovation First Autopilot: read the current app structure first, then generate maximum AI/KI USPs and radical ideas before choosing the best MVP.
```

Expected: reads or infers app structure, produces app breakdown, radical ideas, practical feature ideas, max-USP list with scores, and selected build-ready MVP.

```text
USP Strategist: find AI/KI product advantages for this feature.
```

Expected: outputs ranked ideas with USP Score, MVP, trust risk, and do-not-build warning.

```text
Radical Vibe Builder: analyze this app, generate 5 radical AI/KI 10x features, choose the boldest buildable MVP, and produce a build-ready plan.
```

Expected: outputs current-app breakdown, 5 non-conservative radical ideas, selected best idea, build-ready feature, and disruption explanation.

```text
App Evolution Builder: review the code, suggest optimizations, analyze base functionality and USP potential, generate 6 feasible feature ideas, implement the best one, and verify it with tests.
```

Expected: outputs code review, app analysis, 6 feasibility-ranked feature ideas, selected feature, implementation, verification, and possible USP.

```text
YOLO feature: implement this end to end with ForgeMind guardrails.
```

Expected: announces YOLO mode, checks risk mode, uses project profile, verifies, and reports residual risks.

```text
Use $launch-mvp to turn this existing app opportunity into a verified MVP release decision.
```

Expected: creates a persisted MVP brief, tester plan, and launch record; follows discover, test, build, verify, and release gates; stops on a kill condition, critical tester finding, failed verification, or approval boundary.

```text
Use $mvp-test-lab to prepare and evaluate MVP testing for this feature.
```

Expected: plans target-user, functional, accessibility, and adversarial evidence. It clearly labels simulated input and returns collecting, scale, iterate, or stop based on recorded results.

```text
Learning Loop: record what worked and what should change next time.
```

Expected: captures preferences, mistakes, patterns, and self-update proposals.

```text
Gap Scanner: scan this branch for missing release, quality, docs, CI, packaging, traceability, and runtime work.
```

Expected: lists blockers, high-value gaps, optional polish, evidence, and next action.

```text
Release Readiness Score: score this branch from 0-100 and list blockers.
```

Expected: returns a score, decision, blockers, missing evidence, and next actions.

```text
Risk Radar: scan this branch for security, dependency, migration, generated-file, release, and handoff risks.
```

Expected: reports risk level, evidence, and mitigation actions.

```text
Rollback Planner: create a rollback plan for this change.
```

Expected: produces rollback trigger, steps, verification after rollback, owner, timing, and residual risk.

```text
PR Summary Builder: create a PR or handoff summary from changed files and verification evidence.
```

Expected: summarizes changes, files, verification, gaps, release readiness, risks, rollback, and follow-up.

```text
Traceability Mapper: connect this implementation to PRD, story, acceptance criteria, changed files, and verification.
```

Expected: updates or describes a traceability entry.

```text
Runtime Discovery Test: check whether ForgeMind is installed where Codex can discover it.
```

Expected: checks cache, marketplace, config, manifest, skills, and hooks.

```text
Command Center: refresh the ForgeMind dashboard.
```

Expected: refreshes or describes the dashboard with verification, gaps, release readiness, traceability, USP backlog, and memory.

```text
Differentiation Matrix: compare ForgeMind capabilities with market baselines and alternatives.
```

Expected: outputs capability matrix, gaps, and next feature recommendations.

## Local Command Tests

```powershell
.\plugins\forgemind\scripts\validate-plugin.ps1
.\plugins\forgemind\scripts\test-forgemind.ps1
.\plugins\forgemind\scripts\verify-workspace.ps1
.\plugins\forgemind\scripts\gap-scan.ps1
.\plugins\forgemind\scripts\release-readiness-score.ps1
.\plugins\forgemind\scripts\risk-radar.ps1
.\plugins\forgemind\scripts\generate-rollback-plan.ps1 -Change "Runtime test"
.\plugins\forgemind\scripts\generate-pr-summary.ps1 -Title "Runtime test"
.\plugins\forgemind\scripts\generate-workflow-graph.ps1
.\plugins\forgemind\scripts\runtime-discovery-test.ps1
```

## MVP Command Tests

Run these in a disposable workspace:

```text
node bin/forgemind.mjs launch-mvp --goal "Shorten invoice approvals" --audience "Finance teams" --json
node bin/forgemind.mjs launch-mvp status --json
node bin/forgemind.mjs testing record --panel target-user --outcome passed --completed true --evidence "session-1" --json
node bin/forgemind.mjs testing evaluate --json
```

Expected: project-local artifacts are created under `.codex-orchestrator/product/`; no participant identity, recording, secret, or external telemetry is created.

## Pass Criteria

- Plugin is discoverable.
- Skills trigger by name.
- No stale plugin identity appears.
- Local validation and tests pass.
- Runtime behavior matches skill descriptions.
- Artifact initialization and persona menu entries work.
