import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverXrayMission, executeXrayMission, getXrayStatus, runXray, scoreXrayQuality } from '../src/xray.mjs';

async function fixture(t, { packageJson, files = {} } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const allFiles = { ...files };
  if (packageJson) allFiles['package.json'] = JSON.stringify(packageJson, null, 2);
  for (const [name, content] of Object.entries(allFiles)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

test('Xray discovers CLI, API, GUI, and existing command surfaces without inventing commands', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      bin: { sample: 'bin/sample.mjs' },
      scripts: { test: 'node --test', dev: 'vite --host 127.0.0.1' },
      dependencies: { express: '^5.0.0', vite: '^6.0.0' },
    },
    files: { 'bin/sample.mjs': '', 'src/routes.mjs': 'app.get("/health", () => {});' },
  });

  const mission = await discoverXrayMission({ workspace: root, goal: 'full QA' });

  assert.deepEqual(mission.surfaces.map(({ id }) => id).sort(), ['api', 'cli', 'web-gui']);
  assert.ok(mission.checks.some(({ command }) => command === 'npm test'));
  assert.ok(mission.gaps.every(({ code }) => code !== 'FM_XRAY_COMMAND_INVENTED'));
});

test('Xray reports unavailable GUI control as a gap rather than a test result', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6.0.0' } },
  });

  const mission = await discoverXrayMission({ workspace: root, guiControl: { browser: false, computerUse: false } });

  assert.deepEqual(mission.gaps.map(({ code }) => code), ['FM_XRAY_GUI_CONTROL_UNAVAILABLE']);
});

test('Xray identifies an API route without creating an inferred runnable check', async (t) => {
  const root = await fixture(t, { files: { 'src/routes.mjs': 'router.get("/health", () => {});' } });

  const mission = await discoverXrayMission({ workspace: root });

  assert.deepEqual(mission.surfaces.map(({ id }) => id), ['api']);
  assert.deepEqual(mission.checks, []);
});

test('Xray turns a failed local command into a detailed functional finding', async (t) => {
  const mission = {
    checks: [{ id: 'command-1', kind: 'command', command: 'npm test', surfaceIds: ['api'] }],
    gaps: [],
  };
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission,
    runCommand: async () => ({
      exitCode: 1,
      stdout: 'TOKEN=secret-value',
      stderr: 'expected 200, got 500',
      startedAt: '2026-08-16T00:00:00.000Z',
      endedAt: '2026-08-16T00:00:01.000Z',
    }),
  });

  assert.equal(result.findings[0].severity, 'high');
  assert.deepEqual(result.findings[0].surfaces, ['api']);
  assert.equal(result.findings[0].expected, 'Command succeeds: npm test');
  assert.equal(result.findings[0].actual, 'Command exited with 1');
  assert.match(result.findings[0].evidence[0], /command-1/);
  assert.match(result.receipts[0].stdout, /\[REDACTED:SECRET_ASSIGNMENT\]/);
});

test('Xray does not execute a command marked unsafe and records a test gap', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: { checks: [{ id: 'command-1', command: 'npm run migrate' }], gaps: [] },
    runCommand: async () => { throw new Error('must not execute'); },
  });

  assert.equal(result.receipts[0].status, 'skipped');
  assert.deepEqual(result.gaps.map(({ code }) => code), ['FM_XRAY_UNSAFE_CHECK_SKIPPED']);
});

test('Xray recursively holds package scripts whose aliases hide unsafe or remote operations', async (t) => {
  const cases = [
    { category: 'test', scripts: { test: 'npm run verify', verify: 'npm run deploy', deploy: 'node scripts/release.mjs' } },
    { category: 'build', scripts: { build: 'npm run verify', verify: 'node smoke.mjs --target https://remote.example.com' } },
    { category: 'lint', scripts: { prelint: 'node scripts/delete-data.mjs', lint: 'eslint .' } },
  ];

  for (const { category, scripts } of cases) {
    const mission = await discoverXrayMission({ workspace: await fixture(t, { packageJson: { scripts } }) });
    let executed = false;
    const result = await executeXrayMission({
      workspace: await fixture(t),
      mission,
      runCommand: async () => { executed = true; return { exitCode: 0, stdout: '', stderr: '' }; },
    });

    assert.equal(executed, false);
    assert.equal(mission.checks[0].scriptBody, scripts[category]);
    assert.equal(result.receipts[0].status, 'skipped');
    assert.equal(result.gaps.at(-1).code, 'FM_XRAY_UNSAFE_CHECK_SKIPPED');
  }
});

test('Xray turns a failed imported GUI receipt into an evidence-backed surface finding', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: {
      checks: [{
        id: 'gui-1',
        kind: 'gui-control',
        surfaceIds: ['web-gui'],
        componentIds: ['gui-usability'],
        importedReceipt: {
          status: 'failed',
          control: 'browser',
          surfaceId: 'web-gui',
          componentIds: ['gui-usability'],
          evidence: ['screenshots/broken-menu.png'],
        },
      }],
      gaps: [],
    },
  });

  assert.equal(result.findings[0].severity, 'high');
  assert.deepEqual(result.findings[0].surfaces, ['web-gui']);
  assert.deepEqual(result.findings[0].evidence, ['gui-1']);
});

