# Xray Browser Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Xray autonomously orchestrate Codex Browser testing for every discoverable local web-GUI area and produce evidence-backed GUI coverage, findings, scores, gaps, and prioritized improvement proposals.

**Architecture:** The Xray entry skill owns interactive Browser orchestration because the Node CLI cannot call Codex Browser controls directly. The CLI remains the receipt validator, scorer, report writer, and canonical evidence store; it is extended with a richer browser-flow receipt schema and deterministic recommendations derived from verified findings and gaps.

**Tech Stack:** Node.js 20+ ESM, Node test runner, Codex internal Browser, existing ForgeMind CLI and JSON artifacts.

## Global Constraints

- Interact only with unambiguously local or designated test targets.
- Test flows may create and submit test data only in those targets.
- Never execute production, payment, deployment, publishing, credential, deletion, or administration actions.
- Never infer a GUI pass, failure, or coverage contribution from an open tab, discovery signal, or generic command result.
- Every GUI score contribution requires a surface-specific Browser receipt with non-empty evidence.
- Xray remains test-only and must not modify product source, product configuration, credentials, or production systems.
- Mirror every runtime and entry-skill change under `plugins/forgemind/` byte-for-byte where the repository convention requires it.

---

## File structure

- `src/xray.mjs`: validates browser-flow receipt metadata, persists coverage and produces deterministic evidence-backed recommendations.
- `src/cli.mjs`: preserves the `xray run --gui-receipts` boundary and provides no direct Browser-control illusion.
- `entry-skills/forgemind-xray/SKILL.md`: directs the agent to start a safe local GUI, use Codex Browser, discover all reachable flows, create receipts, and rerun Xray with them.
- `plugins/forgemind/src/xray.mjs` and `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`: exact distribution mirrors.
- `tests/xray.test.mjs`: executable contract for receipt validation, reporting, gaps, recommendations, and score evidence.
- `tests/journey-surface.test.mjs`: entry-skill contract regression checks.
- `package.json`, `package-lock.json`, `.codex-plugin/plugin.json`, and their distribution mirrors: synchronized version bump.
- `CHANGELOG.md`: user-visible summary of the Browser orchestration behavior.

### Task 1: Define and validate browser-flow receipt evidence

**Files:**
- Modify: `tests/xray.test.mjs`
- Modify: `src/xray.mjs`
- Modify: `plugins/forgemind/src/xray.mjs`

**Interfaces:**
- Consumes: `runXray({ workspace, guiReceipts })` and the existing `web-gui` surface definition.
- Produces: an imported GUI receipt with `passed`, `failed`, `blocked`, or `skipped` status and containing `url`, `control`, `action`, `expected`, `actual`, `reproduction`, `coverageArea`, `componentIds`, and `evidence`.
- Produces: `FM_XRAY_GUI_RECEIPT_INCOMPLETE` gaps for Browser receipts that cannot establish a reproducible GUI flow.

- [ ] **Step 1: Write the failing test**

Add this test to `tests/xray.test.mjs`:

```js
test('Xray accepts complete browser-flow evidence and rejects incomplete GUI evidence', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/home.png'],
      url: 'http://127.0.0.1:4173/', coverageArea: 'home', controlLabel: 'Get started',
      action: 'click', expected: 'The onboarding view opens.', actual: 'The onboarding view opened.',
      reproduction: 'Open the home page and click Get started.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/missing-flow.png'],
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'blocked',
      componentIds: ['gui-usability'], evidence: ['screenshots/auth-wall.png'],
      url: 'http://127.0.0.1:4173/account', coverageArea: 'account', controlLabel: 'Save',
      action: 'submit profile', expected: 'The test profile is saved.', actual: 'Authentication was unavailable.',
      reproduction: 'Open account and submit the test profile.',
    }],
  });
  assert.equal(report.receipts.filter(({ status }) => status === 'passed').length, 1);
  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_RECEIPT_INCOMPLETE'));
  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_FLOW_BLOCKED'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/xray.test.mjs`

Expected: FAIL because the current validator accepts the incomplete receipt and does not emit `FM_XRAY_GUI_RECEIPT_INCOMPLETE`.

- [ ] **Step 3: Write the minimal implementation**

In `src/xray.mjs`, add a helper with this contract and use it from `createGuiChecks`:

```js
function browserFlowFields(candidate) {
  const fields = ['url', 'coverageArea', 'controlLabel', 'action', 'expected', 'actual', 'reproduction'];
  const normalized = Object.fromEntries(fields.map((key) => [key, String(candidate?.[key] ?? '').trim()]));
  return { ...normalized, complete: fields.every((key) => normalized[key]) };
}
```

