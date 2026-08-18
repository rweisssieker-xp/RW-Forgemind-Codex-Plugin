# Xray Internal Browser Orchestration Design

## Purpose

Ensure that `$forgemind-xray` actively uses the internal Codex Browser for every eligible local/test Web application, then feeds complete receipts back into the canonical Xray CLI report. Xray must still collect the maximum safe evidence when the Browser is unavailable.

## Architecture

The CLI remains responsible for deterministic mission discovery, command/API execution, receipt validation, scoring, and persistence. It cannot call Codex Browser tools. The Xray skill becomes the mandatory orchestration layer for Web GUI work: it runs a discovery pass, uses the internal Browser on the resulting safe local/test flows, constructs complete receipts, and runs the canonical CLI pass with `--gui-receipts`.

The discovery pass includes `mission.criticalFlows`, each with an explicit safe route and configured viewports. The skill uses only these routes, the declared local/test origin, and the existing non-destructive Browser policy. For each available viewport it collects before/after observable state plus a workspace-local screenshot and submits a receipt containing viewport, coverage area, action, expected/actual result, reproduction, and evidence paths.

## Evidence-Maximizing Execution

1. Run Xray discovery/initial CLI pass to determine local/test URL, safe flows, command/API checks, and prerequisites.
2. If a safe Browser target and Browser binding are available, execute each safe flow at desktop and mobile viewports; submit complete receipts in the second canonical CLI pass.
3. If Browser binding, URL, artifact capture, or a flow is unavailable, record its precise blocked/skipped receipt or retain the returned Browser gap. Continue command and API tests.
4. Direct CLI use continues to use the local Playwright adapter when configured; it never claims internal Browser coverage.

## Report Contract

The report distinguishes verified failures, successful evidence, and unavailable test evidence. It adds a `GUI execution` summary naming the executor (`internal-browser`, `playwright`, or `unavailable`) and its covered routes/viewports. Missing GUI evidence remains a coverage gap; it does not become a verified product defect.

## Safety Constraints

- Only explicit loopback or `.test` HTTP(S) targets.
- Only same-origin route loading, opted-in navigation, and non-submitting validation interactions.
- Never log in, submit forms, save, delete, upload, download, access storage/cookies/session data, use credentials, or execute consequential actions.
- Browser unavailability never prevents independent command/API tests.

## Testing

- Skill text is tested for discovery pass, internal Browser execution, complete receipts, canonical second pass, and evidence-maximizing fallback.
- Xray receipt validation accepts viewport and executor metadata while retaining existing completeness and safety rules.
- Report rendering shows executor, covered routes/viewports, verified failures, and evidence gaps separately.
- Direct CLI behavior remains Playwright-or-gap and never pretends to invoke the internal Browser.

## Non-goals

- No attempt to expose Codex Browser tools to the Node CLI process.
- No automatic local server start by the internal Browser layer.
- No GUI testing of external, production, authenticated, or state-changing flows.
