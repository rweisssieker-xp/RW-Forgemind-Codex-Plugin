# Xray Complete Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver truthful, fully artifact-aware Xray evidence for project intent, safe local Web/API testing, responsive/visual/performance analysis, and native-platform limits.

**Architecture:** Split the current Xray monolith into focused configuration, flow-planning, API, and visual/performance modules. `runXray` remains the orchestrator and only composes normalized receipts, findings, and gaps from those modules; the existing report/score remains the single canonical result.

**Tech Stack:** Node.js 20+, native ES modules, native `fetch`, `node:fs/promises`, existing artifact/project-document helpers, `node:test`.

## Global Constraints

- All Xray persistence uses the active artifact store; `--artifacts none` creates no target-project state, Markdown, Browser evidence, or visual baseline.
- API execution is opt-in and limited to explicit loopback or `.test` URLs, relative `GET`/`HEAD` paths, no credentials, no body, and same-origin redirects.
- Browser use remains local/test-only and non-destructive; responsive mobile Web coverage never claims native iOS coverage.
- Native iOS/desktop detection produces `FM_XRAY_NATIVE_EMULATOR_UNSUPPORTED`; Android ADB behavior is unchanged.
- No external visual/performance services, adaptive thresholds, automatic simulator installation, inferred API endpoints, login, form submission, writes, uploads, downloads, or remote targets.
- Every runtime modification is mirrored byte-for-byte under `plugins/forgemind/src/`.

---

### Task 1: Make Xray publishing fully artifact-aware

**Files:**
- Modify: `src/xray.mjs:1-480`
- Modify: `plugins/forgemind/src/xray.mjs:1-480`
- Modify: `tests/xray.test.mjs:699-730`
- Modify: `tests/artifact-store.test.mjs:9-56`

**Interfaces:**
- Consumes: `publishProjectDocument({ workspace, name, title, body })` and `artifactStatePath(workspace, ...)`.
- Produces: `runXray()` returns `projectDocuments: []` and does not write under the project when active artifact mode is `none`.

- [ ] **Step 1: Write the failing no-persistence integration test**

```js
test('Xray artifacts none leaves no report or project document', async (t) => {
  const root = await fixture(t, { packageJson: { scripts: { test: 'node --test' } } });
  const result = await runCli(['xray', 'run', '--workspace', root, '--artifacts', 'none', '--json'], context());
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.data.projectDocuments, []);
  await assert.rejects(access(path.join(root, 'docs', 'forgemind', 'xray-report.md')));
  await assert.rejects(access(path.join(root, '.codex-orchestrator', 'xray', 'report-latest.json')));
});
```

- [ ] **Step 2: Run the focused test and verify the direct Markdown write fails it**

Run: `node --test tests/xray.test.mjs tests/artifact-store.test.mjs`

Expected: FAIL because `runXray` currently calls `writeTextAtomic(path.join(workspace, 'docs', 'forgemind', 'xray-report.md'))`.

- [ ] **Step 3: Replace direct document persistence with the shared publisher**

```js
const document = await publishProjectDocument({
  workspace,
  name: 'xray-report.md',
  title: 'ForgeMind Xray Report',
  body: renderXrayMarkdown(report),
});
return { ...report, evidencePath: '.codex-orchestrator/xray/report-latest.json', projectDocuments: document ? ['docs/forgemind/xray-report.md'] : [] };
```

Retain JSON state writes through `artifactStatePath`; import `publishProjectDocument`; remove the direct project-relative Markdown write.

- [ ] **Step 4: Run focused tests and copy the runtime mirror**

Run: `Copy-Item src\xray.mjs plugins\forgemind\src\xray.mjs; node --test tests/xray.test.mjs tests/artifact-store.test.mjs; git diff --no-index -- src/xray.mjs plugins/forgemind/src/xray.mjs`

Expected: PASS and mirror comparison exit 0.

- [ ] **Step 5: Commit artifact-aware Xray publishing**

```text
git add src/xray.mjs plugins/forgemind/src/xray.mjs tests/xray.test.mjs tests/artifact-store.test.mjs
git commit -m "fix: honor artifact mode in Xray"
```

### Task 2: Add validated Xray configuration and repository-derived critical flows

