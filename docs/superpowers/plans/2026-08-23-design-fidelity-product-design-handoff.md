# Design Fidelity Product Design Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist exactly three Product Design proposals, require one explicit selection, and hand only that immutable visual target to the measured Fidelity workflow.

**Architecture:** Extend `design-fidelity-drafts.mjs` with proposal-set, selection, and apply-handoff records. Extend the existing CLI actions and Design Fidelity entry skill; do not generate images or modify product code from the CLI.

**Tech Stack:** Node.js 20+, ESM, Node test runner, existing artifact store, hash utilities, atomic I/O, and Design Fidelity drafts.

**Spec:** `docs/superpowers/specs/2026-08-23-design-fidelity-product-design-handoff.md`

## Global Constraints

- Require workspace artifacts, local workspace-contained PNGs, and local/test routes.
- Require exactly three unique PNG hashes; never infer or rank a selection.
- Only `select` may create the draft used by `apply` and the Fidelity correction loop.
- Preserve the existing UI-only edit and safe-target rules.
- `--artifacts none` must be rejected before any file is copied or written.

---

### Task 1: Proposal-set persistence

**Files:** Modify `src/design-fidelity-drafts.mjs`; modify `tests/design-fidelity-drafts.test.mjs`.

**Interfaces:** Export `createProductDesignProposals({ workspace, inputs, route, viewport, goal })` and `loadProductDesignProposals({ workspace, proposalSetId })`.

- [ ] **Step 1: Write the failing test**

```js
test('three unique Product Design PNGs are persisted as an unselected proposal set', async (t) => {
  const root = await workspace(t);
  await writePngs(root, ['a.png', 'b.png', 'c.png']);
  const set = await createProductDesignProposals({ workspace: root, inputs: 'a.png,b.png,c.png', route: 'http://127.0.0.1:4173/', goal: 'Improve CRM onboarding' });
  assert.equal(set.status, 'awaiting-selection');
  assert.equal(set.proposals.length, 3);
  assert.equal(new Set(set.proposals.map((item) => item.sha256)).size, 3);
  await assert.rejects(() => createProductDesignProposals({ workspace: root, inputs: 'a.png,a.png,c.png', route: 'http://127.0.0.1:4173/' }), { code: 'FM_DESIGN_FIDELITY_PROPOSALS_INVALID' });
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/design-fidelity-drafts.test.mjs`  
Expected: FAIL because `createProductDesignProposals` is missing.

- [ ] **Step 3: Implement minimal proposal persistence**

```js
export async function createProductDesignProposals({ workspace, inputs, route, viewport = 'desktop', goal = null }) {
  const sourcePaths = String(inputs ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  if (artifactMetadata().artifactMode === 'none' || sourcePaths.length !== 3 || !isSafeBrowserTarget(route) || !VIEWPORTS.has(viewport)) throw invalidProposals();
  const proposals = await Promise.all(sourcePaths.map((input, index) => importProposal({ workspace, input, index })));
  if (new Set(proposals.map((proposal) => proposal.sha256)).size !== 3) throw invalidProposals();
  const id = `proposal-set-${createHash('sha256').update(proposals.map((item) => item.sha256).join('|')).digest('hex').slice(0, 16)}`;
  const result = { schemaVersion: 1, id, status: 'awaiting-selection', source: 'product-design', goal, route, viewport, proposals, selectedProposalId: null };
  await writeJsonAtomic(artifactStatePath(workspace, 'design-fidelity', 'proposals', id, 'manifest.json'), result);
  return result;
}
```

