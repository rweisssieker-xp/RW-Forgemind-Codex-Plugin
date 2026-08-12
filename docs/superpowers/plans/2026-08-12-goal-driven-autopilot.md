# Goal-Driven Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `$forgemind-autopilot`, a persistent high-autonomy delivery loop that advances a Codex goal through evidence-gated local work and safely holds consequential actions.

**Architecture:** A focused mission state machine owns packets, lease, checkpoints, receipts, and evidence. A separate adapter registry validates and executes only local, reversible operations permitted by policy and scoped grants. CLI and entry skill expose the workflow; readiness derives its mode from persisted execution evidence.

**Tech Stack:** Node.js 20+, ECMAScript modules, node:test, project-local JSON artifacts.

## Global Constraints

- Maintain Node.js 20+ compatibility and dependency-free runtime.
- Persist redacted project-local state only below `.codex-orchestrator/`.
- Treat a user goal as the outcome contract; do not stop for routine choices.
- Fail closed for secrets, irreversible deletion/migration, external spend, production actions, legal/contractual decisions, platform approvals, stale leases, missing rollback, and invalid evidence.
- Existing CLI, Leap, Hero, policy, Trust Fabric, package, and test behavior remains compatible.

---

### Task 1: Mission state machine, CLI, and entry skill

**Files:** Create `src/autopilot.mjs`, `tests/autopilot.test.mjs`, `entry-skills/forgemind-autopilot/SKILL.md`, and `entry-skills/forgemind-autopilot/agents/openai.yaml`; modify `src/cli.mjs`.

**Interfaces:** `startAutopilot({ workspace, goal, autonomy })`, `runAutopilot({ workspace })`, `getAutopilotStatus({ workspace })`, `resumeAutopilot({ workspace })`, and `holdAutopilot({ workspace, reason })`. Packets use `ready`, `running`, `verified`, `repairing`, `blocked`, `held`, `done`.

- [ ] Write tests that start a goal, persist a mission, return its ready inspect packet, hold it, and resume it.
- [ ] Run `node --test tests/autopilot.test.mjs`; confirm it fails before implementation.
- [ ] Implement atomic mission creation under `.codex-orchestrator/autopilot/mission-latest.json`, including goal, DoD, packet sequence, budgets, autonomy envelope, and evidence references.
- [ ] Add `autopilot start|run|status|resume|hold` CLI dispatch and the approved standard instruction in the entry skill.
- [ ] Run `node --test tests/autopilot.test.mjs`; expect PASS.
- [ ] Commit with `feat: add goal-driven autopilot mission`.

### Task 2: Scoped grants and adapter registry

**Files:** Create `src/adapters.mjs` and `tests/adapters.test.mjs`; modify `src/policy.mjs`, `src/config.mjs`, and `tests/policy.test.mjs`.

**Interfaces:** `validateAdapterManifest(manifest)`, `executeAdapter({ workspace, mission, action })`, and `evaluateGrant({ policy, grant, action, now })`. Receipts contain `idempotencyKey`, `preview`, `rollback`, `policyDecision`, and `status`.

- [ ] Test an expired grant, protected path, missing rollback, missing idempotency key, escaped path, undeclared operation, and secret-bearing manifest; each must reject.
- [ ] Run `node --test tests/adapters.test.mjs tests/policy.test.mjs`; confirm failure.
- [ ] Add expiring mission grants that only narrow permissions and preserve policy deny/protected paths.
- [ ] Implement local test-command, workspace-preview, Git branch/commit draft, and PR-draft adapters. Require preview, effective allow policy+grant, rollback/compensation, redacted receipt, and idempotency.
- [ ] Run `node --test tests/adapters.test.mjs tests/policy.test.mjs`; expect PASS.
- [ ] Commit with `feat: add scoped autopilot grants and adapters`.

### Task 3: Worker, recovery, and automatic evidence gates

**Files:** Modify `src/autopilot.mjs`, `src/adapters.mjs`, `tests/autopilot.test.mjs`, and `tests/adapters.test.mjs`.

**Interfaces:** `runAutopilot` acquires one project-local lease and returns `ready`, `repairing`, `held`, `blocked`, or `completed`; `advanceMissionWithEvidence({ workspace, mission, packet, evidence })` unlocks only verified dependents.

- [ ] Test non-expired foreign lease rejection, heartbeat/resume, idempotent replay without a duplicate action, failed action rollback, retry budget exhaustion, and missing/failed evidence blocking advancement.
- [ ] Run `node --test tests/autopilot.test.mjs tests/adapters.test.mjs`; confirm failure.
- [ ] Implement atomic lease records, checkpoints, receipt replay, automatic packet evidence checks, rollback-before-repair, and bounded retries.
- [ ] Require command proof for functional packets and recorded review/visual/risk/readiness proof for applicable later packets.
- [ ] Run `node --test tests/autopilot.test.mjs tests/adapters.test.mjs`; expect PASS.
- [ ] Commit with `feat: run autopilot packets with recovery evidence`.

### Task 4: Readiness, dashboard, configuration, and documentation

**Files:** Modify `src/ai-native-suite.mjs`, `src/dashboard.mjs`, `forgemind.config.example.json`, `docs/WORKFLOWS.md`, `README.md`, `tests/ai-native-suite.test.mjs`, and `tests/dashboard.test.mjs`.

**Interfaces:** `autonomyReadiness({ workspace })` reports `observe`, `suggest`, `bounded-autopilot`, or `held` based on actual adapter and receipt evidence.

- [ ] Test that no artifacts remains observe/suggest and a valid manifest+grant+reversible success becomes bounded-autopilot; test explicit dashboard Autopilot rendering.
- [ ] Run `node --test tests/ai-native-suite.test.mjs tests/dashboard.test.mjs`; confirm failure.
- [ ] Derive readiness from effective policy, active grant, registered adapter, successful reversible receipt, rollback evidence, and held mission status.
- [ ] Add credential-free examples for local/read-only connector and sandbox flag adapters; document all CLI lifecycle commands and hard stops.
- [ ] Run `node --test tests/ai-native-suite.test.mjs tests/dashboard.test.mjs`; expect PASS.
- [ ] Commit with `feat: expose evidence-backed autopilot readiness`.

### Task 5: Regression and release gate

**Files:** Modify `CHANGELOG.md` and `docs/release/local-results.json` if results are tracked.

- [ ] Add user-visible release notes explaining high-autonomy local execution, automatic recovery, and still-gated remote mutable actions.
- [ ] Run `npm test`; expect all tests PASS.
- [ ] Run `npm run ci`; expect validation, eval, package, and strict release validation PASS.
- [ ] Commit with `chore: verify goal-driven autopilot release`.
