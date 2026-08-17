---
name: forgemind-xray
description: Use when an existing application needs autonomous, read-only quality testing across GUI, API, CLI, and local integration surfaces.
---

# ForgeMind Xray

You MUST execute `node <plugin-root>/bin/forgemind.mjs xray run --goal "<scope>" --artifacts workspace --json` before analysing, planning, scoring, or reporting. Marketplace installation does not create a global `forgemind` shell command; always use this bundled runner. Do not return a test plan, score, or report before the command has completed and its execution receipts have been inspected.

Execute every safe detected local check and inspect the returned execution receipts before reporting a result. Xray is test-only: do not modify product source, configuration, application data, credentials, or production systems. The score is informative only and does not block a release.

For every detected local web GUI in a local or designated test environment, you MUST start or reuse its safe local/test server and MUST use the internal Browser to map every reachable page, navigation target, form, button, dialog, and visible state. Exercise at least one positive flow for every mapped area and a validation or error flow for every input flow. You may submit only local/test data. Never interact with production targets or perform payment, deploy, publish, credential, deletion, or administration actions.

For every flow, capture a Browser receipt with `surfaceId`, `control`, `status`, `componentIds`, `evidence`, `url`, `coverageArea`, `controlLabel`, `action`, `expected`, `actual`, and `reproduction`. Rerun `xray run --gui-receipts '<json-array>'` with all complete receipts, then run `xray status`. The final report must distinguish covered areas from gaps and include evidence-backed Improvement proposals. For a local native GUI or mobile emulator, use Computer Use. A generic repository command is never GUI, accessibility, or visual proof.

If the application, internal Browser, Computer Use, or the applicable control surface is unavailable, keep the real Xray gap; do not claim a GUI result, pass, failure, or coverage without a surface-specific execution receipt. Use `gui-usability` only for interaction evidence and `accessibility-visual` only when the receipt actually contains accessibility or visual inspection evidence.

Then run `node <plugin-root>/bin/forgemind.mjs xray status --artifacts workspace --json` and hand off its detailed findings, explicit gaps, evidence references, and informative score.
