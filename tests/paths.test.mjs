import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { assertContained, resolvePluginRoot, resolveWorkspace } from '../src/paths.mjs';

test('plugin root resolves upward from a nested plugin directory', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-paths-'));
  t.after(async () => (await import('node:fs/promises')).rm(root, { recursive: true, force: true }));
  const nested = path.join(root, 'skills', 'example');
  await mkdir(path.join(root, '.codex-plugin'), { recursive: true });
  await mkdir(nested, { recursive: true });
  await writeFile(path.join(root, '.codex-plugin', 'plugin.json'), '{}', 'utf8');

  assert.equal(await resolvePluginRoot(nested), root);
});

test('workspace resolution returns an absolute existing directory', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-workspace-'));
  t.after(async () => (await import('node:fs/promises')).rm(root, { recursive: true, force: true }));

  assert.equal(await resolveWorkspace(root), root);
});

test('path containment rejects a sibling that shares the parent prefix', () => {
  const parent = path.resolve(tmpdir(), 'project');
  const sibling = path.resolve(tmpdir(), 'project-private', 'secret.txt');

  assert.throws(() => assertContained(parent, sibling), (error) => {
    assert.equal(error.code, 'FM_PATH_ESCAPE');
    return true;
  });
});
