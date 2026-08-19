# Design Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an autonomous, local-only Design Fidelity entrypoint that turns PNG references into measured UI corrections with reproducible evidence.

**Architecture:** A small `design-fidelity-contract` module normalizes references into safe route/viewport contracts. A `design-fidelity-diff` module compares decoded PNGs and creates a difference PNG plus geometry. `design-fidelity` orchestrates capture, measurement, iteration records, and Markdown reporting; the Codex entry skill uses those reports to make the permitted UI edits automatically, then reruns the command until the measured result is accepted or bounded.

**Tech Stack:** Node.js 20 ESM, native `node:test`, filesystem artifacts, existing Playwright capture adapter, existing PNG decoder, ForgeMind artifact store.

**Spec:** `docs/superpowers/specs/2026-08-19-design-fidelity-design.md`

## Global Constraints

- Accept only explicit local PNG files and directories; reject URLs, workspace escapes, and non-PNG input.
- Capture only explicit loopback or `.test` URLs with an existing local Playwright runtime; never install a runtime or start an unverified server.
- Default `thresholdPercent` is `1`, default `maxIterations` is `3`, and accepted viewports are `desktop` and `mobile`.
- Persist only beneath the active `.codex-orchestrator/design-fidelity/` store; `--artifacts none` must not write or automatically edit files.
- Automatic edits may touch only project UI source, styles, templates, and local assets; reject lockfiles, dependency manifests, secrets, deployment, payment, identity, and production configuration.
- Retain the prior source state and stop when tests fail or the measured visual result worsens.
- Mirror every runtime and entry-skill file byte-for-byte under `plugins/forgemind/`.

---

### Task 1: Reference-contract normalization

**Files:**
- Create: `src/design-fidelity-contract.mjs`
- Create: `tests/design-fidelity-contract.test.mjs`
- Create: `plugins/forgemind/src/design-fidelity-contract.mjs`

**Interfaces:**
- Produces: `loadDesignContracts({ workspace, references, route, viewport, thresholdPercent, maxIterations }) -> Promise<{ contracts, gaps }>`.
- A contract is `{ id, referencePath, referenceDigest, route, viewport, thresholdPercent, maxIterations }`.
- Consumed by `runDesignFidelity` in Task 3.

- [ ] **Step 1: Write the failing tests**

```js
test('Design Fidelity expands local PNG files and directories into deterministic contracts', async (t) => {
  const result = await loadDesignContracts({ workspace: root, references: 'design/a.png,design', route: 'http://127.0.0.1:4173/', viewport: 'desktop' });
  assert.equal(result.gaps.length, 0);
  assert.deepEqual(result.contracts.map(({ referencePath }) => referencePath), ['design/a.png', 'design/b.png']);
});

test('Design Fidelity rejects URLs, workspace escapes, invalid viewports, and non-PNG references', async () => {
  const result = await loadDesignContracts({ workspace: root, references: 'https://example.com/a.png,../outside.png,design/a.jpg', viewport: 'tablet' });
  assert.ok(result.gaps.every(({ code }) => code === 'FM_DESIGN_FIDELITY_REFERENCE_INVALID'));
});
```

- [ ] **Step 2: Run the contract tests to verify failure**

Run: `node --test tests/design-fidelity-contract.test.mjs`

Expected: FAIL because `design-fidelity-contract.mjs` does not exist.

- [ ] **Step 3: Implement the minimal contract loader**

```js
export async function loadDesignContracts({ workspace, references, route, viewport = 'desktop', thresholdPercent = 1, maxIterations = 3 }) {
  // Resolve comma-separated paths from workspace; recursively collect only .png files.
  // Hash bytes; require a safe local/test route and one of desktop/mobile.
  // Return deterministic contracts sorted by workspace-relative reference path and explicit gaps.
}
```

