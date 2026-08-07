# ForgeMind Workflows

For the complete command and persona manual, see `HANDBOOK.md`.

## Primary Journey Map

ForgeMind exposes eight journeys: **Guide**, **Explore**, **Radical**, **Plan**, **Build**, **Complete**, **Verify**, and **Learn**. Users choose the desired outcome; Guide selects the smallest sufficient journey and its playbooks. Safety always takes precedence over discovery, planning, implementation, verification, and learning.

The portable CLI is the cross-platform execution surface:

```text
node bin/forgemind.mjs inspect
node bin/forgemind.mjs init
node bin/forgemind.mjs verify --run
node bin/forgemind.mjs readiness
node bin/forgemind.mjs dashboard
```

PowerShell scripts are source-maintainer compatibility aliases only. They are not present in the installed Core plugin; use the eight journeys or the portable CLI there.

## Complete End To End

Use `$forgemind-complete` for an outcome that must not stop at scaffolding or a partial vertical slice. It derives a Definition of Done, continues through safe independent tasks, and records optional evidence gaps without turning them into build blockers.

```text
node bin/forgemind.mjs complete --goal "Finish the account settings experience" --acceptance "Profile updates persist|Password validation is covered|The focused tests pass" --json
node bin/forgemind.mjs complete status --json
```

## Trust Fabric

Use `forgemind forge help` for the nine evidence-native capabilities that span all eight journeys. Trust contracts and the flight recorder strengthen Verify; strategy, tournaments, and shrink plans strengthen Design; product loops, genomes, and federation strengthen Learn; evidence escrow strengthens Release. They use the same sealed local record store and never bypass the normal safety, verification, or approval precedence.

The complete action matrix and boundaries are in `TRUST_FABRIC.md`.

## Experience And Opportunity Lab

Before committing to a material GUI, feature, or product bet, produce an assumption-labelled market chance and business case, then compare three reversible experience directions:

```text
node bin/forgemind.mjs experience canvas --goal "Shorten invoice approvals" --market-size 500 --penetration 5 --price 100 --build-cost 10000 --monthly-cost 500 --json
```

The artifact combines a UX failure forecast, counterfactual tournament, task-time target, market chance, business case, experiment, and kill condition. It never upgrades project assumptions into market facts.

## Radical Product Engine

For radical AI, 10x, Vibe Build, UI-elimination, or autonomous-agent work, use `$forgemind-radical`. It replaces a complete interaction rather than adding a conventional feature, creates five AI-central paradigms, and produces an evidence-labelled MVP blueprint.

```text
node bin/forgemind.mjs radical analyze --goal "Eliminate manual approval follow-up" --json
node bin/forgemind.mjs radical select --id outcome-operator --json
node bin/forgemind.mjs radical blueprint --json
node bin/forgemind.mjs radical shadow-mode --json
```

The blueprint covers the new paradigm, minimal input, agent decisions and permitted data, components, lean UI, build steps, 10x metric, moat, kill condition, and rollback boundary. Shadow Mode stages autonomy as Observe → Suggest → Approve → Bounded Autopilot. It never grants autonomous production, secret, destructive, irreversible, externally billed, legal, or high-stakes actions.

## AI-Native Execution Layer

The following local-first commands make the eight advanced capabilities operational. They write evidence-labelled artifacts and do not contact providers or external systems without an explicit project adapter.

```text
forgemind operator plan --goal "Approve invoices" --json
forgemind observer --input events.json --json
forgemind experiment-autopilot create --goal "Reduce approval time" --json
forgemind ai --json
forgemind ai-refactor --json
forgemind truth-loop --goal "Reduce approval time" --json
forgemind autonomy --json
forgemind demo --title "Approval proof" --json
```

For user-facing delivery, persist the state matrix and required test layers, then use drift detection, review-only flaky-test repair proposals, and a proof-carrying demo:

```text
node bin/forgemind.mjs experience evidence --task "Approve invoice" --json
node bin/forgemind.mjs experience demo --title "Approval proof" --json
```

## Evidence-Connected Product Operations

Import dated, cited market research rather than treating an LLM assumption as evidence. Add unit economics across conservative, base, and upside scenarios; CAC, churn, sales cycle, operating cost, and customer growth remain editable assumptions.

```text
node bin/forgemind.mjs research --input sources.json --json
node bin/forgemind.mjs finance --price 100 --cac 300 --churn 3 --new-customers 12 --json
node bin/forgemind.mjs telemetry --input events.json --source product-export --json
node bin/forgemind.mjs discovery-loop --goal "Shorten invoice approvals" --json
node bin/forgemind.mjs portfolio --json
```

