import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { inspectProject } from './project.mjs';
import { runProcess } from './process.mjs';
import { redactText } from './redact.mjs';
import { artifactStatePath } from './artifact-store.mjs';
import { writeJsonAtomic, writeTextAtomic } from './io.mjs';

const API_DEPENDENCIES = new Set([
  'express', '@hapi/hapi', 'fastify', 'koa', '@nestjs/core', 'hono', 'restify',
]);
const WEB_GUI_DEPENDENCIES = new Set([
  'vite', 'next', 'react', 'react-dom', 'vue', '@angular/core', 'svelte', '@sveltejs/kit',
]);
const UNSAFE_COMMAND_PATTERN = /migrate|deploy|publish|seed|reset|delete|production/i;
const SCORE_COMPONENTS = [
  { id: 'functional-correctness', label: 'Functional correctness and regressions', configuredWeight: 30 },
  { id: 'api-contracts', label: 'API, CLI, and integration contracts', configuredWeight: 20 },
  { id: 'gui-usability', label: 'GUI behavior and usability', configuredWeight: 15 },
  { id: 'accessibility-visual', label: 'Accessibility and visual quality', configuredWeight: 15 },
  { id: 'robustness-error-paths', label: 'Robustness and error paths', configuredWeight: 10 },
  { id: 'evidence-coverage', label: 'Evidence coverage of detected surfaces', configuredWeight: 10 },
];
const SEVERITY_DEDUCTIONS = { critical: 40, high: 25, medium: 10, low: 3 };

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

export function scoreXrayQuality({ mission, findings = [], receipts = [], gaps = [] }) {
  const surfaces = mission?.surfaces ?? [];
  const surfaceIds = new Set(surfaces.map(({ id }) => id));
  const hasGui = surfaceIds.has('web-gui') || surfaceIds.has('native-gui') || surfaceIds.has('mobile-gui');
  const hasApiOrCli = surfaceIds.has('api') || surfaceIds.has('cli');
  const executedReceiptIds = new Set(receipts.filter(isExecutionReceipt).map(({ id }) => id));
  const hasReceipts = executedReceiptIds.size > 0;
  const apiOrCliEvidence = receiptIdsForSurfaces(mission, executedReceiptIds, ['api', 'cli']);
  const guiEvidence = receiptIdsForSurfaces(mission, executedReceiptIds, ['web-gui', 'native-gui', 'mobile-gui']);
  const applicability = {
    'functional-correctness': hasReceipts ? 'applicable' : 'insufficient-evidence',
    'api-contracts': componentStatus(hasApiOrCli, apiOrCliEvidence.length),
    'gui-usability': componentStatus(hasGui, guiEvidence.length),
    'accessibility-visual': componentStatus(hasGui, guiEvidence.length),
    'robustness-error-paths': hasReceipts ? 'applicable' : 'insufficient-evidence',
    'evidence-coverage': hasReceipts ? 'applicable' : 'insufficient-evidence',
  };
  const applicableWeight = SCORE_COMPONENTS
    .filter(({ id }) => applicability[id] === 'applicable')
    .reduce((total, { configuredWeight }) => total + configuredWeight, 0);
  const effectiveWeights = redistributedWeights(applicability, applicableWeight);
  const components = SCORE_COMPONENTS.map((definition) => {
    const status = applicability[definition.id];
    const effectiveWeight = effectiveWeights.get(definition.id) ?? 0;
    const relevantFindings = findings.filter((finding) => findingAppliesToComponent(finding, definition.id));
    const deductions = relevantFindings.map((finding) => ({
      findingId: finding.id ?? null,
      severity: finding.severity,
      value: SEVERITY_DEDUCTIONS[finding.severity] ?? 0,
    }));
    const deductionTotal = deductions.reduce((total, deduction) => total + deduction.value, 0);
    return {
      ...definition,
      effectiveWeight,
      status,
      evidence: componentEvidence(definition.id, receipts, gaps, surfaceIds, apiOrCliEvidence, guiEvidence),
      deductions,
      score: status === 'applicable' ? Math.max(0, 100 - deductionTotal) : null,
    };
  });
  const noSurface = surfaces.length === 0;
  const scoreGaps = noSurface
    ? [{ code: 'FM_XRAY_NO_TEST_SURFACE' }]
    : missingSurfaceEvidenceGaps(mission, surfaces, executedReceiptIds);
  const value = applicableWeight === 0
    ? 0
    : Math.round(components.reduce((total, component) => total + ((component.score ?? 0) * component.effectiveWeight), 0) / 100);
  return {
    value,
    status: applicableWeight === 0 ? 'insufficient-evidence' : 'scored',
    components,
    rationale: applicableWeight === 0
      ? 'No executable test evidence is available for a detected surface.'
      : 'Applicable component weights are redistributed to 100; verified finding severities deduct deterministically per component.',
    gaps: scoreGaps,
  };
}