Use `resolveWorkspace`, `assertContained`, `readFile`, `readdir`, `stat`, and `createHash`. Use `isSafeBrowserTarget` from `xray-adapters.mjs` or export a narrowly named equivalent there; do not duplicate URL policy inconsistently.

- [ ] **Step 4: Run the contract tests to verify success**

Run: `node --test tests/design-fidelity-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\design-fidelity-contract.mjs plugins\forgemind\src\design-fidelity-contract.mjs
git add src/design-fidelity-contract.mjs plugins/forgemind/src/design-fidelity-contract.mjs tests/design-fidelity-contract.test.mjs
git commit -m "feat: add Design Fidelity reference contracts"
```

### Task 2: Pixel geometry and diff-image evidence

**Files:**
- Modify: `src/xray-image-diff.mjs`
- Create: `src/design-fidelity-diff.mjs`
- Create: `tests/design-fidelity-diff.test.mjs`
- Create: `plugins/forgemind/src/design-fidelity-diff.mjs`
- Modify: `plugins/forgemind/src/xray-image-diff.mjs`

**Interfaces:**
- Consumes: PNG paths from a contract and a captured screenshot.
- Produces: `compareDesignImages({ baseline, candidate, output }) -> Promise<{ differencePercent, dimensions, changedBounds, output }>`.
- `changedBounds` is `{ x, y, width, height } | null`; a dimension mismatch produces `differencePercent: 100` and full candidate/baseline bounds.

- [ ] **Step 1: Write failing comparison tests**

```js
test('Design Fidelity writes a deterministic transparent diff image and changed bounds', async (t) => {
  const result = await compareDesignImages({ baseline: png(root, 'red'), candidate: png(root, 'blue'), output: path.join(root, 'diff.png') });
  assert.equal(result.differencePercent, 100);
  assert.deepEqual(result.changedBounds, { x: 0, y: 0, width: 1, height: 1 });
  assert.equal((await stat(path.join(root, 'diff.png'))).isFile(), true);
});
```

- [ ] **Step 2: Run the diff tests to verify failure**

Run: `node --test tests/design-fidelity-diff.test.mjs`

Expected: FAIL because `compareDesignImages` does not exist.

- [ ] **Step 3: Expose decoded PNG pixels and implement a PNG writer**

```js
export async function decodePng(file) { /* return { width, height, pixels: RGBA Buffer } */ }
export function encodeRgbaPng({ width, height, pixels }) { /* IHDR + deflated IDAT + CRC chunks */ }
export async function compareDesignImages({ baseline, candidate, output }) { /* paint changed pixels opaque red and unchanged pixels transparent */ }
```

Keep `pngDifferencePercent` backward compatible. A malformed or unsupported PNG must throw a dedicated descriptive error that the orchestrator turns into `FM_DESIGN_FIDELITY_IMAGE_INVALID`.

- [ ] **Step 4: Run the diff tests to verify success**

Run: `node --test tests/design-fidelity-diff.test.mjs tests/xray-evidence.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\xray-image-diff.mjs plugins\forgemind\src\xray-image-diff.mjs
Copy-Item src\design-fidelity-diff.mjs plugins\forgemind\src\design-fidelity-diff.mjs
git add src/xray-image-diff.mjs src/design-fidelity-diff.mjs plugins/forgemind/src/xray-image-diff.mjs plugins/forgemind/src/design-fidelity-diff.mjs tests/design-fidelity-diff.test.mjs
git commit -m "feat: add Design Fidelity diff evidence"
```

### Task 3: Safe correction-loop orchestrator

**Files:**
- Create: `src/design-fidelity.mjs`
- Create: `tests/design-fidelity.test.mjs`
- Create: `plugins/forgemind/src/design-fidelity.mjs`

