import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { inspectProject } from './project.mjs';
import { runProcess } from './process.mjs';
import { redactText } from './redact.mjs';

const API_DEPENDENCIES = new Set([
  'express', '@hapi/hapi', 'fastify', 'koa', '@nestjs/core', 'hono', 'restify',
]);
const WEB_GUI_DEPENDENCIES = new Set([
  'vite', 'next', 'react', 'react-dom', 'vue', '@angular/core', 'svelte', '@sveltejs/kit',
]);
const UNSAFE_COMMAND_PATTERN = /migrate|deploy|publish|seed|reset|delete|production/i;

export async function discoverXrayMission({ workspace, goal, guiControl = { browser: false, computerUse: false } }) {
  const profile = await inspectProject(workspace);
  const manifest = await readPackageManifest(profile.root);
  const files = await projectFileNames(profile.root);
  const surfaces = detectSurfaces({ ...profile, files, manifest });
  const checks = profile.commands
    .filter(({ confidence }) => confidence === 'detected')
    .map((check, index) => ({
      id: `command-${index + 1}`,
      kind: 'command',
      surfaceIds: surfaceIdsForCommand(check, surfaces),
      ...check,
    }));
  const gaps = guiGap(surfaces, guiControl);

  return {
    id: `xray-${Date.now().toString(36)}`,
    goal: String(goal ?? '').trim() || 'Autonomously assess this software quality.',
    surfaces,
    checks,
    gaps,
  };
}

export function detectSurfaces(profile) {
  const manifest = profile.manifest ?? {};
  const dependencies = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
  const scripts = manifest.scripts ?? {};
  const surfaces = [];

  if (manifest.bin || scripts.cli || scripts.command) surfaces.push({ id: 'cli', label: 'Command-line interface' });
  if (hasKnownDependency(dependencies, API_DEPENDENCIES) || hasRouteFile(profile)) surfaces.push({ id: 'api', label: 'API' });
  if (hasKnownDependency(dependencies, WEB_GUI_DEPENDENCIES) || scripts.dev || scripts.start) {
    surfaces.push({ id: 'web-gui', label: 'Web GUI' });
  }

  return surfaces;
}

export function surfaceIdsForCommand(check, surfaces) {
  const ids = surfaces.map(({ id }) => id);
  if (check.category === 'test' || check.category === 'lint' || check.category === 'build') return ids;
  return ids;
}

export function guiGap(surfaces, guiControl) {
  const hasGui = surfaces.some(({ id }) => id === 'web-gui' || id === 'native-gui');
  if (!hasGui || guiControl.browser || guiControl.computerUse) return [];
  return [{
    code: 'FM_XRAY_GUI_CONTROL_UNAVAILABLE',
    message: 'Browser and Computer Use control are unavailable; GUI coverage is a test gap.',
  }];
}

export async function executeXrayMission({ workspace, mission, runCommand = executeDetectedCommand }) {
  const receipts = [];
  const findings = [];
  const gaps = [...(mission.gaps ?? [])];

  for (const check of mission.checks ?? []) {
    if (check.unsafe || isUnsafeCommand(check.command)) {
      receipts.push({ id: check.id, status: 'skipped' });
      gaps.push({
        code: 'FM_XRAY_UNSAFE_CHECK_SKIPPED',
        checkId: check.id,
        message: 'This check was not executed because its command may be destructive or irreversible.',
      });
      continue;
    }

    const result = await runCommand(check, workspace);
    receipts.push({
      id: check.id,
      ...redactReceipt(result),
      status: result.exitCode === 0 ? 'passed' : 'failed',
    });
    if (result.exitCode !== 0) findings.push(commandFinding(check, result));
  }

  return { receipts, findings: deduplicateFindings(findings), gaps };
}

export async function executeDetectedCommand(check, workspace) {
  const [command, ...args] = String(check.command ?? '').trim().split(/\s+/);
  return runProcess(command, args, { cwd: workspace });
}

export function redactReceipt(result) {
  const stdout = redactText(result.stdout).text;
  const stderr = redactText(result.stderr).text;
  return { ...result, stdout, stderr };
}

export function commandFinding(check, result) {
  const command = String(check.command ?? 'detected command');
  return {
    id: `finding-${check.id}`,
    severity: 'high',
    surfaces: [...(check.surfaceIds ?? [])],
    title: `Detected command failed: ${command}`,
    reproduction: `Run ${command} from the workspace root.`,
    expected: `Command succeeds: ${command}`,
    actual: `Command exited with ${result.exitCode}`,
    evidence: [check.id],
    suspectedCause: 'The detected local verification command exited unsuccessfully.',
    userImpact: 'The affected surface may not behave as expected for users.',
    nextVerification: `Fix the failure, then rerun ${command}.`,
  };
}

export function deduplicateFindings(findings) {
  const unique = new Map();
  for (const finding of findings) {
    const key = JSON.stringify([finding.surfaces, finding.title, finding.expected, finding.actual]);
    const existing = unique.get(key);
    if (existing) existing.evidence.push(...finding.evidence);
    else unique.set(key, { ...finding, evidence: [...finding.evidence] });
  }
  return [...unique.values()];
}

function isUnsafeCommand(command) {
  return UNSAFE_COMMAND_PATTERN.test(String(command ?? ''));
}

async function readPackageManifest(workspace) {
  try {
    return JSON.parse(await readFile(path.join(workspace, 'package.json'), 'utf8'));
  } catch {
    return {};
  }
}

async function projectFileNames(root, relative = '') {
  try {
    const entries = await readdir(path.join(root, relative), { withFileTypes: true });
    const names = [];
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) names.push(...await projectFileNames(root, child));
      else if (entry.isFile()) names.push(child);
    }
    return names;
  } catch {
    return [];
  }
}

function hasKnownDependency(dependencies, knownDependencies) {
  return [...knownDependencies].some((dependency) => dependencies.has(dependency));
}

function hasRouteFile(profile) {
  return (profile.files ?? []).some((name) => /(?:^|\/|\\)(?:routes?|controllers?)(?:\.|\/|\\)/i.test(name));
}
