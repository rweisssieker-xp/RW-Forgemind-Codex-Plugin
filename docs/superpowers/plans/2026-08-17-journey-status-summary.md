# Journey Status Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and refresh one concise Markdown page joining Leap, Venture, Ship, and Xray decisions, open work, evidence links, and the next executable action.

**Architecture:** A `journey-summary` module reads the four existing project-local JSON artifacts through the active artifact store, normalizes only their shared decision and follow-up fields, and renders exactly four sections. Each supported journey calls the writer after it persists its own artifact. Writer failures are returned as additive non-fatal errors and never invalidate the source journey.

**Tech Stack:** Node.js 20+, native ES modules, `node:fs/promises`, existing artifact-store/project-document/io helpers, `node:test`.

## Global Constraints

- Generate only `docs/forgemind/status.md`; do not add a dashboard, remote store, connector, or automatic execution.
- Read but never rewrite Leap, Venture, Ship, or Xray detailed artifacts.
- Use active artifact-state paths for reads and `publishProjectDocument` for Markdown so `--artifacts none` writes no target-project document.
- The document has exactly four H2 sections: `Current decision`, `Open items`, `Next best action`, and `Updated from`.
- Missing journeys show `Not run yet`; unreadable or invalid artifacts are open evidence gaps and are never treated as successful.
- Freshest successful non-blocked result owns the action. Otherwise prioritize explicit blocker, failed/blocked Xray gap, Ship open acceptance/verification work, Venture evidence gap, then Leap next packet.
- Keep changed runtime files byte-identical in `src/` and `plugins/forgemind/src/`.

---

### Task 1: Implement the summary reader, normalizer, prioritizer, and renderer

**Files:**
- Create: `src/journey-summary.mjs`
- Create: `plugins/forgemind/src/journey-summary.mjs`
- Create: `tests/journey-summary.test.mjs`

**Interfaces:**
- Consumes: `artifactStatePath(workspace, ...segments)` and `publishProjectDocument({ workspace, name, title, body })`.
- Produces: `writeJourneyStatusSummary({ workspace, now = () => new Date(), publish = publishProjectDocument })`, resolving to `{ statusPath: 'docs/forgemind/status.md' | null, summary, errors }`.
- Produces: `createJourneyStatusSummary({ records, generatedAt })`, returning `{ markdown, decisions, openItems, nextAction, updatedFrom }` for deterministic tests.

- [ ] **Step 1: Write the failing single-journey and Markdown-contract tests**

```js
test('status summarizes Leap and marks other journeys not run yet', async (t) => {
  const root = await workspace(t);
  await writeArtifact(root, 'leap/latest.json', {
    status: 'ready-for-autonomous-delivery', generatedAt: '2026-08-17T09:00:00.000Z',
    selectedBet: { title: 'Triage Copilot', mvp: 'One reversible triage flow.' },
    nextAction: 'Hero Loop: implement the first ready work packet autonomously.', errors: [],
  });
  const result = await writeJourneyStatusSummary({ workspace: root, now: () => new Date('2026-08-17T10:00:00.000Z') });
  const markdown = await statusMarkdown(root);
  assert.equal(result.statusPath, 'docs/forgemind/status.md');
  assert.deepEqual(markdown.match(/^## /gm), ['## Current decision', '## Open items', '## Next best action', '## Updated from']);
  assert.match(markdown, /Triage Copilot/);
  assert.match(markdown, /Venture: Not run yet/);
  assert.match(markdown, /\[Leap evidence\]\(\.\.\/\.\.codex-orchestrator\/leap\/latest\.json\)/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/journey-summary.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/journey-summary.mjs`.

- [ ] **Step 3: Write failing priority, missing, invalid, and stale-artifact tests**

```js
test('status uses blocker, Xray, Ship, Venture, then Leap fallback priority', () => {
  const records = { leap: leapRecord(), venture: ventureRecord(), ship: shipRecord(), xray: xrayRecord({ gaps: [{ status: 'blocked', title: 'Browser evidence unavailable' }] }) };
  assert.match(createJourneyStatusSummary({ records, generatedAt: ISO }).nextAction, /Browser evidence unavailable/);
  assert.match(createJourneyStatusSummary({ records: { ...records, xray: xrayRecord({ gaps: [] }) }, generatedAt: ISO }).nextAction, /first open criterion/i);
});

test('unreadable Venture artifact becomes an evidence gap rather than a successful result', async (t) => {
  const root = await workspace(t);
  await writeFile(path.join(root, '.codex-orchestrator', 'primary', 'venture-latest.json'), '{not json');
  await writeJourneyStatusSummary({ workspace: root });
  assert.match(await statusMarkdown(root), /Venture artifact is unreadable or invalid/);
  assert.doesNotMatch(await statusMarkdown(root), /Venture recommendation:/);
});
```