`importProposal` must use the same containment, file, PNG, copy, and SHA-256 rules as current draft import, writing `proposal-1.png` through `proposal-3.png` under the set directory.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/design-fidelity-drafts.test.mjs`  
Expected: PASS.

Commit: `git add src/design-fidelity-drafts.mjs tests/design-fidelity-drafts.test.mjs && git commit -m "feat: persist Product Design proposal sets"`.

### Task 2: Explicit selection and immutable draft

**Files:** Modify `src/design-fidelity-drafts.mjs`; modify `tests/design-fidelity-drafts.test.mjs`.

**Interfaces:** Export `selectProductDesignProposal({ workspace, proposalSetId, proposalId })`, returning `{ selection, draft }`.

- [ ] **Step 1: Write the failing test**

```js
test('selection creates an immutable user-selected draft and rejects unknown proposals', async (t) => {
  const root = await workspace(t);
  const set = await createThreeProposals(root);
  const selected = await selectProductDesignProposal({ workspace: root, proposalSetId: set.id, proposalId: set.proposals[1].id });
  assert.equal(selected.selection.selectedBy, 'user');
  assert.equal(selected.selection.proposalId, set.proposals[1].id);
  assert.equal(selected.draft.selectedBy, 'user');
  await assert.rejects(() => selectProductDesignProposal({ workspace: root, proposalSetId: set.id, proposalId: 'proposal-99' }), { code: 'FM_DESIGN_FIDELITY_PROPOSAL_UNKNOWN' });
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/design-fidelity-drafts.test.mjs`  
Expected: FAIL because selection is missing.

- [ ] **Step 3: Implement selection**

```js
export async function selectProductDesignProposal({ workspace, proposalSetId, proposalId }) {
  const set = await loadProductDesignProposals({ workspace, proposalSetId });
  const proposal = set?.proposals.find((item) => item.id === proposalId);
  if (!proposal) throw new ForgeMindError('FM_DESIGN_FIDELITY_PROPOSAL_UNKNOWN', 'Select a proposal ID from the current Product Design proposal set.');
  const draft = await importProductDesignDraft({ workspace, input: proposal.workspacePath, route: set.route, viewport: set.viewport });
  const selection = { schemaVersion: 1, id: `selection-${proposal.sha256.slice(0, 16)}`, proposalSetId, proposalId, selectedBy: 'user', selectedAt: new Date().toISOString(), draftId: draft.id, sha256: proposal.sha256 };
  await writeJsonAtomic(artifactStatePath(workspace, 'design-fidelity', 'selections', `${selection.id}.json`), selection);
  return { selection, draft };
}
```

Update the manifest atomically to `status: 'selected'` and `selectedProposalId`. Do not permit a second selection for a set with a different proposal ID.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/design-fidelity-drafts.test.mjs`  
Expected: PASS.

Commit: `git add src/design-fidelity-drafts.mjs tests/design-fidelity-drafts.test.mjs && git commit -m "feat: record immutable design proposal selection"`.

### Task 3: CLI proposal, selection, and apply actions

**Files:** Modify `src/cli.mjs`; modify `tests/cli.test.mjs`.

**Interfaces:** `design-fidelity propose`, `proposals`, `select`, and `apply`. `apply` returns the selected draft ID, selected PNG reference, allowed extensions, contract requirement, and next measured-run command; it does not write application source.

- [ ] **Step 1: Write failing CLI coverage**

```js
test('Design Fidelity applies only the explicitly selected proposal', async (t) => {
  const root = await designWorkspace(t);
  const proposals = await runCli(['design-fidelity', 'propose', '--workspace', root, '--inputs', 'a.png,b.png,c.png', '--route', 'http://127.0.0.1:4173/', '--json'], context());
  const applyBeforeSelection = await runCli(['design-fidelity', 'apply', '--workspace', root, '--proposal', proposals.data.proposals[0].id, '--json'], context());
  assert.equal(applyBeforeSelection.exitCode, 2);
  const selected = await runCli(['design-fidelity', 'select', '--workspace', root, '--proposal-set', proposals.data.id, '--proposal', proposals.data.proposals[0].id, '--json'], context());
  const applied = await runCli(['design-fidelity', 'apply', '--workspace', root, '--proposal', selected.data.selection.proposalId, '--json'], context());
  assert.equal(applied.data.draft.id, selected.data.draft.id);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/cli.test.mjs`  
Expected: FAIL because the actions are unsupported.

- [ ] **Step 3: Add action dispatch**

In the existing `design-fidelity` command branch import the three new helpers. Route `propose` to the manifest creator, `proposals` to the manifest loader, `select` to selection using `--proposal-set` and `--proposal`, and `apply` to a helper that resolves only the selected receipt. Reject apply without a matching selected receipt with `FM_DESIGN_FIDELITY_SELECTION_REQUIRED`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/cli.test.mjs tests/design-fidelity-drafts.test.mjs`  
Expected: PASS.

Commit: `git add src/cli.mjs tests/cli.test.mjs src/design-fidelity-drafts.mjs tests/design-fidelity-drafts.test.mjs && git commit -m "feat: add fidelity proposal selection handoff"`.

### Task 4: Entry-skill and documentation handoff

**Files:** Modify `entry-skills/forgemind-design-fidelity/SKILL.md`; modify `README.md`; modify `tests/journey-surface.test.mjs` if it validates entry-skill wording.

- [ ] **Step 1: Write the failing documentation assertion**

```js
assert.match(await readFile(path.join(root, 'entry-skills', 'forgemind-design-fidelity', 'SKILL.md'), 'utf8'), /exactly three/i);
assert.match(await readFile(path.join(root, 'entry-skills', 'forgemind-design-fidelity', 'SKILL.md'), 'utf8'), /select/i);
assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /design-fidelity propose/);
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/journey-surface.test.mjs`  
Expected: FAIL until proposal/selection instructions exist.

- [ ] **Step 3: Document the exact handoff**

Require Product Design to create exactly three variants, require local export and `propose`, show proposal IDs for one user selection, then use only the resulting draft ID in `apply` and `run`. State that post-selection implementation may not redesign copy, layout, controls, states, or interactions; uncertain elements are assumptions. Add matching concise README commands.

- [ ] **Step 4: Verify, package, and commit**

Run:

```text
node --test tests/design-fidelity-drafts.test.mjs tests/design-fidelity.test.mjs tests/cli.test.mjs tests/journey-surface.test.mjs
npm test
npm run validate
npm run build
node bin/forgemind.mjs validate --plugin dist/plugin --strict-release
```

Expected: all tests and strict package validation pass.

Commit: `git add entry-skills/forgemind-design-fidelity/SKILL.md README.md tests/journey-surface.test.mjs && git commit -m "docs: add Product Design selection handoff"`.

## Plan self-review

Task 1 covers exact-three local persistence, hashes, deduplication, route safety, and none-mode. Task 2 covers the required explicit and immutable user selection. Task 3 covers the CLI actions and prevents application of an unselected design. Task 4 covers the Product Design handoff and full verification. No step permits visual ranking, silent selection, code changes from `apply`, or drift from the selected draft.