**Files:**
- Create: `src/xray-config.mjs`
- Create: `src/xray-flows.mjs`
- Create: `plugins/forgemind/src/xray-config.mjs`
- Create: `plugins/forgemind/src/xray-flows.mjs`
- Modify: `src/xray.mjs:67-127,1024-1072`
- Modify: `tests/xray.test.mjs:41-75`
- Create: `tests/xray-config.test.mjs`

**Interfaces:**
- Produces: `loadXrayConfig({ workspace }) -> { value, gaps }`, reading only `forgemind.config.json` or `package.json#forgemind`.
- Produces: `planCriticalFlows({ files, config, testUrl }) -> { flows, gaps }`, where every flow is `{ id, route, purpose, sourcePaths, safe }`.
- Consumes: `projectContext`, project file names, and explicit `config.web.baseUrl`; adds `criticalFlows` to `discoverXrayMission`.

- [ ] **Step 1: Write failing tests for allowed configuration and non-invented flows**

```js
test('Xray uses only configured local flows and repository routes', async (t) => {
  const root = await fixture(t, {
    packageJson: { forgemind: { xray: { web: { baseUrl: 'http://127.0.0.1:4173', viewports: ['desktop', 'mobile'] } } } },
    files: { 'src/app/settings/page.tsx': '', 'src/app/page.tsx': '' },
  });
  const mission = await discoverXrayMission({ workspace: root });
  assert.deepEqual(mission.criticalFlows.map(({ route }) => route), ['/', '/settings']);
  assert.deepEqual(mission.criticalFlows[0].viewports, ['desktop', 'mobile']);
});

test('Xray emits a config gap without authorizing malformed or remote URLs', async (t) => {
  const root = await fixture(t, { packageJson: { forgemind: { xray: { web: { baseUrl: 'https://example.com' } } } } });
  const mission = await discoverXrayMission({ workspace: root });
  assert.ok(mission.gaps.some(({ code }) => code === 'FM_XRAY_CONFIG_INVALID'));
  assert.equal(mission.criticalFlows.length, 0);
});
```

- [ ] **Step 2: Run unit tests and verify module-import failure**

Run: `node --test tests/xray-config.test.mjs tests/xray.test.mjs`

Expected: FAIL with missing `xray-config.mjs` / absent `criticalFlows`.

- [ ] **Step 3: Implement strict configuration and flow modules**

```js
export async function loadXrayConfig({ workspace }) {
  const source = await firstReadableJson(workspace, ['forgemind.config.json', 'package.json']);
  const value = source?.name === 'package.json' ? source.value?.forgemind?.xray : source?.value?.xray;
  return validateXrayConfig(value ?? {});
}

export function planCriticalFlows({ files, config, testUrl }) {
  const baseUrl = config.web?.baseUrl ?? testUrl;
  if (!isSafeBrowserTarget(baseUrl)) return { flows: [], gaps: [] };
  const routes = files.flatMap(routeFromFile).filter(Boolean).filter(unique).slice(0, 20);
  return { flows: routes.map((route) => ({ id: `flow-${slug(route)}`, route, purpose: `Load ${route}`, sourcePaths: sourcePathsForRoute(files, route), safe: true, viewports: config.web?.viewports ?? ['desktop'] })), gaps: [] };
}
```

Validation accepts only the fields specified in the design, exact viewport values `desktop|mobile`, finite non-negative thresholds, and safe local/test base URLs. Any invalid field becomes `FM_XRAY_CONFIG_INVALID` with `field` and `nextAction`; it never throws from discovery.

- [ ] **Step 4: Wire configuration and flows into Xray mission and test**

Run: `node --test tests/xray-config.test.mjs tests/xray.test.mjs`

Expected: PASS; mission retains `projectContext`, adds deterministic `criticalFlows`, and adds configuration gaps without any network work.

- [ ] **Step 5: Mirror and commit**

```text
Copy-Item src\xray.mjs plugins\forgemind\src\xray.mjs
Copy-Item src\xray-config.mjs plugins\forgemind\src\xray-config.mjs
Copy-Item src\xray-flows.mjs plugins\forgemind\src\xray-flows.mjs
git add src/xray.mjs src/xray-config.mjs src/xray-flows.mjs plugins/forgemind/src/xray.mjs plugins/forgemind/src/xray-config.mjs plugins/forgemind/src/xray-flows.mjs tests/xray.test.mjs tests/xray-config.test.mjs
git commit -m "feat: plan Xray critical flows from project context"
```

