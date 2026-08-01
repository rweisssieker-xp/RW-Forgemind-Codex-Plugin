# ForgeMind Handbook

ForgeMind is a Codex plugin for structured, product-aware, autonomous development. Its native operating model combines specialist roles, governed artifacts, and evidence-driven execution: inspect first, choose the right workflow, build in small useful steps, verify, review, and learn.

## Choose One Of Six Journeys

- **Discover** when the repository, current state, risks, or best route are unclear.
- **Design** when product value, USP, requirements, architecture, stories, or acceptance criteria need definition.
- **Build** when ForgeMind should implement or debug through the common governed orchestration path.
- **Verify** when you need executable checks, review, risks, traceability, or proof-carrying evidence.
- **Release** when preparing a package, installation, handoff, rollback, or release decision.
- **Learn** when recording outcomes, feedback, decisions, product signals, or reusable patterns.

When several workflows match, ForgeMind uses one precedence everywhere: safety, debugging, discovery, product/USP, implementation, verification, then learning.

The Trust Fabric adds nine evidence-native specialist workflows across these journeys. Start with `forgemind forge help`; use the Agent Trust Protocol for cross-agent work, the Strategy Compiler for alignment, Genome and Federation for measured learning, Flight Recorder for audit, Tournament for competing futures, Shrink for reversible simplification, Product Loop for experiments, and Evidence Escrow for acceptance. See `TRUST_FABRIC.md` for exact commands and limits.

## Quick Start

Use this when ForgeMind should handle the whole task:

```text
Orion Forge: uebernimm diese Aufgabe als MasterOrchestrator. Lies die App-Struktur, schlage radical AI/KI-USPs vor, waehle den besten MVP, setze ihn um, teste die App und berichte Risiken.
```

Use this for innovation before implementation:

```text
Astra Moat: lies zuerst die bisherige App-Struktur, liefere maximale AI/KI-USPs und radikale Ideen, waehle den besten buildbaren MVP und plane die Umsetzung mit Tests.
```

Use this for direct autonomous implementation:

```text
ForgeMind Autopilot: inspect, route, decide, act, verify, learn, and report. Ask only on risk escalation.
```

Use this for a safe menu:

```text
ForgeMind Help: show commands, modes, personas, artifacts, and when to use which workflow.
```

## Core Idea

ForgeMind should not only code. It should:

- understand the app structure
- identify what users do today
- find steps that can disappear
- propose AI/KI-driven USPs
- choose a buildable MVP
- implement with the right specialist workflow
- run relevant tests or app smoke checks
- record durable project knowledge

## Personas

You can address personas directly in prompts. Use `Name: task`.

| Persona | Role | Use When |
| --- | --- | --- |
| Orion Forge | MasterOrchestrator | Route, coordinate, implement, verify, learn |
| Mira Value | Product Owner | Scope, MVP, user value, acceptance criteria |
| Atlas Forge | Architect | Boundaries, data flow, risks, technical design |
| Kai Builder | Senior Developer | Implementation, code quality, tests |
| Nora Check | QA Engineer | Test plan, regression, smoke tests |
| Sam Flow | Scrum Master | Story prep, blockers, handoff |
| Vera Shield | Security Engineer | Auth, secrets, data exposure, abuse risk |
| Iris Signal | USP AI Strategist | AI/KI USPs, differentiation, USP Score |
| Astra Moat | Innovation Agent | App-first radical USPs and MVP choice |
| Nova Spark | Radical Vibe Builder | 10x future features that eliminate workflows |
| Rhea Ship | Release Manager | Readiness, verification, release notes |
| Gale Audit | Gap Scanner | Missing work before release or handoff |
| Rhea Score | Release Readiness Score | 0-100 release confidence |
| Tessa Trace | Traceability Mapper | PRD/story/code/test evidence |
| Cora Center | Command Center | Dashboard and operating overview |
| Vera Radar | Risk Radar | Security, dependency, migration, generated-file, release risk |
| Rhea Rollback | Rollback Planner | Recovery plans and fallback steps |
| Nora Registry | Verification Registry | Known-good commands and confidence |
| Atlas Record | Decision Log | Durable product and architecture decisions |
| Rhea Brief | PR Summary Builder | PR and handoff summaries |
| Iris Matrix | Differentiation Matrix | Capability, market, and moat positioning |

Examples:

```text
Iris Signal: finde 10 AI/KI-USPs fuer diese App, score sie und empfehle den ersten MVP.
```

```text
Kai Builder: implementiere diese Story mit minimalem Diff, bestehenden Patterns und Tests.
```

