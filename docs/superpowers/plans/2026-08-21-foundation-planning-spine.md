# Foundation Planning Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add zero-question `forgemind foundation`, creating a versioned Project Context → PRD → Architecture/NFR → Epics/Stories → Readiness → Sprint chain.

**Architecture:** `src/foundation.mjs` owns the Foundation graph, persistence, invalidation, and readiness. The CLI exposes `foundation run|status|refresh`; Ship, Leap, and Autopilot call it only for non-trivial scope.

**Tech Stack:** Node.js 20+, ESM, Node test runner, existing atomic I/O, artifact storage, profile and document helpers.

**Spec:** `docs/superpowers/specs/2026-08-21-foundation-planning-spine-design.md`

## Global Constraints

- No routine user questions; retain only existing hard-stop boundaries.
- No dependencies or network calls.
- Persist only in the workspace; `--artifacts none` leaves no state or documents.
- Label repository-derived values and missing facts as evidence or assumptions.
- Do not overwrite reviewed decisions or change existing behaviour when Foundation is absent.

## Files

- Create `src/foundation.mjs` for the graph, classifier, readiness, refresh, rendering, and persistence.
- Create `tests/foundation.test.mjs` for Foundation unit and workflow coverage.
- Modify `src/cli.mjs`, `src/primary-journeys.mjs`, `src/leap.mjs`, and `src/autopilot.mjs` for the public command and integrations.
- Modify `tests/cli.test.mjs`, `tests/primary-journeys.test.mjs`, `tests/leap.test.mjs`, `tests/autopilot.test.mjs`, and `tests/journey-surface.test.mjs`.
- Modify `README.md`, `docs/HIERARCHY.md`, and `docs/WORKFLOWS.md`.

### Task 1: Implement the Foundation graph

**Interfaces:** Export `runFoundation({ workspace, goal, mode })`, `getFoundationStatus({ workspace })`, `classifyFoundationScope({ goal, projectProfile })`, `evaluateFoundationReadiness(foundation)`, and `refreshFoundation({ workspace, changes })`.

- [ ] Write the failing test.

```js
test('Foundation drafts a complete evidence-labelled chain without questions', async (t) => {
  const root = await workspace(t);
  const result = await runFoundation({ workspace: root });
  assert.equal(result.goalSource, 'zero-input-default');
  assert.equal(result.foundation.context.evidence, 'repository-derived');
  assert.ok(result.foundation.prd.assumptions.length > 0);
  assert.equal(result.foundation.stories.length, 1);
  await readFile(path.join(root, '.codex-orchestrator', 'foundation', 'latest.json'), 'utf8');
  await readFile(path.join(root, 'docs', 'forgemind', 'project-context.md'), 'utf8');
});
```

- [ ] Run `node --test tests/foundation.test.mjs`; expect a missing-module failure.

- [ ] Implement the smallest valid graph.

```js
export async function runFoundation({ workspace, goal, mode = 'direct' } = {}) {
  const root = await resolveWorkspace(workspace);
  const profile = await deriveProjectProfile({ workspace: root });
  const outcome = String(goal ?? '').trim() || defaultGoal(profile);
  const foundation = createFoundation({ profile, outcome, goalSource: goal ? 'user' : 'zero-input-default', mode });
  const readiness = evaluateFoundationReadiness(foundation);
  const result = { schemaVersion: 1, status: readiness.status, foundationId: foundation.id, revision: 1, goal: outcome, goalSource: foundation.goalSource, scope: classifyFoundationScope({ goal: outcome, projectProfile: profile }), foundation, readiness, assumptions: foundation.assumptions, decisionsNeeded: foundation.decisionsNeeded, nextStory: foundation.stories[0], artifactPath: '.codex-orchestrator/foundation/latest.json', errors: [] };
  await persistFoundation(root, result);
  return result;
}
```