### Task 3: Implement the opt-in safe local API adapter

**Files:**
- Create: `src/xray-api.mjs`
- Create: `plugins/forgemind/src/xray-api.mjs`
- Modify: `src/xray.mjs:354-480`
- Create: `tests/xray-api.test.mjs`
- Modify: `tests/xray.test.mjs`

**Interfaces:**
- Produces: `executeApiChecks({ config, workspace, fetchImpl = fetch, now = () => performance.now() }) -> { receipts, findings, gaps }`.
- Consumes: valid `config.api = { baseUrl, checks, performance }`; checks are `{ id, method: 'GET'|'HEAD', path }`.
- Produces: normalized API receipts with `adapter: 'api-fetch'`, `surfaceId: 'api'`, `durationMs`, `url`, `statusCode`, `evidence`.

- [ ] **Step 1: Write failing safety and receipt tests**

```js
test('API adapter requests only configured local GET and records timing', async () => {
  const calls = [];
  const result = await executeApiChecks({
    config: { api: { baseUrl: 'http://127.0.0.1:3000', checks: [{ id: 'health', method: 'GET', path: '/health' }], performance: { responseMs: 50 } } },
    workspace: process.cwd(), fetchImpl: async (url, options) => { calls.push([url, options]); return new Response('ok', { status: 200 }); }, now: sequence(0, 12),
  });
  assert.deepEqual(calls[0], ['http://127.0.0.1:3000/health', { method: 'GET', redirect: 'error' }]);
  assert.equal(result.receipts[0].durationMs, 12);
});

test('API adapter rejects remote, POST, credential, and off-origin redirect candidates before fetch', async () => {
  for (const check of unsafeChecks) {
    const result = await executeApiChecks({ config: { api: check }, workspace: process.cwd(), fetchImpl: async () => { throw new Error('must not fetch'); } });
    assert.ok(result.gaps.some(({ code }) => code === 'FM_XRAY_API_TARGET_UNSAFE'));
  }
});
```

- [ ] **Step 2: Run API tests and verify they fail**

Run: `node --test tests/xray-api.test.mjs`

Expected: FAIL with missing `xray-api.mjs`.

- [ ] **Step 3: Implement validation before fetch and deterministic result classification**

```js
const SAFE_METHODS = new Set(['GET', 'HEAD']);
export async function executeApiChecks({ config, workspace, fetchImpl = fetch, now = () => performance.now() }) {
  const validated = validateApiConfig(config?.api);
  if (validated.gaps.length) return { receipts: [], findings: [], gaps: validated.gaps };
  return collectChecks(validated.value.checks, async (check) => executeOne(check, validated.value, fetchImpl, now));
}
```

Reject credentials in URL, headers, or path, relative paths without leading `/`, `..`, fragments, non-safe base URL, unsafe methods, and redirects. Use `redirect: 'error'`. Map network failures to `FM_XRAY_API_TARGET_UNAVAILABLE`; non-2xx response or budget overrun to a finding with `api-contracts` and `robustness-error-paths` as applicable. Persist a redacted response summary under `artifactStatePath(workspace, 'xray', 'api', '<id>.json')` only when state persistence is active.

- [ ] **Step 4: Compose API outputs into `runXray` and verify**

Run: `node --test tests/xray-api.test.mjs tests/xray.test.mjs`

Expected: PASS; the report includes API receipts/findings/gaps and score consumes API evidence.

- [ ] **Step 5: Mirror and commit**

```text
Copy-Item src\xray.mjs plugins\forgemind\src\xray.mjs
Copy-Item src\xray-api.mjs plugins\forgemind\src\xray-api.mjs
git add src/xray.mjs src/xray-api.mjs plugins/forgemind/src/xray.mjs plugins/forgemind/src/xray-api.mjs tests/xray-api.test.mjs tests/xray.test.mjs
git commit -m "feat: add safe local Xray API checks"
```

### Task 4: Add responsive Browser receipt, visual baseline, and performance analysis

**Files:**
- Create: `src/xray-visual.mjs`
- Create: `src/xray-image-diff.mjs`
- Create: `plugins/forgemind/src/xray-visual.mjs`
- Create: `plugins/forgemind/src/xray-image-diff.mjs`
- Modify: `src/xray.mjs:387-480,703-795,481-559`
- Modify: `src/xray-adapters.mjs:285-420`
- Modify: `tests/xray.test.mjs`
- Modify: `tests/xray-adapters.test.mjs`
- Create: `tests/xray-visual.test.mjs`

