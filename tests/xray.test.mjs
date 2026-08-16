import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverXrayMission, executeXrayMission } from '../src/xray.mjs';

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
