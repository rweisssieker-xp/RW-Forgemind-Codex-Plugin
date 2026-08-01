import { evaluateAction } from './policy.mjs';

const BASE_ROUTES = {
  bug: 'systematic-debugging',
  feature: 'structured-feature',
  innovation: 'innovation-first-autopilot',
  release: 'finish-branch',
  security: 'security-reviewer',
};

export function recommendRoute({ profile, task, outcomes = [], policy }) {
  const base = BASE_ROUTES[task.category] ?? 'master-orchestrator';
  const matching = outcomes.filter((outcome) =>
    outcome.taskCategory === task.category && stackMatch(profile.stacks ?? [], outcome.project?.stacks ?? []),
  );
  const scores = new Map([[base, 1]]);
  for (const outcome of matching) scores.set(outcome.route, (scores.get(outcome.route) ?? 0) + outcome.effectiveness);
  const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  let primaryRoute = ranked[0][0];
  let alternative = ranked.find(([route]) => route !== primaryRoute)?.[0] ?? (primaryRoute === base ? 'master-orchestrator' : base);
  const missingEvidence = [];
  if (!matching.length) missingEvidence.push('matching-outcomes');
  if (!BASE_ROUTES[task.category]) missingEvidence.push('known-task-category');
  const selectedEvidence = matching.filter((outcome) => outcome.route === primaryRoute).map((outcome) => outcome.id).sort();
  const margin = ranked[0][1] - (ranked[1]?.[1] ?? 0);
  let confidence = !BASE_ROUTES[task.category] ? 0.3 : matching.length ? Math.min(0.95, 0.55 + selectedEvidence.length * 0.1 + margin * 0.05) : 0.45;
  let escalation = { decision: 'none', source: null, rationale: 'No elevated task risk declared.' };
  if (task.risk) {
    escalation = evaluateAction(policy, { kind: task.risk, path: task.path });
    if (escalation.decision === 'deny') {
      alternative = primaryRoute;
      primaryRoute = 'master-orchestrator';
      confidence = 1;
    }
  }
  return {
    schemaVersion: 1,
    primaryRoute,
    confidence: Number(confidence.toFixed(2)),
    evidence: selectedEvidence,
    alternative,
    escalation,
    missingEvidence,
    rationale: selectedEvidence.length
      ? `${primaryRoute} has the strongest matching local outcome score.`
      : `${primaryRoute} is the safe base route for ${task.category ?? 'unknown'} tasks.`,
  };
}

function stackMatch(current, historical) {
  if (!current.length || !historical.length) return true;
  return current.some((stack) => historical.includes(stack));
}
