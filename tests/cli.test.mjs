import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

function outputBuffer() {
  let value = '';
  return {
    stream: { write(chunk) { value += String(chunk); } },
    text() { return value; },
  };
}

async function xrayWorkspace(t) {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-cli-'));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }, null, 2));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  return workspace;
}

test('help returns success and lists the stable primary commands', async () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();

  const result = await runCli(['help'], { stdout: stdout.stream, stderr: stderr.stream });

  assert.equal(result.exitCode, 0);
  assert.match(stdout.text(), /ForgeMind/);
  for (const command of ['doctor', 'validate', 'init', 'start', 'leap', 'verify', 'evidence', 'package']) {
    assert.match(stdout.text(), new RegExp(`\\b${command}\\b`));
  }
  assert.equal(stderr.text(), '');
});

test('an unknown command is invalid input with exit code 2', async () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();

  const result = await runCli(['not-a-command'], { stdout: stdout.stream, stderr: stderr.stream });

  assert.equal(result.exitCode, 2);
  assert.equal(stdout.text(), '');
  assert.match(stderr.text(), /Unknown command: not-a-command/);
});

test('Compass has a portable CLI entrypoint and routes an explicit goal', async () => {
  const stdout = outputBuffer();
  const result = await runCli(['compass', '--workspace', process.cwd(), '--goal', 'validate a market opportunity and pricing', '--artifacts', 'none', '--json'], { stdout: stdout.stream, stderr: outputBuffer().stream });

  assert.equal(result.exitCode, 0);
  assert.equal(result.data.recommendedJourney, 'venture');
  assert.equal(result.data.handoff, '$forgemind-venture');
  assert.equal(result.data.goalSource, 'user');
});

test('xray run dispatches the QA report and xray status reads it', async (t) => {
  const workspace = await xrayWorkspace(t);
  const run = await runCli(['xray', 'run', '--workspace', workspace, '--json'], { stdout: outputBuffer().stream, stderr: outputBuffer().stream });
  const status = await runCli(['xray', 'status', '--workspace', workspace, '--json'], { stdout: outputBuffer().stream, stderr: outputBuffer().stream });

  assert.equal(run.exitCode, 0);
  assert.equal(run.data.evidencePath, '.codex-orchestrator/xray/report-latest.json');
  assert.equal(run.data.artifactMode, 'workspace');
  assert.equal(status.exitCode, 0);
  assert.equal(status.data.evidencePath, '.codex-orchestrator/xray/report-latest.json');
});

test('xray rejects unsupported actions', async () => {
  const result = await runCli(['xray', 'repair', '--json'], { stdout: outputBuffer().stream, stderr: outputBuffer().stream });

  assert.equal(result.exitCode, 2);
  assert.match(result.data.error, /FM_XRAY_ACTION_INVALID/);
});

test('xray run accepts surface-specific GUI receipts for the canonical report', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-cli-gui-'));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({
    scripts: { dev: 'vite' },
    dependencies: { vite: '^6' },
  }, null, 2));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const receipts = JSON.stringify([{
    surfaceId: 'web-gui',
    control: 'browser',
    status: 'passed',
    componentIds: ['gui-usability'],
    evidence: ['screenshots/home.png'],
    url: 'http://127.0.0.1:4173/',
    coverageArea: 'home',
    controlLabel: 'Get started',
    action: 'click',
    expected: 'The onboarding view opens.',
    actual: 'The onboarding view opened.',
    reproduction: 'Open the home page and click Get started.',
  }]);

  const result = await runCli(
    ['xray', 'run', '--workspace', workspace, '--gui-receipts', receipts, '--json'],
    { stdout: outputBuffer().stream, stderr: outputBuffer().stream },
  );

  assert.equal(result.exitCode, 0);
  assert.equal(result.data.receipts[0].surfaceId, 'web-gui');
  assert.equal(result.data.score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
});

test('xray run routes the local test URL and selected adapters to browser execution', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-cli-browser-'));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({
    scripts: { dev: 'vite' },
    dependencies: { vite: '^6' },
  }, null, 2));
  t.after(() => rm(workspace, { recursive: true, force: true }));

  const result = await runCli([
    'xray', 'run', '--workspace', workspace,
    '--test-url', 'http://127.0.0.1:4173',
    '--adapters', 'browser', '--json',
  ], { stdout: outputBuffer().stream, stderr: outputBuffer().stream });

  assert.equal(result.exitCode, 0);
  assert.equal(result.data.mission.testUrl, 'http://127.0.0.1:4173/');
  assert.deepEqual(result.data.mission.adapters, ['browser']);
  assert.ok(result.data.gaps.some(({ code }) => code === 'FM_XRAY_PLAYWRIGHT_UNAVAILABLE'));
});

test('xray run rejects unknown adapter names', async (t) => {
  const result = await runCli(
    ['xray', 'run', '--workspace', await xrayWorkspace(t), '--adapters', 'command,telepathy', '--json'],
    { stdout: outputBuffer().stream, stderr: outputBuffer().stream },
  );

  assert.equal(result.exitCode, 2);
  assert.equal(result.data.error, 'FM_XRAY_ADAPTERS_INVALID');
});
