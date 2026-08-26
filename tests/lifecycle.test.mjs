import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { installPlugin, resolveInstallationTarget, runInstallationSelfTest, uninstallPlugin } from '../src/lifecycle.mjs';
import { runCli } from '../src/cli.mjs';
import { buildPackages } from '../src/package.mjs';
import { resolvePluginRoot } from '../src/paths.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-lifecycle-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const built = await buildPackages({ pluginRoot: await resolvePluginRoot(), outputRoot: path.join(root, 'build') });
  return { root, packagePath: built.pluginPath, home: path.join(root, 'home') };
}

test('installation targets resolve only to the ForgeMind plugin directory', async (t) => {
  const { root, home } = await fixture(t);
  const target = path.join(home, 'plugins', 'forgemind');
  assert.deepEqual(await resolveInstallationTarget({ home }), { home, target });
  assert.deepEqual(await resolveInstallationTarget({ pluginPath: target }), { home, target });
  await assert.rejects(
    resolveInstallationTarget({ pluginPath: path.join(root, 'plugins', 'other-plugin') }),
    (error) => error.code === 'FM_INSTALL_TARGET_INVALID',
  );
});

test('install, upgrade, downgrade, and uninstall are recoverable in an isolated home', async (t) => {
  const { root, packagePath, home } = await fixture(t);
  const currentVersion = JSON.parse(await readFile(path.join(packagePath, '.codex-plugin', 'plugin.json'))).version;
  const installed = await installPlugin({ packagePath, home });
  assert.equal(installed.status, 'installed');
  assert.equal(JSON.parse(await readFile(path.join(installed.installPath, '.codex-plugin', 'plugin.json'))).version, currentVersion);
  assert.equal(installed.commandSmokeTest, 'passed');
  assert.match(installed.commandPath, process.platform === 'win32' ? /bin[\\/]forgemind\.cmd$/i : /bin[\\/]forgemind$/i);
  assert.match(await readFile(installed.commandPath, 'utf8'), /ForgeMind managed wrapper/);
  assert.equal(installed.selfTest.installedVersion, currentVersion);
  assert.deepEqual(installed.selfTest.removedLegacyPluginArtifacts, []);
  assert.equal((await runInstallationSelfTest({ home })).commandSmokeTest, 'passed');

  const reinstalled = await installPlugin({ packagePath, home });
  assert.equal(reinstalled.status, 'reinstalled');
  assert.ok(reinstalled.backupPath);

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
  await assert.rejects(readFile(installed.commandPath));
});

test('self-test removes only legacy plugin-local artifact directories', async (t) => {
  const { packagePath, home } = await fixture(t);
  const installed = await installPlugin({ packagePath, home });
  const legacy = path.join(installed.installPath, '.codex-orchestrator');
  const backupLegacy = path.join(home, 'backups', 'forgemind', 'old', '.forgemind-artifacts');
  await mkdir(legacy, { recursive: true });
  await mkdir(backupLegacy, { recursive: true });
  const report = await runInstallationSelfTest({ home });
  assert.deepEqual(report.removedLegacyPluginArtifacts.sort(), [legacy, backupLegacy].sort());
  await assert.rejects(access(legacy));
  await assert.rejects(access(backupLegacy));
});

test('documented source and destination CLI aliases install and self-test correctly', async (t) => {
  const { root, packagePath } = await fixture(t);
  const home = path.join(root, 'documented-home');
  const output = { write() {} };
  const installed = await runCli(['install', '--source', packagePath, '--destination', home], { stdout: output, stderr: output });
  assert.equal(installed.exitCode, 0);
  assert.equal(installed.data.status, 'installed');
  const selfTest = await runCli(['selftest', '--destination', home], { stdout: output, stderr: output });
  assert.equal(selfTest.exitCode, 0);
  assert.equal(selfTest.data.installedVersion, installed.data.version);
});

test('CLI accepts only an explicit ForgeMind plugin path', async (t) => {
  const { root, packagePath, home } = await fixture(t);
  const pluginPath = path.join(root, 'explicit-home', 'plugins', 'forgemind');
  const output = { write() {} };
  const installed = await runCli(['install', '--source', packagePath, '--home', home, '--plugin-path', pluginPath], { stdout: output, stderr: output });
  assert.equal(installed.exitCode, 0);
  assert.equal(installed.data.installPath, pluginPath);
  const rejected = await runCli(['install', '--source', packagePath, '--plugin-path', path.join(root, 'plugins', 'other-plugin')], { stdout: output, stderr: output });
  assert.equal(rejected.exitCode, 2);
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
