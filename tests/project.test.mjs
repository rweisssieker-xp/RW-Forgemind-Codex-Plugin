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
  { manager: 'npm', lock: 'package-lock.json', command: 'npm', args: ['test'] },
  { manager: 'pnpm', lock: 'pnpm-lock.yaml', command: 'pnpm', args: ['test'] },
  { manager: 'yarn', lock: 'yarn.lock', command: 'yarn', args: ['test'] },
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
      {
        command: fixture.command,
        args: fixture.args,
        category: 'test',
        confidence: 'detected',
        source: 'package.json#scripts.test',
        adapter: 'command',
        surfaceHints: [],
      },
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
    {
      command: 'dotnet', args: ['test'], category: 'test', confidence: 'inferred', source: '*.csproj',
      adapter: 'command', surfaceHints: ['api'],
    },
    {
      command: 'python', args: ['-m', 'pytest'], category: 'test', confidence: 'inferred', source: 'pyproject.toml',
      adapter: 'command', surfaceHints: ['api'],
    },
  ]);
});

for (const fixture of [
  {
    name: '.NET solution',
    files: { 'sample.sln': '' },
    expected: {
      command: 'dotnet', args: ['test'], category: 'test', source: '*.sln', confidence: 'inferred',
      adapter: 'command', surfaceHints: ['api'],
    },
  },
  {
    name: 'Python project',
    files: { 'pyproject.toml': '' },
    expected: {
      command: 'python', args: ['-m', 'pytest'], category: 'test', source: 'pyproject.toml', confidence: 'inferred',
      adapter: 'command', surfaceHints: ['api'],
    },
  },
  {
    name: 'Go module',
    files: { 'go.mod': 'module example.test/app' },
    expected: {
      command: 'go', args: ['test', './...'], category: 'test', source: 'go.mod', confidence: 'inferred',
      adapter: 'command', surfaceHints: ['api'],
    },
  },
  {
    name: 'Android Gradle wrapper',
    files: { 'gradlew.bat': '', 'app/src/main/AndroidManifest.xml': '<manifest package="example.app" />' },
    expected: {
      command: 'gradlew.bat', args: ['test'], category: 'test', source: 'gradlew.bat', confidence: 'inferred',
      adapter: 'command', surfaceHints: ['mobile-gui'],
    },
  },
]) {
  test(`discovers a normalized ${fixture.name} command candidate`, async (t) => {
    const profile = await inspectProject(await workspace(t, fixture.files));
    assert.deepEqual(profile.commands, [fixture.expected]);
  });
}

test('a generic repository returns an explicit empty command set', async (t) => {
  const root = await workspace(t, { 'README.md': '# Generic\n' });

  const profile = await inspectProject(root);

  assert.deepEqual(profile.stacks, []);
  assert.deepEqual(profile.commands, []);
  assert.equal(profile.packageManager, null);
});
