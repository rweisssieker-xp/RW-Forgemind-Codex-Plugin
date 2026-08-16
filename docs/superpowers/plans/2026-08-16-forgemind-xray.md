# ForgeMind Xray Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `$forgemind-xray`, an autonomous, read-only, multi-surface QA journey that produces detailed evidence-backed findings and an informative 0-100 quality score.

**Architecture:** `src/xray.mjs` owns repository inspection, safe command execution, mission persistence, finding normalization/deduplication, score calculation, and Markdown rendering. The CLI exposes `xray run|status`; the Xray skill calls it and uses the internal Browser for local web GUIs and Computer Use for native or emulator GUIs, recording unavailable control surfaces as test gaps. Source and `plugins/forgemind` Marketplace surfaces remain in sync.

**Tech Stack:** Node.js 20+ ESM, `node:test`, existing ForgeMind artifact store/process/redaction/policy modules, internal Browser control, Computer Use.

## Global Constraints

- Xray is test-only: never modify product source, configuration, or application data.
- Run only detected local non-destructive commands; external, credentialed, production, destructive, or irreversible operations are reported as test gaps.
- Persist only project-local evidence under `.codex-orchestrator/xray/` and the human report under `docs/forgemind/xray-report.md`.
- The 0-100 score is informative only; it must not automatically block a release.
- Do not report a check as passed, failed, or covered without an execution receipt.
- Use Browser for locally reachable web GUIs and Computer Use for local native or emulated GUIs; unavailable control is an explicit gap.
- Keep source and `plugins/forgemind` Marketplace runtime files byte-equivalent where the package expects duplicated runtime content.

---

## File Structure

- Create: `src/xray.mjs` — pure Xray domain functions, execution orchestration, artifact writes, scoring, and Markdown report rendering.
- Create: `tests/xray.test.mjs` — fixture-driven behavior tests for discovery, safe execution, gaps, findings, score, and artifacts.
- Modify: `src/cli.mjs` — add `xray` to help and dispatch `run|status`.
- Create: `entry-skills/forgemind-xray/SKILL.md` — agent-facing autonomous QA workflow and Browser/Computer Use handoff protocol.
- Create: `entry-skills/forgemind-xray/agents/openai.yaml` — explicit-only Marketplace UI declaration.
- Modify: `entry-skills/forgemind-compass/SKILL.md`, `docs/HIERARCHY.md`, `README.md` — expose Xray in the primary journey hierarchy and routing guidance.
- Modify: `tests/journey-surface.test.mjs` — assert the 14th journey and its explicit-only policy.
- Mirror runtime and entry-skill changes in `plugins/forgemind/` — publishable Marketplace source.
- Modify: `package.json`, `.codex-plugin/plugin.json`, `plugins/forgemind/package.json`, `plugins/forgemind/.codex-plugin/plugin.json`, `CHANGELOG.md` — release version and user-visible change note.

## Xray contracts

`runXray({ workspace, goal, runCommand, now })` returns:

```js
{
  schemaVersion: 1,
  status: 'passed' | 'issues-found' | 'gaps-found',
  generatedAt: 'ISO-8601',
  mission: { id, goal, surfaces, checks, gaps },
  findings: [{ id, severity, surfaces, title, reproduction, expected, actual, evidence, suspectedCause, userImpact, nextVerification }],
  score: { value, components, rationale },
  evidencePath: '.codex-orchestrator/xray/report-latest.json',
  projectDocuments: ['docs/forgemind/xray-report.md'],
  errors: []
}
```

`getXrayStatus({ workspace })` returns the latest report with `status: 'missing'` and an actionable `nextAction` when no Xray artifact exists.

Each score component uses `{ id, label, configuredWeight, effectiveWeight, status, evidence, deductions, score }`. Applicable components redistribute their weights proportionally to exactly 100. Severity deductions are deterministic: critical `-40`, high `-25`, medium `-10`, low `-3`, capped at zero per component.

### Task 1: Build test-surface discovery and safe mission planning

**Files:**
- Create: `src/xray.mjs`
- Create: `tests/xray.test.mjs`

**Interfaces:**
- Consumes: `inspectProject(workspace)` from `src/project.mjs`.
- Produces: `discoverXrayMission({ workspace, goal })` returning `{ id, goal, surfaces, checks, gaps }`.

