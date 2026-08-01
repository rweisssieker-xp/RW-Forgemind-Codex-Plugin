import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { advanceProductLoop, createProductLoop } from '../src/forge/product-loop.mjs';
import { analyzeShrink } from '../src/forge/shrink.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-shrink-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('self-shrinking software creates evidence-backed removal plans without mutating source', async (t) => {
  const root = await workspace(t);
  const source = path.join(root, 'legacy-dashboard.js');
  await writeFile(source, 'export const legacy = true;\n');
  const before = await readFile(source, 'utf8');
  const result = await analyzeShrink({ workspace: root, input: {
    name: 'Remove unused workflow surface',
    usageThreshold: 2,
    outcomeThreshold: 5,
    capabilities: [
      { id: 'legacy-dashboard', files: ['legacy-dashboard.js'], usageCount: 0, outcomeContribution: 0, complexityPoints: 40, protectedBehaviors: ['release visibility'], preservationTests: ['node --test dashboard'], rollback: ['restore legacy-dashboard.js'] },
      { id: 'core-proof', files: ['proof.js'], usageCount: 100, outcomeContribution: 90, complexityPoints: 30, essential: true, protectedBehaviors: ['delivery proof'], preservationTests: ['node --test proof'], rollback: ['restore proof.js'] },
      { id: 'unknown-widget', files: ['unknown.js'], usageCount: 0, outcomeContribution: 0, complexityPoints: 10, protectedBehaviors: [], preservationTests: [], rollback: [] }
    ]
  } });

  assert.equal(result.status, 'planned');
  assert.equal(result.sourceMutation, false);
  assert.equal(result.candidates.find((item) => item.id === 'legacy-dashboard').recommendation, 'remove-experiment');
  assert.equal(result.candidates.find((item) => item.id === 'core-proof').recommendation, 'retain');
  assert.equal(result.candidates.find((item) => item.id === 'unknown-widget').recommendation, 'needs-evidence');
  assert.equal(result.expectedReduction.complexityPoints, 40);
  assert.equal(await readFile(source, 'utf8'), before);
});

test('shrink refuses an actionable removal without preservation tests and rollback', async (t) => {
  const root = await workspace(t);
  const result = await analyzeShrink({ workspace: root, input: {
    name: 'Unsafe reduction', usageThreshold: 1, outcomeThreshold: 1,
    capabilities: [{ id: 'candidate', files: ['candidate.js'], usageCount: 0, outcomeContribution: 0, complexityPoints: 20, protectedBehaviors: ['behavior'], preservationTests: [], rollback: [] }]
  } });
  const candidate = result.candidates[0];
  assert.equal(candidate.recommendation, 'needs-evidence');
  assert.ok(candidate.missingEvidence.includes('preservation-tests'));
  assert.ok(candidate.missingEvidence.includes('rollback'));
});

const LOOP_INPUT = {
  name: 'Support automation outcome',
  signalRefs: ['signal_1', 'signal_2'],
  hypothesis: 'Automation reduces support handling time without increasing errors.',
  successMetric: { id: 'support_minutes', direction: 'decrease-by-percent', target: 20, baseline: 100 },
  guardrails: [{ id: 'error_rate', direction: 'max', target: 0.01 }],
};

async function toDelivery(root) {
  let loop = (await createProductLoop({ workspace: root, input: LOOP_INPUT, now: new Date('2026-01-01T00:00:00Z') })).record;
  loop = (await advanceProductLoop({ workspace: root, loop, event: { type: 'form-hypothesis', hypothesis: LOOP_INPUT.hypothesis }, now: new Date('2026-01-01T00:01:00Z') })).record;
  loop = (await advanceProductLoop({ workspace: root, loop, event: { type: 'approve-experiment', experiment: { id: 'experiment_1', trustContractId: 'contract_1' } }, now: new Date('2026-01-01T00:02:00Z') })).record;
  loop = (await advanceProductLoop({ workspace: root, loop, event: { type: 'record-delivery', delivery: { proofId: 'proof_1', attestationId: 'attestation_1' } }, now: new Date('2026-01-01T00:03:00Z') })).record;
  return loop;
}

test('product loop enforces transitions and scales only from measured success', async (t) => {
  const root = await workspace(t);
  const delivery = await toDelivery(root);
  assert.equal(delivery.state, 'delivery');
  const measured = await advanceProductLoop({ workspace: root, loop: delivery, event: { type: 'measure', metrics: { support_minutes: 75, error_rate: 0.005 } }, now: new Date('2026-01-01T00:04:00Z') });
  assert.equal(measured.record.state, 'scale');
  assert.equal(measured.record.decision, 'scale');
  assert.ok(measured.record.references.proofId);
  assert.ok(measured.record.references.attestationId);
});

test('product loop chooses rollback on guardrail breach and iterate when success is unproven', async (t) => {
  const rollbackRoot = await workspace(t);
  const rollbackDelivery = await toDelivery(rollbackRoot);
  const rollback = await advanceProductLoop({ workspace: rollbackRoot, loop: rollbackDelivery, event: { type: 'measure', metrics: { support_minutes: 70, error_rate: 0.03 } } });
  assert.equal(rollback.record.state, 'rollback');
  assert.match(rollback.record.decisionRationale, /guardrail/i);

  const iterateRoot = await workspace(t);
  const iterateDelivery = await toDelivery(iterateRoot);
  const iterate = await advanceProductLoop({ workspace: iterateRoot, loop: iterateDelivery, event: { type: 'measure', metrics: { support_minutes: 95, error_rate: 0.005 } } });
  assert.equal(iterate.record.state, 'iterate');
  assert.match(iterate.record.decisionRationale, /success metric/i);
});

test('product loop rejects out-of-order or unproven transitions', async (t) => {
  const root = await workspace(t);
  const loop = (await createProductLoop({ workspace: root, input: LOOP_INPUT })).record;
  await assert.rejects(
    advanceProductLoop({ workspace: root, loop, event: { type: 'record-delivery', delivery: { proofId: 'proof', attestationId: 'attestation' } } }),
    (error) => error.code === 'FM_LOOP_TRANSITION_INVALID',
  );
  const hypothesis = (await advanceProductLoop({ workspace: root, loop, event: { type: 'form-hypothesis', hypothesis: LOOP_INPUT.hypothesis } })).record;
  await assert.rejects(
    advanceProductLoop({ workspace: root, loop: hypothesis, event: { type: 'approve-experiment', experiment: { id: 'experiment-without-contract' } } }),
    (error) => error.code === 'FM_LOOP_EVIDENCE_REQUIRED',
  );
});