test('Xray classifies a missing test binary as a gap instead of a product defect', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: { checks: [{ id: 'command-1', command: 'npm test', surfaceIds: ['api'] }], gaps: [] },
    runCommand: async () => ({ exitCode: 127, stdout: '', stderr: 'spawn npm ENOENT' }),
  });

  assert.equal(result.receipts[0].status, 'blocked');
  assert.deepEqual(result.findings, []);
  assert.equal(result.gaps[0].code, 'FM_XRAY_TOOL_UNAVAILABLE');
});

test('Xray classifies an unavailable local service or credential as a gap', async (t) => {
  for (const stderr of ['connect ECONNREFUSED 127.0.0.1:5432', 'Required credential TEST_API_KEY is not configured']) {
    const result = await executeXrayMission({
      workspace: await fixture(t),
      mission: { checks: [{ id: 'command-1', command: 'npm test', surfaceIds: ['api'] }], gaps: [] },
      runCommand: async () => ({ exitCode: 1, stdout: '', stderr }),
    });

    assert.equal(result.receipts[0].status, 'blocked');
    assert.deepEqual(result.findings, []);
    assert.equal(result.gaps[0].code, 'FM_XRAY_PREREQUISITE_UNAVAILABLE');
  }
});

test('Xray deduplicates findings with identical surfaces and command outcomes', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: {
      checks: [
        { id: 'command-1', command: 'npm test', surfaceIds: ['api'] },
        { id: 'command-2', command: 'npm test', surfaceIds: ['api'] },
      ],
      gaps: [],
    },
    runCommand: async () => ({ exitCode: 1, stdout: '', stderr: '' }),
  });

  assert.equal(result.findings.length, 1);
  assert.deepEqual(result.findings[0].evidence, ['command-1', 'command-2']);
});

test('Xray redistributes not-applicable weights and deducts high severity deterministically', () => {
  const score = scoreXrayQuality({
    mission: { surfaces: [{ id: 'api' }], checks: [{ id: 'command-1', surfaceIds: ['api'] }] },
    receipts: [{ id: 'command-1', status: 'failed' }],
    gaps: [],
    findings: [{ severity: 'high', surfaces: ['api'] }],
  });

  assert.equal(score.value, 82);
  assert.deepEqual(
    score.components.filter(({ status }) => status === 'not-applicable').map(({ id }) => id).sort(),
    ['accessibility-visual', 'gui-usability'],
  );
  assert.deepEqual(score.components.find(({ id }) => id === 'api-contracts').deductions, [{ findingId: null, severity: 'high', value: 25 }]);
});

test('Xray marks an API surface without an execution receipt as an evidence gap', () => {
  const score = scoreXrayQuality({
    mission: { surfaces: [{ id: 'api' }], checks: [{ id: 'command-1', surfaceIds: ['api'] }] },
    receipts: [],
    gaps: [],
    findings: [],
  });

  assert.equal(score.value, 0);
  assert.equal(score.status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'api-contracts').status, 'insufficient-evidence');
  assert.deepEqual(score.components.find(({ id }) => id === 'api-contracts').evidence, []);
  assert.equal(score.components.find(({ id }) => id === 'api-contracts').score, null);
  assert.equal(score.gaps[0].code, 'FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE');
  assert.equal(score.gaps[0].surfaceId, 'api');
});

test('Xray does not count a generic repository command as GUI or accessibility evidence', () => {
  const score = scoreXrayQuality({
    mission: {
      surfaces: [{ id: 'web-gui' }],
      checks: [{ id: 'command-1', kind: 'command', surfaceIds: [] }],
    },
    receipts: [{ id: 'command-1', status: 'passed' }],
    gaps: [{ code: 'FM_XRAY_GUI_CONTROL_UNAVAILABLE' }],
    findings: [],
  });

  assert.equal(score.components.find(({ id }) => id === 'gui-usability').status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'accessibility-visual').status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'evidence-coverage').score, 0);
  assert.ok(score.value < 100);
});

