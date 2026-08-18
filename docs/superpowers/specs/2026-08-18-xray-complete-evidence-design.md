# Xray Complete Evidence Design

## Purpose

Make Xray a complete, truthful local quality workflow: it must honor no-persistence mode, understand the repository-derived application purpose, exercise only safe local Web/API evidence paths, compare approved visual baselines, measure declared performance budgets, and state native iOS/desktop limitations explicitly.

## Scope

The scope contains the five approved improvements:

1. Xray must not publish JSON, Markdown, screenshots, or baselines into a target project when invoked with `--artifacts none`.
2. Xray must derive a concise application test context and deterministic critical Web-flow candidates from the project profile and repository signals.
3. Xray must execute only explicitly configured, local `GET` and `HEAD` API checks.
4. Xray must use the internal Browser for responsive Web testing; true iOS and desktop native apps remain explicit unsupported-evidence gaps.
5. Xray must retain approved visual baselines and local timing evidence for configured safe Web flows.

## Architecture

### Artifact publishing

All human-readable Xray documents use `publishProjectDocument`. State, browser evidence, visual baselines, and report artifacts use `artifactStatePath`. Therefore active `--artifacts none` redirects state to its temporary store and suppresses all project-document publication. Xray still returns the complete in-memory report; `projectDocuments` is empty and `artifactPath` is null.

### Application context and flow plan

`deriveProjectProfile` remains the source of category, target audience, primary job, deployment model, and evidence labels. A new focused flow-planning module derives candidate Web flows only from concrete repository signals: routes/pages, local start scripts, and explicit ForgeMind configuration. Each candidate contains a stable ID, route, purpose, source paths, and whether it is safe for Browser execution.

The default Xray goal continues to describe the inferred application purpose. The mission stores both `projectContext` and `criticalFlows`. Missing or ambiguous signals produce documented gaps, not invented user journeys.

### Local API adapter

The API adapter is opt-in through project-local Xray configuration. It accepts only an explicit loopback or `.test` base URL plus an allowlist of relative paths and methods `GET` or `HEAD`. It rejects credentials, request bodies, query values marked sensitive, redirects off the allowed origin, non-HTTP URLs, remote hosts, and all state-changing methods. Each check emits a normalized receipt with URL, status, duration, response summary, and workspace-local evidence. A failed response is a finding; unavailable targets and invalid configuration are gaps.

### Browser, responsive, visual, and performance evidence

For a configured explicit local/test Web URL, the internal Browser operates the safe flow plan at the configured desktop and mobile viewports. It may load pages, use same-origin opted-in links, and perform non-submitting invalid-input validation only. Existing receipt validation remains canonical.

For every configured visual flow, Xray stores the current screenshot under its active artifact root. On an explicit `baseline` action it creates or replaces the baseline. On a regular run it compares against an existing baseline using a deterministic image-difference metric. Missing baseline is a gap, never a regression. A difference above the configured threshold is a finding with both current and baseline evidence paths.

Timing evidence is recorded for each Browser/API receipt. Configured local performance budgets define maximum navigation duration and maximum API duration. A budget breach is a finding; unavailable timing data is an evidence gap. No adaptive thresholds or external telemetry are introduced.

### Native scope

Web applications may be exercised in responsive mobile viewports, but this does not claim iOS-native coverage. Xray must identify `native-gui` and iOS projects as `FM_XRAY_NATIVE_EMULATOR_UNSUPPORTED` gaps with a next action to run an approved platform-specific simulator externally and import a complete receipt. Android ADB support remains unchanged.

## Project Configuration

`forgemind.config.json` or `package.json#forgemind` can declare:

```json
{
  "xray": {
    "web": {
      "baseUrl": "http://127.0.0.1:4173",
      "viewports": ["desktop", "mobile"],
      "visualBaseline": { "enabled": true, "thresholdPercent": 0.5 },
      "performance": { "navigationMs": 2000 }
    },
    "api": {
      "baseUrl": "http://127.0.0.1:3000",
      "checks": [{ "id": "health", "method": "GET", "path": "/health" }],
      "performance": { "responseMs": 500 }
    }
  }
}
```

All fields are optional. Absent configuration never authorizes a new network request, visual comparison, or performance assertion.

## Report and Result Contract

The canonical report continues to contain mission, receipts, findings, gaps, score, coverage, recommendations, and errors. The mission additionally exposes `criticalFlows`. The report adds concise sections for critical flows, API evidence, responsive coverage, visual baseline results, and performance budgets. Evidence links remain project-local artifact paths.

## Failure Handling

- Missing or malformed configuration: `FM_XRAY_CONFIG_INVALID` gap with the exact invalid field.
- Unsafe/out-of-scope API target: `FM_XRAY_API_TARGET_UNSAFE` gap; no request is attempted.
- Missing local API server: `FM_XRAY_API_TARGET_UNAVAILABLE` gap.
- Missing visual baseline: `FM_XRAY_VISUAL_BASELINE_MISSING` gap.
- Unsupported iOS/native emulator: `FM_XRAY_NATIVE_EMULATOR_UNSUPPORTED` gap.
- Artifact publication failure is non-fatal to the quality result and is surfaced in `errors`.

## Testing

Tests must prove:

- `--artifacts none` leaves no Xray Markdown, report, Browser evidence, or baseline in the target project.
- project context and critical-flow candidates come only from supported repository/configuration signals.
- API requests reject remote, write, credential, redirect, and malformed candidates before execution; approved local GET/HEAD checks produce receipts, timings, findings, and gaps accurately.
- Browser receipt plans include configured desktop/mobile viewports and do not turn mobile emulation into a native-coverage claim.
- baseline creation, missing-baseline gap, below-threshold comparison, and above-threshold visual finding are deterministic.
- navigation/API performance threshold pass, breach, and unavailable-timing cases are deterministic.
- native/iOS signals produce the explicit unsupported-emulator gap while Android behavior remains covered.
- source and `plugins/forgemind` runtime mirrors are identical; full package validation passes.

## Non-goals

- No automatic iOS or desktop simulator installation or execution.
- No browser login, form submission, external URL, credential, upload, download, payment, administration, or state-changing API call.
- No performance telemetry service, remote visual testing provider, or adaptive/AI-generated thresholds.
- No inferred API endpoints or user flows beyond explicit local repository/configuration evidence.
