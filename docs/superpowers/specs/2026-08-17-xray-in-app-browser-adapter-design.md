# Xray In-App Browser Adapter Design

## Purpose

Make `$forgemind-xray` exercise safe local and test web-GUI flows through the internal Codex Browser, then retain the resulting observations as canonical Xray evidence. The change gives end users an actual interactive Browser path while preserving Xray's existing evidence, scoring, artifact, and safety model.

## Scope

The `forgemind-xray` entry skill becomes an orchestrator for an explicit safe `--test-url`:

1. Run the existing Xray CLI discovery/initial report.
2. Use the internal Codex Browser only for the explicit loopback or reserved `.test` target.
3. Exercise only safe page loads, same-origin links explicitly identified as safe, and non-submitting validation interactions.
4. Build a complete receipt for every attempted flow.
5. Run the Xray CLI with those receipts through `--gui-receipts`.
6. Report the CLI's canonical findings, gaps, score, and recommendations.

The Node CLI remains independently usable. Its existing local Playwright adapter remains unchanged; the internal Browser is available only to the active Codex skill runtime.

## Components and Data Flow

The entry skill owns Browser control. It initializes the internal-browser binding, reads its API documentation, obtains a local/test tab, and uses its safe browser controls to inspect and exercise eligible flows.

The skill converts each observation into Xray's existing browser-receipt format:

```json
{
  "surfaceId": "web-gui",
  "control": "browser",
  "status": "passed|failed|blocked|skipped",
  "componentIds": ["gui-usability", "accessibility-visual"],
  "evidence": ["<skill-produced local artifact reference>"],
  "url": "<same-origin local/test URL>",
  "coverageArea": "<page or route>",
  "controlLabel": "<visible control>",
  "action": "<safe action>",
  "expected": "<observable expectation>",
  "actual": "<observed result>",
  "reproduction": "<repeatable steps>"
}
```

The skill passes the JSON array to `node <plugin-root>/bin/forgemind.mjs xray run --gui-receipts '<json-array>' --artifacts workspace --json`. Xray's existing normalization, validation, persistence, scoring, Markdown report, and improvement recommendations remain the source of truth.

## Safety

- Browser execution requires an explicit `--test-url` that resolves to loopback or a reserved `.test` host.
- The skill does not read cookies, storage, passwords, profiles, or session stores.
- It does not perform login, download, upload, submit, save, delete, payment, administrative, production, deploy, publish, credential, or other consequential actions.
- Navigation stays same-origin, except safe same-document anchors.
- A control is eligible only when its visible label and target pass the existing Xray safe-control policy.
- The browser path does not start an application server, install packages, download browser runtimes, or fall back to another browser family.

## Failure Handling

If the Browser is unavailable, no safe URL is supplied, the target cannot be reached, or no eligible flow exists, the skill must not invent a receipt. It runs the normal CLI command without Browser receipts and reports the resulting Xray gap and next action.

A partially observed flow is emitted only as a `blocked` or `skipped` receipt with complete fields and available evidence. Xray continues to reject incomplete, off-target, or unsafe receipts. The final report always distinguishes Browser-covered areas from untested or blocked areas.

## Verification

Tests cover:

- the entry skill declares the internal-Browser orchestration contract and bundled CLI handoff;
- safe explicit local/test targets can produce a complete, accepted Browser receipt;
- remote, unsafe, consequential, cross-origin, download, and submit actions are not exercised;
- unavailable Browser, unreachable targets, empty eligible-control sets, and incomplete observations preserve Xray gaps rather than creating passed evidence;
- submitted receipts are included in the canonical Xray report, score, coverage, and packaged Marketplace skill.

## Non-goals

- Replacing or removing the CLI's local Playwright adapter.
- Browser testing of production or external sites.
- Automatic test-server startup, package installation, browser download, or emulator control.
- Collecting or persisting browser session data.

