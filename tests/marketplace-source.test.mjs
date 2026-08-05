import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('repository root exposes a direct GitHub Marketplace entry for ForgeMind', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const catalog = JSON.parse(await readFile(path.join(root, '.agents', 'plugins', 'marketplace.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(root, 'plugins', 'forgemind', '.codex-plugin', 'plugin.json'), 'utf8'));
  const entry = catalog.plugins.find((plugin) => plugin.name === manifest.name);
  assert.equal(catalog.name, 'forgemind-marketplace');
  assert.equal(entry.source.path, './plugins/forgemind');
  assert.equal(catalog.plugins.find((plugin) => plugin.name === 'forgemind-trust-fabric').source.path, './plugins/forgemind-trust-fabric');
});
