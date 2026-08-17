import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { executeCommandAdapter } from '../src/xray-adapters.mjs';
import { runProcess } from '../src/process.mjs';
import { discoverXrayMission, runXray, selectXrayChecks } from '../src/xray.mjs';

async function workspace(t, files = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-adapter-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

test('command adapter records a successful inferred dotnet test receipt', async (t) => {
  const root = await workspace(t, { 'sample.sln': '' });

  const result = await executeCommandAdapter({
    candidate: {
      id: 'command-1', command: 'dotnet', args: ['test'],
      confidence: 'inferred', surfaceHints: ['api'],
    },
    workspace: root,
    runProcess: async (command, args, options) => {
      assert.equal(command, 'dotnet');
      assert.deepEqual(args, ['test']);
      assert.deepEqual(options, { cwd: root });
      return { exitCode: 0, stdout: 'Passed!', stderr: '' };
    },
  });

  assert.equal(result.adapter, 'command');
  assert.equal(result.status, 'passed');
  assert.deepEqual(result.surfaceIds, ['api']);
  assert.deepEqual(result.evidence, ['command-1']);
  assert.equal(result.command, 'dotnet test');
});

test('command adapter blocks an unavailable dotnet executable', async (t) => {
  const result = await executeCommandAdapter({
    candidate: { id: 'command-1', command: 'dotnet', args: ['test'], surfaceHints: ['api'] },
    workspace: await workspace(t),
    runProcess: async () => ({ exitCode: 127, stdout: '', stderr: 'dotnet: command not found' }),
  });

  assert.equal(result.adapter, 'command');
  assert.equal(result.status, 'blocked');
  assert.equal(result.gap.code, 'FM_XRAY_TOOL_UNAVAILABLE');
});

test('Xray retains an API evidence gap when API discovery has no executable candidate', async (t) => {
  const root = await workspace(t, { 'src/routes.mjs': 'router.get("/health", () => {});' });

  const mission = await discoverXrayMission({ workspace: root });
  const apiOnly = await runXray({ workspace: root });

  assert.deepEqual(mission.checks, []);
  assert.ok(apiOnly.gaps.some(({ code }) => code === 'FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE'));
});

test('Xray rejects inferred candidates made unsafe by their arguments', () => {
  const checks = selectXrayChecks({
    commands: [{
      command: 'dotnet', args: ['test', '--environment=production'], category: 'test',
      confidence: 'inferred', source: '*.sln', adapter: 'command', surfaceHints: ['api'],
    }],
    manifest: { scripts: {} },
    surfaces: [{ id: 'api' }],
  });

  assert.deepEqual(checks, []);
});

test('Xray rejects inferred batch candidates with command chaining in their arguments', () => {
  const checks = selectXrayChecks({
    commands: [{
      command: 'gradlew.bat', args: ['test', '&', 'whoami'], category: 'test',
      confidence: 'inferred', source: 'gradlew.bat', adapter: 'command', surfaceHints: [],
    }],
    manifest: { scripts: {} },
    surfaces: [],
  });

  assert.deepEqual(checks, []);
});

test('process adapter executes a Windows batch wrapper without enabling a shell', { skip: process.platform !== 'win32' }, async (t) => {
  const root = await workspace(t, { 'gradlew.bat': '@echo off\r\necho wrapper-%1\r\nexit /b 0\r\n' });

  const result = await runProcess('gradlew.bat', ['test'], { cwd: root });

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /wrapper-test/);
  assert.equal(result.shell, false);
});