`sources.json` is an array of `{ "title", "url", "claim", "confidence" }` records. `events.json` is a privacy-minimized array of event names, timestamps, optional pseudonymous users, and properties. The cockpit ranks the evidence that is present; it does not convert research or correlations into a release decision.

For GUI quality, choose the installed test layer, retain a real run, and consume the report from the project's perceptual visual tool. ForgeMind deliberately does not claim that byte-identical images are a visual regression check, and it never applies a selector repair to source automatically.

```text
node bin/forgemind.mjs ui-test plan --url http://localhost:3000 --json
node bin/forgemind.mjs ui-test run --command "npm run test:e2e" --timeout 120 --json
node bin/forgemind.mjs ui-test perceptual --input visual-report.json --threshold 0.02 --json
node bin/forgemind.mjs ui-test repair --failure "CTA renamed" --replacement "getByRole('button', { name: 'Continue' })" --json
```

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

## One-Session MVP Launch

Use `$forgemind-plan` when an idea or existing-app opportunity should progress through discovery, testing, implementation, verification, and a release decision without manually selecting each workflow.

```text
node bin/forgemind.mjs launch-mvp --goal "Shorten invoice approvals" --audience "Finance teams" --json
node bin/forgemind.mjs launch-mvp status --json
```

The persisted stages are `discover`, `test`, `build`, `verify`, and `release`. Complete the active stage only with its required evidence:

```text
node bin/forgemind.mjs launch-mvp advance --stage discover --json
node bin/forgemind.mjs launch-mvp advance --stage test --json
node bin/forgemind.mjs launch-mvp advance --stage build --evidence "acceptance" --json
node bin/forgemind.mjs launch-mvp advance --stage verify --evidence "passed" --json
node bin/forgemind.mjs launch-mvp advance --stage release --evidence "delivery-proof|rollback" --json
```

The launch stops when its kill condition is met, a tester result is critical or blocked, verification fails, or a safety gate requires approval. A stopped launch must be rescaled or restarted; it must not be presented as release-ready.

## MVP Tester Evidence

Create a plan before collecting results:

```text
node bin/forgemind.mjs testing plan --goal "Shorten invoice approvals" --audience "Finance teams" --json
```

Record one result at a time. `target-user`, `functional`, `accessibility`, and `adversarial` are the supported panels. Mark simulated evidence explicitly and never store participant names, contact details, recordings, or credentials.

```text
node bin/forgemind.mjs testing record --panel target-user --outcome passed --completed true --evidence "session-1" --json
node bin/forgemind.mjs testing record --panel functional --outcome blocked --critical --evidence "critical-defect" --json
node bin/forgemind.mjs testing evaluate --json
```

The decision is `collecting` until enough evidence exists, `scale` when all panels pass and at least four of five target-user sessions complete independently, `iterate` for mixed evidence, and `stop` for critical findings or fewer than two independent completions after five target-user sessions.

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
node bin/forgemind.mjs evidence
node bin/forgemind.mjs readiness
```

Risk Radar flags secret-like files, migrations, dependency changes, generated artifacts, installer/CI changes, missing verification, and large diffs. Use `$forgemind-verify` when you need a rollback plan or an evidence-backed handoff summary.

## Traceability

Use this after implementation to connect product intent to code and tests:

```powershell
.\scripts\add-traceability.ps1 -Feature "Feature name" -Story "Story id" -Acceptance "Acceptance summary"
```

The artifact lives in `docs/forgemind/traceability.md`.

## Verification Registry And Decisions

Use these to make repeatable project knowledge durable:

```powershell
.\scripts\register-verification.ps1 -Command "npm test" -Category test -When "before release"
.\scripts\record-decision.ps1 -Decision "Use X" -Rationale "Because Y"
```

Verification entries live in `.codex-orchestrator/memory/verification-registry.md`. Decisions live in `.codex-orchestrator/memory/decisions.md`.

## Workflow Graph

Use this to refresh the visible ForgeMind state machine:

```powershell
.\scripts\generate-workflow-graph.ps1
```

The graph lives in `.codex-orchestrator/workflow-graph.md`.

## Runtime Discovery

Use this after installing or packaging the plugin:

```powershell
.\scripts\runtime-discovery-test.ps1
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
.\scripts\record-learning.ps1 -Task "Feature X" -Outcome success -MemoryUsed -Note "Pattern extracted"
.\scripts\update-usp-backlog.ps1 -Title "AI feature" -Score 82 -Experiment "Smoke test"
.\scripts\init-global-memory.ps1
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
