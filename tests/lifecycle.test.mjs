import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { installPlugin, uninstallPlugin } from '../src/lifecycle.mjs';
import { buildPackages } from '../src/package.mjs';
import { resolvePluginRoot } from '../src/paths.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-lifecycle-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const built = await buildPackages({ pluginRoot: await resolvePluginRoot(), outputRoot: path.join(root, 'build') });
  return { root, packagePath: built.pluginPath, home: path.join(root, 'home') };
}

test('install, upgrade, downgrade, and uninstall are recoverable in an isolated home', async (t) => {
  const { root, packagePath, home } = await fixture(t);
  const currentVersion = JSON.parse(await readFile(path.join(packagePath, '.codex-plugin', 'plugin.json'))).version;
  const installed = await installPlugin({ packagePath, home });
  assert.equal(installed.status, 'installed');
  assert.equal(JSON.parse(await readFile(path.join(installed.installPath, '.codex-plugin', 'plugin.json'))).version, currentVersion);

  const upgraded = await installPlugin({ packagePath, home });
  assert.equal(upgraded.status, 'upgraded');
  assert.ok(upgraded.backupPath);

  const lowerSource = path.join(root, 'lower-source');
  await import('node:fs/promises').then(({ cp }) => cp(packagePath, lowerSource, { recursive: true }));
  for (const relative of [['.codex-plugin', 'plugin.json'], ['package.json']]) {
    const file = path.join(lowerSource, ...relative);
    const metadata = JSON.parse(await readFile(file));
    metadata.version = '1.4.0';
    await writeFile(file, `${JSON.stringify(metadata, null, 2)}\n`);
  }
  const lower = await buildPackages({ pluginRoot: lowerSource, outputRoot: path.join(root, 'downgrade') });
  const downgraded = await installPlugin({ packagePath: lower.pluginPath, home });
  assert.equal(downgraded.status, 'downgraded');
  assert.equal(downgraded.version, '1.4.0');
  assert.equal(JSON.parse(await readFile(path.join(home, 'plugins', 'forgemind', '.codex-plugin', 'plugin.json'))).version, '1.4.0');

  const removed = await uninstallPlugin({ home });
  assert.equal(removed.status, 'uninstalled');
});

test('an injected failure after backup restores the previous installation', async (t) => {
  const { packagePath, home } = await fixture(t);
  const currentVersion = JSON.parse(await readFile(path.join(packagePath, '.codex-plugin', 'plugin.json'))).version;
  await installPlugin({ packagePath, home });

  await assert.rejects(installPlugin({ packagePath, home, injectFailure: 'after-backup' }), (error) => error.code === 'FM_INSTALL_ROLLED_BACK');

  assert.equal(JSON.parse(await readFile(path.join(home, 'plugins', 'forgemind', '.codex-plugin', 'plugin.json'))).version, currentVersion);
});

test('uninstall preserves project data unless purge is explicitly approved', async (t) => {
  const { root, packagePath, home } = await fixture(t);
  const workspace = path.join(root, 'workspace');
  await import('node:fs/promises').then(({ mkdir }) => mkdir(path.join(workspace, '.codex-orchestrator'), { recursive: true }));
  await writeFile(path.join(workspace, '.codex-orchestrator', 'memory.txt'), 'keep');
  await installPlugin({ packagePath, home });
  await uninstallPlugin({ home, workspace });
  assert.equal(await readFile(path.join(workspace, '.codex-orchestrator', 'memory.txt'), 'utf8'), 'keep');

  await assert.rejects(uninstallPlugin({ home, workspace, purgeData: true }), (error) => error.code === 'FM_POLICY_DENIED');
  const purged = await uninstallPlugin({ home, workspace, purgeData: true, approvedPurge: true });
  assert.equal(purged.dataPurged, true);
});