export async function runXray({ workspace, goal, runCommand, now = new Date() }) {
  const mission = await discoverXrayMission({ workspace, goal });
  const execution = await executeXrayMission({ workspace, mission, runCommand });
  const score = scoreXrayQuality({ mission, ...execution });
  const gaps = [...execution.gaps, ...score.gaps];
  const report = {
    schemaVersion: 1,
    status: deriveStatus({ ...execution, gaps }, score),
    generatedAt: now.toISOString(),
    mission,
    receipts: execution.receipts,
    findings: execution.findings,
    gaps,
    score,
    errors: [],
  };
  await writeJsonAtomic(artifactStatePath(workspace, 'xray', 'test-mission-latest.json'), mission);
  await writeJsonAtomic(artifactStatePath(workspace, 'xray', 'report-latest.json'), report);
  await writeTextAtomic(path.join(workspace, 'docs', 'forgemind', 'xray-report.md'), renderXrayMarkdown(report));
  return {
    ...report,
    evidencePath: '.codex-orchestrator/xray/report-latest.json',
    projectDocuments: ['docs/forgemind/xray-report.md'],
  };
}

export async function getXrayStatus({ workspace }) {
  try {
    const report = JSON.parse(await readFile(artifactStatePath(workspace, 'xray', 'report-latest.json'), 'utf8'));
    return {
      ...report,
      evidencePath: '.codex-orchestrator/xray/report-latest.json',
      projectDocuments: ['docs/forgemind/xray-report.md'],
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { schemaVersion: 1, status: 'missing', nextAction: 'Run xray run first.', errors: [] };
    }
    throw error;
  }
}

export function renderXrayMarkdown(report) {
  const lines = [
    '# ForgeMind Xray report',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Quality score',
    '',
    `${report.score.value}/100 (${report.score.status})`,
    '',
    '### Components',
    '',
    '| Component | Weight | Status | Score | Deductions |',
    '| --- | ---: | --- | ---: | --- |',
    ...report.score.components.map((component) => `| ${component.label} | ${formatWeight(component.effectiveWeight)} | ${component.status} | ${component.score ?? '—'} | ${component.deductions.map(({ severity, value }) => `${severity} -${value}`).join(', ') || '—'} |`),
    '',
    '## Findings',
    '',
    ...(report.findings.length ? report.findings.map((finding) => `- **${finding.severity}** ${finding.title} (${finding.evidence.join(', ')})`) : ['No verified failures.']),
    '',
    '## Test gaps',
    '',
    ...(report.gaps.length ? report.gaps.map((gap) => `- ${gap.code}${gap.message ? `: ${gap.message}` : ''}`) : ['No test gaps recorded.']),
    '',
  ];
  return lines.join('\n');
}

function isUnsafeCommand(command) {
  return UNSAFE_COMMAND_PATTERN.test(String(command ?? ''));
}

function findingAppliesToComponent(finding, componentId) {
  const surfaces = new Set(finding.surfaces ?? []);
  if (componentId === 'api-contracts') return surfaces.has('api') || surfaces.has('cli');
  if (componentId === 'gui-usability' || componentId === 'accessibility-visual') return surfaces.has('web-gui') || surfaces.has('native-gui') || surfaces.has('mobile-gui');
  if (componentId === 'functional-correctness') return true;
  if (componentId === 'robustness-error-paths') return /error|exception|timeout|resilien|robust/i.test(`${finding.title ?? ''} ${finding.actual ?? ''}`);
  return false;
}

function componentEvidence(componentId, receipts, gaps, surfaceIds, apiOrCliEvidence, guiEvidence) {
  if (componentId === 'api-contracts') return apiOrCliEvidence;
  if (componentId === 'gui-usability' || componentId === 'accessibility-visual') return guiEvidence;
  if (componentId === 'evidence-coverage') return { receipts: receipts.map(({ id }) => id), gaps: gaps.map(({ code }) => code) };
  return receipts.map(({ id }) => id);
}

function deriveStatus(execution, score) {
  if (execution.findings.length) return 'issues-found';
  if (execution.gaps.length || score.status === 'insufficient-evidence') return 'gaps-found';
  return 'passed';
}

function formatWeight(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function isExecutionReceipt(receipt) {
  return receipt.status === 'passed' || receipt.status === 'failed';
}

function componentStatus(hasSurface, evidenceCount) {
  if (!hasSurface) return 'not-applicable';
  return evidenceCount > 0 ? 'applicable' : 'insufficient-evidence';
}

function receiptIdsForSurfaces(mission, receiptIds, targetSurfaceIds) {
  const targets = new Set(targetSurfaceIds);
  return (mission?.checks ?? [])
    .filter((check) => receiptIds.has(check.id) && (check.surfaceIds ?? []).some((id) => targets.has(id)))
    .map(({ id }) => id);
}

function missingSurfaceEvidenceGaps(mission, surfaces, receiptIds) {
  return surfaces
    .filter(({ id }) => receiptIdsForSurfaces(mission, receiptIds, [id]).length === 0)
    .map(({ id }) => ({
      code: 'FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE',
      surfaceId: id,
      message: `No executed check produced evidence for the detected ${id} surface.`,
    }));
}

function redistributedWeights(applicability, applicableWeight) {
  const applicable = SCORE_COMPONENTS.filter(({ id }) => applicability[id] === 'applicable');
  const weights = new Map();
  let assigned = 0;
  applicable.forEach((component, index) => {
    const weight = index === applicable.length - 1
      ? 100 - assigned
      : (component.configuredWeight / applicableWeight) * 100;
    weights.set(component.id, weight);
    assigned += weight;
  });
  return weights;
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
