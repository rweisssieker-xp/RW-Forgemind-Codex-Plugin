# ForgeMind Leap Implementation Plan

**Goal:** Add `$forgemind-leap` as a one-prompt, disruption-first route from an idea or existing app to a selected, bounded MVP delivery contract.

**Architecture:** `src/leap.mjs` composes existing app intelligence, radical and innovation portfolios, the opportunity/business-case model, and the completion contract into one deterministic Leap record. The entry skill tells Codex to continue from that record through bounded YOLO delivery without routine questions; the CLI exposes the same composition as `forgemind leap run`.

**Tech stack:** Node.js ESM, local JSON artifacts, Codex Marketplace skills, Node test runner.

## Global constraints

- Keep generated Leap state outside the project by default and expose `artifactMode` and `artifactPath` in JSON responses.
- Never make market, customer, ROI, or test-success claims without evidence; label missing evidence as assumptions.
- Continue without routine questions but stop before secrets, production access, deletion, irreversible migrations, external spend, legal/compliance commitments, or high-stakes decisions.
- Preserve the ten existing journeys; Leap is the eleventh explicit journey and Guide remains the sole implicit route.

### Task 1: Create the deterministic Leap contract

**Files:**
- Create: `src/leap.mjs`
- Test: `tests/leap.test.mjs`

**Interfaces:**
- Produces `runLeap({ workspace, goal, mode }): Promise<LeapRecord>`.
- Consumes `scanAppIntelligence`, `createInnovationPortfolio`, `createRadicalPortfolio`, `createOpportunityCase`, `createExperienceCanvas`, `createCompletionContract`, and `createRadicalBlueprint`.

- [ ] Write a failing test proving Leap creates five radical alternatives, an automatic selected bet plus contrarian, market/business-case evidence labels, kill condition, rollback boundary, completion contract, and project-local state under `--artifacts workspace`.
- [ ] Implement `runLeap` using the existing deterministic scores; select the highest combined radical/innovation candidate, retain the next eligible candidate as contrarian, generate a radical blueprint and shadow-mode plan for the selected radical bet, and create a completion contract from the selected MVP outcome.
- [ ] Persist the complete record at `leap/latest.json` through the active artifact store and publish one concise project decision document when persistence is enabled.
- [ ] Run `node --test tests/leap.test.mjs`.

### Task 2: Expose the CLI contract

**Files:**
- Modify: `src/cli.mjs`
- Test: `tests/cli.test.mjs`

**Interfaces:**
- Adds `forgemind leap run --goal <outcome> --mode yolo|guided --json`.

- [ ] Write a failing CLI test for `leap run` with JSON output and the resolved artifact metadata.
- [ ] Add `leap` to help, validate the `run` action, and delegate to `runLeap`.
- [ ] Run focused CLI tests.

### Task 3: Add the visible Leap journey

**Files:**
- Create: `entry-skills/forgemind-leap/SKILL.md`, `entry-skills/forgemind-leap/agents/openai.yaml`, `playbooks/leap.md`
- Modify: `entry-skills/forgemind-guide/SKILL.md`, `README.md`, `docs/HIERARCHY.md`
- Test: `tests/journey-surface.test.mjs`, `tests/workflow-routing.test.mjs`

- [ ] Register Leap in the eleven-journey fixtures and documentation hierarchy.
- [ ] State Leap's no-routine-question execution policy, its business-case and disruption requirements, concrete Codex handoff to Complete/YOLO, and hard stop boundary.
- [ ] Run journey tests.

### Task 4: Package and verify distribution

**Files:**
- Modify: `CHANGELOG.md`, root and snapshot manifests, `plugins/forgemind/**`
- Test: full `npm test` and strict package validation.

- [ ] Bump the Marketplace version, build the package, synchronize the validated Core snapshot, and ensure it contains Leap.
- [ ] Run all tests, strict source/package validation, and a local installation smoke test.
- [ ] Commit, tag, push, and release only after all checks pass.
