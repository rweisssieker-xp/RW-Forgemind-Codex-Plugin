# Product Intelligence Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give ForgeMind cited product intelligence, reviewable decisions, and bounded continuous delivery.

**Architecture:** Focused modules model the repository, normalize cited research, derive evidence-aware bets, prepare approved project decisions, and determine the next safe delivery gate. Existing Product, Explore, Radical, and Dashboard surfaces consume those modules.

**Tech Stack:** Node.js 20+, ES modules, Node test runner, JSON artifacts, Markdown, static HTML.

## Global Constraints

- Keep the nine visible Marketplace journeys and portable bundled runner.
- Detailed state is external by default; approved decision documents belong in `docs/forgemind/`.
- `--artifacts none` persists neither state nor project documents.
- Every `--json` success or failure includes `artifactMode`, `artifactPath`, and `projectDocuments`.
- External research is browsed and cited by Codex, then imported as JSON; the CLI has no hidden network client.
- Automation stops at secrets, production, destructive, irreversible, billed, legal, compliance, and high-stakes boundaries.

---

### Task 1: Normalize response and publication contracts

**Files:** Modify `src/cli.mjs`, `src/artifact-store.mjs`, `src/project-documents.mjs`; test `tests/cli.test.mjs` and `tests/artifact-store.test.mjs`.

**Interfaces:** `withResponseMetadata(data, metadata)` returns `{ ...data, artifactMode, artifactPath, projectDocuments }`. `publishDecision(input)` returns a preview unless `approve` is true.

- [ ] Write failing tests that assert `runCli(['help', '--json'])` and an unknown command both return `artifactMode`, `artifactPath`, and `projectDocuments: []`.
- [ ] Run `node --test tests/cli.test.mjs tests/artifact-store.test.mjs`; expect the absent metadata assertion to fail.
- [ ] Implement `withResponseMetadata(data = {}, meta = artifactMetadata()) { return { ...data, artifactMode: meta.artifactMode, artifactPath: meta.artifactPath, projectDocuments: data.projectDocuments ?? [] }; }` and invoke it for help, results, and normalized errors.
- [ ] Make publication return `review-required` with a diff for existing documents and persist only approved records; preserve no-persistence in artifact mode `none`.
- [ ] Run the focused tests; expect PASS; commit `feat: normalize artifact and publication contracts`.

### Task 2: Add App Intelligence and Evidence Engine

**Files:** Create `src/app-intelligence.mjs`, `src/evidence-engine.mjs`, `schemas/evidence-claim-v1.schema.json`; modify `src/cli.mjs`; test `tests/app-intelligence.test.mjs` and `tests/evidence-engine.test.mjs`.

**Interfaces:** `scanAppIntelligence({ workspace })`, `importEvidence({ workspace, input })`, `assessEvidence({ workspace, goal })`, `requiresExternalResearch(goal)`.

- [ ] Write failing CLI tests for `intelligence scan` returning labelled route, data, test, integration, and flow findings without project writes, and `evidence assess --goal "B2B pricing"` returning `researchRequired: true`.
- [ ] Run `node --test tests/app-intelligence.test.mjs tests/evidence-engine.test.mjs`; expect `FM_COMMAND_UNKNOWN`.
- [ ] Implement read-only project modelling from normalized file markers and `inspectProject`; every inferred flow is `{ status: 'hypothesis', sourceFiles, confidence }`.
- [ ] Implement strict cited-claim imports requiring `url`, `title`, `claim`, `retrievedAt`, `sourceType`, `classification`, `confidence`, and `limitations`; compute freshness, evidence gaps, and contradictions. `requiresExternalResearch` matches market, USP, competition, pricing, business case, launch, and radical goals.
- [ ] Store reports through `artifactStatePath`, add command dispatch, run the focused tests, and commit `feat: add app intelligence and cited evidence`.

### Task 3: Replace fixed bets and direct writes

**Files:** Create `src/adaptive-innovation.mjs`, `src/decision-ledger.mjs`; modify `src/innovation-portfolio.mjs`, `src/radical-product.mjs`, `src/experience-lab.mjs`, `src/product-ops-lab.mjs`, `src/product-os.mjs`, and `src/cli.mjs`; test `tests/adaptive-innovation.test.mjs` and `tests/decision-ledger.test.mjs`.

**Interfaces:** `generateAdaptivePortfolio({ workspace, goal, radical })`, `prepareDecision(input)`, `approveDecision({ workspace, previewId })`.

- [ ] Write failing tests proving imported counter-evidence changes the leading candidate and an existing `docs/forgemind/market-opportunity.md` is unchanged after a preview.
- [ ] Run `node --test tests/adaptive-innovation.test.mjs tests/decision-ledger.test.mjs`; expect absent exports.
- [ ] Generate candidates from project findings plus evidence dimensions. Every candidate has `interactionReplaced`, `usp`, `businessModel`, `tenXMetric`, `counterHypothesis`, `killCondition`, `safetyBoundary`, `mvp`, and score; rank by impact, feasibility, differentiation, evidence, and contradiction penalty, never array position.
- [ ] Implement ledger preview artifacts with stable IDs, unified diff, provenance, evidence IDs, and revision hashes. Permit document replacement only through `product decide --publish approve`.
- [ ] Route Explore, Radical, Product scan, market case, and finance through the adaptive portfolio and ledger. Run focused and existing Product/Radical tests; commit `feat: add adaptive innovation and reviewed decisions`.

### Task 4: Add controller, dashboard, skill guidance, and release

**Files:** Create `src/delivery-controller.mjs`; modify `src/product-os.mjs`, `src/dashboard.mjs`, `src/cli.mjs`, `entry-skills/forgemind-product/SKILL.md`, `entry-skills/forgemind-explore/SKILL.md`, `entry-skills/forgemind-radical/SKILL.md`, `README.md`, `docs/WORKFLOWS.md`, `docs/HANDBOOK.md`, `PRIVACY.md`, `CHANGELOG.md`, package manifests, and `plugins/forgemind/**`; test `tests/delivery-controller.test.mjs`, `tests/dashboard.test.mjs`, and release documentation tests.

**Interfaces:** `nextDeliveryAction({ workspace, mode })`, `continueDelivery({ workspace, mode })`; dashboard section `decision-summary`.

- [ ] Write failing tests where `product continue --mode guided` returns `review-required` and explicit blockers for unsafe or unverified work, while dashboard includes `decision-summary`.
- [ ] Run `node --test tests/delivery-controller.test.mjs tests/dashboard.test.mjs`; expect missing controller contract and section.
- [ ] Implement `nextDeliveryAction`: collect Product OS, evidence, verification, rollback, and policy state; select the first open gate; return `ready` only for reversible, testable, non-billed, non-production work; otherwise return a review request.
- [ ] Render one prioritized summary containing opportunity confidence, counter-evidence, business viability, top risk, freshness, delivery gate, and decision-document link.
- [ ] Update skills: market, USP, competition, pricing, business case, launch, and radical requests require cited research import; Product uses the controller after every safe action instead of stopping at partial completion.
- [ ] Version as 1.27.0; run `npm test && npm run validate && npm run eval && npm run build && node bin/forgemind.mjs validate --plugin dist/plugin --strict-release`; copy package snapshots, remove generated source checksums, commit `feat: release product intelligence runtime`, push main, tag and release `v1.27.0`.

## Self-review

- Tasks cover the response contract, project model, cited evidence, adaptive bets, decision publication, continuation, dashboard, skill guidance, documentation, packaging, and release.
- Consumers depend only on interfaces introduced in earlier tasks.
- Each task begins with a failure assertion and ends with focused verification and a commit.
