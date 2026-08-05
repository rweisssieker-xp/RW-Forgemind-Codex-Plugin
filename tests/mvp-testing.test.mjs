import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createMvpTestPlan, recordMvpTestResult } from '../src/mvp-testing.mjs';

test('MVP test plan creates complementary tester panels and an evidence-gated decision', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-test-lab-'));
  const plan = await createMvpTestPlan({ workspace, goal: 'validate a faster invoice approval flow', audience: 'finance teams' });
  assert.equal(plan.status, 'planned');
  assert.deepEqual(plan.testerPanels.map((panel) => panel.id), ['target-user', 'functional', 'accessibility', 'adversarial']);
  assert.match(plan.killCondition, /Stop or rescope/);
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'mvp-test-plan-latest.json'), 'utf8'));
  assert.equal(saved.goal, plan.goal);
});

test('tester results automatically decide scale, iterate, or stop', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-test-results-'));
  await createMvpTestPlan({ workspace, goal: 'validate an approval flow' });
  for (let index = 0; index < 5; index += 1) await recordMvpTestResult({ workspace, result: { panel: 'target-user', outcome: 'passed', completed: true, evidence: 'session' } });
  for (const panel of ['functional', 'accessibility', 'adversarial']) await recordMvpTestResult({ workspace, result: { panel, outcome: 'passed', completed: true, evidence: 'review' } });
  const decision = await recordMvpTestResult({ workspace, result: { panel: 'functional', outcome: 'blocked', completed: false, critical: true, evidence: 'critical defect' } });
  assert.equal(decision.decision, 'stop');
  assert.equal(decision.criticalFindings, 1);
});
