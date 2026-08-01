import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-forge-cli-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function outputBuffer() {
  let value = '';
  return { stream: { write(chunk) { value += String(chunk); } }, text: () => value };
}

async function jsonFile(root, name, value) {
  const file = path.join(root, name);
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

async function forge(root, args) {
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  const result = await runCli(['forge', ...args, '--workspace', root, '--json'], { cwd: root, stdout: stdout.stream, stderr: stderr.stream });
  return { ...result, stdout: stdout.text(), stderr: stderr.text() };
}

test('forge CLI dispatches every disruptive capability through the shared contract surface', async (t) => {
  const root = await workspace(t);
  const trustInput = await jsonFile(root, 'trust.json', {
    title: 'CLI contract', intent: 'Verify CLI surface',
    acceptanceCriteria: [{ id: 'ac1', description: 'Works', evidenceType: 'test' }],
    requiredEvidence: ['proof'], policy: { allowedVendors: ['openai'], requireNoViolations: true }, rollbackRequired: true,
  });
  const strategyInput = await jsonFile(root, 'strategy.json', {
    name: 'CLI strategy', goal: 'Prove dispatch', nonGoals: [],
    constraints: [{ id: 'evidence', type: 'require-evidence', value: 'proof' }],
    metrics: [{ id: 'quality', direction: 'min', target: 90 }],
  });
  const outcomesInput = await jsonFile(root, 'outcomes.json', { minCohort: 1, outcomes: [{ id: 'o1', taskCategory: 'feature', route: 'structured-feature', project: { stacks: ['node'] }, durationMinutes: 10, verificationStatus: 'passed', correctionCount: 0, userAccepted: true, residualDefects: 0 }] });
  const tournamentInput = await jsonFile(root, 'tournament.json', {
    name: 'CLI tournament', minimumAcceptance: 80, budgets: { maxCostUnits: 10, maxDurationMinutes: 60 },
    candidates: [
      { id: 'a', outcomeScore: 90, acceptancePercent: 95, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: [], risk: 'low', complexity: 2, costUnits: 3, durationMinutes: 20 },
      { id: 'b', outcomeScore: 70, acceptancePercent: 90, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: [], risk: 'medium', complexity: 3, costUnits: 4, durationMinutes: 30 }
    ]
  });
  const shrinkInput = await jsonFile(root, 'shrink.json', { name: 'CLI shrink', usageThreshold: 1, outcomeThreshold: 1, capabilities: [{ id: 'old', files: ['old.js'], usageCount: 0, outcomeContribution: 0, complexityPoints: 10, protectedBehaviors: ['behavior'], preservationTests: ['npm test'], rollback: ['restore'] }] });
  const loopInput = await jsonFile(root, 'loop.json', { name: 'CLI loop', signalRefs: ['s1'], hypothesis: 'Outcome improves', successMetric: { id: 'value', direction: 'min', target: 10 }, guardrails: [{ id: 'errors', direction: 'max', target: 1 }] });
  const escrowInput = await jsonFile(root, 'escrow.json', { name: 'CLI escrow', contractId: 'contract_external', milestones: [{ id: 'release', requiredEvidence: ['proof'] }], requiredApprovers: ['owner'] });
  const federationInput = await jsonFile(root, 'federation.json', { minCohort: 2, outcomes: [
    { id: 'f1', taskCategory: 'feature', route: 'structured-feature', project: { stacks: ['node'] }, verificationStatus: 'passed', userAccepted: true, durationMinutes: 10, correctionCount: 0, residualDefects: 0 },
    { id: 'f2', taskCategory: 'feature', route: 'structured-feature', project: { stacks: ['node'] }, verificationStatus: 'passed', userAccepted: true, durationMinutes: 12, correctionCount: 0, residualDefects: 0 }
  ] });

  const cases = [
    ['trust', ['trust', 'create', '--input', trustInput], 'created'],
    ['strategy', ['strategy', 'compile', '--input', strategyInput], 'compiled'],
    ['genome', ['genome', 'analyze', '--input', outcomesInput], 'analyzed'],
    ['flight', ['flight', 'verify'], 'valid'],
    ['tournament', ['tournament', 'run', '--input', tournamentInput], 'selected'],
    ['shrink', ['shrink', 'analyze', '--input', shrinkInput], 'planned'],
    ['loop', ['loop', 'create', '--input', loopInput], 'created'],
    ['escrow', ['escrow', 'create', '--input', escrowInput], 'created'],
    ['federate', ['federate', 'export', '--input', federationInput], 'exported'],
  ];
  for (const [capability, args, status] of cases) {
    const result = await forge(root, args);
    assert.equal(result.exitCode, 0, `${capability}: ${result.stderr}`);
    assert.equal(result.data.status, status, capability);
    assert.doesNotThrow(() => JSON.parse(result.stdout), capability);
  }
});

test('forge CLI returns operational failure for a held or rejected result', async (t) => {
  const root = await workspace(t);
  const input = await jsonFile(root, 'tournament-blocked.json', {
    name: 'No safe future', minimumAcceptance: 90, budgets: { maxCostUnits: 10, maxDurationMinutes: 60 },
    candidates: [
      { id: 'a', outcomeScore: 100, acceptancePercent: 95, verificationStatus: 'failed', proofStatus: 'invalid', policyViolations: [], risk: 'low', complexity: 1, costUnits: 1, durationMinutes: 5 },
      { id: 'b', outcomeScore: 100, acceptancePercent: 95, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: ['denied'], risk: 'low', complexity: 1, costUnits: 1, durationMinutes: 5 }
    ]
  });
  const result = await forge(root, ['tournament', 'run', '--input', input]);
  assert.equal(result.data.status, 'no-eligible-candidate');
  assert.equal(result.exitCode, 1);
});

test('forge CLI rejects oversized or malformed imported JSON with invalid-input exit code', async (t) => {
  const root = await workspace(t);
  const malformed = path.join(root, 'malformed.json');
  await writeFile(malformed, '{broken');
  const bad = await forge(root, ['trust', 'create', '--input', malformed]);
  assert.equal(bad.exitCode, 2);
  assert.match(bad.stderr, /FM_FORGE_INPUT_INVALID/);

  const oversized = path.join(root, 'oversized.json');
  await writeFile(oversized, JSON.stringify({ padding: 'x'.repeat(2 * 1024 * 1024 + 1) }));
  const huge = await forge(root, ['trust', 'create', '--input', oversized]);
  assert.equal(huge.exitCode, 2);
  assert.match(huge.stderr, /FM_FORGE_INPUT_TOO_LARGE/);
});
