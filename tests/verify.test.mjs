import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runProcess } from '../src/process.mjs';
import { verifyWorkspace } from '../src/verify.mjs';

test('process execution captures successful and failed commands without a shell', async () => {
  const success = await runProcess(process.execPath, ['-e', 'console.log("ok")']);
  const failure = await runProcess(process.execPath, ['-e', 'console.error("bad");process.exit(3)']);

  assert.equal(success.exitCode, 0);
  assert.equal(success.stdout.trim(), 'ok');
  assert.equal(success.shell, false);
  assert.equal(failure.exitCode, 3);
  assert.equal(failure.stderr.trim(), 'bad');
});

test('process execution truncates output at the configured byte limit', async () => {
  const result = await runProcess(process.execPath, ['-e', 'process.stdout.write("x".repeat(1000))'], { maxOutputBytes: 64 });

  assert.equal(result.truncated, true);
  assert.ok(Buffer.byteLength(result.stdout) <= 64);
});

test('verification executes detected project commands and persists their evidence', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-verify-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), '{"scripts":{"test":"node -e \\"process.exit(0)\\""}}');
  await writeFile(path.join(root, 'package-lock.json'), '{}');

  const report = await verifyWorkspace({ workspace: root, run: true });

  assert.equal(report.status, 'passed');
  assert.equal(report.commands[0].category, 'test');
  assert.equal(report.commands[0].exitCode, 0);
  const persisted = JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'reports', 'verification-latest.json'), 'utf8'));
  assert.equal(persisted.status, 'passed');
});

test('verification refuses inferred commands unless explicitly allowed', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-verify-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'pyproject.toml'), '[project]\nname="fixture"\n');

  const report = await verifyWorkspace({ workspace: root, run: true });

  assert.equal(report.status, 'failed');
  assert.equal(report.errors[0].code, 'FM_COMMAND_INFERRED_DENIED');
  assert.equal(report.commands[0].status, 'denied');
});