`createFoundation` creates context, PRD, architecture, NFRs, one epic, one ready story, readiness, and sprint records with IDs, revisions, dependencies, draft state, and assumptions. `persistFoundation` uses `artifactStatePath` and `publishProjectDocument` for the eight documents defined by the spec.

- [ ] Run `node --test tests/foundation.test.mjs`; expect PASS.
- [ ] Commit with `git add src/foundation.mjs tests/foundation.test.mjs && git commit -m "feat: add foundation planning draft"`.

### Task 2: Implement classification, readiness, and refresh

- [ ] Write failing tests.

```js
test('Foundation requires planning for integration work and fails without architecture', async (t) => {
  const result = await runFoundation({ workspace: await workspace(t), goal: 'Add authenticated API integration across dashboard and data model' });
  assert.equal(result.scope, 'foundation-required');
  result.foundation.architecture = null;
  assert.deepEqual(evaluateFoundationReadiness(result.foundation), { status: 'fail', blockers: ['architecture-missing'] });
});
test('Foundation stales descendants after a PRD change while preserving reviewed architecture', async (t) => {
  const root = await workspace(t);
  await runFoundation({ workspace: root, goal: 'Improve triage' });
  const next = await refreshFoundation({ workspace: root, changes: { prd: { scope: 'Add partner API synchronization' }, architecture: { decisionState: 'reviewed', boundary: 'existing gateway' } } });
  assert.equal(next.revision, 2);
  assert.equal(next.foundation.architecture.decisionState, 'reviewed');
  assert.equal(next.foundation.epics[0].state, 'stale');
  assert.ok(next.readiness.blockers.includes('stories-stale'));
});
```

- [ ] Run `node --test tests/foundation.test.mjs`; expect FAIL.
- [ ] Implement deterministic classification and refresh.

```js
export function classifyFoundationScope({ goal, projectProfile }) {
  const text = String(goal ?? '').toLowerCase();
  return /architecture|integration|api|database|migration|authentication|dashboard|release/.test(text) || (projectProfile?.commands?.length ?? 0) > 2 ? 'foundation-required' : 'lightweight';
}
export function evaluateFoundationReadiness(foundation) {
  const blockers = ['context', 'prd', 'architecture', 'nfrs', 'epics', 'stories', 'sprint'].filter((key) => !foundation[key] || (Array.isArray(foundation[key]) && !foundation[key].length)).map((key) => `${key}-missing`);
  if (foundation.stories?.some((story) => story.state === 'stale')) blockers.push('stories-stale');
  return { status: blockers.length ? 'fail' : foundation.assumptions.length ? 'concerns' : 'pass', blockers };
}
```

`refreshFoundation` increments revision, marks only descendants stale when a material parent changes, preserves reviewed fields, and rejects malformed persisted state.

- [ ] Run `node --test tests/foundation.test.mjs`; expect PASS.
- [ ] Commit with `git add src/foundation.mjs tests/foundation.test.mjs && git commit -m "feat: add foundation readiness and revisions"`.

### Task 3: Expose the CLI and artifact-mode behaviour

- [ ] Write failing CLI coverage.

```js
test('foundation CLI is zero-input and none mode leaves no state', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-foundation-cli-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await runCli(['foundation', 'run', '--workspace', root, '--artifacts', 'none', '--json'], context());
  assert.equal(result.exitCode, 0);
  assert.equal(result.data.goalSource, 'zero-input-default');
  assert.equal(result.data.artifactPath, null);
  await assert.rejects(() => readFile(path.join(root, '.codex-orchestrator', 'foundation', 'latest.json')));
});
```

- [ ] Run `node --test tests/cli.test.mjs tests/foundation.test.mjs`; expect FAIL with unknown command.
- [ ] Add `foundation` once to `PRIMARY_COMMANDS` and dispatch:

