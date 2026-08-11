# ForgeMind Release Acceptance Evidence

Version: `1.38.2`

Overall status: **pending**

Remote three-OS CI: **pending** — No authenticated GitHub Actions run evidence supplied.

Public marketplace submission: not claimed.

| # | Status | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| 1 | pending | Local test suite passes. | Pending authoritative result: localCi. | `package.json`<br>`tests/` |
| 2 | pending | Generic validator passes source and built plugins. | Pending authoritative result: sourceValidator, builtValidator. | `.codex-plugin/plugin.json`<br>`dist/plugin/.codex-plugin/plugin.json` |
| 3 | pending | CI defines and passes Windows, macOS, and Linux jobs. | Pending authoritative result: remoteCi. | `.github/workflows/validate.yml` |
| 4 | pending | Runtime features do not require PowerShell; PowerShell files are wrappers. | Pending authoritative result: localCi. | `tests/wrappers.test.mjs`<br>`scripts/` |
| 5 | pending | Source validation works from repository root. | Pending authoritative result: sourceValidator. | `src/validate.mjs`<br>`tests/validate.test.mjs` |
| 6 | pending | Build reproducibly creates standalone and marketplace artifacts. | Pending authoritative result: build, reproducibility. | `src/package.mjs`<br>`dist/plugin/checksums.json`<br>`dist/marketplace/` |
| 7 | pending | Built marketplace metadata resolves ./plugins/forgemind and validates. | Pending authoritative result: builtValidator. | `dist/marketplace/.agents/plugins/marketplace.json`<br>`tests/package.test.mjs` |
| 8 | pending | Install, upgrade, rollback, downgrade, and uninstall pass in isolated homes. | Pending authoritative result: lifecycle. | `tests/lifecycle.test.mjs`<br>`src/lifecycle.mjs` |
| 9 | pending | Shared and personal memory separation, provenance, conflict, expiry, and redaction pass. | Pending authoritative result: localCi. | `tests/memory.test.mjs`<br>`src/memory.mjs` |
| 10 | pending | Unapproved personal configuration cannot weaken policy. | Pending authoritative result: localCi. | `tests/policy.test.mjs`<br>`src/policy.mjs` |
| 11 | pending | Successful fixture produces valid proof and matching digest. | Pending authoritative result: localCi. | `tests/evidence.test.mjs`<br>`src/evidence.mjs` |
| 12 | pending | Failed verification, blocker risk, or stale Git state prevents ready proof. | Pending authoritative result: localCi. | `tests/evidence.test.mjs`<br>`src/readiness.mjs` |
| 13 | pending | Outcomes influence routing with explainable evidence. | Pending authoritative result: localCi. | `tests/router.test.mjs`<br>`src/router.mjs` |
| 14 | pending | Product signals remain traceable into scored USP records. | Pending authoritative result: localCi. | `tests/signals.test.mjs`<br>`src/signals.mjs` |
| 15 | pending | Offline dashboard renders all core evidence. | Pending authoritative result: localCi. | `tests/dashboard.test.mjs`<br>`src/dashboard.mjs` |
| 16 | pending | Six primary workflows and overlapping route precedence are consistent. | Pending authoritative result: localCi. | `tests/workflow-routing.test.mjs`<br>`docs/WORKFLOWS.md` |
| 17 | pending | Release metadata has real identity and repository links. | Pending authoritative result: sourceValidator. | `tests/release-metadata.test.mjs`<br>`.codex-plugin/plugin.json` |
| 18 | pending | Package is allowlisted, checksummed, and excludes development/personal state. | Pending authoritative result: build, packageValidation, secretScan. | `package-allowlist.json`<br>`dist/plugin/checksums.json`<br>`tests/package.test.mjs` |
| 19 | passed | Release audit maps all acceptance criteria to authoritative evidence. | All 28 criteria have explicit commands and evidence paths. | `tests/release-audit.test.mjs`<br>`docs/release/acceptance-evidence.md` |
| 20 | pending | Agent Trust Protocol rejects any delivery that fails acceptance, verification, policy, provenance, rollback, or budget gates. | Pending authoritative result: localCi. | `src/forge/trust.mjs`<br>`tests/forge-trust-strategy.test.mjs`<br>`schemas/agent-trust-v1.schema.json` |
| 21 | pending | Strategy Compiler emits deterministic executable rules and blocks rule-level strategic drift. | Pending authoritative result: localCi. | `src/forge/strategy.mjs`<br>`tests/forge-trust-strategy.test.mjs`<br>`schemas/executable-strategy-v1.schema.json` |
| 22 | pending | Engineering Genome exposes measured cohorts and suppresses recommendations below the minimum sample. | Pending authoritative result: localCi. | `src/forge/genome.mjs`<br>`tests/forge-genome-tournament.test.mjs`<br>`schemas/engineering-genome-v1.schema.json` |
| 23 | pending | Delivery Flight Recorder detects mutation, deletion, reordering, and invalid anchors without executing replayed actions. | Pending authoritative result: localCi. | `src/forge/flight.mjs`<br>`tests/forge-foundation.test.mjs`<br>`schemas/flight-event-v1.schema.json` |
| 24 | pending | Parallel Future Tournament applies hard gates before scoring and preserves ties and the Pareto frontier. | Pending authoritative result: localCi. | `src/forge/tournament.mjs`<br>`tests/forge-genome-tournament.test.mjs`<br>`schemas/future-tournament-v1.schema.json` |
| 25 | pending | Self-Shrinking Software produces reversible evidence plans and never mutates source. | Pending authoritative result: localCi. | `src/forge/shrink.mjs`<br>`tests/forge-shrink-loop.test.mjs`<br>`schemas/shrink-plan-v1.schema.json` |
| 26 | pending | Autonomous Product Loop enforces ordered proof gates and measured scale, iterate, or rollback decisions. | Pending authoritative result: localCi. | `src/forge/product-loop.mjs`<br>`tests/forge-shrink-loop.test.mjs`<br>`schemas/product-loop-v1.schema.json` |
| 27 | pending | Evidence Escrow stays held until trusted proof, all milestones, and every required approval pass, and never handles funds. | Pending authoritative result: localCi. | `src/forge/escrow.mjs`<br>`tests/forge-escrow-federate.test.mjs`<br>`schemas/evidence-escrow-v1.schema.json` |
| 28 | pending | Federated Learning exports verified k-suppressed aggregates without raw identifiers and makes no differential-privacy claim. | Pending authoritative result: localCi. | `src/forge/federate.mjs`<br>`tests/forge-escrow-federate.test.mjs`<br>`schemas/federated-bundle-v1.schema.json` |
