import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createDeliveryProof, verifyDeliveryProof } from '../src/evidence.mjs';
import { runProcess } from '../src/process.mjs';
import { scoreReadiness } from '../src/readiness.mjs';

async function repository(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-evidence-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await runProcess('git', ['init'], { cwd: root });
  await writeFile(path.join(root, 'feature.txt'), 'implemented\n');
  await runProcess('git', ['add', '.'], { cwd: root });
  await runProcess('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid.local', 'commit', '-m', 'feature'], { cwd: root });
  await mkdir(path.join(root, '.codex-orchestrator', 'reports'), { recursive: true });
  return root;
}

const verification = { status: 'passed', evidencePath: '.codex-orchestrator/reports/verification-latest.json', commands: [{ command: 'node --test', status: 'passed', exitCode: 0 }], errors: [] };
const risks = { status: 'clear', evidencePath: '.codex-orchestrator/reports/risk-radar-latest.json', risks: [] };

test('a clean verified repository produces a valid tamper-evident delivery proof', async (t) => {
  const root = await repository(t);

  const created = await createDeliveryProof({
    workspace: root,
    intent: 'Deliver the evidence feature.',
    acceptanceCriteria: ['Tests pass.', 'Proof links to Git state.'],
    verification,
    risks,
    decisions: ['Use SHA-256 over canonical JSON.'],
    rollback: ['Revert the feature commit.'],
    unresolved: [],
  });
  const checked = await verifyDeliveryProof({ workspace: root, proofPath: created.proofPath });
  const digestFile = await readFile(path.join(root, path.dirname(created.proofPath), 'sha256.txt'), 'utf8');

  assert.equal(created.status, 'ready');
  assert.equal(checked.status, 'valid');
  assert.match(created.proof.digest, /^[a-f0-9]{64}$/);
  assert.equal(digestFile.trim(), created.proof.digest);
  assert.ok(created.proof.git.changedFiles.includes('feature.txt'));
  assert.ok(created.proof.evidence.every((item) => !path.isAbsolute(item)));
});

test('failed verification, blocker risks, dirty state, and uncertainty block proof readiness', async (t) => {
  const root = await repository(t);
  await writeFile(path.join(root, 'uncommitted.txt'), 'dirty\n');

  const created = await createDeliveryProof({
    workspace: root,
    intent: 'Unsafe delivery.',
    acceptanceCriteria: ['Must be verified.'],
    verification: { status: 'failed', commands: [], errors: [{ code: 'FM_VERIFY_FAILED' }] },
    risks: { status: 'blocked', risks: [{ severity: 'blocker', category: 'secrets' }] },
    decisions: [],
    rollback: [],
    unresolved: ['Production behavior is unknown.'],
  });

  assert.equal(created.status, 'blocked');
  assert.deepEqual(created.proof.blockers.sort(), ['dirty-worktree', 'risk:secrets', 'rollback-missing', 'uncertainty', 'verification'].sort());
});

test('tampering and later Git changes invalidate an existing proof', async (t) => {
  const root = await repository(t);
  const created = await createDeliveryProof({ workspace: root, intent: 'Feature.', acceptanceCriteria: ['Done.'], verification, risks, decisions: [], rollback: ['git revert HEAD'], unresolved: [] });
  const absolute = path.join(root, created.proofPath);
  const proof = JSON.parse(await readFile(absolute, 'utf8'));
  proof.intent = 'Tampered intent.';
  await writeFile(absolute, `${JSON.stringify(proof, null, 2)}\n`);

  const tampered = await verifyDeliveryProof({ workspace: root, proofPath: created.proofPath });
  assert.equal(tampered.status, 'tampered');

  await writeFile(absolute, `${JSON.stringify(created.proof, null, 2)}\n`);
  await writeFile(path.join(root, 'feature.txt'), 'changed after proof\n');
  const stale = await verifyDeliveryProof({ workspace: root, proofPath: created.proofPath });
  assert.equal(stale.status, 'stale');
  assert.equal(stale.error.code, 'FM_PROOF_STALE');
});

test('readiness cannot be ready without a valid delivery proof', async (t) => {
  const root = await repository(t);
  const report = await scoreReadiness({
    workspace: root,
    verification,
    gaps: { status: 'clear', gaps: [] },
    risks,
  });

  assert.equal(report.status, 'blocked');
  assert.ok(report.blockers.includes('delivery-proof'));
});
