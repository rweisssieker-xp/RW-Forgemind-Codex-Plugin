import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resolvePluginRoot } from '../src/paths.mjs';
import { runProcess } from '../src/process.mjs';

test('every PowerShell script is a thin Node compatibility launcher', async () => {
  const root = await resolvePluginRoot();
  const scripts = (await readdir(path.join(root, 'scripts'))).filter((name) => name.endsWith('.ps1'));
  assert.ok(scripts.length >= 20);
  for (const script of scripts) {
    const content = await readFile(path.join(root, 'scripts', script), 'utf8');
    assert.match(content, /bin[\\/]forgemind\.mjs/);
    assert.match(content, /legacy/);
    assert.doesNotMatch(content, /Set-Content|ConvertTo-Json|New-Item|Remove-Item|Invoke-WebRequest/);
    assert.ok(content.split(/\r?\n/).length <= 12, `${script} is not a thin wrapper`);
  }
});

test('representative legacy wrappers execute real portable behavior on PowerShell hosts', { skip: process.platform !== 'win32' }, async (t) => {
  const root = await resolvePluginRoot();
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-wrapper-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, 'package.json'), '{"scripts":{"test":"node --test"}}');
  await writeFile(path.join(workspace, 'package-lock.json'), '{}');

  const detect = await runProcess('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts', 'detect-stack.ps1'), '-Path', workspace], { cwd: workspace });
  const validate = await runProcess('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts', 'validate-plugin.ps1')], { cwd: workspace });

  assert.equal(detect.exitCode, 0, detect.stderr);
  assert.equal(JSON.parse(detect.stdout).packageManager, 'npm');
  assert.equal(validate.exitCode, 0, validate.stderr);
  assert.match(validate.stdout, /passed/);
});
