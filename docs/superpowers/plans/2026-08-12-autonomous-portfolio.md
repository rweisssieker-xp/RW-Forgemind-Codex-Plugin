# Autonomous Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every activated repository into an evidence-labelled portfolio of AI-native disruptive USP experiments, autonomously scheduled through isolated child missions.

**Architecture:** `portfolio-autopilot.mjs` merges Radical and Innovation opportunity sets, deduplicates them, gives every candidate the USP quality contract, and schedules safe work. Existing Autopilot mission records remain the execution primitive; portfolio state, conflict metadata, and aggregate learning stay project-local.

**Tech Stack:** Node.js 20+, ESM, node:test, project-local JSON.

## Global Constraints

- All candidates are hypotheses until supported by real evidence.
- Default concurrent candidate execution is 3; conflicting work is serial.
- Existing policy, grant, adapter, receipt, lease, rollback, and hard-stop rules apply to each child mission.
- Remote mutable, production, destructive, cost, migration, credential, legal, and contractual actions remain held unless explicitly authorized.

---

### Task 1: Portfolio discovery and USP contract

**Files:** Create `src/portfolio-autopilot.mjs`, `tests/portfolio-autopilot.test.mjs`; modify `src/cli.mjs`.

- [ ] Test `portfolio discover` creates deduplicated candidates with interaction replacement, 10x hypothesis, AI centrality, moat, target user, metric, guardrail, kill condition, and rollback.
- [ ] Run `node --test tests/portfolio-autopilot.test.mjs`; confirm failure.
- [ ] Merge Radical and Innovation candidate sets into a persisted portfolio with evidence labels and no market-fact claims.
- [ ] Add `portfolio discover|status|run|resume|candidate|stop` CLI dispatch.
- [ ] Run focused tests; expect PASS.

### Task 2: Child missions and scheduler

**Files:** Modify `src/portfolio-autopilot.mjs`, `src/autopilot.mjs`, `tests/portfolio-autopilot.test.mjs`.

- [ ] Test a max-concurrency-three scheduler, conflict serialization, independent candidate continuation, and stopped candidate isolation.
- [ ] Run focused tests; confirm failure.
- [ ] Create child Autopilot missions with candidate-specific grants, path conflicts, budgets, evidence, and rollback declarations; schedule only eligible non-conflicting work.
- [ ] Run focused tests; expect PASS.

### Task 3: Transform entry points, dashboard, docs, package sync

**Files:** Create `entry-skills/forgemind-portfolio/*`, `entry-skills/forgemind-transform/*`; modify `src/dashboard.mjs`, `README.md`, `docs/WORKFLOWS.md`, `docs/HIERARCHY.md`, `CHANGELOG.md`, tests, and `plugins/forgemind/` mirrors.

- [ ] Test both entry skills, `transform run|status|resume`, dashboard portfolio rendering, and backward-compatible single-goal Autopilot.
- [ ] Implement Transform as portfolio discovery plus scheduler execution; add dashboard evidence and documentation.
- [ ] Synchronize the versioned Marketplace source tree.
- [ ] Run `npm test` and `npm run ci`; expect PASS.
