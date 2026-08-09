import { access, constants, readFile } from 'node:fs/promises';
import path from 'node:path';

export async function diagnose({ pluginRoot, workspace, installation = false }) {
  const checks = [];
  const check = (name, status, evidence, remediation) => checks.push({ name, status, evidence, remediation });
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  check('node-version', nodeMajor >= 20 ? 'passed' : 'failed', process.versions.node, 'Install Node.js 20 or newer.');

  try {
    JSON.parse(await readFile(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'));
    check('plugin-manifest', 'passed', path.join(pluginRoot, '.codex-plugin', 'plugin.json'));
  } catch (error) {
    check('plugin-manifest', 'failed', error.message, 'Repair .codex-plugin/plugin.json.');
  }

  await permissionCheck(check, 'workspace-readable', workspace, constants.R_OK, 'Grant read permission to the workspace.');
  await permissionCheck(check, 'workspace-writable', workspace, constants.W_OK, 'Grant write permission to the workspace.');
  if (installation) {
    const runner = path.join(pluginRoot, 'bin', 'forgemind.mjs');
    await permissionCheck(check, 'bundled-runner', runner, constants.R_OK, 'Reinstall ForgeMind from the Marketplace or a verified package.');
    try { const manifest = JSON.parse(await readFile(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8')); check('installed-version', 'passed', manifest.version, 'Upgrade with codex plugin marketplace upgrade forgemind-marketplace, then reinstall ForgeMind.'); } catch {}
  }

  const config = path.join(workspace, 'forgemind.config.json');
  try {
    await access(config, constants.R_OK);
    check('shared-config', 'passed', config);
  } catch {
    check('shared-config', 'warning', 'No shared config; secure defaults apply.', 'Copy forgemind.config.example.json when team policy is needed.');
  }

  const failed = checks.some((item) => item.status === 'failed');
  const warning = checks.some((item) => item.status === 'warning');
  return { schemaVersion: 1, status: failed ? 'failed' : warning ? 'warning' : 'passed', checks, errors: [] };
}

async function permissionCheck(check, name, candidate, mode, remediation) {
  try {
    await access(candidate, mode);
    check(name, 'passed', candidate);
  } catch (error) {
    check(name, 'failed', error.message, remediation);
  }
}