```js
} else if (command === 'foundation') {
  const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
  const action = positionals[0] ?? 'run';
  const foundation = await import('./foundation.mjs');
  if (action === 'run') data = await foundation.runFoundation({ workspace, goal: options.goal, mode: 'direct' });
  else if (action === 'status') data = await foundation.getFoundationStatus({ workspace });
  else if (action === 'refresh') data = await foundation.refreshFoundation({ workspace });
  else throw invalidInput('FM_FOUNDATION_ACTION_INVALID', 'Foundation supports run, status, and refresh.');
}
```

- [ ] Run `node --test tests/cli.test.mjs tests/foundation.test.mjs`; expect PASS.
- [ ] Commit with `git add src/cli.mjs tests/cli.test.mjs tests/foundation.test.mjs && git commit -m "feat: expose foundation CLI"`.

### Task 4: Integrate Ship, Leap, and Autopilot

- [ ] Write failing integration tests.

```js
test('Ship exposes Foundation for integration work', async (t) => {
  const result = await runShip({ workspace: await workspace(t), goal: 'Add authenticated API synchronization to dashboard' });
  assert.equal(result.foundation.scope, 'foundation-required');
  assert.ok(result.foundation.nextStory);
});
test('Autopilot adds Foundation readiness before implementation', async (t) => {
  const started = await startAutopilot({ workspace: await workspace(t), goal: 'Migrate data and add authenticated partner integration' });
  assert.deepEqual(started.mission.packets.slice(0, 3).map((packet) => packet.id), ['inspect-and-contract', 'foundation-readiness', 'implement']);
});
```

- [ ] Run `node --test tests/primary-journeys.test.mjs tests/leap.test.mjs tests/autopilot.test.mjs`; expect FAIL.
- [ ] Call `runFoundation({ workspace: root, goal, mode: 'embedded' })` from Ship after goal resolution and from Leap after bet selection. Ship uses `foundation.nextStory` as its next action. Leap leaves `implement-thin-slice` pending with `blockedBy: 'foundation-readiness'` only if mandatory readiness fails.
- [ ] In `startAutopilot`, insert `foundation-readiness` immediately after `inspect-and-contract` for Foundation-required scopes. In `runAutopilot`, hold with Foundation blockers when readiness is `fail`; never execute an adapter in that case.
- [ ] Run `node --test tests/primary-journeys.test.mjs tests/leap.test.mjs tests/autopilot.test.mjs`; expect PASS.
- [ ] Commit with `git add src/primary-journeys.mjs src/leap.mjs src/autopilot.mjs tests/primary-journeys.test.mjs tests/leap.test.mjs tests/autopilot.test.mjs && git commit -m "feat: gate complex journeys on foundation readiness"`.

### Task 5: Document and release-verify

- [ ] Write a failing documentation assertion for `$forgemind-foundation`, `without routine questions`, and `Foundation` in the hierarchy.
- [ ] Run `node --test tests/journey-surface.test.mjs`; expect FAIL.
- [ ] Document Foundation as an explicit advanced planning workflow in README, hierarchy, and workflows. Describe `run|status|refresh`, the artifact chain, advisory direct runs, enforcing embedded gates, and the boundary that plans remain repository-derived drafts.
- [ ] Run the focused tests and release checks:

```text
node --test tests/foundation.test.mjs tests/cli.test.mjs tests/primary-journeys.test.mjs tests/leap.test.mjs tests/autopilot.test.mjs tests/journey-surface.test.mjs
npm test
npm run validate
npm run eval
npm run build
node bin/forgemind.mjs validate --plugin dist/plugin --strict-release
```

- [ ] Commit with `git add README.md docs/HIERARCHY.md docs/WORKFLOWS.md tests/journey-surface.test.mjs && git commit -m "docs: describe foundation workflow"`.

## Plan self-review

Tasks 1–2 implement all required artifacts, evidence/assumption labeling, revisions, invalidation, refresh, and readiness. Task 3 covers the public command and no-persistence mode. Task 4 covers the three required journey integrations. Task 5 covers the public contract and complete verification. The names introduced by Task 1 are used consistently, and every implementation step has an explicit verification command.
