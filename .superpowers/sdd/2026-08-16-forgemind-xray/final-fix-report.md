# ForgeMind Xray final review fix report

## Outcome

Addressed all five findings from `final-review.md`: four P1 runtime/score/discovery failures and the P2 mission-artifact contract gap. Source and Marketplace runtime copies remain byte-equivalent.

## Finding resolution

### Safe recursive package-script classification

- Discovery now preserves each detected `test`, `build`, or `lint` script body.
- The safety classifier follows nested npm/pnpm/yarn script aliases and their `pre*`/`post*` lifecycle scripts.
- Destructive/production operations, credential access, external-spend operations, and non-loopback remote targets mark the wrapper check unsafe before execution.
- Unsafe checks produce a skipped receipt and `FM_XRAY_UNSAFE_CHECK_SKIPPED`; the underlying wrapper is never invoked.
- Regression cases cover an unsafe nested `test` alias, a remote target hidden behind `build`, and an unsafe `prelint` lifecycle script.

### Surface-specific GUI and accessibility evidence

- Generic repository commands no longer map to web, native, or mobile GUI surfaces.
- Browser/Computer Use results are imported as distinct `gui-control` checks with an exact surface, control, component IDs, and non-empty evidence.
- The public CLI accepts these receipts through `xray run --gui-receipts '<json-array>'`; the entry skill documents the handoff and evidence rules.
- GUI usability and accessibility/visual components resolve evidence independently and only from matching GUI receipt aspects.
- Evidence coverage is calculated across detected surface evidence units. Missing GUI aspects create explicit gaps and lower evidence coverage, so a generic passing test plus a GUI gap cannot produce 100/100.
- Failed GUI receipts create evidence-backed surface findings and deduct only from the GUI components they exercised.

### Missing tools and prerequisites are gaps

- Exit code 127 and recognizable ENOENT/command-not-found launch failures produce a blocked receipt plus `FM_XRAY_TOOL_UNAVAILABLE`, with no product finding.
- Unavailable local services, emulators/devices, and missing credential prerequisites produce a blocked receipt plus `FM_XRAY_PREREQUISITE_UNAVAILABLE`, with no fabricated defect.
- Ordinary nonzero application/test failures continue to produce high-severity evidence-backed findings.

### Native desktop and mobile-emulator discovery

- Native Windows desktop detection uses local Windows Desktop/WPF/WinForms project metadata and maps the surface to Computer Use.
- Mobile discovery recognizes local Android Gradle/manifest, iOS workspace/project, MAUI, Flutter, and scripted React Native/Expo/Capacitor/Ionic signals and maps the surface to Computer Use.
- Standalone native, standalone mobile, unavailable-control, and hybrid web/API/mobile fixtures are covered.

### Execution-enriched mission artifact

- `test-mission-latest.json` now persists enriched checks with `selection`, `outcome`, and `receiptId`.
- It also persists `selectedChecks`, `skippedChecks`, all execution receipts, and the final deduplicated execution/scoring gaps.
- Regression coverage asserts both a passed command and an unsafe skipped command, plus imported GUI evidence, in the canonical mission artifact.

## Files changed

- `src/xray.mjs`
- `src/cli.mjs`
- `tests/xray.test.mjs`
- `tests/cli.test.mjs`
- `entry-skills/forgemind-xray/SKILL.md`
- Mirrored Marketplace copies under `plugins/forgemind/`

## TDD evidence

The initial focused Xray run after adding the regressions produced 7 expected failures: hidden script safety, missing-tool classification, prerequisite classification, generic-GUI scoring, GUI-aspect separation, native/mobile discovery, and enriched mission persistence. After the runtime changes, the focused suite passed. A separate failed-GUI-receipt regression was also observed failing before its finding normalization was implemented.

## Verification

- `node --test tests/xray.test.mjs tests/cli.test.mjs tests/journey-surface.test.mjs tests/package.test.mjs` — 34 passed, 0 failed.
- `node bin/forgemind.mjs validate --plugin plugins/forgemind --strict-release` — passed.
- `git diff --check` — passed.
- `npm test` — 186 passed, 0 failed.
- `npm run build` — passed.
- `node bin/forgemind.mjs validate --plugin dist/plugin --strict-release` — passed.
- SHA-256 comparisons confirmed `src/xray.mjs` and `src/cli.mjs` are byte-equivalent to their `plugins/forgemind/src/` copies.

## Final re-review follow-up

The follow-up review identified two remaining P1 boundaries and two P2 report-accuracy issues. All four are addressed:

- Package-script recursion now uses a conservative read-only leaf allowlist. Destructive shell operations (`rm -rf`, `rimraf`, PowerShell `Remove-Item`, and common runtime filesystem-deletion APIs), unresolved local runtime scripts, missing nested script references, and environment-derived URL/host/endpoint/target values default to an unsafe hold. Regression fixtures verify that none reaches `runCommand`.
- Prerequisite classification no longer treats the generic phrase `Service Unavailable` as infrastructure evidence. It requires a concrete launch/tool failure, connection refusal, named missing credential/device, or explicit loopback/local-service context. An asserted HTTP 503 response remains a failed receipt and evidence-backed product finding.
- Functional-correctness and robustness applicability now come from checks that explicitly exercise those components. GUI findings apply only to their declared GUI/accessibility component IDs; an accessibility-only receipt neither verifies nor deducts functional or robustness scores.
- Web discovery now distinguishes recognized web development servers from mobile packagers and ignores React/React DOM as web-only evidence when a mobile framework dependency is present. A standalone `react-native start` fixture emits only `mobile-gui` and a Computer Use gap, while the existing Vite/React Native hybrid still emits both surfaces.

TDD red evidence: the new focused run initially failed exactly four regressions (destructive/unresolved scripts executed, HTTP 503 swallowed, GUI receipt over-applied, and React Native web false positive). After implementation, the focused release surface passed 38/38.

Fresh verification for this follow-up:

- `node --test tests/xray.test.mjs tests/cli.test.mjs tests/journey-surface.test.mjs tests/package.test.mjs` — 38 passed, 0 failed.
- `npm test` — 190 passed, 0 failed.
- `npm run build` — passed.
- Strict validation of both `plugins/forgemind` and `dist/plugin` — passed.
- `git diff --check` — passed.
