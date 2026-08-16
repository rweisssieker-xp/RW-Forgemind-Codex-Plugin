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
    mission: { surfaces: [{ id: 'api' }], checks: [] },
    receipts: [],
    gaps: [],
    findings: [{ severity: 'high', surfaces: ['api'] }],
  });

  assert.equal(score.value, 75);
  assert.deepEqual(
    score.components.filter(({ status }) => status === 'not-applicable').map(({ id }) => id).sort(),
    ['accessibility-visual', 'gui-usability'],
  );
  assert.equal(score.components.find(({ id }) => id === 'api-contracts').effectiveWeight, 100);
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
