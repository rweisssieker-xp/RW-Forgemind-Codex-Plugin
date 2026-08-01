import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { listOutcomes, recordOutcome } from '../src/outcomes.mjs';

test('outcomes persist measurable route effectiveness as append-only records', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-outcomes-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const first = await recordOutcome({ workspace: root, outcome: {
    task: 'Add export', taskCategory: 'feature', route: 'structured-feature', project: { stacks: ['node'] },
    durationMinutes: 20, verificationStatus: 'passed', correctionCount: 0, userAccepted: true, residualDefects: 0,
  } });
  const second = await recordOutcome({ workspace: root, outcome: {
    task: 'Fix export', taskCategory: 'bug', route: 'systematic-debugging', project: { stacks: ['node'] },
    durationMinutes: 15, verificationStatus: 'failed', correctionCount: 2, userAccepted: false, residualDefects: 1,
  } });

  const stored = await listOutcomes({ workspace: root });
  assert.equal(stored.length, 2);
  assert.match(first.outcome.id, /^out_[a-f0-9]{24}$/);
  assert.notEqual(first.outcome.id, second.outcome.id);
  assert.equal(stored[0].route, 'structured-feature');
  assert.equal(stored[0].effectiveness, 1);
  assert.ok(stored[1].effectiveness < 0);
});

test('invalid outcome metrics are rejected', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-outcomes-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await assert.rejects(
    recordOutcome({ workspace: root, outcome: { task: 'Bad', taskCategory: 'feature', route: '', correctionCount: -1 } }),
    (error) => error.code === 'FM_OUTCOME_INVALID',
  );
});