**Interfaces:**
- Consumes: contracts from Task 1, `compareDesignImages` from Task 2, and an injected `{ capture }` adapter for tests.
- Produces: `runDesignFidelity({ workspace, references, route, viewport, thresholdPercent, maxIterations, capture }) -> Promise<report>` and `getDesignFidelityStatus({ workspace }) -> Promise<report | missing>`.
- `report.status` is one of `matched`, `needs-correction`, `blocked`, `unresolved`; each measurement has `{ number, before, after, diff, status }`. The entry skill appends a patch/verification receipt after each agent-applied UI edit.

- [ ] **Step 1: Write failing orchestration tests**

```js
test('Design Fidelity produces an evidence-backed correction request when tolerance is exceeded', async (t) => {
  const report = await runDesignFidelity({ workspace: root, references: 'reference.png', route: localUrl, capture });
  assert.equal(report.status, 'needs-correction');
  assert.deepEqual(report.corrections[0].allowedExtensions, ['.css', '.scss', '.sass', '.less', '.html', '.jsx', '.tsx', '.vue', '.svelte', '.svg', '.png', '.jpg', '.jpeg', '.webp']);
});

test('Design Fidelity refuses automatic corrections when artifacts are disabled', async () => {
  await assert.rejects(() => runDesignFidelity({ workspace: root, references: 'reference.png' }), /FM_DESIGN_FIDELITY_ARTIFACTS_REQUIRED/);
});
```

- [ ] **Step 2: Run the orchestrator tests to verify failure**

Run: `node --test tests/design-fidelity.test.mjs`

Expected: FAIL because `design-fidelity.mjs` does not exist.

- [ ] **Step 3: Implement the bounded loop**

```js
export async function runDesignFidelity(input) {
  // Load contracts, capture same route/viewport, compare, persist report.
  // Capture and compare each contract, persist screenshot/diff/report and emit
  // a correction request containing only allowed UI file types. The Codex skill
  // consumes that request, edits the app, runs verification, and reruns this command.
}
```

