---
name: forgemind-xray
description: Use when an existing application needs autonomous, read-only quality testing across GUI, API, CLI, and local integration surfaces.
---

# ForgeMind Xray

You MUST execute `node <plugin-root>/bin/forgemind.mjs xray run --goal "<scope>" --artifacts workspace --json` before analysing, planning, scoring, or reporting. Marketplace installation does not create a global `forgemind` shell command; always use this bundled runner. Do not return a test plan, score, or report before the command has completed and its execution receipts have been inspected.

Xray executes its command/API, Playwright Browser, and Android ADB adapters itself. Execute every safe detected local check and inspect the returned execution receipts before reporting a result. API evidence requires an executable local check; detecting API code alone is not a passing API test. Xray is test-only: do not modify product source, configuration, credentials, or production systems. Isolated local or designated-test application data may be created or updated only as required by safe test flows; production and other non-test application data remain immutable. The score is informative only and does not block a release.

For autonomous web-GUI execution, start or reuse a safe local/test server and run `node <plugin-root>/bin/forgemind.mjs xray run --goal "<scope>" --test-url <loopback-url> --artifacts workspace --json`. The URL MUST use localhost, 127.0.0.0/8, ::1, or a reserved `.test` host. Xray uses the workspace-local Playwright installation to map safe reachable pages and exercise only non-destructive interactions; it writes canonical flow receipts and artifacts itself. Never target production or perform payment, deploy, publish, credential, deletion, administration, or other destructive actions.

The internal Browser and Computer Use remain interactive inspection tools: use them to understand a local/test surface or native GUI, but a visible Codex tab is not CLI evidence and must not be coupled through a controlled reload. Only Xray adapter receipts count toward the score. For local native GUI or mobile testing, Xray uses Android ADB only when it detects an Android surface and exactly one authorized emulator; it does not choose physical devices autonomously.

Do not install packages, download browsers, start an emulator, or invent receipts silently. If the declared local Playwright package or Chromium runtime is unavailable, preserve `FM_XRAY_PLAYWRIGHT_UNAVAILABLE` with its exact next action. If no authorized emulator is available, preserve `FM_XRAY_ANDROID_EMULATOR_UNAVAILABLE`; if ADB itself is unavailable, preserve `FM_XRAY_ADB_UNAVAILABLE`. For externally gathered GUI observations, provide complete `--gui-receipts '<json-array>'` only when each receipt has `surfaceId`, `control`, `status`, `componentIds`, `evidence`, `url`, `coverageArea`, `controlLabel`, `action`, `expected`, `actual`, and `reproduction`.

If an applicable adapter or control surface is unavailable, keep the real Xray gap; do not claim a GUI result, pass, failure, or coverage without a surface-specific execution receipt. Use `gui-usability` only for interaction evidence and `accessibility-visual` only when the receipt actually contains accessibility or visual inspection evidence. The final report must distinguish covered areas from gaps and include evidence-backed Improvement proposals.

Then run `node <plugin-root>/bin/forgemind.mjs xray status --artifacts workspace --json` and hand off its detailed findings, explicit gaps, evidence references, and informative score.
