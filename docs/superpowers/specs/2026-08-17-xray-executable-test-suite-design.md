# Xray executable test suite design

## Goal

Make ForgeMind Xray a functional, autonomous local test suite. It must discover, execute, and evidence-test applicable command, API, browser-GUI, and Android-emulator surfaces; distinguish product failures from unavailable prerequisites; and produce one canonical report with coverage, findings, gaps, recommendations, and a 0–100 informative score.

## Architecture

Xray uses a small adapter model. Every adapter discovers safe local test work, executes it, normalizes its output into receipts, and reports a precise unavailable-prerequisite gap when its tool or target is absent. Xray never treats discovery, an open browser tab, or a declared API route as execution evidence.

### Command adapter

The command adapter discovers and executes safe local commands for these project signals:

- Node package scripts: `test`, `build`, `lint`, and existing Playwright scripts.
- .NET: `dotnet test` for a solution or project file.
- Python: `python -m pytest` for `pyproject.toml` or requirements-based projects.
- Go: `go test ./...` for `go.mod`.
- Gradle/Android: `./gradlew test` or `gradlew.bat test` when an Android/Gradle project exists.

Inferred framework commands are selected when their project marker exists. They remain subject to the existing destructive, credential, remote-target, and lifecycle-script safety checks. A missing executable or unavailable local dependency becomes an infrastructure gap, not a product defect.

### API adapter

API recognition is evidence only when an executable local command is associated with the API surface. Command receipts from API test commands cover API contracts. An API route without an executable safe command receives `FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE` with a next action that names the missing test command; it does not receive a false pass or failure.

### Browser adapter

The Browser adapter is a local Playwright CLI workflow. When Xray detects a web GUI and a safe loopback/test URL, it:

1. Starts or reuses the local server through a safe project command.
2. Opens the URL through the bundled Playwright CLI wrapper.
3. Takes a DOM snapshot before each interaction and after navigation or a material view change.
4. Maps reachable pages, links, buttons, dialogs, forms, and visible states.
5. Runs at least one positive flow for every mapped area and a validation/error flow for each input flow.
6. Captures screenshots and a trace for every flow, then converts results into complete Browser receipts.

The adapter runs only against a literal loopback URL (`127.0.0.0/8`, `::1`, or `localhost`) or a designated test URL supplied through explicit Xray configuration. It may create/update isolated test data only at those targets. It never interacts with production, payment, deploy, publish, credential, deletion, or administrative actions.

Codex internal Browser remains available for interactive exploration, but Playwright is the canonical automated GUI runner. If Playwright or its browser runtime is unavailable, Xray records a specific prerequisite gap and installation next action.

### Android adapter

The Android adapter activates only with an Android/Gradle project and a connected emulator. It uses ADB to resolve and launch the test app, inspect the UI tree, operate controls from UI-tree bounds, capture screenshots, and collect package-scoped logcat/crash output. It records one receipt per tested flow, never derives coordinates from a screenshot, and makes an emulator/tool absence a prerequisite gap.

## Receipt contract

All adapter receipts include an adapter identifier, surface identifiers, command or flow, status, expected/actual outcome, reproducible steps, non-empty evidence, and normalized artifacts. Browser receipts additionally include URL, coverage area, control label, action, screenshot, and trace references. Android receipts include emulator serial, package, activity, UI-tree or control evidence, screenshot, and relevant logs.

Only `passed` and `failed` receipts contribute to score and coverage. `blocked` and `skipped` receipts preserve their distinct evidence as gaps. Failed receipts use only `critical`, `high`, `medium`, or `low`; missing or malformed severity defaults to `high`.

## Report and recommendations

The canonical JSON and Markdown report list discovered surfaces, executed adapters, coverage by surface, receipts, findings, explicit gaps, and score rationale. Recommendations are generated only from verified findings and recorded gaps. Each has priority, affected area, evidence, actionable recommendation, expected quality/user benefit, and exact verification step.

## Error handling

Xray classifies missing tools, server startup failure, an unavailable local URL, absent emulator, unavailable Playwright browser runtime, or unavailable credentials as prerequisite gaps. It does not label these as product failures. Unsafe commands and non-local targets are skipped with an explicit safety gap.

## Packaging and verification

The source and `plugins/forgemind/` runtime/entry-skill mirrors stay byte-identical. Version metadata, lockfile entries, built Marketplace artifact, changelog, and tests stay synchronized. Automated tests cover discovery/selection for each adapter, safe-command filtering, prerequisite classification, receipt normalization, score boundaries, report rendering, and source/distribution/package parity.
