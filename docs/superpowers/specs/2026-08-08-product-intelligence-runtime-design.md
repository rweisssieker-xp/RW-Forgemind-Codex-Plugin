# ForgeMind Product Intelligence Runtime Design

## Purpose

Turn ForgeMind from a collection of local product workflows into an evidence-adaptive Product Intelligence Runtime. It must understand an existing application, combine local and external evidence, create app-specific disruptive options, preserve reviewable decisions, and continue safe delivery until an achievable outcome is verified.

## Scope

This release adds five connected capabilities while preserving the nine Marketplace journeys and the existing local-first CLI contract:

1. **App Intelligence** creates a structured project model from source layout, dependencies, routes, UI components, tests, data stores, integrations, commands, and explicitly imported product signals.
2. **Evidence Engine** records local inputs and external research claims with source URL, retrieval timestamp, source type, claim, counter-evidence, freshness, confidence, and an explicit fact-or-assumption status.
3. **Adaptive Innovation** derives disruptive and commercial hypotheses from the project model and evidence graph, rather than returning a fixed ordered catalog. It produces alternatives, scores their evidence and delivery constraints, and retains kill conditions.
4. **Decision Ledger** publishes concise Markdown decision records in `docs/forgemind/` with a stable decision ID, provenance, content hash, revision history, diff preview, and an explicit overwrite policy.
5. **Delivery Controller** turns the Product OS into a bounded continuation loop. It determines the next gate, records a proposed action, verifies evidence after execution, and continues only when the action is safe, reversible, and inside the selected mode.

## Evidence-adaptive research policy

External research is automatically required for `market`, `usp`, `competition`, `pricing`, `business case`, `launch`, and `radical` goals. It is not started for local build, fix, refactor, test, or bounded YOLO requests unless the user asks for it.

External claims are never treated as facts merely because a URL exists. Each claim has:

- source URL and title;
- retrieval time and freshness band;
- source/evidence type;
- claim text and supporting excerpt reference;
- confidence and material limitation;
- optional counter-evidence;
- fact, inference, or assumption classification.

The runtime must not make legal, medical, financial, privacy, or compliance conclusions autonomously. High-stakes recommendations remain review-required.

## Components and boundaries

### App Intelligence

`src/app-intelligence.mjs` owns project analysis. It extends existing project inspection with a normalized `project-model-latest.json` containing detected architecture, route and UI candidates, test coverage signals, data and integration markers, user-flow hypotheses, and confidence per finding. It only reads the workspace.

### Evidence Engine

`src/evidence-engine.mjs` owns claim normalization, freshness scoring, contradiction detection, and evidence gaps. The Codex journey performs web research; the CLI accepts normalized imports through an explicit input file and never embeds a hidden network client. This preserves local-first installation while allowing the agent to use available cited research.

### Adaptive Innovation

`src/adaptive-innovation.mjs` creates a candidate set from the project model, evidence, goal, and optional radical constraints. It must generate multiple distinct hypotheses with a required interaction replacement, USP, business-model angle, 10x metric, evidence basis, counter-hypothesis, kill condition, safety boundary, and buildable MVP. Fixed archetypes may remain as inspiration, but cannot decide rank by their array order.

### Decision Ledger

`src/decision-ledger.mjs` owns durable Markdown records and a matching external revision index. On an existing document it calculates a diff and returns `review-required` by default. A document is overwritten only with `--publish approve`; `--publish preview` returns the diff without writing. Each approved revision includes its evidence IDs and the exact external artifact IDs from which it was rendered.

### Delivery Controller

`src/delivery-controller.mjs` owns product continuation. It receives an active Product OS run, completion contract, evidence graph, verification status, and policy outcome. It can propose or execute only an action classified as low-risk, reversible, testable, and non-billed. Otherwise it creates a review request with the blocked gate, missing evidence, and smallest required user decision.

### Decision Dashboard

`dashboard` gains a decision summary section: recommended action, opportunity confidence, top risk, strongest counter-evidence, decision deadline/freshness, delivery gate, and a direct link to the decision document. The dashboard remains static local HTML and does not transmit data.

