import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { writeJsonAtomic } from './io.mjs';
import { assertContained } from './paths.mjs';

const TESTERS = [
  { id: 'target-user', purpose: 'Desirability', prompt: 'Can the intended user complete the core job without coaching?', evidence: ['task completion', 'observed friction', 'verbatim feedback'] },
  { id: 'functional', purpose: 'Reliability', prompt: 'Does the change meet acceptance criteria, including realistic edge cases?', evidence: ['acceptance results', 'defects', 'reproduction steps'] },
  { id: 'accessibility', purpose: 'Inclusion', prompt: 'Can keyboard, assistive-technology, and reduced-motion users complete the task?', evidence: ['keyboard path', 'semantics review', 'contrast or motion findings'] },
  { id: 'adversarial', purpose: 'Trust', prompt: 'What misuse, confusing promise, unsafe default, or broken boundary could harm adoption?', evidence: ['misuse scenario', 'risk rating', 'mitigation or stop reason'] },
];

export async function createMvpTestPlan({ workspace, goal, audience = 'target users' }) {
  const outcome = String(goal ?? '').trim();
  if (!outcome) throw new ForgeMindError('FM_TEST_PLAN_INVALID', 'MVP test planning requires a goal.');
  const plan = {
    schemaVersion: 1,
    status: 'planned',
    generatedAt: new Date().toISOString(),
    goal: outcome,
    audience: String(audience),
    hypothesis: `For ${String(audience)}, ${outcome} solves a meaningful task better than the current alternative.`,
    testTask: 'Complete the smallest end-to-end task without coaching.',
    successMetric: 'At least 4 of 5 target-user sessions complete the task independently and no critical functional, accessibility, or trust finding remains.',
    killCondition: 'Stop or rescope when fewer than 2 of 5 target-user sessions complete the task independently, or a critical safety or trust finding remains unresolved.',
    testerPanels: TESTERS,
    decisionRules: { scale: 'Success metric met and no critical finding.', iterate: 'Mixed signal with a specific, reversible improvement.', stop: 'Kill condition met or problem evidence is weak.' },
    evidenceRules: ['Label simulated feedback as simulated.', 'Do not store names, contact details, raw recordings, or credentials.', 'Keep observed evidence separate from assumptions.'],
    handoffs: ['acceptance-criteria-builder', 'visual-qa', 'discovery-operations', 'user-feedback-capture'],
    errors: [],
  };
  await writeJsonAtomic(assertContained(workspace, path.join(workspace, '.codex-orchestrator', 'product', 'mvp-test-plan-latest.json')), plan);
  return plan;
}