```text
Nora Check: erstelle einen Regressionstestplan und einen App-Smoke-Test fuer diese Aenderung.
```

## Main Commands

### Help And Routing

```text
ForgeMind Help: show commands, modes, and when to use which workflow.
```

```text
Agent Menu: show named personas and recommend who should handle this task.
```

```text
MasterOrchestrator: route this coding task.
```

### Project Setup

```text
Workflow Init: initialize project profile, memory, product artifacts, and workflow status.
```

This initializes or proposes:

- `.codex-orchestrator/project.md`
- `.codex-orchestrator/memory/`
- `.codex-orchestrator/patterns/`
- `.codex-orchestrator/workflow-status.md`
- `docs/forgemind/prd.md`
- `docs/forgemind/epics.md`
- `docs/forgemind/stories/`
- `docs/forgemind/acceptance/`
- `docs/forgemind/traceability.md`
- `docs/forgemind/release-readiness.md`
- `docs/forgemind/rollback-plan.md`
- `docs/forgemind/differentiation-matrix.md`
- `.codex-orchestrator/workflow-graph.md`

Script equivalent:

```powershell
.\plugins\forgemind\scripts\write-project-profile.ps1 -WithMemory -WithArtifacts
```

### Status

```text
Workflow Status: show current phase, mode, blockers, verification, and next action.
```

```text
Skill Router: recommend the best ForgeMind skill with confidence, alternatives, risk, and next action.
```

```text
Workflow Graph: show the ForgeMind workflow graph and next gate.
```

## Product And Delivery Artifacts

ForgeMind keeps product planning concrete by writing artifacts when project files are writable.

### PRD

```text
Mira Value: create a PRD for this feature and update docs/forgemind/prd.md.
```

Or:

```text
PRD Builder: create a product requirements document for this feature.
```

### Epics And Stories

```text
Epic Story Builder: convert this PRD into epics, user stories, tasks, dependencies, and implementation order.
```

Stories should be small enough for one implementation pass plus verification.

### Story Prep

```text
Sam Flow: prepare this story for implementation with tasks, blockers, and handoff notes.
```

### Acceptance Criteria

```text
Acceptance Criteria Builder: create observable acceptance criteria, test cases, definition of done, and verification checklist.
```

## Innovation And USP Workflow

Use this when you want radical ideas before implementation:

```text
Innovation First Autopilot: read the current app structure first, then generate maximum AI/KI USPs and radical ideas before choosing the best MVP.
```

The expected output:

1. App structure and current workflow
2. Base functions, expandable areas, removable steps
3. 5 radical AI/KI ideas
4. 6 feasible feature ideas
5. Max-USP list with USP Score
6. Best MVP selection
7. Build-ready plan
8. Implementation and verification if requested
9. App smoke test result
10. Risks, learning, next steps

### USP Score

ForgeMind scores substantial AI/KI ideas from 0-100:

- Revenue potential: 0-20
- Differentiation: 0-20
- Data availability: 0-15
- Trust feasibility: 0-15
- Build effort: 0-15, simpler earns more
- Time-to-MVP: 0-15, faster earns more

Bands:

- 80-100: build now
- 65-79: promising MVP
- 45-64: validate first
- 0-44: avoid or rethink

## Radical Vibe Builder

Use this when you do not want small improvements:

```text
Nova Spark: analyze this app, generate 5 radical AI/KI 10x features, choose the boldest buildable MVP, and produce a build-ready plan.
```

Rules:

- no conservative feature add-ons
- replace interactions instead of improving them
- prefer automation over control
- prefer fewer screens and less UI
- AI/KI must be central, not optional
- output must be build-ready for a vibe coder

## App Evolution Builder

Use this for practical app improvement with implementation:

```text
App Evolution Builder: review the code, suggest optimizations, analyze base functionality and USP potential, generate 6 feasible feature ideas, implement the best one, and verify it with tests.
```

This workflow should produce:

- short code/app review
- basis functions and extensible areas
- one possible USP
- 6 feature ideas with feasibility
- selected feature
- implementation
- verification and app test

## Autonomy Modes

ForgeMind uses risk-based autonomy:

- `safe`: analysis only
- `normal`: bounded implementation
- `autonomous`: implement, verify, review, and learn with minimal questions
- `yolo`: end-to-end delivery with guardrails
- `surgery`: broad refactor, migration, production, secrets, destructive action, or irreversible work; ask first

Default:

- Use `normal` unless the user asks for more autonomy.
- Use `autonomous` for "mach das", "leg los", "handle end to end".
- Use `yolo` only when explicitly requested.
- Escalate to `surgery` for high-risk work.

## YOLO Feature

Use YOLO only when you want ForgeMind to build end to end:

```text
YOLO feature: implement this end to end with ForgeMind guardrails, run verification, update memory, and report residual risks.
```

YOLO still has guardrails:

- no destructive git operations
- no secrets or production changes without approval
- no unrelated refactors
- no external cost without approval
- verification required unless blocked
- app work needs an app-level test attempt

## TDD And Debugging

### TDD

```text
TDD Builder: implement this behavior test-first with red-green-refactor.
```

Use when behavior can be expressed with tests before implementation.

### Debugging

```text
Systematic Debugging: reproduce, diagnose, fix, and verify this bug.
```

Expected sequence:

1. Reproduce or identify evidence
2. Form a concrete hypothesis
3. Inspect the relevant path
4. Fix narrowly
5. Verify
6. Report root cause and residual risk

## Review And Security

### Code Review

```text
Code Review Gate: review this diff for bugs, regressions, and missing tests.
```

Findings should lead the response and include file/line references when possible.

### Security

```text
Vera Shield: check auth, secrets, data exposure, dependencies, prompt injection, and AI tool risks.
```

Use for auth changes, data handling, public endpoints, AI tool use, dependencies, secrets, or risky input handling.

## Traceability, Gaps, And Release Score

Use these when you need evidence that work is complete rather than only implemented.

```text
Traceability Mapper: connect this implementation to PRD, story, acceptance criteria, changed files, and verification.
```

```text
Gap Scanner: scan this branch for missing release, quality, docs, CI, packaging, traceability, and runtime work.
```

```text
Release Readiness Score: score this branch from 0-100 and list blockers.
```

Script equivalents:

```powershell
.\plugins\forgemind\scripts\add-traceability.ps1 -Feature "Feature X" -Story "ST-1" -Acceptance "Acceptance summary"
.\plugins\forgemind\scripts\gap-scan.ps1
.\plugins\forgemind\scripts\release-readiness-score.ps1
.\plugins\forgemind\scripts\risk-radar.ps1
.\plugins\forgemind\scripts\generate-rollback-plan.ps1 -Change "Feature X"
.\plugins\forgemind\scripts\generate-pr-summary.ps1 -Title "Feature X"
```

Release score bands:

- 0-59: blocked
- 60-74: risky
- 75-89: ready with notes
- 90-100: ready

```text
Risk Radar: scan this branch for security, dependency, migration, generated-file, release, and handoff risks.
```

```text
Rollback Planner: create a rollback plan for this change.
```

```text
PR Summary Builder: create a PR or handoff summary from changed files and verification evidence.
```

## Runtime Discovery

Use after installing or packaging ForgeMind:

```text
Runtime Discovery Test: check whether ForgeMind is installed where Codex can discover it.
```

```powershell
.\plugins\forgemind\scripts\runtime-discovery-test.ps1
```

It checks Codex home, plugin cache, marketplace registration, config entries, manifest, skills, and hook references.

## Verification

Before claiming work is complete, ForgeMind should run relevant verification.

Common script:

```powershell
.\plugins\forgemind\scripts\verify-workspace.ps1
.\plugins\forgemind\scripts\verify-workspace.ps1 -Run
```

Plugin validation:

```powershell
.\plugins\forgemind\scripts\validate-plugin.ps1
.\plugins\forgemind\scripts\test-forgemind.ps1
```

Verification hierarchy:

- tests
- build
- lint
- typecheck
- app smoke test
- manual check when automation is unavailable

If verification cannot run, ForgeMind should state the blocker clearly.

## Learning And Memory

ForgeMind can persist useful project knowledge in `.codex-orchestrator/`.

Use:

```text
Learning Loop: record what worked, what failed, user preferences, reusable patterns, and self-update proposals.
```

Script:

```powershell
.\plugins\forgemind\scripts\record-learning.ps1 -Task "Feature X" -Outcome success -MemoryUsed -Note "Reusable pattern found"
```

Memory files include:

- decisions
- conventions
- risk zones
- verification commands
- USP ideas
- USP backlog
- outcome memory
- verification registry
- preferences
- mistakes
- self-update proposals

Use the USP backlog for product differentiation ideas:

```powershell
.\plugins\forgemind\scripts\update-usp-backlog.ps1 -Title "AI Feature" -Score 82 -Experiment "Smoke test"
.\plugins\forgemind\scripts\register-verification.ps1 -Command "npm test" -Category test
.\plugins\forgemind\scripts\record-decision.ps1 -Decision "Use X" -Rationale "Because Y"
```

