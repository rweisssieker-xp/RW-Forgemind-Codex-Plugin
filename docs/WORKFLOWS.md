# ForgeMind Workflows

For the complete command and persona manual, see `HANDBOOK.md`.

## Primary Journey Map

Every ForgeMind skill has exactly one primary journey: **Discover**, **Design**, **Build**, **Verify**, **Release**, or **Learn**. Users choose the desired outcome; the router selects the specialist skill. Autonomous workflows share this precedence: safety -> debugging -> discovery -> product/USP -> implementation -> verification -> learning.

The portable CLI is the cross-platform execution surface:

```text
node bin/forgemind.mjs inspect
node bin/forgemind.mjs init
node bin/forgemind.mjs verify --run
node bin/forgemind.mjs readiness
node bin/forgemind.mjs dashboard
```

PowerShell scripts are compatibility aliases only and delegate to the same CLI behavior.

## Trust Fabric

Use `forgemind forge help` for the nine evidence-native capabilities that span all six journeys. Trust contracts and the flight recorder strengthen Verify; strategy, tournaments, and shrink plans strengthen Design; product loops, genomes, and federation strengthen Learn; evidence escrow strengthens Release. They use the same sealed local record store and never bypass the normal safety, verification, or approval precedence.

The complete action matrix and boundaries are in `TRUST_FABRIC.md`.

## Delivery Acceleration

Use when Codex should behave like a senior product engineer.

1. Project intelligence
2. Skill routing with confidence
3. USP/AI pass when user-facing
4. PRD/story/acceptance traceability
5. Architecture pass
6. Implementation plan
7. Build
8. Review and verify
9. Risk radar, rollback plan, gap scan, and release readiness score
10. PR summary, outcome memory, and learning update

## YOLO Feature

Use when the user wants autonomous end-to-end delivery.

Guardrails:

- no destructive git operations
- no secrets or production changes without approval
- no unrelated refactors
- verification required unless blocked
- surgery mode requires explicit approval

## USP / AI Strategy

Use when the user asks for USPs, KI ideas, AI differentiation, moat, product value, or monetization angles.

Output should include ranked ideas, MVP, complexity, trust level, and success signal.

## Verification

Use `node bin/forgemind.mjs verify`:

- no flags: show detected commands
- `--run`: execute verified commands
- `--include-inferred`: also run inferred commands

Reports include status and failure categories such as `test`, `build`, `lint`, `typecheck`, `permission`, and `missing-dependency`.

## Gap Scan And Release Readiness

Use these before handoff, release, PR, or installer distribution:

```text
node bin/forgemind.mjs gaps
node bin/forgemind.mjs readiness
```

The gap scan reports missing verification, docs, changelog, CI, packaging, traceability, runtime discovery, memory, and git handoff evidence. The release score turns that evidence into a 0-100 decision: `blocked`, `risky`, `ready-with-notes`, or `ready`.

## Risk, Rollback, And PR Summary

Use these before a risky merge, release, installer update, dependency change, or PR handoff:

```text
node bin/forgemind.mjs risks
node bin/forgemind.mjs legacy generate-rollback-plan -Change "Feature name"
node bin/forgemind.mjs legacy generate-pr-summary -Title "Feature name"
```

Risk Radar flags secret-like files, migrations, dependency changes, generated artifacts, installer/CI changes, missing verification, and large diffs. Rollback Planner writes `docs/forgemind/rollback-plan.md`. PR Summary Builder writes `.codex-orchestrator/reports/pr-summary.md`.

## Traceability

Use this after implementation to connect product intent to code and tests:

```powershell
.\plugins\forgemind\scripts\add-traceability.ps1 -Feature "Feature name" -Story "Story id" -Acceptance "Acceptance summary"
```

The artifact lives in `docs/forgemind/traceability.md`.

## Verification Registry And Decisions

Use these to make repeatable project knowledge durable:

```powershell
.\plugins\forgemind\scripts\register-verification.ps1 -Command "npm test" -Category test -When "before release"
.\plugins\forgemind\scripts\record-decision.ps1 -Decision "Use X" -Rationale "Because Y"
```

Verification entries live in `.codex-orchestrator/memory/verification-registry.md`. Decisions live in `.codex-orchestrator/memory/decisions.md`.

## Workflow Graph

Use this to refresh the visible ForgeMind state machine:

```powershell
.\plugins\forgemind\scripts\generate-workflow-graph.ps1
```

The graph lives in `.codex-orchestrator/workflow-graph.md`.

## Runtime Discovery

Use this after installing or packaging the plugin:

```powershell
.\plugins\forgemind\scripts\runtime-discovery-test.ps1
```

It checks the Codex plugin cache, marketplace registration, config entry, manifest, skills, and hook references.

## Dashboard

Use `scripts/generate-dashboard.ps1` to render the command center into `.codex-orchestrator/dashboard/index.html`.

The command center includes project profile, workflow graph, verification, gap scan, release readiness, risk radar, runtime discovery, traceability, rollback plan, PR summary, USP backlog, outcome memory, learning, and patterns.

## Learning Loop

Use after substantial work, failed checks, repeated corrections, or explicit user feedback.

1. Record what worked.
2. Record mistakes and wrong assumptions.
3. Capture durable user preferences.
4. Extract reusable patterns.
5. Propose ForgeMind self-updates when a rule, template, or skill should improve.
6. Record actual outcome and route effectiveness in outcome memory.
7. Convert repeated failures into self-update proposals when useful.

Scripts:

```powershell
.\plugins\forgemind\scripts\record-learning.ps1 -Task "Feature X" -Outcome success -MemoryUsed -Note "Pattern extracted"
.\plugins\forgemind\scripts\update-usp-backlog.ps1 -Title "AI feature" -Score 82 -Experiment "Smoke test"
.\plugins\forgemind\scripts\init-global-memory.ps1
```

## Self-Update

Use `apply-self-update` when ForgeMind has collected proposals in `self-update-proposals.md`.

Rules:

- review proposals before applying
- reject unsafe or overfit proposals
- update focused files only
- run `scripts/test-forgemind.ps1` after applying
- update `CHANGELOG.md` when behavior changes

## Max USP Mode

For product-facing work, ForgeMind should answer:

- What is the clearest differentiator?
- Where does AI/KI reduce time, risk, uncertainty, or manual effort?
- What would a user pay for?
- What data advantage or workflow lock-in exists?
- What should not be built because it is a gimmick, risky, or too expensive?