## CLI and journey surface

The nine visible Marketplace journeys remain unchanged. New internal commands are grouped under existing product surfaces:

```text
forgemind intelligence scan --json
forgemind evidence import --input <claims.json> --json
forgemind evidence assess --goal "<outcome>" --json
forgemind innovation generate --goal "<outcome>" --json
forgemind product decide --publish preview --json
forgemind product decide --publish approve --json
forgemind product continue --mode guided --json
```

`$forgemind-product`, `$forgemind-explore`, and `$forgemind-radical` invoke the relevant commands automatically. They use the bundled plugin runner when no global CLI exists.

All successful and failed `--json` responses, including help and validation responses, contain `artifactMode`, `artifactPath`, and `projectDocuments`. `projectDocuments` is an empty list when no project document was written. `--artifacts none` produces no persisted cache state and no project documents.

## Artifact and publication policy

Machine-readable state stays in the configured external artifact root by default. Human-readable, approved decision records belong in `docs/forgemind/` in the application project. `--artifacts workspace` is the only mode that permits repository-local generated state under `.codex-orchestrator/`.

The ledger treats existing project documents as user-owned. It never silently replaces them. Preview is the default; approval is explicit. The external revision index makes a document reproducible without copying raw exploratory artifacts into the repository.

## Error handling and safety

- Missing or stale evidence returns `review-required`, never a fabricated market conclusion.
- Conflicting claims lower confidence and become visible counter-evidence.
- A missing external-research adapter reports a research gap and provides the exact normalized import contract.
- Controller actions pause at production, secrets, destructive, irreversible, externally billed, legal, compliance, or high-stakes boundaries.
- A failed test, verification gap, or absent rollback prevents a delivery action from being marked complete.

## Verification

Unit and CLI tests will prove that:

1. App intelligence derives deterministic, evidence-labelled project models without modifying the project.
2. Evidence imports reject malformed, stale, secret-bearing, or uncited claims and expose contradictions.
3. Innovation output changes when project model and evidence change; rankings do not depend on fixed candidate order.
4. Ledger preview never writes; approval writes a revision with provenance; existing user content is not silently overwritten.
5. `--artifacts none` persists neither state nor documents; every JSON success and error response has the artifact contract.
6. Delivery continuation executes only the next safe action and stops at real gates.
7. Dashboard priorities reflect evidence confidence, business impact, risk, and delivery state.
8. Marketplace package, source snapshot, documentation, and release validation remain installable on supported platforms.

## Delivery order

1. Normalize the artifact-response contract and add App Intelligence.
2. Add Evidence Engine and its import schema.
3. Replace fixed innovation ranking with adaptive generation and wire Radical/Product journeys.
4. Replace direct document writes with the Decision Ledger.
5. Add Delivery Controller and Dashboard summary.
6. Add command, integration, regression, package, and release tests; document the new workflow; publish a minor version release.

## Distribution Reliability Layer

The repository marketplace, built marketplace bundle, documentation, release assets, and installed plugin cache use the single identity `forgemind-marketplace`. Core remains the independent `forgemind` plugin and Trust Fabric remains the independent optional `forgemind-trust-fabric` add-on.

`forgemind doctor --installation` reports the running plugin root, manifest version, cache discovery, marketplace registration, bundled-runner availability, Core/Add-on compatibility, and the precise next update command. It performs no writes.

Core capabilities never imply that Trust Fabric is installed. A Trust Fabric request without the add-on returns a clear `FM_TRUST_FABRIC_NOT_INSTALLED` result with the exact install command. When present, its capabilities are included in Doctor output.

The Marketplace package contains a compact entry surface. Each journey keeps its short skill file; longer workflow material is divided into focused references loaded only by that journey. The runtime test suite includes a clean-home path: register the GitHub marketplace, install Core, invoke the bundled runner, assert manifest version and entry skill discovery, upgrade the marketplace, reinstall, and assert the newer version.

CI tests Node.js 22 and 24 on Windows, macOS, and Linux. Documentation identifies one recommended path for GitHub installation, update, offline package installation, and plugin development. It contains no obsolete journey count or legacy version example.
