import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildPackages, syncMarketplaceSources, verifyPackage } from '../src/package.mjs';
import { validatePlugin } from '../src/validate.mjs';

test('repository root exposes a direct GitHub Marketplace entry synchronized with the build', async (t) => {
  const root = path.resolve(import.meta.dirname, '..');
  const output = await mkdtemp(path.join(tmpdir(), 'forgemind-marketplace-sync-'));
  t.after(() => rm(output, { recursive: true, force: true }));
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
  await access(path.join(root, 'plugins', 'forgemind', 'checksums.json'));
  await access(path.join(root, 'plugins', 'forgemind', 'src', 'foundation.mjs'));
  await access(path.join(root, 'plugins', 'forgemind-trust-fabric', 'checksums.json'));
  await access(path.join(root, 'plugins', 'forgemind-trust-fabric', 'bin', 'forgemind.mjs'));
  assert.equal((await verifyPackage(path.join(root, 'plugins', 'forgemind'))).status, 'passed');
  assert.equal((await verifyPackage(path.join(root, 'plugins', 'forgemind-trust-fabric'))).status, 'passed');
  const built = await buildPackages({ pluginRoot: root, outputRoot: path.join(output, 'dist') });
  for (const name of ['forgemind', 'forgemind-trust-fabric']) {
    const expected = await readFile(path.join(built.marketplacePath, 'plugins', name, 'checksums.json'), 'utf8');
    const published = await readFile(path.join(root, 'plugins', name, 'checksums.json'), 'utf8');
    assert.equal(published, expected, `${name} Marketplace source is stale; run npm run build`);
  }
});

test('Marketplace sync preserves the published source if staging fails', async (t) => {
  const root = path.resolve(import.meta.dirname, '..');
  const temp = await mkdtemp(path.join(tmpdir(), 'forgemind-marketplace-atomic-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const built = await buildPackages({ pluginRoot: root, outputRoot: path.join(temp, 'build') });
  const catalog = path.join(built.marketplacePath, '.agents', 'plugins', 'marketplace.json');
  await rename(catalog, `${catalog}.missing`);
  const publishedMarker = path.join(temp, 'published', 'plugins', 'forgemind', 'marker.txt');
  await mkdir(path.dirname(publishedMarker), { recursive: true });
  await writeFile(publishedMarker, 'previous package', { encoding: 'utf8', flush: true });

  await assert.rejects(syncMarketplaceSources({ pluginRoot: path.join(temp, 'published'), marketplacePath: built.marketplacePath }));

  assert.equal(await readFile(publishedMarker, 'utf8'), 'previous package');
});
