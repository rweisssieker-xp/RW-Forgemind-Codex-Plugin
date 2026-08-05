import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { validatePlugin } from '../src/validate.mjs';

test('repository root exposes a direct GitHub Marketplace entry for ForgeMind', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const catalog = JSON.parse(await readFile(path.join(root, '.agents', 'plugins', 'marketplace.json'), 'utf8'));
  const sourceManifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(root, 'plugins', 'forgemind', '.codex-plugin', 'plugin.json'), 'utf8'));
  const entry = catalog.plugins.find((plugin) => plugin.name === manifest.name);
  assert.equal(catalog.name, 'forgemind-marketplace');
  assert.equal(entry.source.path, './plugins/forgemind');
  assert.equal(catalog.plugins.find((plugin) => plugin.name === 'forgemind-trust-fabric').source.path, './plugins/forgemind-trust-fabric');
  assert.equal(manifest.version, sourceManifest.version);
  assert.equal((await validatePlugin(path.join(root, 'plugins', 'forgemind'))).status, 'passed');
  assert.equal((await validatePlugin(path.join(root, 'plugins', 'forgemind-trust-fabric'))).status, 'passed');
  await assert.rejects(access(path.join(root, 'plugins', 'forgemind', 'checksums.json')));
  await assert.rejects(access(path.join(root, 'plugins', 'forgemind-trust-fabric', 'checksums.json')));
});
