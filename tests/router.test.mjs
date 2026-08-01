import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_POLICY, mergePolicies } from '../src/policy.mjs';
import { recommendRoute } from '../src/router.mjs';

const profile = { stacks: ['node'], packageManager: 'npm' };
const successful = (id, route) => ({
  id, taskCategory: 'feature', route, project: { stacks: ['node'] }, effectiveness: 1,
  verificationStatus: 'passed', correctionCount: 0, userAccepted: true, residualDefects: 0,
});

test('repeated successful outcomes change the recommended route with evidence', () => {
  const baseline = recommendRoute({ profile, task: { category: 'feature' }, outcomes: [], policy: DEFAULT_POLICY });
  const learned = recommendRoute({
    profile,
    task: { category: 'feature' },
    outcomes: [successful('o1', 'yolo-feature'), successful('o2', 'yolo-feature'), successful('o3', 'yolo-feature')],
    policy: DEFAULT_POLICY,
  });

  assert.equal(baseline.primaryRoute, 'structured-feature');
  assert.ok(baseline.missingEvidence.includes('matching-outcomes'));
  assert.equal(learned.primaryRoute, 'yolo-feature');
  assert.deepEqual(learned.evidence, ['o1', 'o2', 'o3']);
  assert.ok(learned.confidence > baseline.confidence);
  assert.equal(learned.alternative, 'structured-feature');
});

test('unknown tasks use a low-confidence orchestrator fallback', () => {
  const result = recommendRoute({ profile: { stacks: [] }, task: { category: 'unknown' }, outcomes: [], policy: DEFAULT_POLICY });

  assert.equal(result.primaryRoute, 'master-orchestrator');
  assert.ok(result.confidence <= 0.4);
  assert.ok(result.missingEvidence.includes('known-task-category'));
});

test('learned preferences cannot bypass a denied safety action', () => {
  const policy = mergePolicies(DEFAULT_POLICY, { actions: { destructive: 'deny' } }, {}, {}).policy;
  const result = recommendRoute({
    profile,
    task: { category: 'feature', risk: 'destructive' },
    outcomes: [successful('o1', 'yolo-feature')],
    policy,
  });

  assert.equal(result.escalation.decision, 'deny');
  assert.equal(result.primaryRoute, 'master-orchestrator');
  assert.match(result.escalation.rationale, /denies destructive/);
});
