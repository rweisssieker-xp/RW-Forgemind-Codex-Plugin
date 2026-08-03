import { evaluateAction } from './policy.mjs';

const BASE_ROUTES = {
  bug: 'systematic-debugging',
  feature: 'structured-feature',
  innovation: 'innovation-first-autopilot',
  release: 'finish-branch',
  security: 'security-reviewer',
};

const ROUTE_TOKEN_COST = {
  'master-orchestrator': 850,
  'structured-feature': 500,
  'systematic-debugging': 450,
  'innovation-first-autopilot': 700,
  'finish-branch': 420,
  'security-reviewer': 380,
  'skill-router': 180,
};

export function recommendRoute({ profile, task, outcomes = [], policy, routing = {} }) {
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
  const maxSkillTokens = routing.maxSkillTokens ?? 800;
  const selectedCost = ROUTE_TOKEN_COST[primaryRoute] ?? 650;
  const alternativeCost = ROUTE_TOKEN_COST[alternative] ?? 650;
  const budget = { maxSkillTokens, selectedCost, decision: 'within-budget', fallback: null };
  if (escalation.decision !== 'deny' && selectedCost > maxSkillTokens && alternativeCost <= maxSkillTokens) {
    const previous = primaryRoute;
    primaryRoute = alternative;
    alternative = previous;
    budget.decision = 'fallback';
    budget.fallback = previous;
    confidence = Math.min(confidence, 0.7);
  } else if (escalation.decision !== 'deny' && selectedCost > maxSkillTokens) {
    budget.decision = 'escalate';
    budget.fallback = 'skill-router';
  }
  return {
    schemaVersion: 1,
    primaryRoute,
    confidence: Number(confidence.toFixed(2)),
    evidence: selectedEvidence,
    alternative,
    escalation,
    budget,
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
