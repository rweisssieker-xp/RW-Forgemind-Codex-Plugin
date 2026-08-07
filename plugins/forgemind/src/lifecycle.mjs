import { cp, mkdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import { loadConfig } from './config.mjs';
import { ForgeMindError } from './errors.mjs';
import { assertContained } from './paths.mjs';
import { evaluateAction } from './policy.mjs';
import { verifyPackage } from './package.mjs';

export async function installPlugin({ packagePath, home, requestedStatus, injectFailure }) {
  const source = path.resolve(packagePath);
  const root = path.resolve(home);
  const target = assertContained(root, path.join(root, 'plugins', 'forgemind'));
  const sourceReport = await verifyPackage(source);
  if (sourceReport.status !== 'passed') throw new ForgeMindError('FM_PACKAGE_INVALID', 'Installation package validation failed.', { details: sourceReport.errors });
  await mkdir(root, { recursive: true });
  const sourceManifest = JSON.parse(await readFile(path.join(source, '.codex-plugin', 'plugin.json'), 'utf8'));
  const previousManifest = await readManifest(target);
  const staging = assertContained(root, path.join(root, '.staging', `forgemind-${process.pid}-${Date.now()}`));
  const backup = previousManifest
    ? assertContained(root, path.join(root, 'backups', 'forgemind', `${previousManifest.version}-${Date.now()}`))
    : null;
  let backedUp = false;
  try {
    await rm(staging, { recursive: true, force: true });
    await mkdir(path.dirname(staging), { recursive: true });
    await cp(source, staging, { recursive: true, force: true });
    if ((await verifyPackage(staging)).status !== 'passed') throw new ForgeMindError('FM_PACKAGE_INVALID', 'Staged package validation failed.');
    if (backup) {
      await mkdir(path.dirname(backup), { recursive: true });
      await rename(target, backup);
      backedUp = true;
    }
    if (injectFailure === 'after-backup') throw new Error('Injected lifecycle failure');
    await mkdir(path.dirname(target), { recursive: true });
    await rename(staging, target);
    return {
      schemaVersion: 1,
      status: requestedStatus ?? (previousManifest ? versionStatus(previousManifest.version, sourceManifest.version) : 'installed'),
      version: sourceManifest.version,
      installPath: target,
      backupPath: backup,
    };
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    if (backedUp) {
      await rm(target, { recursive: true, force: true });
      await rename(backup, target);
      throw new ForgeMindError('FM_INSTALL_ROLLED_BACK', `Installation failed and previous version was restored: ${error.message}`);
    }
    if (error instanceof ForgeMindError) throw error;
    throw new ForgeMindError('FM_INSTALL_FAILED', error.message);
  }
}

export async function uninstallPlugin({ home, workspace, purgeData = false, approvedPurge = false }) {
  const root = path.resolve(home);
  const target = assertContained(root, path.join(root, 'plugins', 'forgemind'));
  await rm(target, { recursive: true, force: true });
  let dataPurged = false;
  if (purgeData) {
    if (!workspace) throw new ForgeMindError('FM_WORKSPACE_INVALID', 'Workspace is required with --purge-data.');
    const config = await loadConfig(path.resolve(workspace));
    const decision = evaluateAction(config.policy, { kind: 'destructive', path: '.codex-orchestrator' });
    if (!approvedPurge || decision.decision === 'deny') throw new ForgeMindError('FM_POLICY_DENIED', decision.rationale);
    const data = assertContained(path.resolve(workspace), path.join(path.resolve(workspace), '.codex-orchestrator'));
    await rm(data, { recursive: true, force: true });
    dataPurged = true;
  }
  return { schemaVersion: 1, status: 'uninstalled', installPath: target, dataPurged };
}

async function readManifest(target) {
  try { return JSON.parse(await readFile(path.join(target, '.codex-plugin', 'plugin.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function versionStatus(previous, next) {
  const left = previous.split('.').map(Number);
  const right = next.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (right[index] > left[index]) return 'upgraded';
    if (right[index] < left[index]) return 'downgraded';
  }
  return 'upgraded';
}