**Interfaces:**
- Produces: Browser receipts carry `viewport`, `durationMs`, and current-run screenshot evidence.
- Produces: `pixelDifferencePercent({ baseline, candidate }) -> number`, using decoded RGBA PNG pixels and returning the percentage of pixels with one or more differing channels.
- Produces: `compareVisualBaseline({ workspace, flow, screenshot, thresholdPercent, mode }) -> { finding, gap, evidence }`.
- Consumes: `mode: 'run'|'baseline'`, baseline/current paths resolved through `artifactStatePath`.

- [ ] **Step 1: Write failing baseline, comparison, and timing tests**

```js
test('visual baseline is created only by the explicit baseline action', async (t) => {
  const root = await workspace(t);
  const result = await compareVisualBaseline({ workspace: root, flow: flow('home'), screenshot: png('current'), thresholdPercent: 0.5, mode: 'run' });
  assert.equal(result.gap.code, 'FM_XRAY_VISUAL_BASELINE_MISSING');
  const baseline = await compareVisualBaseline({ workspace: root, flow: flow('home'), screenshot: png('current'), thresholdPercent: 0.5, mode: 'baseline' });
  assert.equal(baseline.gap, null);
});

test('visual delta and timing budget become evidence-backed findings', async (t) => {
  const result = await compareVisualBaseline({ workspace: await workspace(t), flow: flow('home'), screenshot: png('changed'), baseline: png('baseline'), thresholdPercent: 0.5, mode: 'run' });
  assert.equal(result.finding.title, 'Visual regression: home');
  assert.match(performanceFinding({ durationMs: 2100, budgetMs: 2000 }).title, /Performance budget exceeded/);
});
```

- [ ] **Step 2: Run visual tests and verify they fail**

Run: `node --test tests/xray-visual.test.mjs tests/xray-adapters.test.mjs`

Expected: FAIL with missing `xray-visual.mjs` and receipt fields.

- [ ] **Step 3: Implement artifact-rooted visual comparisons and performance helpers**

```js
export async function compareVisualBaseline({ workspace, flow, screenshot, thresholdPercent, mode }) {
  const baseline = artifactStatePath(workspace, 'xray', 'visual', 'baseline', `${flow.id}.png`);
  if (mode === 'baseline') { await copyFile(screenshot, baseline); return { finding: null, gap: null, evidence: [relative(baseline)] }; }
  if (!await exists(baseline)) return { finding: null, gap: visualGap(flow), evidence: [relative(screenshot)] };
  const percent = await pixelDifferencePercent(baseline, screenshot);
  return percent > thresholdPercent ? { finding: visualFinding(flow, baseline, screenshot, percent), gap: null, evidence: [relative(baseline), relative(screenshot)] } : { finding: null, gap: null, evidence: [relative(baseline), relative(screenshot)] };
}
```

Implement `xray-image-diff.mjs` with native `node:zlib`: parse only PNG signature, `IHDR`, concatenated `IDAT`, and `IEND`; inflate the data; reverse PNG filters 0–4; accept only 8-bit RGB/RGBA images without interlacing; compare equal-dimension pixels channel-by-channel. Different dimensions count as 100% difference. Any unsupported or unreadable image returns `FM_XRAY_VISUAL_COMPARISON_UNAVAILABLE`; it is never treated as a pass. Add deterministic fixture PNGs for identical, one-pixel-different, and different-size cases. Add `durationMs` around Browser runner execution and create `FM_XRAY_PERFORMANCE_TIMING_UNAVAILABLE` gaps when a configured budget cannot be measured.

- [ ] **Step 4: Wire configured flow viewports and `xray baseline` CLI action**

Run: `node --test tests/xray-visual.test.mjs tests/xray-adapters.test.mjs tests/xray.test.mjs tests/cli.test.mjs`

Expected: PASS; `xray baseline` only writes the active artifact store, regular `xray run` compares available baseline, and responsive receipts remain Web GUI evidence.

- [ ] **Step 5: Mirror and commit**