Cover a future-dated/stale artifact by asserting that its invalid timestamp is listed under Open items and cannot own `nextAction`.

- [ ] **Step 4: Implement the smallest focused module**

```js
const JOURNEYS = [
  { id: 'leap', label: 'Leap', segments: ['leap', 'latest.json'], path: '.codex-orchestrator/leap/latest.json' },
  { id: 'venture', label: 'Venture', segments: ['primary', 'venture-latest.json'], path: '.codex-orchestrator/primary/venture-latest.json' },
  { id: 'ship', label: 'Ship', segments: ['primary', 'ship-latest.json'], path: '.codex-orchestrator/primary/ship-latest.json' },
  { id: 'xray', label: 'Xray', segments: ['xray', 'report-latest.json'], path: '.codex-orchestrator/xray/report-latest.json' },
];

export async function writeJourneyStatusSummary({ workspace, now = () => new Date(), publish = publishProjectDocument }) {
  const records = Object.fromEntries(await Promise.all(JOURNEYS.map(async (journey) => [journey.id, await loadJourney(workspace, journey)])));
  const summary = createJourneyStatusSummary({ records, generatedAt: now().toISOString() });
  try {
    const document = await publish({ workspace, name: 'status.md', title: 'ForgeMind Journey Status', body: summary.markdown });
    return { statusPath: document ? 'docs/forgemind/status.md' : null, summary, errors: [] };
  } catch (error) {
    return { statusPath: null, summary, errors: [{ code: 'FM_JOURNEY_STATUS_WRITE_FAILED', message: String(error.message ?? error) }] };
  }
}
```

Implement `loadJourney` with `readFile(artifactStatePath(...))`: `ENOENT` maps to missing, parsing/schema failures map to invalid/open-gap, and valid artifacts retain only status, ISO time, decision/recommendation, gaps/errors/blocker, Ship open definition-of-done items, Leap ready packet, nextAction, and its static artifact path. Render each heading once, link evidence as `../../.codex-orchestrator/...`, and select actions with stable timestamps plus the required fallback ordering.

- [ ] **Step 5: Run focused tests and enforce source/mirror parity**

Run: `node --test tests/journey-summary.test.mjs; git diff --no-index -- src/journey-summary.mjs plugins/forgemind/src/journey-summary.mjs`

Expected: PASS and exit code 0 from the mirror comparison.

- [ ] **Step 6: Commit the summary module**

```text
git add src/journey-summary.mjs plugins/forgemind/src/journey-summary.mjs tests/journey-summary.test.mjs
git commit -m "feat: add journey status summary writer"
```

### Task 2: Refresh status after each supported journey while preserving source results

**Files:**
- Modify: `src/leap.mjs:1-112`
- Modify: `src/primary-journeys.mjs:1-152`
- Modify: `src/xray.mjs:1-462`
- Modify: `plugins/forgemind/src/leap.mjs:1-112`
- Modify: `plugins/forgemind/src/primary-journeys.mjs:1-152`
- Modify: `plugins/forgemind/src/xray.mjs:1-462`
- Modify: `tests/leap.test.mjs:9-40`
- Modify: `tests/primary-journeys.test.mjs:9-40`
- Modify: `tests/xray.test.mjs:689-705`
- Modify: `tests/artifact-store.test.mjs:9-56`

**Interfaces:**
- Consumes: `writeJourneyStatusSummary({ workspace })` after each source JSON persistence.
- Produces: source response adds `docs/forgemind/status.md` to `projectDocuments` only if it was written; a failed summary write appends its error to `errors` while leaving the journey status and exit result unchanged.

- [ ] **Step 1: Write failing automatic-refresh integration tests**

```js
test('Leap, Venture, Ship, and Xray refresh the shared status document', async (t) => {
  const root = await workspace(t);
  for (const [command, action] of [['leap', 'run'], ['venture', 'run'], ['ship', 'plan'], ['xray', 'run']]) {
    const result = await runCli([command, action, '--workspace', root, '--goal', 'reduce triage time', '--json'], context());
    assert.equal(result.exitCode, 0);
    assert.ok(result.data.projectDocuments.includes('docs/forgemind/status.md'));
    assert.match(await statusMarkdown(root), /## Updated from/);
  }
});
```

- [ ] **Step 2: Write failing artifact-none and non-fatal-error tests**

```js
test('supported journeys do not publish status with artifacts none', async (t) => {
  const root = await workspace(t);
  const result = await runCli(['ship', 'plan', '--workspace', root, '--goal', 'ship safely', '--artifacts', 'none', '--json'], context());
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.data.projectDocuments, []);
  await assert.rejects(access(path.join(root, 'docs', 'forgemind', 'status.md')));
});

test('summary write failure is non-fatal', async (t) => {
  const result = await writeJourneyStatusSummary({ workspace: await workspace(t), publish: async () => { throw new Error('disk full'); } });
  assert.equal(result.errors[0].code, 'FM_JOURNEY_STATUS_WRITE_FAILED');
});
```

