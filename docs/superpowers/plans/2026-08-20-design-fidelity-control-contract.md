# Design Fidelity Control Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Design Fidelity require both measured PNG similarity and evidence-backed, accessible controls derived from the design reference.

**Architecture:** The Design Fidelity skill derives and persists a control contract from each locally supplied image; the Node runtime validates an explicit contract rather than inventing image semantics. A safe DOM/browser receipt adapter validates roles, accessible names, visible text, state, and allowlisted interactions, then `runDesignFidelity` combines visual and control evidence into one status.

**Tech Stack:** Node.js ESM, native `node:test`, existing artifact store, local Playwright browser capture, internal Codex Browser skill, Marketplace source mirror.

**Spec:** `docs/superpowers/specs/2026-08-20-design-fidelity-control-contract-design.md`

## Global Constraints

- Only the Codex skill interprets PNG content; runtime accepts explicit, project-local JSON contracts and makes no cloud/AI request.
- Permit only roles: `button`, `link`, `textbox`, `searchbox`, `checkbox`, `radio`, `combobox`, `tab`, `navigation`, `heading`, `img`, `card`, `status`.
- Permit only page load, same-origin opted-in navigation, tab/accordion state changes, and non-submitting empty-input validation.
- Never automate authentication, form submission, upload/download, save/delete, account/admin, payment, deployment, cookies, local storage, or credentials.
- Persist contracts and evidence beneath `.codex-orchestrator/design-fidelity/`; `matched` requires visual tolerance and every required control receipt.
- Mirror runtime and skill changes under `plugins/forgemind/` byte-for-byte.

---

### Task 1: Validated project-local control contracts

**Files:**
- Create: `src/design-fidelity-controls.mjs`
- Create: `tests/design-fidelity-controls.test.mjs`
- Create: `plugins/forgemind/src/design-fidelity-controls.mjs`

**Interfaces:**
- Produces `saveControlContract({ workspace, contract }) -> Promise<contract>` and `loadControlContract({ workspace, contractId }) -> Promise<contract | null>`.
- A control is `{ id, role, name, visibleText?, region?, state?, safeInteraction? }`.

- [ ] **Step 1: Write failing tests**

```js
test('Control contracts retain only approved roles and safe same-origin interactions', async (t) => {
  const saved = await saveControlContract({ workspace: root, contract: { id: 'home', controls: [{ id: 'cta', role: 'button', name: 'Start', safeInteraction: { type: 'navigate', target: '/signup' } }] } });
  assert.equal(saved.controls[0].role, 'button');
});

test('Control contracts reject a remote target, unsafe role, duplicate ID, and consequential action', async () => {
  await assert.rejects(() => saveControlContract({ workspace: root, contract: invalid }), /FM_DESIGN_FIDELITY_CONTROL_INVALID/);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test tests/design-fidelity-controls.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement validation and persistence**

```js
export async function saveControlContract({ workspace, contract }) {
  // Validate IDs, approved roles, nonblank names, optional bounded regions,
  // safe interaction types and same-origin relative targets; atomically write JSON.
}
```

Use `artifactStatePath` and `writeJsonAtomic`; reject unknown keys and return no partial contract.

- [ ] **Step 4: Run tests and confirm success**

Run: `node --test tests/design-fidelity-controls.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\design-fidelity-controls.mjs plugins\forgemind\src\design-fidelity-controls.mjs
git add src/design-fidelity-controls.mjs plugins/forgemind/src/design-fidelity-controls.mjs tests/design-fidelity-controls.test.mjs
git commit -m "feat: add Design Fidelity control contracts"
```

### Task 2: Safe browser/DOM control receipts

**Files:**
- Create: `src/design-fidelity-control-receipts.mjs`
- Create: `tests/design-fidelity-control-receipts.test.mjs`
- Create: `plugins/forgemind/src/design-fidelity-control-receipts.mjs`

**Interfaces:**
- Consumes a saved contract and injected local DOM/browser observations.
- Produces `verifyControlContract({ contract, observations }) -> { receipts, gaps, status }`.

- [ ] **Step 1: Write failing receipt tests**

```js
test('a matching button receipt proves role, accessible name, visible text, and safe navigation', () => {
  const result = verifyControlContract({ contract, observations: [{ id: 'cta', role: 'button', name: 'Start', visibleText: 'Start', status: 'passed', interaction: { type: 'navigate', url: 'http://127.0.0.1:4173/signup' } }] });
  assert.equal(result.status, 'passed');
});

