# Task 6 report: publish ForgeMind Xray

## Outcome

Task 6 is complete. The publishable `plugins/forgemind` source now contains the Xray runtime, CLI dispatch, Compass route, explicit-only entry skill, hierarchy, and README surface. All four release manifests are version `1.39.0`, and the changelog describes the read-only QA journey, Browser/Computer Use evidence, detailed findings, and informative score.

## TDD evidence

- Red: `node --test tests/package.test.mjs` failed only the new Xray distribution assertion because `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md` was absent.
- Green: after adding the minimal mirrored Xray skill/runtime payload, the focused package suite passed 4/4.
- Regression coverage: the package test builds from `plugins/forgemind` itself, so removing either the Xray skill or runtime from the publishable source fails the test.

## Changes

- Added the mirrored Xray runtime and explicit-only skill under `plugins/forgemind`.
- Mirrored Xray CLI and Compass routing plus hierarchy/README discovery.
- Added a package distribution assertion for the Xray skill and runtime.
- Updated the complete journey hierarchy assertion from thirteen to fourteen journeys.
- Bumped `package.json`, `.codex-plugin/plugin.json`, `plugins/forgemind/package.json`, and `plugins/forgemind/.codex-plugin/plugin.json` from `1.38.3` to `1.39.0`.
- Added the user-visible Xray changelog entry.
- Excluded project-local `.superpowers` SDD scratch reports from the brand-neutrality source scan. This is test-infrastructure isolation only and does not change product behavior.
- Kept the mirrored Marketplace README self-contained by linking only to its included hierarchy document.

## Verification

- `node --test tests/package.test.mjs tests/journey-surface.test.mjs && npm run build && node bin/forgemind.mjs validate --plugin dist/plugin --strict-release` — passed (8 tests, package build, strict validation).
- `node --test tests/brand-neutrality.test.mjs tests/marketplace-source.test.mjs tests/workflow-routing.test.mjs tests/wrappers.test.mjs && node bin/forgemind.mjs validate --plugin plugins/forgemind --strict-release` — passed (6 tests and strict Marketplace-source validation).
- `npm test && node bin/forgemind.mjs validate && git diff --check` — passed (177/177 tests, source validation, no whitespace errors).
- A preceding full run encountered a transient existing Windows `EPERM` rename race in the Portfolio test; the unchanged full command passed on the immediate fresh rerun, so no out-of-scope runtime change was made.

## Self-review

- Confirmed the source and mirrored Xray runtime, skill, and UI declaration are byte-equivalent.
- Confirmed all four manifests report `1.39.0`.
- Confirmed plugin-source and built-package strict validation both pass.
- No unresolved Task 6 issues found.
