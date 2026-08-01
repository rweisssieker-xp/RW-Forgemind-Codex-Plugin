# ForgeMind Cross-Platform Team Product Design

Date: 2026-07-30

Status: proposed for implementation
Target: ForgeMind as a personal and team Codex plugin, distributed through an internal marketplace and prepared for public Plugin Directory submission

## 1. Purpose

ForgeMind will become a cross-platform, evidence-driven software delivery plugin rather than a collection of loosely connected prompts and Windows-only scripts. It must work on Windows, macOS, and Linux; remain useful to one developer; support shared team conventions and memory; install reproducibly from an internal marketplace; and produce a publication-ready public package.

Its primary product promise is:

> ForgeMind does not merely generate code. It produces a traceable, policy-compliant delivery proof that connects intent, changes, verification, risk, rollback, and measured outcomes.

## 2. Scope

The implementation includes:

1. A canonical plugin-root source layout.
2. A dependency-light Node.js CLI for all supported platforms.
3. Compatibility wrappers for existing PowerShell entry points.
4. Cross-platform validation, unit tests, integration tests, and CI.
5. Reproducible standalone-plugin and marketplace build artifacts.
6. Internal installation, upgrade, downgrade, uninstall, and diagnostic workflows.
7. Metadata and documents required for public release readiness.
8. Shared and personal memory with provenance, review state, expiry, conflict handling, and redaction.
9. Policy-based autonomy and safety gates.
10. Proof-Carrying Delivery evidence bundles.
11. Outcome-based routing recommendations.
12. Product-signal ingestion that connects evidence to a scored USP backlog.
13. Consolidated primary workflows and unambiguous skill routing.
14. Release, security, and behavior evaluation evidence.

Actual submission to an external Plugin Directory is outside repository control because it requires an authenticated publisher action. The repository must nevertheless generate the exact validated package and submission checklist needed for that action.

## 3. Non-goals

- ForgeMind will not train a custom model.
- It will not upload project memory, source code, or telemetry by default.
- It will not require a hosted ForgeMind service.
- It will not silently deploy, purchase services, mutate production, or bypass Codex approval controls.
- It will not remove existing skill names in the first compatibility release.

## 4. Canonical repository and artifact layout

The source repository remains a standalone plugin at its root:

```text
forgemind/
├── .codex-plugin/plugin.json
├── bin/forgemind.mjs
├── src/
├── tests/
├── skills/
├── agents/
├── templates/
├── assets/
├── scripts/                 # compatibility wrappers
├── schemas/
├── docs/
├── package.json
└── forgemind.config.example.json
```

`npm run build` creates disposable artifacts under `dist/`:

```text
dist/
├── plugin/                  # standalone public package
└── marketplace/
    ├── .agents/plugins/marketplace.json
    └── plugins/forgemind/   # exact copy of standalone package
```

Source files never depend on being nested under `plugins/forgemind`. Runtime path discovery starts at the executing module and locates `.codex-plugin/plugin.json`. Workspace paths start at an explicit `--workspace` argument or the current directory.

## 5. Runtime and CLI architecture

Node.js 20 or newer is the portable runtime. Production code uses Node built-ins unless a dependency provides a clear security and maintenance advantage. Commands are exposed through `forgemind` and `node bin/forgemind.mjs`.

Primary commands:

```text
forgemind help
forgemind doctor
forgemind validate
forgemind init
forgemind inspect
forgemind verify
forgemind gaps
forgemind risks
forgemind readiness
forgemind evidence
forgemind outcome
forgemind route
forgemind signals
forgemind dashboard
forgemind package
forgemind install
forgemind uninstall
```

Each command delegates to a focused module with a stable JavaScript API. Commands return exit code `0` for success, `1` for operational failure, and `2` for invalid input or policy rejection. Human-readable output goes to stdout/stderr; `--json` returns a versioned machine-readable result.

Existing `.ps1` files become thin compatibility wrappers that invoke the equivalent Node command and preserve documented parameters where practical. New documentation uses the portable CLI.

## 6. Core modules

### 6.1 Paths and filesystem

The path module resolves plugin root, workspace root, state directory, and artifact paths without platform-specific separators. Writes use atomic temporary-file replacement. Generated JSON uses UTF-8 and stable key ordering where hashes depend on content.

### 6.2 Project inspection and verification

Inspection detects package managers, common build systems, test commands, repository state, CI, and relevant project structure. It distinguishes detected commands from inferred commands. Verification never runs inferred commands unless the user explicitly requests execution.

Each executed command records category, command, start/end time, exit code, sanitized output summary, and evidence location.

### 6.3 Policy engine

Policy is loaded from these layers, with later layers only allowed to become stricter unless explicitly approved:

1. ForgeMind secure defaults.
2. Repository `forgemind.config.json` shared by the team.
3. Personal `.forgemind.local.json`, ignored by Git.
4. Per-command explicit approval.