test('missing controls and consequential interaction receipts remain gaps', () => {
  const result = verifyControlContract({ contract, observations: [] });
  assert.equal(result.gaps[0].code, 'FM_DESIGN_FIDELITY_CONTROL_NOT_EVIDENCED');
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test tests/design-fidelity-control-receipts.test.mjs`

Expected: FAIL because the verifier does not exist.

- [ ] **Step 3: Implement deterministic receipt matching**

```js
export function verifyControlContract({ contract, observations }) {
  // Match each control by ID, role, name, visible text and state.
  // Permit only validated interaction evidence; emit one explicit gap per missing/mismatched control.
}
```

Never treat an open tab or a screenshot alone as control evidence.

- [ ] **Step 4: Run tests and confirm success**

Run: `node --test tests/design-fidelity-control-receipts.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\design-fidelity-control-receipts.mjs plugins\forgemind\src\design-fidelity-control-receipts.mjs
git add src/design-fidelity-control-receipts.mjs plugins/forgemind/src/design-fidelity-control-receipts.mjs tests/design-fidelity-control-receipts.test.mjs
git commit -m "feat: verify Design Fidelity controls"
```

### Task 3: Combine control and visual status

**Files:**
- Modify: `src/design-fidelity.mjs`
- Modify: `tests/design-fidelity.test.mjs`
- Modify: `plugins/forgemind/src/design-fidelity.mjs`

**Interfaces:**
- `runDesignFidelity({ ..., controlContractId, controlObservations })` appends `controlEvidence`, `controlGaps`, and a combined status.

- [ ] **Step 1: Write failing combined-status tests**

```js
test('a visually matching screen stays unresolved when required controls lack evidence', async () => {
  const report = await runDesignFidelity({ workspace: root, references: 'reference.png', route: localUrl, controlContractId: 'home', controlObservations: [] });
  assert.equal(report.status, 'needs-correction');
  assert.equal(report.controlGaps[0].code, 'FM_DESIGN_FIDELITY_CONTROL_NOT_EVIDENCED');
});
```

- [ ] **Step 2: Run test and confirm failure**

Run: `node --test tests/design-fidelity.test.mjs`

Expected: FAIL because control evidence is absent from the report.

- [ ] **Step 3: Implement combined report semantics**

```js
const controls = controlContractId ? await loadControlContract({ workspace, contractId: controlContractId }) : null;
const controlResult = controls ? verifyControlContract({ contract: controls, observations: controlObservations }) : { receipts: [], gaps: [] };
const status = visualMatched && controlResult.gaps.length === 0 ? 'matched' : 'needs-correction';
```

Render `## Control evidence` and `## Control gaps` in the Markdown report.

- [ ] **Step 4: Run tests and confirm success**

Run: `node --test tests/design-fidelity.test.mjs tests/design-fidelity-controls.test.mjs tests/design-fidelity-control-receipts.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\design-fidelity.mjs plugins\forgemind\src\design-fidelity.mjs
git add src/design-fidelity.mjs plugins/forgemind/src/design-fidelity.mjs tests/design-fidelity.test.mjs
git commit -m "feat: gate Design Fidelity on control evidence"
```

### Task 4: CLI and agent workflow

**Files:**
- Modify: `src/cli.mjs`
- Modify: `entry-skills/forgemind-design-fidelity/SKILL.md`
- Modify: `tests/cli.test.mjs`
- Mirror: matching `plugins/forgemind/` files

- [ ] **Step 1: Write a failing CLI contract test**

```js
test('Design Fidelity accepts an explicit local control contract and observations', async () => {
  const result = await runCli(['design-fidelity', 'run', '--workspace', root, '--references', 'reference.png', '--route', localUrl, '--control-contract', 'home', '--control-observations', '[]', '--json'], context);
  assert.equal(result.exitCode, 0);
});
```

- [ ] **Step 2: Run test and confirm failure**

Run: `node --test tests/cli.test.mjs`

Expected: FAIL because these options are not forwarded.

- [ ] **Step 3: Add dispatch and skill protocol**

```js
data = await designFidelity.runDesignFidelity({ workspace, references: options.references, route: options.route, controlContractId: options['control-contract'], controlObservations: parseJsonArray(options['control-observations'], 'FM_DESIGN_FIDELITY_CONTROLS_INVALID') });
```

Require the skill to inspect the image, write the contract through the CLI/API, implement only allowed UI controls, collect local Browser receipts for every safe interaction, and rerun the combined gate. It must label uncertain image interpretation as an assumption.

- [ ] **Step 4: Run tests and confirm success**

Run: `node --test tests/cli.test.mjs tests/journey-surface.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\cli.mjs plugins\forgemind\src\cli.mjs
Copy-Item entry-skills\forgemind-design-fidelity\SKILL.md plugins\forgemind\entry-skills\forgemind-design-fidelity\SKILL.md
git add src/cli.mjs plugins/forgemind/src/cli.mjs entry-skills/forgemind-design-fidelity plugins/forgemind/entry-skills/forgemind-design-fidelity tests/cli.test.mjs
git commit -m "feat: guide semantic Design Fidelity implementation"
```

### Task 5: Release verification

**Files:**
- Modify: `package.json`, `package-lock.json`, `.codex-plugin/plugin.json`
- Modify: `plugins/forgemind/package.json`, `plugins/forgemind/.codex-plugin/plugin.json`
- Modify: `CHANGELOG.md`, `tests/package.test.mjs`

- [ ] **Step 1: Change the expected version to `1.45.0` and confirm package test fails**

Run: `node --test tests/package.test.mjs`

Expected: FAIL while manifests still say `1.44.0`.

- [ ] **Step 2: Synchronize `1.45.0`, changelog, source/mirror files, and test expectations**

- [ ] **Step 3: Run final verification**

Run: `npm run ci`

Expected: PASS.

- [ ] **Step 4: Commit release**

```bash
git add package.json package-lock.json .codex-plugin/plugin.json plugins/forgemind/package.json plugins/forgemind/.codex-plugin/plugin.json CHANGELOG.md tests/package.test.mjs
git commit -m "release: ForgeMind 1.45.0"
```
