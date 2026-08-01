import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createEvidenceEscrow, evaluateEscrow, releaseEscrow } from '../src/forge/escrow.mjs';
import { aggregateFederatedBundles, exportFederatedBundle } from '../src/forge/federate.mjs';
import { sealRecord } from '../src/forge/integrity.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-escrow-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function trustedAttestation(contractId = 'contract_1') {
  return sealRecord({ schemaVersion: 1, protocol: 'forgemind-trust-attestation-v1', id: 'attestation_1', contractId, status: 'trusted', score: 100, blockers: [] });
}

test('evidence escrow releases only after trusted attestation, every milestone, and every required approval', async (t) => {
  const root = await workspace(t);
  const escrow = await createEvidenceEscrow({ workspace: root, input: {
    name: 'Release evidence escrow',
    contractId: 'contract_1',
    milestones: [
      { id: 'build', requiredEvidence: ['artifact-checksum', 'verification-report'] },
      { id: 'release', requiredEvidence: ['rollback-plan'] },
    ],
    requiredApprovers: ['engineering', 'security'],
  }, now: new Date('2026-01-01T00:00:00Z') });
  assert.equal(escrow.record.custody, 'evidence-only-no-funds');

  const evaluation = await evaluateEscrow({ workspace: root, escrow: escrow.record, attestation: trustedAttestation(), submission: {
    milestoneEvidence: {
      build: ['artifact-checksum', 'verification-report'],
      release: ['rollback-plan'],
    },
    approvals: [{ party: 'engineering', status: 'approved' }, { party: 'security', status: 'approved' }],
  }, now: new Date('2026-01-01T00:01:00Z') });
  assert.equal(evaluation.status, 'releasable');
  const receipt = await releaseEscrow({ workspace: root, escrow: escrow.record, evaluation: evaluation.record, now: new Date('2026-01-01T00:02:00Z') });
  assert.equal(receipt.status, 'released');
  assert.equal(receipt.record.contractId, 'contract_1');
  assert.equal(receipt.record.custody, 'evidence-only-no-funds');
  assert.ok(receipt.record.attestationDigest);
});

test('escrow stays held for untrusted proof, missing milestone evidence, or missing approvals', async (t) => {
  const root = await workspace(t);
  const escrow = await createEvidenceEscrow({ workspace: root, input: {
    name: 'Guarded escrow', contractId: 'contract_1',
    milestones: [{ id: 'release', requiredEvidence: ['proof', 'rollback'] }],
    requiredApprovers: ['security'],
  } });
  const cases = [
    { attestation: sealRecord({ ...trustedAttestation(), digest: undefined, status: 'rejected' }), submission: { milestoneEvidence: { release: ['proof', 'rollback'] }, approvals: [{ party: 'security', status: 'approved' }] } },
    { attestation: trustedAttestation(), submission: { milestoneEvidence: { release: ['proof'] }, approvals: [{ party: 'security', status: 'approved' }] } },
    { attestation: trustedAttestation(), submission: { milestoneEvidence: { release: ['proof', 'rollback'] }, approvals: [] } },
  ];
  for (const item of cases) {
    const evaluation = await evaluateEscrow({ workspace: root, escrow: escrow.record, ...item });
    assert.equal(evaluation.status, 'held');
    assert.ok(evaluation.blockers.length > 0);
    await assert.rejects(releaseEscrow({ workspace: root, escrow: escrow.record, evaluation: evaluation.record }), (error) => error.code === 'FM_ESCROW_NOT_RELEASABLE');
  }
});

function outcome(index, overrides = {}) {
  return {
    id: `private-outcome-${index}`,
    task: `SECRET PROJECT ALPHA task ${index}`,
    taskCategory: 'feature',
    route: 'structured-feature',
    project: { stacks: ['node'], path: `C:/customer/private-${index}` },
    author: `person-${index}@example.invalid`,
    verificationStatus: 'passed',
    userAccepted: true,
    durationMinutes: 20,
    correctionCount: 0,
    residualDefects: 0,
    ...overrides,
  };
}

test('federated export emits only k-anonymous aggregates and suppresses small cohorts without leaking identifiers', async (t) => {
  const root = await workspace(t);
  const outcomes = [
    outcome(1), outcome(2), outcome(3),
    outcome(4, { taskCategory: 'tiny-secret-category', route: 'rare-private-route', project: { stacks: ['secret-stack'], path: 'C:/ultra-secret' } }),
  ];
  const exported = await exportFederatedBundle({ workspace: root, outcomes, minCohort: 3, now: new Date('2026-01-01T00:00:00Z') });
  assert.equal(exported.status, 'exported');
  assert.equal(exported.record.cohorts.length, 1);
  assert.equal(exported.record.cohorts[0].count, 3);
  assert.equal(exported.record.suppression.outcomeCount, 1);
  assert.equal(exported.record.privacy.claim, 'k-anonymous-aggregate-not-differential-privacy');
  const serialized = JSON.stringify(exported.record);
  for (const forbidden of ['private-outcome-', 'SECRET PROJECT ALPHA', 'person-', 'C:/customer', 'tiny-secret-category', 'rare-private-route', 'secret-stack', 'ultra-secret']) {
    assert.doesNotMatch(serialized, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('federated aggregation verifies bundles and pools metrics by cohort counts', async (t) => {
  const firstRoot = await workspace(t);
  const secondRoot = await workspace(t);
  const outputRoot = await workspace(t);
  const first = await exportFederatedBundle({ workspace: firstRoot, outcomes: [outcome(1), outcome(2), outcome(3, { userAccepted: false })], minCohort: 3 });
  const second = await exportFederatedBundle({ workspace: secondRoot, outcomes: [outcome(4), outcome(5), outcome(6), outcome(7), outcome(8), outcome(9)], minCohort: 3 });
  const benchmark = await aggregateFederatedBundles({ workspace: outputRoot, bundles: [first.record, second.record] });
  assert.equal(benchmark.status, 'aggregated');
  assert.equal(benchmark.record.cohorts[0].count, 9);
  assert.equal(benchmark.record.cohorts[0].successRate, 88.89);

  const tampered = structuredClone(first.record);
  tampered.cohorts[0].successCount = 999;
  await assert.rejects(aggregateFederatedBundles({ workspace: outputRoot, bundles: [tampered] }), (error) => error.code === 'FM_FEDERATION_BUNDLE_INVALID');
});
