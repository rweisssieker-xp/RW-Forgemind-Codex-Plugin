import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { inspectProject } from '../src/project.mjs';

async function workspace(t, files) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-project-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

for (const fixture of [
  { manager: 'npm', lock: 'package-lock.json', command: 'npm test' },
  { manager: 'pnpm', lock: 'pnpm-lock.yaml', command: 'pnpm test' },
  { manager: 'yarn', lock: 'yarn.lock', command: 'yarn test' },
]) {
  test(`detects ${fixture.manager} commands from its lockfile and package scripts`, async (t) => {
    const root = await workspace(t, {
      'package.json': '{"scripts":{"test":"node --test","build":"node build.mjs"}}',
      [fixture.lock]: '',
    });

    const profile = await inspectProject(root);

    assert.equal(profile.packageManager, fixture.manager);
    assert.ok(profile.stacks.includes('node'));
    assert.deepEqual(
      profile.commands.find((item) => item.category === 'test'),
      { command: fixture.command, category: 'test', confidence: 'detected', source: 'package.json#scripts.test' },
    );
  });
}

test('detects Python and .NET projects without inventing runnable commands', async (t) => {
  const root = await workspace(t, {
    'pyproject.toml': '[project]\nname="sample"\n',
    'Sample.csproj': '<Project Sdk="Microsoft.NET.Sdk"/>\n',
  });

  const profile = await inspectProject(root);

  assert.deepEqual(profile.stacks, ['dotnet', 'python']);
  assert.deepEqual(profile.commands, [
    { command: 'dotnet test', category: 'test', confidence: 'inferred', source: '*.csproj' },
    { command: 'python -m pytest', category: 'test', confidence: 'inferred', source: 'pyproject.toml' },
  ]);
});

test('a generic repository returns an explicit empty command set', async (t) => {
  const root = await workspace(t, { 'README.md': '# Generic\n' });

  const profile = await inspectProject(root);

  assert.deepEqual(profile.stacks, []);
  assert.deepEqual(profile.commands, []);
  assert.equal(profile.packageManager, null);
});