Policies cover command allow/deny patterns, protected paths, secrets, external network actions, cost-bearing actions, deployments, migrations, destructive operations, required verification, and minimum evidence for release. Every decision records policy source and rationale.

### 6.4 Team and personal memory

Shared memory lives under `.codex-orchestrator/memory/shared/`; personal memory lives under `.codex-orchestrator/memory/personal/` and is ignored by Git by default. Entries use a versioned JSON Lines format plus generated Markdown views.

Each entry contains:

- stable identifier
- type and scope
- statement or outcome
- source and evidence reference
- author identity when locally available
- creation and review timestamps
- confidence
- review state
- expiry date or explicit non-expiring status
- sensitivity classification
- superseded entry identifier when applicable

Conflicting active entries are preserved and reported; ForgeMind does not silently choose one. A deterministic redaction pass rejects secrets, credentials, private keys, high-confidence tokens, and configured sensitive paths before persistence.

### 6.5 Evidence store and Proof-Carrying Delivery

`forgemind evidence` creates:

```text
.codex-orchestrator/evidence/<delivery-id>/
├── delivery-proof.json
├── delivery-proof.md
└── sha256.txt
```

The proof contains:

- schema version and delivery identifier
- repository and commit identity
- dirty-worktree state
- stated intent and acceptance criteria
- changed files and diff summary
- decisions and traceability links
- verification commands and results
- policy decisions and approvals
- risks and mitigations
- rollback procedure
- unresolved uncertainty
- outcome linkage when later available
- SHA-256 digest over the canonical proof payload

The digest is tamper-evident, not an identity signature. The tool must never claim cryptographic authorship without a separately configured signing key.

Release readiness cannot be `ready` when required proof fields are absent, verification failed, a blocker risk remains, or the worktree state differs from the recorded proof.

### 6.6 Outcome-based routing

Outcome records connect project characteristics, task category, chosen workflow, duration, verification status, correction count, user acceptance, and residual defects. Routing uses transparent weighted scoring rather than opaque machine learning.

The router explains:

- recommended primary workflow
- confidence
- evidence supporting the recommendation
- viable alternative
- safety escalation
- missing evidence that reduced confidence

Routing weights can be recomputed from local outcomes, but shared policy sets minimum safety gates that learned preferences cannot bypass.

### 6.7 Product signals and USP backlog

The first release accepts local JSON, JSON Lines, Markdown, and CSV signal exports. Inputs can represent issues, support notes, reviews, sales feedback, or user interviews. The importer normalizes source, date, audience, problem statement, frequency, severity, evidence, and sensitivity.

ForgeMind clusters only by deterministic normalized terms in the initial implementation; it may use the active Codex model through a skill for semantic synthesis, but the CLI remains useful offline. Each proposed USP links back to source signal identifiers and records score components, hypothesis, MVP experiment, status, and outcome.

External apps or MCP connectors are optional adapters and must not be required for core operation. No connector is declared in the manifest until it exists, has permission documentation, and passes integration tests.

### 6.8 Dashboard

The dashboard is a static, locally generated site. It displays proof status, verification, risks, readiness, traceability, decisions, shared-memory conflicts, routing outcomes, and USP experiments. It embeds no remote scripts and sends no telemetry.

## 7. Workflow and skill consolidation

ForgeMind exposes six primary user journeys:

1. **Discover** — inspect a project and establish trusted commands.
2. **Design** — create product intent, architecture, stories, and acceptance criteria.
3. **Build** — implement with the appropriate autonomy mode.
4. **Verify** — test, review, assess risk, and produce delivery proof.
5. **Release** — evaluate readiness, package, hand off, and retain rollback evidence.
6. **Learn** — record outcomes, improve routing, and evolve product hypotheses.

Existing skills remain callable for compatibility, but their descriptions identify one primary journey and router precedence. Overlapping autopilot skills become explicit presets over a common orchestration contract rather than independent, contradictory processes.

`forgemind help` and the `forgemind-help` skill lead with these six journeys, then show specialist skills as advanced options.

## 8. Distribution and lifecycle

### 8.1 Internal marketplace

The package command generates a valid marketplace with source path `./plugins/forgemind`. Installation accepts a local marketplace root or built artifact, verifies manifest and checksums, and copies only the allowlisted package contents. Upgrade creates a recoverable backup; downgrade uses the same mechanism. Uninstall removes only the resolved ForgeMind installation and preserves project-owned `.codex-orchestrator` data unless `--purge-data` is explicitly approved.

### 8.2 Public release readiness

The repository includes:

- MIT `LICENSE`
- `CHANGELOG.md`
- `SECURITY.md`
- `SUPPORT.md`
- privacy policy
- terms of use
- contribution guide
- code of conduct
- release checklist
- package checksums
- accurate repository metadata
- marketplace description and screenshots

The package validator rejects placeholder contact data, broken local links, missing assets, inconsistent versions, and unexpected files.

## 9. Security and privacy

