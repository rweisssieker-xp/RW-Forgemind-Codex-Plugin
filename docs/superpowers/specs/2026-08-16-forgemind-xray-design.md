# ForgeMind Xray Design

## Goal

Add `$forgemind-xray`, a primary ForgeMind journey for autonomous, read-only
software quality assessment. Xray tests the surfaces that a repository makes
locally verifiable and produces evidence-backed findings plus an informative
quality score from 0 to 100. It never implements fixes or mutates product
source, configuration, or application data.

## User experience

The explicit entry point is:

```text
$forgemind-xray Fully test this application and create a detailed quality report.
```

The skill invokes:

```text
node <plugin-root>/bin/forgemind.mjs xray run --goal "<optional scope>" --artifacts workspace --json
node <plugin-root>/bin/forgemind.mjs xray status --artifacts workspace --json
```

Compass may recommend Xray when the user requests independent testing or QA,
but Xray is explicit-only and does not become an implicit journey.

## Test mission

`xray run` resolves the workspace and inspects its verifiable test surfaces:

- Web, desktop, and mobile GUI projects when a local test or start path is
  detected.
- APIs, workers, and integration boundaries when declared contracts, routes,
  or local tests exist.
- CLIs when an executable entry point and safe local invocation are detected.
- Existing unit, integration, end-to-end, smoke, visual, and accessibility
  test commands.

Xray converts those observations into a risk-weighted test mission. It runs
only detected, local, non-destructive commands. Missing binaries, unavailable
services, credentials, external access, or an unsafe operation create explicit
test gaps; none is silently treated as a passing or failing test.

Xray may start a locally configured application only when the command is
recognized as a local development server and can be stopped cleanly. For a
locally reachable web GUI, it uses the internal Browser control surface to
exercise visible user flows, inspect interactive states, and capture visual
evidence. For native Windows desktop or mobile-emulator GUIs, it uses Computer
Use to interact with the visible application and capture UI evidence. Xray
falls back to repository tests when a suitable GUI-control surface is not
available, and records that gap explicitly. It never contacts external
production systems or changes product source, configuration, or data.

## Findings and reports

Xray writes project-local evidence only:

- `.codex-orchestrator/xray/test-mission-latest.json`: discovered surfaces,
  selected and skipped checks, execution receipts, and test gaps.
- `.codex-orchestrator/xray/report-latest.json`: canonical quality report.
- `docs/forgemind/xray-report.md`: concise human-readable report.

Each finding has a stable ID and records severity, affected surface,
reproduction steps, expected and actual behavior, evidence references,
suspected cause, user impact, and a recommended next verification step.
Findings sharing the same causal evidence are deduplicated and cross-linked so
that one API defect exposed in a GUI is reported coherently instead of twice.

The report distinguishes verified failures, verified passes, untested areas,
and assumptions. It never claims coverage or a successful check without an
execution receipt.

## Informative quality score

Xray reports a 0-100 score but never uses it as an automatic release gate. The
report includes each component, weight, available evidence, and deductions:

| Component | Weight |
| --- | ---: |
| Functional correctness and regressions | 30 |
| API, CLI, and integration contracts | 20 |
| GUI behavior and usability | 15 |
| Accessibility and visual quality | 15 |
| Robustness and error paths | 10 |
| Evidence coverage of detected surfaces | 10 |

A component with no applicable detected surface is marked not applicable and
its weight is redistributed across applicable components. A detected but
unexecutable surface remains a visible gap and reduces evidence coverage only;
it does not fabricate a functional failure. Verified high-severity defects
deduct from the relevant component using a documented deterministic rule.

## Safety and boundaries

Xray is test-only. It may write ForgeMind artifacts and temporary test output
inside the workspace but does not edit application files. It must hold and
report a gap for destructive commands, credentials, production access,
external spend, irreversible migrations, or unverified remote targets.

## Integration

The implementation adds `forgemind-xray` to the source and Marketplace skill
surfaces, hierarchy, README, Compass routing, and journey-surface tests. The
CLI adds `xray run` and `xray status`; it follows the existing JSON result,
artifact storage, redaction, and error-code conventions.

## Verification

Automated fixtures cover standalone CLI, API, web GUI, native GUI, and hybrid
repositories; browser and Computer Use availability gaps; non-startable GUIs;
missing test tools; failures; test-gap reporting; cross-surface finding
deduplication; deterministic scoring; no-source-mutation; and packaged
Marketplace discoverability. Existing ForgeMind tests, source validation,
package build, and strict package validation must pass.
