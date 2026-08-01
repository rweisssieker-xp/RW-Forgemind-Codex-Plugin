# ForgeMind Cross-Platform Team Product Implementation Plan

> **Execution guidance:** Follow the ForgeMind governed delivery journey and implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ForgeMind into a cross-platform, team-safe, evidence-driven Codex plugin with reproducible internal/public packages and a portable CLI.

**Architecture:** Keep the plugin source at repository root and introduce a dependency-light Node.js 20+ CLI split into focused modules. Store versioned workspace evidence under `.codex-orchestrator`, generate standalone and marketplace packages under `dist`, preserve PowerShell commands as wrappers, and prove behavior with Node tests plus a three-OS CI matrix.

**Tech Stack:** Node.js 20+ ESM, Node built-ins, `node:test`, JSON/JSONL/Markdown/CSV, PowerShell compatibility wrappers, GitHub Actions.

## Global Constraints

- Support Windows, macOS, and Linux.
- Require Node.js 20 or newer.
- Use Node built-ins in production unless a dependency has a documented security and maintenance advantage.
- Do not upload source, memory, evidence, signals, or telemetry by default.
- Preserve existing skill names and PowerShell entry points for the compatibility release.
- Never weaken shared safety policy through personal configuration without explicit approval.
- Never declare an app or MCP connector until it exists, is documented, and passes integration tests.
- Use atomic writes, path-containment checks, UTF-8, stable machine-readable schemas, and recoverable lifecycle operations.
- Treat external publication as a publisher-authenticated action; make the repository and artifact submission-ready.

---

## File map

- `bin/forgemind.mjs`: executable entry point; delegates to CLI parser.
- `src/cli.mjs`: argument parsing, command registry, output mode, exit-code mapping.
- `src/errors.mjs`: stable ForgeMind error class and codes.
- `src/paths.mjs`: plugin/workspace/state resolution and containment.
- `src/io.mjs`: atomic UTF-8 and canonical JSON writes.
- `src/validate.mjs`: plugin, manifest, skill, link, and package validation.
- `src/doctor.mjs`: non-mutating environment diagnosis.
- `src/project.mjs`: stack and command detection.
- `src/artifacts.mjs`: initialization and template copying.
- `src/verify.mjs`: safe command execution and verification reports.
- `src/gaps.mjs`, `src/risks.mjs`, `src/readiness.mjs`: release evidence analysis.
- `src/config.mjs`, `src/policy.mjs`, `src/redact.mjs`: layered configuration and safety decisions.
- `src/memory.mjs`, `src/migrate-memory.mjs`: versioned team/personal memory.
- `src/evidence.mjs`: delivery-proof creation, digesting, and stale-proof checks.
- `src/outcomes.mjs`, `src/router.mjs`: outcome storage and explainable routing.
- `src/signals.mjs`, `src/csv.mjs`: signal import and USP traceability.
- `src/dashboard.mjs`: offline dashboard generation.
- `src/package.mjs`, `src/lifecycle.mjs`: build, checksums, install/upgrade/downgrade/uninstall.
- `schemas/*.schema.json`: versioned data contracts.
- `tests/*.test.mjs`: unit and integration tests mirroring modules.
- `.github/workflows/validate.yml`: Windows/macOS/Linux validation matrix.
- `scripts/*.ps1`: compatibility wrappers only.

### Task 1: Portable CLI foundation