Security defaults are deny-by-default for destructive, deployment, credential, production, and cost-bearing operations. ForgeMind respects the host application's approval controls and adds no bypass.

Required safeguards:

- path containment checks before recursive operations
- atomic writes and recoverable backups
- command execution without shell interpolation where possible
- secret redaction before reports and memory writes
- output-size limits
- untrusted signal-content labeling
- prompt-injection warnings for imported external text
- no telemetry unless a later opt-in design is separately approved
- dependency audit and locked dependency graph
- documented data inventory and retention behavior

## 10. Error handling

Errors use stable codes such as `FM_CONFIG_INVALID`, `FM_POLICY_DENIED`, `FM_VERIFY_FAILED`, and `FM_PROOF_STALE`. JSON mode returns code, message, remediation, and evidence paths. Partial writes are cleaned up or left in a clearly named recovery directory. A failed upgrade automatically restores the previous installed package.

`forgemind doctor` reports runtime, permissions, manifest validity, package consistency, configuration, workspace state, and actionable remediation without mutating the workspace.

## 11. Testing and evaluation

The project uses Node's built-in test runner for unit and integration tests. Tests include:

- path behavior on Windows and POSIX conventions
- atomic writes and containment protection
- all CLI argument and exit-code contracts
- config precedence and stricter-only policy merging
- redaction fixtures
- shared-memory conflicts and expiry
- project detection for npm, pnpm, yarn, Python, .NET, and generic repositories
- successful and failed verification
- evidence schema, digest stability, and stale-proof detection
- outcome routing explanations
- signal import and source traceability
- package allowlist and checksum validation
- install, upgrade, rollback, downgrade, and uninstall in temporary homes
- dashboard generation without remote resources

GitHub Actions runs validation, tests, package creation, and artifact inspection on current supported Node LTS versions across `windows-latest`, `macos-latest`, and `ubuntu-latest`.

A behavior-evaluation fixture set covers at least the six primary journeys. Each fixture specifies expected route, mandatory safety behavior, required evidence, and forbidden claims. Evaluations are deterministic where possible and clearly separate structural checks from model-quality review.

## 12. Migration and backward compatibility

Version 1.x PowerShell commands continue to work as wrappers and emit a migration hint. Existing Markdown memory remains readable and can be imported into the versioned store. No existing project memory is deleted automatically. Existing specialist skill names remain available for the compatibility release.

The manifest version advances according to semantic versioning. Because the runtime and package model change materially while skill names remain supported, the first completed release is a minor version unless validation proves an unavoidable breaking behavior; any confirmed breaking behavior requires a major version.

## 13. Delivery sequence

1. Establish package metadata, portable CLI skeleton, schemas, and canonical path resolution.
2. Port validation, inspection, initialization, verification, gaps, risks, and readiness.
3. Add policy, redaction, shared/personal memory, and migration.
4. Add delivery proof, stale-proof enforcement, and dashboard integration.
5. Add outcome routing and product-signal ingestion.
6. Convert PowerShell scripts to compatibility wrappers and update skills/docs.
7. Add package, lifecycle commands, internal marketplace artifact, and public-release documents.
8. Add cross-platform CI, integration tests, behavior evaluations, and release audit.

Each sequence step must leave tests green and preserve the previous step's public command behavior.

## 14. Acceptance criteria

The implementation is complete only when all of the following are evidenced:

1. `npm test` passes locally.
2. The generic Codex plugin validator passes the source plugin and built plugin.
3. CI defines and passes Windows, macOS, and Linux jobs.
4. No runtime feature requires PowerShell; PowerShell scripts are wrappers only.
5. Source validation works from the repository root without a marketplace layout.
6. `npm run build` reproducibly creates standalone and marketplace artifacts.
7. Built marketplace metadata resolves `./plugins/forgemind` and validates.
8. Install, upgrade, failed-upgrade rollback, downgrade, and uninstall pass in isolated test homes.
9. Shared and personal memory are separated; provenance, conflict, expiry, and redaction tests pass.
10. Policies cannot be weakened by unapproved personal configuration.
11. A successful fixture produces a valid proof with matching digest.
12. Failed verification, blocker risk, or stale Git state prevents a ready proof.
13. Outcome records influence routing and every recommendation explains its evidence.
14. Imported product signals remain traceable into scored USP records.
15. The dashboard renders all core evidence without network dependencies.
16. Six primary workflows are documented and overlapping skills route consistently.
17. Release metadata contains no placeholder identity or broken repository links.
18. License, changelog, security, support, privacy, terms, contribution, and conduct documents exist.
19. Package contents are allowlisted, checksummed, and free of development state and personal memory.
20. A release audit maps every criterion above to a test, generated artifact, or inspected source file.

## 15. Release decision

The first team release may be distributed internally only after criteria 1–16 and 18–20 pass. Public submission additionally requires criterion 17, final publisher review of directory metadata, and the authenticated external submission action.