## Differentiation Matrix

Use this when planning ForgeMind's next moat:

```text
Differentiation Matrix: compare ForgeMind capabilities with market baselines and alternatives.
```

The artifact lives in `docs/forgemind/differentiation-matrix.md`.

Do not store secrets, credentials, private customer data, patient data, proprietary code snippets, or production endpoints in memory.

## Dashboard

Generate a local dashboard:

```powershell
.\plugins\forgemind\scripts\generate-dashboard.ps1
```

Output:

```text
.codex-orchestrator/dashboard/index.html
```

The command center summarizes project profile, workflow graph, verification, gap scan, release readiness, risk radar, runtime discovery, traceability, rollback plan, PR summary, USP backlog, outcome memory, learning, memory, and patterns.

## Recommended Prompt Patterns

### Full Innovation-To-Build Prompt

```text
Orion Forge: uebernimm als MasterOrchestrator.
1. Lies die App-Struktur.
2. Erklaere kurz, was die App heute macht.
3. Liefere 5 radikale AI/KI-Ideen und 6 realistische Feature-Ideen.
4. Bewerte die besten USPs mit USP Score.
5. Waehle den besten buildbaren MVP.
6. Erstelle/aktualisiere PRD, Epics, Story und Acceptance Criteria.
7. Implementiere den MVP.
8. Teste die App und fasse Verification, Risiken und naechste Schritte zusammen.
```

### Product-Only Prompt

```text
Iris Signal: analysiere diese App aus USP-Sicht. Was ist Basisfunktion, was ist erweiterbar, was koennte ein echter AI/KI-Moat sein? Liefere Scores und den besten MVP.
```

### Build-Only Prompt

```text
Kai Builder: implementiere diese Story mit minimalem Diff. Nutze bestehende Patterns, fuege fokussierte Tests hinzu und fuehre relevante Verification aus.
```

### QA Prompt

```text
Nora Check: pruefe diese Aenderung auf Regressionen, Edge Cases und fehlende Tests. Definiere einen App-Smoke-Test und klare Pass/Fail-Kriterien.
```

### Release Prompt

```text
Rhea Ship: bereite den Abschluss vor. Pruefe Scope, Verification, Risiken, Release Notes und Rollback-Hinweise.
```

## Operating Rules

ForgeMind should:

- prefer existing repo patterns
- keep edits scoped
- avoid unrelated refactors
- verify before completion
- run app-level tests after app changes
- document durable decisions
- ask only when risk requires it

ForgeMind should not:

- invent broad architecture without code context
- skip app-structure reading for innovation workflows
- call generic chatbot ideas a USP
- claim tests pass without running them
- write secrets or sensitive data into memory
- perform destructive actions without explicit approval

## Runtime Test Checklist

After changing ForgeMind itself:

```powershell
Get-Content -Raw .\plugins\forgemind\.codex-plugin\plugin.json | ConvertFrom-Json | Out-Null
Get-Content -Raw .\.agents\plugins\marketplace.json | ConvertFrom-Json | Out-Null
.\plugins\forgemind\scripts\validate-plugin.ps1
.\plugins\forgemind\scripts\test-forgemind.ps1
.\plugins\forgemind\scripts\gap-scan.ps1
.\plugins\forgemind\scripts\release-readiness-score.ps1
```

Then reload Codex and test:

```text
ForgeMind Help: show commands, modes, personas, artifacts, and when to use which workflow.
```

```text
Agent Menu: show named personas and recommend who should handle this task.
```

```text
Workflow Init: initialize project profile, memory, product artifacts, and workflow status.
```

```text
Innovation First Autopilot: read app structure first and generate max AI/KI USPs.
```

## File Map

- `plugins/forgemind/.codex-plugin/plugin.json`: plugin manifest
- `plugins/forgemind/hooks.json`: trigger hooks
- `plugins/forgemind/skills/`: Codex skills
- `plugins/forgemind/agents/`: persona profiles
- `plugins/forgemind/templates/artifacts/`: PRD, epic, story, acceptance, workflow templates
- `plugins/forgemind/templates/memory/`: project memory templates
- `plugins/forgemind/templates/usp/`: domain USP templates
- `plugins/forgemind/scripts/`: validation, init, verification, learning, dashboard scripts
- `plugins/forgemind/prompts/README.md`: prompt library
- `plugins/forgemind/docs/`: handbook, install, workflows, release, runtime tests
