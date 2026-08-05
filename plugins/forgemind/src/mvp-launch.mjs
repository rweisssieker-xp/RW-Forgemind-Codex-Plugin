import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { createIdeaToMvpBrief } from './idea-to-mvp.mjs';
import { writeJsonAtomic } from './io.mjs';
import { createMvpTestPlan } from './mvp-testing.mjs';
import { assertContained } from './paths.mjs';

export async function launchMvp({ workspace, goal, audience }) {
  const outcome = String(goal ?? '').trim();
  if (!outcome) throw new ForgeMindError('FM_MVP_LAUNCH_INVALID', 'MVP launch requires a goal.');
  const brief = await createIdeaToMvpBrief({ workspace, goal: outcome });
  const testPlan = await createMvpTestPlan({ workspace, goal: outcome, audience });
  const launch = {
    schemaVersion: 1,
    status: 'active',
    generatedAt: new Date().toISOString(),
    goal: outcome,
    audience: testPlan.audience,
    artifacts: {
      ideaToMvp: '.codex-orchestrator/product/idea-to-mvp-latest.json',
      testPlan: '.codex-orchestrator/product/mvp-test-plan-latest.json',
    },
    stages: [
      { id: 'discover', workflow: 'idea-to-mvp', gate: 'One evidence-labeled MVP hypothesis, metric, and kill condition.' },
      { id: 'test', workflow: 'mvp-test-lab', gate: 'Tester plan exists; critical findings must be resolved before release.' },
      { id: 'build', workflow: 'delivery-builder', gate: 'Scoped implementation meets acceptance criteria.' },
      { id: 'verify', workflow: 'quality-review', gate: 'Verification passes and residual risks are explicit.' },
      { id: 'release', workflow: 'release-readiness-score', gate: 'Delivery proof and rollback evidence support Go/No-Go.' },
    ],
    stopConditions: [testPlan.killCondition, 'Critical tester finding remains unresolved.', 'Verification fails.', 'A safety policy requires approval.'],
    errors: [],
  };
  await writeJsonAtomic(assertContained(workspace, path.join(workspace, '.codex-orchestrator', 'product', 'mvp-launch-latest.json')), launch);
  return launch;
}
