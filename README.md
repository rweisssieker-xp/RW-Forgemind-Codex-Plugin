# ForgeMind

ForgeMind is an evidence-first product innovation and delivery plugin for Codex, published by [Aivana GmbH](https://aivana-gmbh.ai/). It turns ideas and existing applications into disruptive, market-aware, testable MVPs while keeping a clear boundary between facts, assumptions, and release proof.

## Recommended starting points

Start with one of three clear outcomes. Specialist playbooks are packaged internally and selected by ForgeMind when relevant.

| Start | Prompt | Result |
| --- | --- | --- |
| Compass | `$forgemind-compass Build a CRM for our sales team autonomously.` | Chooses and applies the appropriate internal playbook, then reports the next safe action. |
| Guide | `$forgemind-guide Help me decide how to improve this application.` | A non-executing route recommendation with confidence and alternatives. |
| Innovate | `$forgemind-innovate Find disruptive AI opportunities for this SaaS product.` | AI-central USP hypotheses, moats, metrics, and safe cohort experiments. |
| GUI Draft | `$forgemind-design-fidelity Implement this selected local UI draft.` | Implements the selected draft in UI source and verifies visual improvement. |
| Commands | `$forgemind-commands` | Compact navigator for Leap, Spark, Venture, Ship, Growth, and other advanced workflows. |
| Quality/release | `$forgemind-xray Assess this application with read-only local QA.` | Evidence-backed quality findings and release proof. |

Every entry works without appended text. Compass is the default route; Guide explains the route without executing it; Innovate and Xray are intentionally explicit. The first response states the derived goal; any supplied text overrides it.

Use **Compass** by default. It persists the PRD → architecture → epics → stories chain, starts a bounded autonomous mission when appropriate, and reports the one next action through `forgemind status`. Use the advanced CLI for deliberate control of an individual domain command.

`forgemind insights` reports only local, aggregate command outcomes (success rate and duration); it never stores raw prompts or sends telemetry.

## AI Opportunity Engine for SaaS

Use the advanced CLI command below to turn a SaaS workflow into ranked, AI-central USP hypotheses. It produces bounded experiments for outcome agents, predictive workflows, multimodal intake, company memory, simulations, and autonomous QA triage. Each card states the interaction it replaces, a defensible moat, a feature flag, cohort, metric, guardrails, and kill condition.

```text
forgemind innovation saas --goal "Reduce renewal-risk research time"
```

The same report includes an Activation Map, Churn Radar, Pricing Lab, Feature-to-Revenue Trace, Tenant-Safety Gate, Integration Health checks, and staged release cohorts. It writes only local planning evidence; it does not contact customers, change billing, access production tenants, or invoke integrations without an explicitly configured adapter.

## Developer automode

Use **Autopilot** when the Codex goal itself is the delivery contract:

```text
$forgemind-autopilot Autonomously achieve this Codex goal end to end.
```

Autopilot persists its mission, checkpoint and action receipts below `.codex-orchestrator/`. It makes routine implementation decisions itself, runs only explicitly scoped adapters, and recovers reversible failures within its retry budget. It pauses only for credentials, irreversible migrations or deletion, real spend, production impact, legal or contractual decisions, platform-required approval, or an objectively blocked goal.

Use **Portfolio** and **Transform** to discover every defensible AI-native USP in the repository and run the eligible candidates as isolated child missions. The scheduler defaults to three concurrent, non-conflicting candidates; all candidates are retained as hypotheses with metrics, guardrails, kill conditions, and rollback paths.

Use **Twin** before broad product work to map repository-derived workflows and knowledge gaps. **Evolve UI** stages a feature-flagged, reversible outcome-flow experiment. **Growth** creates non-contact, non-spend experiment plans. Portfolio invokes a six-perspective Product Lab, Autopilot retains verified Outcome Memory, and Transform prepares an Integration Mesh; none of these capabilities makes market, user, or production claims without evidence and an authorized adapter.

Use **Xray** for an independent, read-only QA pass across detected local CLI, API, integration, and GUI surfaces. `$forgemind-xray` uses the internal Codex Browser for safe flows on an explicit local/test web URL, passes complete receipts to the canonical Xray report, and records unavailable controls as test gaps rather than claiming coverage. Direct CLI use retains its workspace-local Playwright adapter.

Use **Leap** for fast autonomous MVP work:

```text
$forgemind-leap Analyze this existing app, select the strongest disruptive AI opportunity, and implement the tested, reversible MVP autonomously. Do not ask routine questions; pause only for safety, production, or cost decisions.
```

Leap analyzes the repository, creates radical alternatives, calculates an evidence-labelled opportunity and business case, selects a reversible bet with a kill condition, and drives delivery through a YOLO Hero Loop. The loop advances implementation, functional proof, experience proof, and risk/release readiness as evidence-gated work packets; it retries bounded failures autonomously and never claims that an assumption is market evidence.

### Example: build a CRM autonomously

Use this prompt to create a locally runnable, production-minded CRM MVP with minimal routine interaction:

```text
$forgemind-leap

Build a production-minded, locally runnable CRM MVP autonomously.

Goal:
A small B2B team can manage contacts, companies, deals, and activities efficiently.

First create the Foundation planning spine automatically, then continue without routine questions:
- generate project context, PRD, architecture spine, NFRs, epics, stories, and sprint status
- select a modern, maintainable stack
- build a responsive web application with local data storage and seed data
- prepare authentication, roles, and permissions
- implement contacts, companies, a deal pipeline, activities, notes, search, and a dashboard
- include useful empty, loading, error, and success states
- run functional tests, accessibility checks, visual QA, risk checks, rollback planning, and release-readiness checks
- document every assumption clearly
- pause only for credentials, external spend, production impact, irreversible migrations or deletion, or legal/compliance decisions

Product principle:
Prefer a few clear workflows over feature overload:
capture a lead → qualify company and contact → move a deal through the pipeline → plan the next activity → measure the outcome.

Deliverable:
A locally runnable, tested CRM MVP with README, seed data, architecture and product artifacts, and an evidence-backed handoff report.
```

Optionally append a required stack, for example: `Use Next.js, TypeScript, PostgreSQL/Prisma, shadcn/ui, and Playwright.` If no stack is supplied, ForgeMind selects a conservative fit from the project context.

Use `hero run` for the local Mission Control view. It joins the active Hero Loop with a feature-flag experiment contract, configured research/telemetry connectors, release gates, and a benchmark scorecard. `hero execute --run` runs local verification only; it never silently deploys, spends money, contacts an external service, or changes a remote feature flag.

## What makes it different

- **Disruption before feature lists:** AI must eliminate or replace a user interaction, not merely decorate it.
- **Existing-app first:** product bets start from the actual repository and its constraints.
- **Evidence-to-Action market engine:** Venture adds source ranking, competitor map, bottom-up reachable-account sizing, willingness-to-pay, buyer journey, sensitivity, market memory, and the next highest-decision-value experiments.
- **Experience Intelligence:** Hero Control creates a visual quality gate, AI UX critique contract, outcome metrics, adaptive-interface plan, multimodal intake, project-local AI memory, counterfactuals, and self-healing UX experiments.
- **Kill conditions:** every material bet has a measurable reason to stop.
- **Fast with guardrails:** YOLO-style delivery continues autonomously until a genuine hard stop.
- **Evidence-native:** decisions, tests, risks, dissent, and release claims are visibly separated from assumptions.
- **Clean distribution:** generated state always stays in the target project, never in the installed plugin.

## Clean artifact storage

By default, every generated ForgeMind state file goes to the target project:

```text
<target-project>/.codex-orchestrator/
```

The target app remains the source for inspection, implementation, tests, signals, and generated state. Durable, human-readable decisions are written to `docs/forgemind/` in that same target app. Nothing is written to the installed plugin directory.

- `--artifacts workspace` is the default.
- `--artifacts local` is a backwards-compatible alias for `workspace`.
- `--artifacts none` returns one-shot JSON without persistence.
- External `--artifact-dir` destinations are disabled; persistent artifacts always remain in the target project.

Every JSON response includes `artifactMode` and absolute `artifactPath`.

## Running a local UI-test script

`ui-test run` intentionally accepts only the name of a script declared in the target project's `package.json`; it executes that script as `npm run <script>` without a shell. This keeps the command auditable and prevents shell syntax from being interpreted as part of a test command.

```text
node <plugin-root>/bin/forgemind.mjs ui-test run --command test:e2e --artifacts workspace --json
```

## Product Design to Design Fidelity

For a controlled visual handoff, let `@Product Design` create exactly three local PNG variants, persist them with `design-fidelity propose`, and have the user explicitly select one proposal. ForgeMind binds that decision to the route and viewport, verifies its artifacts, requires an observable control contract, and creates a bounded implementation work order. The agent then implements the selected draft and re-measures it; ForgeMind blocks a regression or exhausted iteration limit.

```text
node <plugin-root>/bin/forgemind.mjs design-fidelity propose --inputs option-a.png,option-b.png,option-c.png --route http://127.0.0.1:4173/ --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs design-fidelity select --proposal-set <set-id> --proposal proposal-2 --reason "Clearer customer hierarchy" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs design-fidelity contract --contract '{"id":"customer-controls","route":"http://127.0.0.1:4173/","controls":[{"id":"new-customer","role":"button","name":"New customer"}]}' --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs design-fidelity prepare --proposal-set <set-id> --proposal proposal-2 --control-contract customer-controls --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs design-fidelity run --draft-id <draft-id> --control-contract customer-controls --control-observations '<observations-json>' --artifacts workspace --json
```

## Portable CLI

For controlled installation, use `node bin/forgemind.mjs install --source <package-path> --home <codex-home>`. ForgeMind installs only to `<codex-home>/plugins/forgemind`; `--destination` is a compatible alias and `--plugin-path <codex-home>/plugins/forgemind` is available for explicit local or team targets.

Marketplace installation makes the skills available in Codex; it does not require a global shell command. The portable runner is:

```text
node <plugin-root>/bin/forgemind.mjs leap run --goal "Eliminate manual case triage" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs compass run --goal "Choose the right ForgeMind journey" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs venture run --goal "Validate an AI triage copilot" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs ship plan --goal "Release a flagged, reversible MVP" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs autopilot start --goal "Implement and prove this Codex goal" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs autopilot run --artifacts workspace --json
```

From a source checkout, the equivalent maintainer command is `node bin/forgemind.mjs`. The legacy `launch-mvp` CLI remains available for a resumable, staged MVP launch and tester-evidence loop; new work should start through Leap or Ship.

```text
node bin/forgemind.mjs launch-mvp start --goal "Validate a reversible MVP" --json
node bin/forgemind.mjs testing plan --goal "Validate a reversible MVP" --json
node bin/forgemind.mjs testing evaluate --json
```

The tester decision is explicit: scale, iterate, or stop. Target-user, functional, accessibility, and adversarial findings are evidence—not a substitute for the seven primary journeys.

## Install from GitHub

```text
codex plugin marketplace add rweisssieker-xp/RW-Forgemind-Codex-Plugin --ref main
codex plugin add forgemind@forgemind-marketplace
```

To update an existing installation, refresh the marketplace checkout and reinstall:

```text
git -C ~/.codex/.tmp/marketplaces/forgemind-marketplace pull --ff-only origin main
codex plugin add forgemind@forgemind-marketplace
```

See [the hierarchy](docs/HIERARCHY.md), [installation guide](docs/INSTALL.md), and [workflow guide](docs/WORKFLOWS.md) for operational detail.