**Files:**
- Create: `package.json`, `bin/forgemind.mjs`, `src/cli.mjs`, `src/errors.mjs`, `src/paths.mjs`, `src/io.mjs`
- Create: `tests/cli.test.mjs`, `tests/paths.test.mjs`, `tests/io.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `runCli(argv, context): Promise<{exitCode:number,data?:unknown}>`; `ForgeMindError`; `resolvePluginRoot(start)`; `resolveWorkspace(path)`; `assertContained(parent,target)`; `writeJsonAtomic(path,value)`; `canonicalJson(value)`.

- [x] Write tests that invoke `help`, reject unknown commands with exit code `2`, resolve the manifest from repository root, reject path escape, and atomically round-trip canonical JSON.
- [x] Run `node --test tests/cli.test.mjs tests/paths.test.mjs tests/io.test.mjs`; expect failures because modules do not exist.
- [x] Implement the six modules with no production dependency. The entry point must contain:

```js
#!/usr/bin/env node
import { runCli } from '../src/cli.mjs';
const result = await runCli(process.argv.slice(2), { stdout: process.stdout, stderr: process.stderr });
process.exitCode = result.exitCode;
```

- [x] Add npm scripts `test`, `validate`, `build`, and `forgemind`, plus `engines.node: ">=20"` and `bin.forgemind`.
- [x] Run the focused tests and `node bin/forgemind.mjs help`; expect exit `0` and the documented command list.
- [x] Commit with `feat: add portable ForgeMind CLI foundation`.

### Task 2: Source validation and doctor

**Files:**
- Create: `src/frontmatter.mjs`, `src/validate.mjs`, `src/doctor.mjs`
- Create: `tests/validate.test.mjs`, `tests/doctor.test.mjs`
- Modify: `src/cli.mjs`

**Interfaces:**
- Consumes: path and JSON helpers from Task 1.
- Produces: `validatePlugin(pluginRoot): Promise<ValidationReport>` and `diagnose({pluginRoot,workspace}): Promise<DoctorReport>` where reports contain `status`, `checks`, and `errors`.

- [x] Add fixture-driven tests for valid manifest/skills/assets, malformed YAML frontmatter, missing assets, unsupported fields, broken local Markdown links, placeholder author data, and a non-mutating doctor result.
- [x] Run focused tests and confirm fixture failures.
- [x] Implement frontmatter parsing for the supported scalar fields, manifest validation, unique skill-name validation, asset/link checks, and doctor checks for Node version, permissions, Git, manifest, config, and workspace.
- [x] Register `validate` and `doctor` commands with `--json`; operational validation failure returns exit `1`.
- [x] Run focused tests and the generic Codex validator against the repository root.
- [x] Commit with `feat: add source validation and diagnostics`.

### Task 3: Project inspection and artifact initialization

**Files:**
- Create: `src/project.mjs`, `src/artifacts.mjs`
- Create: `tests/project.test.mjs`, `tests/artifacts.test.mjs`
- Modify: `src/cli.mjs`, `templates/memory/*`, `templates/artifacts/*`

**Interfaces:**
- Produces: `inspectProject(workspace): Promise<ProjectProfile>`; `initializeWorkspace({workspace,pluginRoot,withMemory,withArtifacts}): Promise<InitReport>`.

- [x] Test npm/pnpm/yarn, Python, .NET, generic Git, detected-versus-inferred commands, idempotent initialization, and preservation of existing user content.
- [x] Run focused tests; expect missing-module failures.
- [x] Implement deterministic detection and template initialization using atomic writes and copy-if-absent semantics.
- [x] Register `inspect` and `init` with `--workspace`, `--memory`, `--artifacts`, and `--json`.
- [x] Run focused tests twice against the same temporary workspace to prove idempotence.
- [x] Commit with `feat: add cross-platform project initialization`.

### Task 4: Verification, gaps, risks, and readiness

**Files:**
- Create: `src/process.mjs`, `src/verify.mjs`, `src/gaps.mjs`, `src/risks.mjs`, `src/readiness.mjs`
- Create: `tests/verify.test.mjs`, `tests/release-analysis.test.mjs`
- Modify: `src/cli.mjs`

**Interfaces:**
- Produces: `runProcess(command,args,options)` without shell interpolation; `verifyWorkspace(options)`; `scanGaps(context)`; `scanRisks(context)`; `scoreReadiness(context)`.

- [x] Test successful/failed commands, output limits, inferred-command rejection, missing CI/changelog evidence, secret-like files, migrations, blocker scoring, and stable JSON report paths.
- [x] Run tests; expect failures.
- [x] Implement sanitized command execution, versioned reports, release gap/risk rules, and readiness scoring whose `ready` state requires passing verification and no blockers.
- [x] Register `verify`, `gaps`, `risks`, and `readiness`.
- [x] Run focused tests plus one real `node --test` verification fixture.
- [x] Commit with `feat: add portable release evidence analysis`.

### Task 5: Layered policy and secret redaction

**Files:**
- Create: `forgemind.config.example.json`, `src/config.mjs`, `src/policy.mjs`, `src/redact.mjs`
- Create: `schemas/config-v1.schema.json`, `tests/policy.test.mjs`, `tests/redact.test.mjs`
- Modify: `.gitignore`, `src/verify.mjs`, `src/cli.mjs`

**Interfaces:**
- Produces: `loadConfig(workspace)`; `mergePolicies(defaults,shared,personal,{approvedWeakening:false})`; `evaluateAction(policy,action)`; `redactText(text,config)`.

- [x] Test precedence, stricter personal rules, rejected weakening, deployments/migrations/destructive/network/cost actions, protected paths, common token/private-key fixtures, false-positive allowlist, and sanitized reports.
- [x] Run focused tests; expect failures.
- [x] Implement schema validation, secure defaults, deterministic policy decisions with source/rationale, and redaction before persistence.
- [x] Integrate policy evaluation into verification and future lifecycle calls.
- [x] Run focused tests and scan generated fixtures to prove raw secrets are absent.
- [x] Commit with `feat: enforce team policy and secret redaction`.

### Task 6: Team and personal memory

**Files:**
- Create: `src/memory.mjs`, `src/migrate-memory.mjs`, `schemas/memory-entry-v1.schema.json`
- Create: `tests/memory.test.mjs`, `tests/memory-migration.test.mjs`
- Modify: `src/cli.mjs`, `.gitignore`, `templates/memory/*`

**Interfaces:**
- Produces: `appendMemoryEntry(options)`; `readActiveMemory(options)`; `findMemoryConflicts(entries)`; `migrateMarkdownMemory(options)`.

- [x] Test stable IDs, provenance, shared/personal separation, expiry, supersession, conflict preservation, review states, redaction rejection, deterministic Markdown views, and non-destructive import of existing Markdown.
- [x] Run tests; expect failures.
- [x] Implement JSONL storage under shared/personal directories, validation, conflict reporting, generated views, and migration command.
- [x] Add `memory add|list|conflicts|migrate` CLI routes.
- [x] Run tests and verify personal memory is Git-ignored while shared memory is not.
- [x] Commit with `feat: add governed team and personal memory`.

### Task 7: Proof-Carrying Delivery

**Files:**
- Create: `src/git.mjs`, `src/evidence.mjs`, `schemas/delivery-proof-v1.schema.json`
- Create: `tests/evidence.test.mjs`
- Modify: `src/readiness.mjs`, `src/cli.mjs`, `templates/artifacts/traceability.md`, `templates/artifacts/rollback-plan.md`

**Interfaces:**
- Produces: `createDeliveryProof(options)`; `verifyDeliveryProof(options)`; `canonicalProofDigest(payload)`.

- [x] Test a successful clean fixture, failed verification, blocker risk, dirty worktree, acceptance criteria, SHA-256 stability, tampering, stale commit/diff state, and unresolved uncertainty.
- [x] Run tests; expect failures.
- [x] Implement proof JSON/Markdown/digest output and validation against current Git/evidence state.
- [x] Register `evidence create|verify`; make readiness reject absent, invalid, or stale required proof.
- [x] Run focused tests and inspect a generated proof for secret-free, relative evidence paths.
- [x] Commit with `feat: add proof-carrying delivery evidence`.

### Task 8: Outcome-based routing

**Files:**
- Create: `src/outcomes.mjs`, `src/router.mjs`, `schemas/outcome-v1.schema.json`
- Create: `tests/outcomes.test.mjs`, `tests/router.test.mjs`
- Modify: `src/cli.mjs`, `skills/skill-router/SKILL.md`, `skills/outcome-memory/SKILL.md`

**Interfaces:**
- Produces: `recordOutcome(options)`; `recommendRoute({profile,task,outcomes,policy})` returning primary route, confidence, evidence, alternative, escalation, and missing evidence.

- [x] Test outcome validation, correction counts, user acceptance, weighted route changes after repeated outcomes, transparent evidence, low-confidence fallback, and safety escalation that learned weights cannot bypass.
- [x] Run tests; expect failures.
- [x] Implement append-only outcomes and documented deterministic weights.
- [x] Register `outcome record|list` and `route`.
- [x] Run tests and snapshot two explained recommendations before/after outcome history.
- [x] Commit with `feat: add explainable outcome-based routing`.

### Task 9: Product signals and traceable USP backlog

**Files:**
- Create: `src/csv.mjs`, `src/signals.mjs`, `schemas/signal-v1.schema.json`, `schemas/usp-record-v1.schema.json`
- Create: `tests/signals.test.mjs`, `tests/fixtures/signals/*`
- Modify: `src/cli.mjs`, `skills/usp-backlog/SKILL.md`, `skills/usp-ai-strategist/SKILL.md`

**Interfaces:**
- Produces: `importSignals(options)`; `clusterSignals(signals)`; `createUspRecords(clusters,scoring)`.

- [x] Test JSON/JSONL/Markdown/CSV inputs, malformed rows, deterministic normalization, external-content trust labels, sensitivity redaction, source IDs, cluster evidence, six-part USP scores, and experiment/outcome linkage.
- [x] Run tests; expect failures.
- [x] Implement offline import and deterministic term clustering; keep semantic synthesis in skills, not the CLI.
- [x] Register `signals import|cluster|usps`.
- [x] Run tests and prove every generated USP references at least one source signal.
- [x] Commit with `feat: connect product signals to USP evidence`.

### Task 10: Offline command-center dashboard

**Files:**
- Create: `src/dashboard.mjs`, `tests/dashboard.test.mjs`
- Modify: `src/cli.mjs`, `assets/*`

**Interfaces:**
- Produces: `generateDashboard({workspace}): Promise<{path,sections}>`.

- [x] Test rendering of verification, risks, readiness, proof, traceability, decisions, memory conflicts, outcomes, routing, and USP experiments; assert no remote URL or script source exists.
- [x] Run test; expect failure.
- [x] Implement escaped static HTML/CSS generation with missing-section states and local-only assets.
- [x] Register `dashboard` and return the absolute generated path.
- [x] Run tests and open the generated HTML text to verify all section anchors.
- [x] Commit with `feat: rebuild command center as offline evidence dashboard`.

### Task 11: Reproducible packaging and lifecycle

**Files:**
- Create: `src/package.mjs`, `src/lifecycle.mjs`, `package-allowlist.json`
- Create: `tests/package.test.mjs`, `tests/lifecycle.test.mjs`
- Modify: `src/cli.mjs`, `package.json`

**Interfaces:**
- Produces: `buildPackages(options)`; `installPlugin(options)`; `uninstallPlugin(options)`; `verifyPackage(path)`.

- [x] Test clean reproducible builds, allowlist rejection, checksums, standalone structure, marketplace source `./plugins/forgemind`, isolated-home install, upgrade backup, injected failed-upgrade rollback, downgrade, safe uninstall, and explicit `--purge-data` policy denial/approval.
- [x] Run tests; expect failures.
- [x] Implement deterministic recursive copy, SHA-256 manifest, marketplace JSON, version comparison, recoverable backup/restore, and path containment.
- [x] Register `package`, `install`, and `uninstall`; wire `npm run build` to `package`.
- [x] Run focused tests twice and compare package checksums.
- [x] Commit with `feat: add reproducible plugin packaging and lifecycle`.

### Task 12: PowerShell compatibility and workflow consolidation

**Files:**
- Modify: `scripts/*.ps1`, `README.md`, `docs/HANDBOOK.md`, `docs/WORKFLOWS.md`, `prompts/README.md`
- Modify: `skills/master-orchestrator/SKILL.md`, `skills/forgemind-help/SKILL.md`, overlapping autopilot skill files
- Create: `tests/wrappers.test.mjs`, `tests/workflow-routing.test.mjs`

**Interfaces:**
- Consumes: CLI commands from Tasks 1–11.
- Produces: wrapper parameter mapping and six primary journey routing contract.

- [x] Test that every PowerShell file contains only parameter mapping plus Node invocation, and that representative legacy commands map to portable equivalents when PowerShell is available.
- [x] Test all 52 skill descriptions for one primary journey and deterministic precedence among overlapping workflows.
- [x] Convert scripts to wrappers, retaining legacy aliases and emitting one migration hint.
- [x] Rewrite user-facing help around Discover, Design, Build, Verify, Release, and Learn.
- [x] Run wrapper/routing tests and generic plugin validation.
- [x] Commit with `refactor: consolidate ForgeMind workflows on portable CLI`.

### Task 13: Release and community documentation

**Files:**
- Create: `LICENSE`, `CHANGELOG.md`, `SECURITY.md`, `SUPPORT.md`, `PRIVACY.md`, `TERMS.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- Modify: `.codex-plugin/plugin.json`, `README.md`, `docs/INSTALL.md`, `docs/RELEASE.md`, `docs/RUNTIME_TEST.md`
- Create: `tests/release-metadata.test.mjs`

**Interfaces:**
- Produces: accurate public metadata and complete internal/public lifecycle documentation.

- [x] Test for placeholder identity, repository mismatch, missing docs/assets, broken local links, inconsistent versions, empty screenshots, and undocumented data retention.
- [x] Run test against current metadata; expect failure.
- [x] Add MIT license and concrete project policies using the actual repository URL `https://github.com/rweisssieker-xp/RW-Forgemind-Codex-Plugin`; use GitHub Security Advisories and Issues as contact channels instead of invented email addresses.
- [x] Update manifest links, descriptions, screenshots, CLI examples, installation, upgrade, rollback, uninstall, privacy, and release instructions.
- [x] Run metadata tests, link validation, source validation, and package validation.
- [x] Commit with `docs: prepare ForgeMind for team and public release`.

### Task 14: Cross-platform CI and behavior evaluations

**Files:**
- Create: `.github/workflows/validate.yml`, `evals/fixtures/*.json`, `src/evals.mjs`, `tests/evals.test.mjs`
- Modify: `src/cli.mjs`, `package.json`

**Interfaces:**
- Produces: `runStructuralEvals(fixtures,context)` and CI matrix evidence.

- [x] Add six fixtures for Discover, Design, Build, Verify, Release, and Learn with expected route, mandatory safety behaviors, required evidence, and forbidden claims.
- [x] Test fixture schema and structural evaluator pass/fail reporting.
- [x] Implement `eval` command and npm `ci` script running tests, validation, evals, build, and artifact validation.
- [x] Add GitHub Actions matrix for `ubuntu-latest`, `macos-latest`, and `windows-latest` on Node 20 and current LTS, with uploaded package artifacts from one release job.
- [x] Run `npm run ci` locally and validate workflow YAML structurally.
- [x] Commit with `ci: validate ForgeMind across supported platforms`.

### Task 15: Completion audit and release evidence

**Files:**
- Create: `scripts/release-audit.mjs`, `docs/release/acceptance-evidence.md`
- Modify: `package.json`, `CHANGELOG.md`, `.codex-plugin/plugin.json`

**Interfaces:**
- Produces: a report mapping all 20 design acceptance criteria to authoritative tests, artifacts, commands, or inspected files.

- [x] Write a release-audit test that fails when any criterion lacks an evidence path, command, result, or status.
- [x] Implement audit collection from test results, validators, package manifests, Git state, docs, and generated fixtures; never infer CI success from workflow existence.
- [x] Run full `npm run ci`, generic source/built validators, package reproducibility check, lifecycle integration suite, secret scan, and `git diff --check`.
- [x] Record local results truthfully; mark remote three-OS CI as pending until GitHub supplies job evidence, and do not claim public submission.
- [x] Update version and changelog according to the verified compatibility impact.
- [x] Review every design acceptance criterion against current authoritative evidence; fix any failed or weak item before completion.
- [x] Commit with `chore: add ForgeMind release acceptance evidence`.