- [ ] **Step 1: Write failing discovery tests**

```js
test('Xray discovers CLI, API, GUI, and existing command surfaces without inventing commands', async (t) => {
  const root = await fixture(t, {
    packageJson: { bin: { sample: 'bin/sample.mjs' }, scripts: { test: 'node --test', dev: 'vite --host 127.0.0.1' }, dependencies: { express: '^5.0.0', vite: '^6.0.0' } },
    files: { 'bin/sample.mjs': '', 'src/routes.mjs': 'app.get("/health", () => {});' },
  });
  const mission = await discoverXrayMission({ workspace: root, goal: 'full QA' });
  assert.deepEqual(mission.surfaces.map(({ id }) => id).sort(), ['api', 'cli', 'web-gui']);
  assert.ok(mission.checks.some(({ command }) => command === 'npm test'));
  assert.ok(mission.gaps.every(({ code }) => code !== 'FM_XRAY_COMMAND_INVENTED'));
});

test('Xray reports unavailable GUI control as a gap rather than a test result', async (t) => {
  const root = await fixture(t, { packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6.0.0' } } });
  const mission = await discoverXrayMission({ workspace: root, guiControl: { browser: false, computerUse: false } });
  assert.deepEqual(mission.gaps.map(({ code }) => code), ['FM_XRAY_GUI_CONTROL_UNAVAILABLE']);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/xray.test.mjs`

Expected: FAIL because `src/xray.mjs` and `discoverXrayMission` do not exist.

- [ ] **Step 3: Implement minimal discovery**

```js
export async function discoverXrayMission({ workspace, goal, guiControl = { browser: false, computerUse: false } }) {
  const profile = await inspectProject(workspace);
  const surfaces = detectSurfaces(profile);
  const checks = profile.commands.filter(({ confidence }) => confidence === 'detected').map((check, index) => ({
    id: `command-${index + 1}`, kind: 'command', surfaceIds: surfaceIdsForCommand(check, surfaces), ...check,
  }));
  const gaps = guiGap(surfaces, guiControl);
  return { id: `xray-${Date.now().toString(36)}`, goal: String(goal ?? '').trim() || 'Autonomously assess this software quality.', surfaces, checks, gaps };
}
```

Implement `detectSurfaces`, `surfaceIdsForCommand`, and `guiGap` as pure helpers. A GUI surface is detected from known frontend/runtime dependencies or start commands; API from routes/framework dependencies; CLI from `package.json.bin` or an executable command. Do not infer a runnable test command.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/xray.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/xray.mjs tests/xray.test.mjs
git commit -m "feat: plan Xray test surfaces"
```

### Task 2: Execute safe checks and normalize evidence-backed findings

**Files:**
- Modify: `src/xray.mjs`
- Modify: `tests/xray.test.mjs`

**Interfaces:**
- Consumes: `discoverXrayMission`, `runProcess` from `src/process.mjs`, and `redactText` from `src/redact.mjs`.
- Produces: `executeXrayMission({ workspace, mission, runCommand })` returning `{ receipts, findings, gaps }`.

- [ ] **Step 1: Write failing execution tests**

```js
test('Xray turns a failed local command into a detailed functional finding', async (t) => {
  const mission = { checks: [{ id: 'command-1', kind: 'command', command: 'npm test', surfaceIds: ['api'] }], gaps: [] };
  const result = await executeXrayMission({ workspace: await fixture(t), mission, runCommand: async () => ({ exitCode: 1, stdout: '', stderr: 'expected 200, got 500', startedAt: '2026-08-16T00:00:00.000Z', endedAt: '2026-08-16T00:00:01.000Z' }) });
  assert.deepEqual(result.findings[0], assert.objectContaining({ severity: 'high', surfaces: ['api'], expected: 'Command succeeds: npm test', actual: 'Command exited with 1' }));
  assert.match(result.findings[0].evidence[0], /command-1/);
});

