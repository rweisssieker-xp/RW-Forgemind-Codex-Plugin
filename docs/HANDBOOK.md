# ForgeMind Handbook

ForgeMind is the evidence-first delivery system for Codex: autonomous execution with verifiable proof, safe escalation, and release-ready decisions. Its operating model combines specialist roles, governed artifacts, and evidence-driven execution: inspect first, choose the smallest sufficient workflow, build in small useful steps, verify, review, and learn.

Its distinguishing promises are concrete: proof before completion claims; autonomous work with explicit safety stops; cost-aware specialist selection; a single evidence-backed Go/No-Go release decision; privacy-preserving aggregate learning; vendor-neutral trust contracts; reproducible records and replay; and traceability from product strategy through verification.

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
Orchestration Flow: take ownership of this task as Delivery Orchestrator. Inspect the app structure, propose radical AI product advantages, select the strongest MVP, implement it, test the app, and report risks.
```

Use this for innovation before implementation:

```text
Innovation Design: inspect the current app structure first, generate high-leverage AI product advantages and radical ideas, select the strongest buildable MVP, and plan implementation with tests.
```

For a durable, developer-focused innovation portfolio, run:

```powershell
node bin/forgemind.mjs innovation portfolio --goal "Reduce approval time for existing customers" --json
```

The result is stored in `.codex-orchestrator/product/innovation-portfolio-latest.json`. It creates ten ranked hypotheses across workflow elimination, contextual intelligence, explainable automation, product learning, collaboration, vertical specialization, proactive operations, integrations, outcome pricing, and bounded autonomous work. Every bet records an evidence basis, moat, monetization hypothesis, MVP experiment, and kill condition. Repository signals are project evidence; missing customer signals remain clearly labeled assumptions.

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
| Orchestration Flow | Delivery Orchestrator | Route, coordinate, implement, verify, learn |
| Product Scope | Product Owner | Scope, MVP, user value, acceptance criteria |
| Architecture Review | Architect | Boundaries, data flow, risks, technical design |
| Delivery Build | Senior Developer | Implementation, code quality, tests |
| Quality Check | QA Engineer | Test plan, regression, smoke tests |
| Work Planning | Scrum Master | Story prep, blockers, handoff |
| Security Review | Security Engineer | Auth, secrets, data exposure, abuse risk |
| Value Signals | USP AI Strategist | AI/KI USPs, differentiation, USP Score |
| Innovation Design | Innovation Workflow | App-first radical USPs and MVP choice |
| Radical Design | Radical Vibe Builder | 10x future features that eliminate workflows |
| Release Delivery | Release Manager | Readiness, verification, release notes |
| Gap Review | Gap Scanner | Missing work before release or handoff |
| Release Score | Release Readiness Score | 0-100 release confidence |
| Traceability | Traceability Mapper | PRD/story/code/test evidence |
| Command Center | Command Center | Dashboard and operating overview |
| Risk Radar | Risk Radar | Security, dependency, migration, generated-file, release risk |
| Rollback Plan | Rollback Planner | Recovery plans and fallback steps |
| Verification Registry | Verification Registry | Known-good commands and confidence |
| Decision Record | Decision Log | Durable product and architecture decisions |
| Delivery Brief | PR Summary Builder | PR and handoff summaries |
| Differentiation Matrix | Differentiation Matrix | Capability, market, and moat positioning |

Examples:

```text
Value Signals: find 10 AI product advantages for this app, score them, and recommend the first MVP.
```

```text
Delivery Build: implement this story with a minimal diff, existing patterns, and tests.
```

```text
Quality Check: create a regression test plan and an application smoke test for this change.
```

## Main Commands

### Launch An MVP End To End

Use `$launch-mvp` for one resumable path from an idea or existing-app opportunity to a release decision. It persists the MVP brief, tester plan, current stage, and completed-stage evidence in `.codex-orchestrator/product/`.

```text
node bin/forgemind.mjs launch-mvp --goal "Shorten invoice approvals" --audience "Finance teams" --json
node bin/forgemind.mjs launch-mvp status --json
```

The required order is `discover`, `test`, `build`, `verify`, then `release`. Advance a stage only after its evidence exists:

```text
node bin/forgemind.mjs launch-mvp advance --stage discover --json
node bin/forgemind.mjs launch-mvp advance --stage test --json
node bin/forgemind.mjs launch-mvp advance --stage build --evidence "acceptance" --json
node bin/forgemind.mjs launch-mvp advance --stage verify --evidence "passed" --json
node bin/forgemind.mjs launch-mvp advance --stage release --evidence "delivery-proof|rollback" --json
```

Do not advance a stopped launch. Kill conditions, critical or blocked tester findings, failed verification, and approval requirements stop it.

### Record And Evaluate MVP Tests

Use `$mvp-test-lab` to prepare target-user, functional, accessibility, and adversarial testing. Create a plan, record privacy-safe results, then read the decision:

```text
node bin/forgemind.mjs testing plan --goal "Shorten invoice approvals" --audience "Finance teams" --json
node bin/forgemind.mjs testing record --panel target-user --outcome passed --completed true --evidence "session-1" --json
node bin/forgemind.mjs testing evaluate --json
```

Supported panels are `target-user`, `functional`, `accessibility`, and `adversarial`. Use `--critical` for a release-blocking finding and `--simulated` for non-user evidence. Never store names, contact data, recordings, credentials, or raw prompts. Decisions are `collecting`, `scale`, `iterate`, or `stop`.

### Help And Routing

```text
ForgeMind Help: show commands, modes, and when to use which workflow.
```

```text
Workflow Menu: show named personas and recommend who should handle this task.
```

```text
Delivery Orchestrator: route this coding task.
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
Product Scope: create a PRD for this feature and update docs/forgemind/prd.md.
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
Work Planning: prepare this story for implementation with tasks, blockers, and handoff notes.
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
Radical Design: analyze this app, generate 5 radical AI/KI 10x features, choose the boldest buildable MVP, and produce a build-ready plan.
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
- Use `autonomous` for “take care of it,” “get started,” or “handle end to end.”
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
Security Review: check auth, secrets, data exposure, dependencies, prompt injection, and AI tool risks.
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
Orchestration Flow: take ownership as Delivery Orchestrator.
1. Inspect the app structure.
2. Explain briefly what the app does today.
3. Generate 5 radical AI ideas and 6 realistic feature ideas.
4. Score the strongest product advantages.
5. Select the best buildable MVP.
6. Create or update the PRD, epics, story, and acceptance criteria.
7. Implement the MVP.
8. Test the app and summarize verification, risks, and next steps.
```

### Product-Only Prompt

```text
Value Signals: analyze this app for product advantages. What is baseline functionality, what can be extended, and what could become a meaningful AI moat? Provide scores and the strongest MVP.
```

### Build-Only Prompt

```text
Delivery Build: implement this story with a minimal diff. Use existing patterns, add focused tests, and run relevant verification.
```

### QA Prompt

```text
Quality Check: review this change for regressions, edge cases, and missing tests. Define an application smoke test and clear pass/fail criteria.
```

### Release Prompt

```text
Release Delivery: prepare completion. Review scope, verification, risks, release notes, and rollback guidance.
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
Workflow Menu: show named personas and recommend who should handle this task.
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