test('Xray counts only explicit surface-specific GUI receipt aspects', () => {
  const mission = {
    surfaces: [{ id: 'web-gui' }],
    checks: [{
      id: 'gui-1',
      kind: 'gui-control',
      surfaceIds: ['web-gui'],
      componentIds: ['gui-usability'],
    }],
  };
  const score = scoreXrayQuality({
    mission,
    receipts: [{ id: 'gui-1', status: 'passed', evidence: ['screenshot.png'] }],
    gaps: [],
    findings: [],
  });

  assert.equal(score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
  assert.equal(score.components.find(({ id }) => id === 'accessibility-visual').status, 'insufficient-evidence');
  assert.deepEqual(score.components.find(({ id }) => id === 'gui-usability').evidence, ['gui-1']);
});

test('Xray discovers standalone native, mobile-emulator, and hybrid GUI surfaces from local signals', async (t) => {
  const native = await fixture(t, {
    files: {
      'DesktopApp.sln': '',
      'DesktopApp.csproj': '<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop"><PropertyGroup><UseWPF>true</UseWPF></PropertyGroup></Project>',
    },
  });
  const mobile = await fixture(t, {
    files: {
      'gradlew': '',
      'app/src/main/AndroidManifest.xml': '<manifest package="example.app" />',
    },
  });
  const hybrid = await fixture(t, {
    packageJson: {
      scripts: { test: 'node --test', dev: 'vite', android: 'react-native run-android' },
      dependencies: { express: '^5', react: '^19', vite: '^6', 'react-native': '^0.81' },
    },
  });

  assert.deepEqual((await discoverXrayMission({ workspace: native })).surfaces.map(({ id }) => id), ['native-gui']);
  assert.deepEqual((await discoverXrayMission({ workspace: mobile })).surfaces.map(({ id }) => id), ['mobile-gui']);
  assert.deepEqual(
    (await discoverXrayMission({ workspace: hybrid })).surfaces.map(({ id }) => id).sort(),
    ['api', 'mobile-gui', 'web-gui'],
  );
  assert.ok((await discoverXrayMission({ workspace: native })).gaps.some(({ code }) => code === 'FM_XRAY_GUI_CONTROL_UNAVAILABLE'));
});

test('Xray effective component weights total exactly 100 after redistribution', () => {
  const score = scoreXrayQuality({
    mission: { surfaces: [{ id: 'api' }], checks: [{ id: 'command-1' }] },
    receipts: [{ id: 'command-1', status: 'passed' }],
    gaps: [],
    findings: [],
  });

  assert.equal(score.components.reduce((total, component) => total + component.effectiveWeight, 0), 100);
});

test('Xray writes canonical evidence and a readable Markdown report without changing product files', async (t) => {
  const packageJson = { scripts: { test: 'node --test' } };
  const root = await fixture(t, { packageJson });

  const report = await runXray({
    workspace: root,
    now: new Date('2026-08-16T00:00:00.000Z'),
    runCommand: async () => ({ exitCode: 0, stdout: 'ok', stderr: '' }),
  });

  assert.equal(report.evidencePath, '.codex-orchestrator/xray/report-latest.json');
  assert.match(await readFile(path.join(root, 'docs', 'forgemind', 'xray-report.md'), 'utf8'), /Quality score/);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'xray', 'report-latest.json'), 'utf8')),
    Object.fromEntries(Object.entries(report).filter(([key]) => !['evidencePath', 'projectDocuments'].includes(key))),
  );
  assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), JSON.stringify(packageJson, null, 2));
});

test('Xray imports GUI receipts and persists executed and skipped mission outcomes', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      scripts: { test: 'node --test', build: 'npm run deploy', deploy: 'node release.mjs', dev: 'vite' },
      dependencies: { vite: '^6' },
    },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui',
      control: 'browser',
      status: 'passed',
      componentIds: ['gui-usability', 'accessibility-visual'],
      evidence: ['screenshots/home.png', 'axe:0-critical'],
    }],
    runCommand: async (check) => {
      assert.equal(check.command, 'npm test');
      return { exitCode: 0, stdout: 'ok', stderr: '' };
    },
  });
  const persisted = JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'xray', 'test-mission-latest.json'), 'utf8'));

  assert.equal(report.receipts.find(({ id }) => id === 'gui-1').status, 'passed');
  assert.equal(report.score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
  assert.equal(persisted.checks.find(({ id }) => id === 'command-1').outcome, 'skipped');
  assert.equal(persisted.checks.find(({ id }) => id === 'command-2').outcome, 'passed');
  assert.equal(persisted.checks.find(({ id }) => id === 'gui-1').outcome, 'passed');
  assert.deepEqual(persisted.skippedChecks, ['command-1']);
  assert.deepEqual(persisted.selectedChecks, ['command-2', 'gui-1']);
  assert.deepEqual(persisted.receipts, report.receipts);
  assert.ok(persisted.gaps.some(({ code }) => code === 'FM_XRAY_UNSAFE_CHECK_SKIPPED'));
});

test('Xray status identifies a workspace with no evidence report', async (t) => {
  const status = await getXrayStatus({ workspace: await fixture(t) });

  assert.deepEqual(status, {
    schemaVersion: 1,
    status: 'missing',
    nextAction: 'Run xray run first.',
    errors: [],
  });
});

test('Xray labels a mission with no test surface as insufficient evidence', () => {
  const score = scoreXrayQuality({ mission: { surfaces: [], checks: [] }, receipts: [], gaps: [], findings: [] });

  assert.equal(score.value, 0);
  assert.equal(score.status, 'insufficient-evidence');
  assert.deepEqual(score.gaps, [{ code: 'FM_XRAY_NO_TEST_SURFACE' }]);
});