```text
Copy-Item src\xray.mjs plugins\forgemind\src\xray.mjs
Copy-Item src\xray-adapters.mjs plugins\forgemind\src\xray-adapters.mjs
Copy-Item src\xray-visual.mjs plugins\forgemind\src\xray-visual.mjs
Copy-Item src\xray-image-diff.mjs plugins\forgemind\src\xray-image-diff.mjs
git add src/xray.mjs src/xray-adapters.mjs src/xray-visual.mjs src/xray-image-diff.mjs plugins/forgemind/src/xray.mjs plugins/forgemind/src/xray-adapters.mjs plugins/forgemind/src/xray-visual.mjs plugins/forgemind/src/xray-image-diff.mjs tests/xray-visual.test.mjs tests/xray-adapters.test.mjs tests/xray.test.mjs tests/cli.test.mjs
git commit -m "feat: add Xray visual and performance evidence"
```

### Task 5: State native/iOS limits, report all new evidence, and release-verify

**Files:**
- Modify: `src/xray.mjs:128-155,481-559`
- Modify: `src/cli.mjs:277-290`
- Modify: `entry-skills/forgemind-xray/SKILL.md`
- Modify: `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`
- Modify: `README.md`
- Modify: `docs/WORKFLOWS.md`
- Modify: `CHANGELOG.md`
- Modify: `tests/xray.test.mjs`
- Modify: `tests/cli.test.mjs`
- Modify: `tests/journey-surface.test.mjs`

**Interfaces:**
- Produces: `FM_XRAY_NATIVE_EMULATOR_UNSUPPORTED` for iOS/native desktop surfaces, while Android keeps the current ADB path.
- Produces: report sections `Critical flows`, `API evidence`, `Responsive coverage`, `Visual baseline`, and `Performance budgets` only from canonical report data.

- [ ] **Step 1: Write failing native-gap and report-content tests**

```js
test('Xray reports iOS and desktop native surfaces as unsupported emulator evidence', async (t) => {
  const root = await fixture(t, { files: { 'App.xcodeproj/project.pbxproj': '', 'Desktop.csproj': '<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop" />' } });
  const report = await runXray({ workspace: root });
  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_NATIVE_EMULATOR_UNSUPPORTED'));
});

test('Xray report renders critical flows, API, responsive, visual, and performance evidence', () => {
  const markdown = renderXrayMarkdown(fullReportFixture());
  for (const heading of ['Critical flows', 'API evidence', 'Responsive coverage', 'Visual baseline', 'Performance budgets']) assert.match(markdown, new RegExp(heading));
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `node --test tests/xray.test.mjs tests/cli.test.mjs tests/journey-surface.test.mjs`

Expected: FAIL because unsupported-native gaps and report sections do not exist.

- [ ] **Step 3: Implement native gaps, report rendering, CLI/docs, and package mirror updates**

```js
function nativeEmulatorGap(surface) {
  return {
    code: 'FM_XRAY_NATIVE_EMULATOR_UNSUPPORTED', surfaceId: surface.id,
    message: `Xray cannot claim native ${surface.label} coverage through the internal Web Browser.`,
    nextAction: 'Run an approved platform-specific simulator externally and import a complete, workspace-local receipt.',
  };
}
```

Add this gap when a `native-gui` or iOS-only mobile surface is detected and no Android adapter owns it. Extend the CLI with `xray baseline`, passing `action: 'baseline'` to `runXray`. Update the skill and user docs with explicit configuration, baseline, safe API, responsive-browser, and native-limit instructions.

- [ ] **Step 4: Run focused and full release verification**

Run: `node --test tests/xray.test.mjs tests/xray-adapters.test.mjs tests/xray-api.test.mjs tests/xray-config.test.mjs tests/xray-visual.test.mjs tests/cli.test.mjs; npm run ci; node bin/forgemind.mjs validate --plugin dist/plugin --strict-release`

Expected: all tests, packaging, and strict validation PASS.

- [ ] **Step 5: Review, commit, and push the completed feature**

Run: `git diff --check; git status --short; git diff --no-index -- src/xray.mjs plugins/forgemind/src/xray.mjs`

Expected: no whitespace errors, intended files only, and mirror comparison exit 0.

```text
git add src plugins/forgemind/src entry-skills/forgemind-xray plugins/forgemind/entry-skills/forgemind-xray README.md docs/WORKFLOWS.md CHANGELOG.md tests docs/superpowers/plans/2026-08-18-xray-complete-evidence.md
git commit -m "feat: complete Xray local evidence workflow"
git push origin main
```