test('Xray does not execute a command marked unsafe and records a test gap', async (t) => {
  const result = await executeXrayMission({ workspace: await fixture(t), mission: { checks: [{ id: 'command-1', command: 'npm run migrate', unsafe: true }], gaps: [] }, runCommand: async () => { throw new Error('must not execute'); } });
  assert.equal(result.receipts[0].status, 'skipped');
  assert.deepEqual(result.gaps.map(({ code }) => code), ['FM_XRAY_UNSAFE_CHECK_SKIPPED']);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/xray.test.mjs`

Expected: FAIL because `executeXrayMission` does not exist.

- [ ] **Step 3: Implement execution and finding normalization**

```js
export async function executeXrayMission({ workspace, mission, runCommand = executeDetectedCommand }) {
  const receipts = []; const findings = []; const gaps = [...mission.gaps];
  for (const check of mission.checks) {
    if (check.unsafe) { receipts.push({ id: check.id, status: 'skipped' }); gaps.push({ code: 'FM_XRAY_UNSAFE_CHECK_SKIPPED', checkId: check.id }); continue; }
    const result = await runCommand(check, workspace);
    receipts.push({ id: check.id, status: result.exitCode === 0 ? 'passed' : 'failed', ...redactReceipt(result) });
    if (result.exitCode !== 0) findings.push(commandFinding(check, result));
  }
  return { receipts, findings: deduplicateFindings(findings), gaps };
}
```

Classify nonzero check exits as `high`, preserve redacted stdout/stderr in the receipt, build an evidence reference from the check ID, and deduplicate only when surface IDs, title, expected, and actual are identical. Flag command names containing `migrate`, `deploy`, `publish`, `seed`, `reset`, `delete`, or `production` as unsafe before execution.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/xray.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/xray.mjs tests/xray.test.mjs
git commit -m "feat: execute safe Xray checks"
```

### Task 3: Calculate transparent score and persist the Xray report

**Files:**
- Modify: `src/xray.mjs`
- Modify: `tests/xray.test.mjs`

**Interfaces:**
- Consumes: `executeXrayMission` result.
- Produces: `scoreXrayQuality({ mission, findings, receipts, gaps })`, `runXray({ workspace, goal, runCommand, now })`, and `getXrayStatus({ workspace })`.

- [ ] **Step 1: Write failing report and scoring tests**

```js
test('Xray redistributes not-applicable weights and deducts severity deterministically', () => {
  const score = scoreXrayQuality({ mission: { surfaces: [{ id: 'api' }], checks: [] }, receipts: [], gaps: [], findings: [{ severity: 'high', surfaces: ['api'] }] });
  assert.equal(score.value, 75);
  assert.deepEqual(score.components.filter(({ status }) => status === 'not-applicable').map(({ id }) => id).sort(), ['accessibility-visual', 'gui-usability']);
  assert.equal(score.components.find(({ id }) => id === 'api-contracts').effectiveWeight, 100);
});

test('Xray writes a canonical JSON report and readable Markdown report without modifying product files', async (t) => {
  const root = await fixture(t, { packageJson: { scripts: { test: 'node --test' } } });
  const report = await runXray({ workspace: root, now: new Date('2026-08-16T00:00:00.000Z'), runCommand: async () => ({ exitCode: 0, stdout: 'ok', stderr: '' }) });
  assert.equal(report.evidencePath, '.codex-orchestrator/xray/report-latest.json');
  assert.match(await readFile(path.join(root, 'docs', 'forgemind', 'xray-report.md'), 'utf8'), /Quality score/);
  assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), JSON.stringify({ scripts: { test: 'node --test' } }, null, 2));
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/xray.test.mjs`

Expected: FAIL because score/report functions do not exist.

- [ ] **Step 3: Implement scoring, persistence, and status lookup**

```js
export async function runXray({ workspace, goal, runCommand, now = new Date() }) {
  const mission = await discoverXrayMission({ workspace, goal });
  const execution = await executeXrayMission({ workspace, mission, runCommand });
  const score = scoreXrayQuality({ mission, ...execution });
  const report = { schemaVersion: 1, status: deriveStatus(execution), generatedAt: now.toISOString(), mission, ...execution, score, errors: [] };
  await writeJsonAtomic(artifactStatePath(workspace, 'xray', 'test-mission-latest.json'), mission);
  await writeJsonAtomic(artifactStatePath(workspace, 'xray', 'report-latest.json'), report);
  await writeTextAtomic(path.join(workspace, 'docs', 'forgemind', 'xray-report.md'), renderXrayMarkdown(report));
  return { ...report, evidencePath: '.codex-orchestrator/xray/report-latest.json', projectDocuments: ['docs/forgemind/xray-report.md'] };
}
```

Use the six score components and weights from the approved specification. If no components are applicable, return value `0`, status `insufficient-evidence`, and a `FM_XRAY_NO_TEST_SURFACE` gap. `getXrayStatus` reads the report atomically and returns `{ schemaVersion: 1, status: 'missing', nextAction: 'Run xray run first.', errors: [] }` when absent.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/xray.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/xray.mjs tests/xray.test.mjs
git commit -m "feat: report Xray quality evidence"
```

### Task 4: Expose `xray run` and `xray status` through the CLI

**Files:**
- Modify: `src/cli.mjs`
- Modify: `tests/cli.test.mjs`
- Modify: `tests/xray.test.mjs`

**Interfaces:**
- Consumes: `runXray` and `getXrayStatus` from `src/xray.mjs`.
- Produces: `forgemind xray run|status` with the normal JSON envelope and artifact metadata.

- [ ] **Step 1: Write failing CLI tests**

```js
test('xray run dispatches the QA report and xray status reads it', async (t) => {
  const root = await fixture(t, { packageJson: { scripts: { test: 'node --test' } } });
  const run = await runCli(['xray', 'run', '--workspace', root, '--json'], context());
  const status = await runCli(['xray', 'status', '--workspace', root, '--json'], context());
  assert.equal(run.exitCode, 0);
  assert.equal(status.exitCode, 0);
  assert.equal(status.data.evidencePath, '.codex-orchestrator/xray/report-latest.json');
});

test('xray rejects unsupported actions', async () => {
  const result = await runCli(['xray', 'repair', '--json'], context());
  assert.equal(result.exitCode, 2);
  assert.match(result.data.errors[0].code, /FM_XRAY_ACTION_INVALID/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/cli.test.mjs tests/xray.test.mjs`

Expected: FAIL because `xray` is not a primary command.

- [ ] **Step 3: Implement CLI dispatch**

```js
// Add 'xray' once to PRIMARY_COMMANDS.
} else if (command === 'xray') {
  const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
  const action = positionals[0] ?? 'run';
  const xray = await import('./xray.mjs');
  if (action === 'run') data = await xray.runXray({ workspace, goal: options.goal });
  else if (action === 'status') data = await xray.getXrayStatus({ workspace });
  else throw invalidInput('FM_XRAY_ACTION_INVALID', 'Xray supports run and status.');
}
```

Keep the branch before generic journey dispatch and rely on the existing CLI artifact-store activation/deactivation wrapper.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/cli.test.mjs tests/xray.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli.mjs tests/cli.test.mjs tests/xray.test.mjs
git commit -m "feat: add Xray CLI commands"
```

### Task 5: Add the Xray skill, Browser/Computer Use protocol, and primary-journey discovery

**Files:**
- Create: `entry-skills/forgemind-xray/SKILL.md`
- Create: `entry-skills/forgemind-xray/agents/openai.yaml`
- Modify: `entry-skills/forgemind-compass/SKILL.md`
- Modify: `docs/HIERARCHY.md`
- Modify: `README.md`
- Modify: `tests/journey-surface.test.mjs`

**Interfaces:**
- Consumes: CLI commands from Task 4 and Browser/Computer Use skills at agent runtime.
- Produces: explicit `$forgemind-xray` Marketplace entry point and discoverable hierarchy text.

- [ ] **Step 1: Write failing journey-surface tests**

```js
const JOURNEYS = [/* existing names */, 'forgemind-xray'];

test('Xray remains an explicit-only primary journey with the bundled runner and GUI-control protocol', async () => {
  const instructions = await readFile(path.join(root, 'entry-skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const ui = await readFile(path.join(root, 'entry-skills', 'forgemind-xray', 'agents', 'openai.yaml'), 'utf8');
  assert.match(instructions, /node <plugin-root>\/bin\/forgemind\.mjs xray run/);
  assert.match(instructions, /internal Browser/);
  assert.match(instructions, /Computer Use/);
  assert.match(ui, /allow_implicit_invocation: false/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/journey-surface.test.mjs`

Expected: FAIL because the Xray directory and journey declaration do not exist.

- [ ] **Step 3: Implement the entry skill and documentation**

```markdown
---
name: forgemind-xray
description: Use when an existing application needs autonomous, read-only quality testing across GUI, API, CLI, and local integration surfaces.
---

# ForgeMind Xray

Run `node <plugin-root>/bin/forgemind.mjs xray run --goal "<scope>" --artifacts workspace --json`.
Execute every safe detected local check. For a running local web GUI, use the internal Browser to test visible user flows and record screenshots or receipts. For a local native or mobile-emulator GUI, use Computer Use. If either control surface or the application is unavailable, record the real gap in Xray; do not claim a GUI result. Do not modify product files. Read `xray status` and hand off the detailed findings and informative score.
```

Use the existing `openai.yaml` schema with `display_name: "Xray"`, a QA-focused prompt, and `allow_implicit_invocation: false`. Add Xray as a direct Compass recommendation for independent QA, a primary row in hierarchy/README tables, and an Xray branch beneath Compass in the hierarchy diagram.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/journey-surface.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add entry-skills/forgemind-xray entry-skills/forgemind-compass/SKILL.md docs/HIERARCHY.md README.md tests/journey-surface.test.mjs
git commit -m "feat: add ForgeMind Xray journey"
```

### Task 6: Mirror the Marketplace runtime and publish a tested release package

**Files:**
- Create: `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`
- Create: `plugins/forgemind/entry-skills/forgemind-xray/agents/openai.yaml`
- Create: `plugins/forgemind/src/xray.mjs`
- Modify: `plugins/forgemind/src/cli.mjs`
- Modify: `plugins/forgemind/entry-skills/forgemind-compass/SKILL.md`
- Modify: `plugins/forgemind/docs/HIERARCHY.md`
- Modify: `plugins/forgemind/README.md`
- Modify: `package.json`, `.codex-plugin/plugin.json`, `plugins/forgemind/package.json`, `plugins/forgemind/.codex-plugin/plugin.json`, `CHANGELOG.md`

**Interfaces:**
- Consumes: completed source runtime and entry-skill files.
- Produces: a coherent Marketplace source at `plugins/forgemind` and a versioned distribution package.

- [ ] **Step 1: Write failing package assertions**

```js
test('built Marketplace package exposes the Xray skill and CLI runtime', async (t) => {
  const built = await buildPackages({ pluginRoot: root, outputRoot: await mkdtemp(path.join(tmpdir(), 'forgemind-xray-package-')) });
  await access(path.join(built.marketplacePath, 'plugins', 'forgemind', 'entry-skills', 'forgemind-xray', 'SKILL.md'));
  await access(path.join(built.marketplacePath, 'plugins', 'forgemind', 'src', 'xray.mjs'));
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/package.test.mjs`

Expected: FAIL because the Xray skill and runtime are absent from the package.

- [ ] **Step 3: Mirror files and update versioning**

Copy the completed runtime and entry-skill files to the matching `plugins/forgemind/` paths. Apply the same CLI, Compass, hierarchy, and README updates there. Bump all four manifests from `1.38.3` to `1.39.0` and add a changelog entry describing autonomous read-only QA, Browser/Computer Use GUI evidence, detailed findings, and the informative score.

- [ ] **Step 4: Run focused package checks**

Run: `node --test tests/package.test.mjs tests/journey-surface.test.mjs && npm run build && node bin/forgemind.mjs validate --plugin dist/plugin --strict-release`

Expected: PASS; the built Marketplace package contains Xray and strict validation succeeds.

- [ ] **Step 5: Run the complete verification suite**

Run: `npm test && node bin/forgemind.mjs validate && git diff --check`

Expected: all tests pass, validation passes, and no whitespace errors are reported.

- [ ] **Step 6: Commit**

```bash
git add plugins/forgemind package.json .codex-plugin/plugin.json CHANGELOG.md tests/package.test.mjs
git commit -m "feat: publish ForgeMind Xray"
```

## Plan self-review

- Spec coverage: Tasks 1-3 implement local multi-surface discovery, safe execution, detailed findings, project-local artifacts, and the transparent informative score. Task 5 mandates Browser/Computer Use GUI testing at agent runtime. Task 4 exposes the required CLI. Task 6 makes the Marketplace payload discoverable and validates it.
- Placeholder scan: no unresolved placeholders or deferred implementation steps remain.
- Type consistency: `discoverXrayMission` feeds `executeXrayMission`; its result feeds `scoreXrayQuality` and `runXray`; the CLI imports exactly `runXray` and `getXrayStatus`.
