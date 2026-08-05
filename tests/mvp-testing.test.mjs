import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createMvpTestPlan } from '../src/mvp-testing.mjs';

test('MVP test plan creates complementary tester panels and an evidence-gated decision', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-test-lab-'));
  const plan = await createMvpTestPlan({ workspace, goal: 'validate a faster invoice approval flow', audience: 'finance teams' });
  assert.equal(plan.status, 'planned');
  assert.deepEqual(plan.testerPanels.map((panel) => panel.id), ['target-user', 'functional', 'accessibility', 'adversarial']);
  assert.match(plan.killCondition, /Stop or rescope/);
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'mvp-test-plan-latest.json'), 'utf8'));
  assert.equal(saved.goal, plan.goal);
});