Change `createGuiChecks` to return `{ checks, gaps }` rather than only the checks array. In `discoverXrayMission`, destructure it as `const { checks: guiChecks, gaps: guiReceiptGaps } = createGuiChecks(...)` and construct mission gaps with `const gaps = [...guiGap(surfaces, guiControl, guiChecks), ...guiReceiptGaps]`. Accept `passed`, `failed`, `blocked`, and `skipped` statuses. For `control === 'browser'`, accept a receipt only when `complete` is true, preserve the normalized flow fields in `importedReceipt`, and add `FM_XRAY_GUI_RECEIPT_INCOMPLETE` with the candidate surface when it is false. For accepted `blocked` or `skipped` receipts, add an explicit non-product gap with the recorded flow and status; only `passed` and `failed` may contribute score evidence. Keep the existing non-empty evidence and approved-component requirements. Mirror the final file to `plugins/forgemind/src/xray.mjs`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/xray.test.mjs`

Expected: PASS, including the new complete/incomplete Browser receipt test.

- [ ] **Step 5: Commit**

```bash
git add tests/xray.test.mjs src/xray.mjs plugins/forgemind/src/xray.mjs
git commit -m "feat: validate Xray browser flow receipts"
```

### Task 2: Persist coverage and render evidence-backed recommendations

**Files:**
- Modify: `tests/xray.test.mjs`
- Modify: `src/xray.mjs`
- Modify: `plugins/forgemind/src/xray.mjs`

**Interfaces:**
- Consumes: verified `report.findings`, `report.gaps`, and browser receipts with `coverageArea`.
- Produces: `report.coverage` and `report.recommendations`.
- Produces: Markdown sections named `GUI coverage` and `Improvement proposals`.

- [ ] **Step 1: Write the failing test**

Add this test:

```js
test('Xray reports browser coverage and prioritized recommendations from findings and gaps', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { test: 'node --test', dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui', control: 'browser', status: 'failed', severity: 'high',
      componentIds: ['gui-usability'], evidence: ['screenshots/login-error.png'],
      url: 'http://127.0.0.1:4173/login', coverageArea: 'login', controlLabel: 'Sign in',
      action: 'submit invalid credentials', expected: 'A clear validation message appears.',
      actual: 'The form becomes unresponsive.', reproduction: 'Open login and submit invalid credentials.',
    }],
    runCommand: async () => ({ exitCode: 0, stdout: 'ok', stderr: '' }),
  });
  assert.deepEqual(report.coverage.areas, ['login']);
  assert.equal(report.recommendations[0].priority, 'high');
  assert.match(report.recommendations[0].verification, /Open login/);
  const markdown = await readFile(path.join(root, 'docs', 'forgemind', 'xray-report.md'), 'utf8');
  assert.match(markdown, /GUI coverage/);
  assert.match(markdown, /Improvement proposals/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/xray.test.mjs`

Expected: FAIL because `coverage` and `recommendations` are not yet returned or rendered.

- [ ] **Step 3: Write the minimal implementation**

Add these pure helpers in `src/xray.mjs` and call them while constructing `report`:

```js
function browserCoverage(receipts) {
  const areas = [...new Set(receipts
    .filter(({ control, status, coverageArea }) => control === 'browser' && ['passed', 'failed'].includes(status) && coverageArea)
    .map(({ coverageArea }) => coverageArea))].sort();
  return { areas, covered: areas.length };
}

function priorityForSeverity(severity) {
  return ['critical', 'high', 'medium', 'low'].includes(severity) ? severity : 'medium';
}
```

Create one proposal per verified finding and one proposal per recorded gap. Each proposal must contain `priority`, `area`, `evidence`, `recommendation`, `benefit`, and `verification`. Derive content only from finding fields or gap fields; do not invent product facts. Extend `renderXrayMarkdown` to list coverage areas and proposals. Mirror the final source file.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/xray.test.mjs`

Expected: PASS; the JSON report and Markdown report contain deterministic coverage and recommendation sections.

- [ ] **Step 5: Commit**

```bash
git add tests/xray.test.mjs src/xray.mjs plugins/forgemind/src/xray.mjs
git commit -m "feat: report Xray GUI coverage and improvements"
```

### Task 3: Require full Codex Browser orchestration in the Xray journey

**Files:**
- Modify: `tests/journey-surface.test.mjs`
- Modify: `entry-skills/forgemind-xray/SKILL.md`
- Modify: `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`

**Interfaces:**
- Consumes: the `web-gui` detection and the Browser receipt contract from Task 1.
- Produces: a mandatory agent workflow that starts/reuses a safe local server, maps reachable UI areas, executes positive and validation flows, passes receipts to `xray run`, and then reads `xray status`.

- [ ] **Step 1: Write the failing test**

Extend the Xray section in `tests/journey-surface.test.mjs`:

```js
assert.match(instructions, /MUST use the internal Browser.*every reachable/i);
assert.match(instructions, /local or designated test environment/i);
assert.match(instructions, /production.*payment.*deploy.*credential.*administration/i);
assert.match(instructions, /coverageArea.*controlLabel.*reproduction/i);
assert.match(instructions, /positive flow.*validation or error flow/i);
assert.match(instructions, /rerun.*xray run.*--gui-receipts/i);
assert.match(instructions, /Improvement proposals/i);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/journey-surface.test.mjs`

Expected: FAIL because the current entry skill only requests a generic Browser receipt.

- [ ] **Step 3: Write the minimal implementation**

Replace the single web-GUI paragraph in both mirrored `SKILL.md` files with this ordered workflow:

```markdown
For every detected local web GUI, you MUST start or reuse its local/test server and use the internal Browser to map every reachable page, navigation target, form, button, dialog, and visible state. Exercise at least one positive flow for every mapped area and a validation or error flow for every input flow. You may submit only local/test data. Never interact with production targets or perform payment, deploy, publish, credential, deletion, or administration actions.

For every flow, capture a Browser receipt with `surfaceId`, `control`, `status`, `componentIds`, `evidence`, `url`, `coverageArea`, `controlLabel`, `action`, `expected`, `actual`, and `reproduction`. Rerun `xray run --gui-receipts '<json-array>'` with all complete receipts, then run `xray status`. The final report must distinguish covered areas from gaps and include evidence-backed Improvement proposals.
```

Retain the existing instruction that unavailable Browser controls remain gaps and never become a pass. Verify the source and distribution skill files are byte-identical.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/journey-surface.test.mjs`

Expected: PASS; the entry-skill contract explicitly requires complete Browser coverage and safe test-only actions.

- [ ] **Step 5: Commit**

```bash
git add tests/journey-surface.test.mjs entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md
git commit -m "feat: orchestrate Xray browser coverage"
```

### Task 4: Package the feature and perform end-to-end verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `plugins/forgemind/package.json`
- Modify: `plugins/forgemind/.codex-plugin/plugin.json`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Tasks 1–3 and the existing mirror/package validation commands.
- Produces: ForgeMind version `1.40.0` with synchronized source and distribution metadata.

- [ ] **Step 1: Write the failing release-contract test**

Add version expectations to the existing package test so it asserts the source and distribution manifests share the same version and Xray Browser orchestration copy is packaged. Use this assertion shape:

```js
assert.equal(sourceManifest.version, distributionManifest.version);
assert.match(await readFile(path.join(root, 'plugins', 'forgemind', 'entry-skills', 'forgemind-xray', 'SKILL.md'), 'utf8'), /every reachable page/i);
```

- [ ] **Step 2: Run the release-contract test to verify it fails**

Run: `node --test tests/package.test.mjs tests/journey-surface.test.mjs`

Expected: FAIL until the distribution skill and version metadata are synchronized.

- [ ] **Step 3: Update release metadata and changelog**

Set the source and distribution manifests and both root-package version entries in `package-lock.json` to `1.40.0`. Add a `CHANGELOG.md` entry stating that Xray now uses Codex Browser to exercise every reachable local/test web-GUI flow, persists detailed evidence, and provides evidence-backed improvement proposals.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
node --test tests/xray.test.mjs tests/journey-surface.test.mjs tests/package.test.mjs
npm test
npm run build
node bin/forgemind.mjs validate --plugin dist/plugin --strict-release
git diff --check
```

Expected: all focused and full tests pass, build succeeds, strict validation succeeds, and `git diff --check` produces no output.

- [ ] **Step 5: Verify source/distribution mirrors and commit**

Run:

```bash
git diff --no-index -- src/xray.mjs plugins/forgemind/src/xray.mjs
git diff --no-index -- entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md
```

Expected: both commands exit `0` with no diff.

Then commit:

```bash
git add package.json package-lock.json .codex-plugin/plugin.json plugins/forgemind/package.json plugins/forgemind/.codex-plugin/plugin.json CHANGELOG.md tests/package.test.mjs
git commit -m "release: Xray 1.40.0"
```

## Self-review

- Spec coverage: Tasks 1–3 implement safe local/Test Browser interaction, complete reachable-flow mapping, positive and validation flows, structured receipts, explicit evidence gaps, coverage, findings, score evidence, and recommendations. Task 4 verifies packaging and distribution consistency.
- Placeholder scan: no deferred implementation markers or unspecified test steps remain.
- Interface consistency: Browser receipt fields are introduced in Task 1, consumed in Task 2, and required by Task 3. Task 4 packages the same mirrored files.