- [ ] **Step 3: Run integration tests and verify they fail before wiring**

Run: `node --test tests/leap.test.mjs tests/primary-journeys.test.mjs tests/xray.test.mjs tests/artifact-store.test.mjs`

Expected: FAIL because the supported journeys do not yet create or report `status.md`.

- [ ] **Step 4: Add one shared non-fatal refresh helper and wire all four journeys**

```js
async function refreshJourneyStatus(workspace, result) {
  const status = await writeJourneyStatusSummary({ workspace });
  if (status.statusPath) result.projectDocuments = [...new Set([...(result.projectDocuments ?? []), status.statusPath])];
  if (status.errors.length) result.errors = [...(result.errors ?? []), ...status.errors];
  return result;
}
```

Call it after writing `leap/latest.json`, `primary/venture-latest.json`, `primary/ship-latest.json`, and both Xray JSON artifacts. Keep the current Leap and Venture documents. In Xray replace its direct `writeTextAtomic` report write with `publishProjectDocument` so Xray itself also satisfies `--artifacts none`; retain `xray-report.md` in `projectDocuments` only when it is published. Do not invoke the summary for Leap `status`, `continue`, `advance`, or other read-only paths.

- [ ] **Step 5: Mirror source edits and run focused integration tests**

Run: `Copy-Item src\leap.mjs plugins\forgemind\src\leap.mjs; Copy-Item src\primary-journeys.mjs plugins\forgemind\src\primary-journeys.mjs; Copy-Item src\xray.mjs plugins\forgemind\src\xray.mjs; node --test tests/journey-summary.test.mjs tests/leap.test.mjs tests/primary-journeys.test.mjs tests/xray.test.mjs tests/artifact-store.test.mjs`

Expected: all focused tests PASS, including no status or other project document in artifact-none mode.

- [ ] **Step 6: Commit the automatic integration**

```text
git add src/leap.mjs src/primary-journeys.mjs src/xray.mjs plugins/forgemind/src/leap.mjs plugins/forgemind/src/primary-journeys.mjs plugins/forgemind/src/xray.mjs tests/leap.test.mjs tests/primary-journeys.test.mjs tests/xray.test.mjs tests/artifact-store.test.mjs tests/journey-summary.test.mjs
git commit -m "feat: refresh journey status after primary runs"
```

### Task 3: Document and release-verify the handoff page

**Files:**
- Modify: `README.md:1-220`
- Modify: `docs/WORKFLOWS.md:1-35`
- Modify: `CHANGELOG.md:1-8`
- Modify: `tests/package.test.mjs`

**Interfaces:**
- Consumes: `docs/forgemind/status.md` behavior from Tasks 1-2.
- Produces: documentation of refresh triggers, the four sections, evidence links, and artifact-none behavior; package coverage for the new runtime module.

- [ ] **Step 1: Write failing documentation/package coverage**

```js
test('package contains the status writer and project docs explain it', async () => {
  assert.ok(await exists(path.join(stagedPlugin, 'src', 'journey-summary.mjs')));
  assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /docs\/forgemind\/status\.md/);
  assert.match(await readFile(path.join(root, 'docs', 'WORKFLOWS.md'), 'utf8'), /Journey status/i);
});
```

- [ ] **Step 2: Run the package test and verify it fails**

Run: `node --test tests/package.test.mjs`

Expected: FAIL until docs mention the status page and the packaged module is asserted.

- [ ] **Step 3: Add concise user documentation**

Add a `Journey status` subsection near Start/Xray workflows and a README reference. State that Leap, Venture, Ship, and Xray refresh `docs/forgemind/status.md`; it contains the current decision, open items, next best action, and evidence sources. State that detailed evidence stays under `.codex-orchestrator/` and `--artifacts none` writes no document. Add one Unreleased changelog entry.

- [ ] **Step 4: Run release verification**

Run: `node --test tests/package.test.mjs; npm test; node bin/forgemind.mjs validate --strict-release; node bin/forgemind.mjs package --output dist/journey-status-summary; node bin/forgemind.mjs validate --plugin dist/journey-status-summary --strict-release`

Expected: all tests and strict validations PASS; the built plugin includes `src/journey-summary.mjs`.

- [ ] **Step 5: Self-review and commit the documentation**

Run: `git diff --check; git status --short; rg -n "TODO|TBD|implement later|fill in details" docs/superpowers/plans/2026-08-17-journey-status-summary.md`

Expected: no whitespace errors, only intended changes, and no plan placeholders.

```text
git add README.md docs/WORKFLOWS.md CHANGELOG.md tests/package.test.mjs docs/superpowers/plans/2026-08-17-journey-status-summary.md
git commit -m "docs: describe journey status summary"
```