Implement and export `isAllowedUiEdit(relativePath)` with an allowlist of UI extensions (`.css`, `.scss`, `.sass`, `.less`, `.html`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`) and reject package manifests, lockfiles, `.env*`, infrastructure folders, and all paths outside the workspace. Persist JSON atomically under `artifactStatePath(workspace, 'design-fidelity', ...)`; publish `docs/forgemind/design-fidelity-report.md` only through `publishProjectDocument`.

- [ ] **Step 4: Run the orchestrator tests to verify success**

Run: `node --test tests/design-fidelity.test.mjs tests/artifact-store.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\design-fidelity.mjs plugins\forgemind\src\design-fidelity.mjs
git add src/design-fidelity.mjs plugins/forgemind/src/design-fidelity.mjs tests/design-fidelity.test.mjs
git commit -m "feat: add Design Fidelity correction loop"
```

### Task 4: CLI, skill, reporting, and dashboard surface

**Files:**
- Modify: `src/cli.mjs`
- Create: `entry-skills/forgemind-design-fidelity/SKILL.md`
- Create: `entry-skills/forgemind-design-fidelity/agents/openai.yaml`
- Modify: `src/dashboard.mjs`
- Modify: `README.md`
- Modify: `docs/HIERARCHY.md`
- Modify: `docs/WORKFLOWS.md`
- Modify: `CHANGELOG.md`
- Modify: `tests/cli.test.mjs`
- Modify: `tests/journey-surface.test.mjs`
- Mirror: matching files under `plugins/forgemind/`

**Interfaces:**
- CLI dispatches `design-fidelity run|status` to Task 3.
- The skill requires local references, safe local/test target, workspace artifacts, repeated evidence inspection, and never claims match without a measured report.

- [ ] **Step 1: Write failing public-surface tests**

```js
test('design-fidelity CLI dispatches run and status with explicit reference input', async (t) => {
  const run = await runCli(['design-fidelity', 'run', '--workspace', root, '--references', 'reference.png', '--route', 'http://127.0.0.1:4173/', '--json'], context);
  assert.equal(run.exitCode, 0);
  assert.equal(run.data.schemaVersion, 1);
});

test('Design Fidelity is an explicit primary journey with a mirror skill', async () => {
  assert.match(await readFile('entry-skills/forgemind-design-fidelity/SKILL.md', 'utf8'), /design-fidelity run/);
});
```

- [ ] **Step 2: Run public-surface tests to verify failure**

Run: `node --test tests/cli.test.mjs tests/journey-surface.test.mjs`

Expected: FAIL because the command and skill do not exist.

- [ ] **Step 3: Implement public dispatch and documentation**

```js
} else if (command === 'design-fidelity') {
  const action = positionals[0] ?? 'run';
  if (action === 'run') data = await designFidelity.runDesignFidelity({ workspace, references: options.references, route: options.route, viewport: options.viewport, thresholdPercent: options.threshold, maxIterations: options['max-iterations'] });
  else if (action === 'status') data = await designFidelity.getDesignFidelityStatus({ workspace });
  else throw invalidInput('FM_DESIGN_FIDELITY_ACTION_INVALID', 'Design Fidelity supports run and status.');
}
```

Add the dashboard key to its ordered sections and load `.codex-orchestrator/design-fidelity` JSON records read-only. The skill must: run the command; inspect `corrections`; locate only allowed UI files; apply the visual fix automatically; run the project’s safe verification; rerun `design-fidelity run`; retain a patch receipt only if the new comparison improves; stop at `maxIterations`, a failed verification, a worsened measurement, or a reported gap. Document that automatic UI-only editing scope, required references and target, measured completion condition, and limits in US English.

- [ ] **Step 4: Run public-surface tests to verify success**

Run: `node --test tests/cli.test.mjs tests/journey-surface.test.mjs tests/dashboard.test.mjs`

Expected: PASS.

- [ ] **Step 5: Mirror and commit**

```powershell
Copy-Item src\cli.mjs plugins\forgemind\src\cli.mjs
Copy-Item src\dashboard.mjs plugins\forgemind\src\dashboard.mjs
Copy-Item -Recurse -Force entry-skills\forgemind-design-fidelity plugins\forgemind\entry-skills\forgemind-design-fidelity
git add src/cli.mjs src/dashboard.mjs entry-skills/forgemind-design-fidelity plugins/forgemind/src/cli.mjs plugins/forgemind/src/dashboard.mjs plugins/forgemind/entry-skills/forgemind-design-fidelity README.md docs/HIERARCHY.md docs/WORKFLOWS.md CHANGELOG.md tests/cli.test.mjs tests/journey-surface.test.mjs
git commit -m "feat: expose Design Fidelity journey"
```

### Task 5: Release synchronization and full verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `plugins/forgemind/package.json`
- Modify: `plugins/forgemind/.codex-plugin/plugin.json`
- Modify: `tests/package.test.mjs`

**Interfaces:**
- Produces a synchronized release version across source and Marketplace plugin.

- [ ] **Step 1: Write the failing release expectation**

```js
assert.equal(sourceManifest.version, '1.44.0');
assert.equal(marketplaceManifest.version, '1.44.0');
```

- [ ] **Step 2: Run package test to verify failure**

Run: `node --test tests/package.test.mjs`

Expected: FAIL because manifests remain on `1.43.0`.

- [ ] **Step 3: Synchronize version and validate mirrors**

Set every manifest and lockfile root version to `1.44.0`. Add a changelog entry describing measured PNG reference contracts, automatic UI-only corrections, bounded rollback, and local-only evidence. Confirm every mirrored runtime/skill file reports no `git diff --no-index` differences.

- [ ] **Step 4: Run release verification**

Run: `npm run ci`

Expected: PASS: unit tests, plugin validation, evaluation, build, built-plugin strict-release validation.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .codex-plugin/plugin.json plugins/forgemind/package.json plugins/forgemind/.codex-plugin/plugin.json CHANGELOG.md tests/package.test.mjs
git commit -m "release: ForgeMind 1.44.0"
```
