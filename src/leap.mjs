import { readFile } from 'node:fs/promises';
import { writeJsonAtomic } from './io.mjs';
import { artifactStatePath } from './artifact-store.mjs';
import { resolveWorkspace } from './paths.mjs';
import { scanAppIntelligence } from './app-intelligence.mjs';
import { createCompletionContract } from './completion.mjs';
import { createOpportunityCase } from './experience-lab.mjs';
import { createInnovationPortfolio } from './innovation-portfolio.mjs';
import { createRadicalBlueprint, createRadicalPortfolio, createShadowModePlan } from './radical-product.mjs';
import { markdownTable, publishProjectDocument } from './project-documents.mjs';

const HARD_STOPS = ['secrets-or-credentials', 'production-access', 'data-deletion', 'irreversible-migration', 'external-spend', 'legal-or-compliance-commitment', 'high-stakes-decision'];

export async function runLeap({ workspace, goal, mode = 'yolo', autonomy = {} }) {
  const root = await resolveWorkspace(workspace);
  const outcome = String(goal ?? '').trim();
  if (!outcome) throw new Error('Leap requires --goal.');
  const selectedMode = ['yolo', 'guided'].includes(String(mode).toLowerCase()) ? String(mode).toLowerCase() : 'yolo';
  const [appIntelligence, innovation, radical, opportunity] = await Promise.all([
    scanAppIntelligence({ workspace: root }),
    createInnovationPortfolio({ workspace: root, goal: outcome }),
    createRadicalPortfolio({ workspace: root, goal: outcome }),
    createOpportunityCase({ workspace: root, goal: outcome }),
  ]);
  const [selected, contrarian] = radical.ideas.slice(0, 2);
  const commercialWedge = innovation.candidates[0] ?? null;
  const blueprint = await createRadicalBlueprint({ workspace: root, id: selected.id, selectionMode: 'leap-deterministic' });
  const shadowMode = await createShadowModePlan({ workspace: root });
  const mvpOutcome = `${selected.title}: ${selected.mvp}`;
  const completionContract = await createCompletionContract({ workspace: root, goal: mvpOutcome, acceptance: [
    `Implement one reversible MVP for ${selected.title} that replaces the selected workflow.`,
    `Measure the 10x hypothesis: ${selected.tenXHypothesis}`,
    `Preserve an explicit rollback or recovery path and stop on: ${selected.killCondition}`,
    'Run the smallest relevant functional, GUI, accessibility, and risk checks; record unavailable checks as gaps.',
  ] });
  const record = {
    schemaVersion: 1,
    status: 'ready-for-autonomous-delivery',
    generatedAt: new Date().toISOString(),
    goal: outcome,
    mode: selectedMode,
    hardStopBoundary: HARD_STOPS,
    autonomyPolicy: {
      continueWithoutRoutineQuestions: true,
      maxExternalSpend: finite(autonomy.maxExternalSpend, 0),
      productionAccess: Boolean(autonomy.productionAccess),
      requireFeatureFlag: autonomy.requireFeatureFlag !== false,
      implementationHandoff: '$forgemind-complete with bounded YOLO delivery',
      hardStopBoundary: HARD_STOPS,
    },
    appIntelligence,
    radicalOptions: radical.ideas,
    selectedBet: summarizeBet(selected),
    contrarianBet: summarizeBet(contrarian),
    commercialWedge: commercialWedge ? summarizeCommercialWedge(commercialWedge) : null,
    opportunity,
    businessCase: opportunity.businessCase,
    radicalBlueprint: blueprint,
    shadowMode,
    completionContract,
    testerPlan: { panels: ['target-user', 'functional', 'accessibility', 'adversarial'], successRule: '4 of 5 qualified target users complete the core task and no critical finding remains.', decision: 'collect-evidence-before-scale' },
    uxBaseline: { states: ['loading', 'empty', 'error', 'success', 'keyboard', 'narrow-viewport', 'recovery'], rule: 'Capture browser and accessibility evidence for changed decisive tasks before release.' },
    phases: [{ id: 'select', state: 'completed' }, { id: 'implement', state: 'ready' }, { id: 'verify', state: 'blocked-by-evidence' }, { id: 'release', state: 'blocked-by-evidence' }],
    nextAction: 'Continue autonomously with $forgemind-complete. Implement the selected reversible MVP, verify it, and report only at a hard stop or final handoff.',
    artifactPath: '.codex-orchestrator/leap/latest.json',
    errors: [],
  };
  const document = await publishProjectDocument({ workspace: root, name: 'leap-decision.md', title: 'Leap Decision', body: renderDecision(record) });
  if (document) record.projectDocuments = ['docs/forgemind/leap-decision.md'];
  await writeJsonAtomic(artifactStatePath(root, 'leap', 'latest.json'), record);
  return record;
}

export async function getLeapStatus({ workspace }) {
  const root = await resolveWorkspace(workspace);
  try { const record = JSON.parse(await readFile(artifactStatePath(root, 'leap', 'latest.json'), 'utf8')); return { schemaVersion: 1, status: 'passed', leap: record, nextAction: next(record), errors: [] }; }
  catch { return { schemaVersion: 1, status: 'missing', nextAction: 'Run leap run --goal "<outcome>" first.', errors: [] }; }
}

export async function continueLeap({ workspace }) {
  const state = await getLeapStatus({ workspace });
  if (state.status === 'missing') return state;
  return { ...state, status: 'ready-for-autonomous-delivery', nextAction: next(state.leap), handoff: '$forgemind-complete', errors: [] };
}

function summarizeBet(idea) {
  return { id: idea.id, title: idea.title, interactionReplaced: idea.interactionReplaced, tenXHypothesis: idea.tenXHypothesis, mvp: idea.mvp, moat: idea.moat, killCondition: idea.killCondition, evidenceBasis: idea.evidenceBasis, score: idea.score };
}

function summarizeCommercialWedge(candidate) {
  return { id: candidate.id, title: candidate.title, thesis: candidate.thesis, monetization: candidate.monetization, moat: candidate.moat, killCondition: candidate.killCondition, evidenceBasis: candidate.evidenceBasis, score: candidate.score };
}

function renderDecision(record) {
  const selected = record.selectedBet;
  return `## Goal\n\n${record.goal}\n\n## Selected disruptive bet\n\n- **${selected.title}** — ${selected.interactionReplaced}\n- 10x hypothesis: ${selected.tenXHypothesis}\n- MVP: ${selected.mvp}\n- Moat: ${selected.moat}\n- Kill condition: ${selected.killCondition}\n\n## Contrarian\n\n**${record.contrarianBet.title}** — retained as a credible alternative, not discarded as a false certainty.\n\n## Commercial wedge\n\n${record.commercialWedge ? `${record.commercialWedge.title}: ${record.commercialWedge.monetization}` : 'No commercial wedge available.'}\n\n## Market and business-case boundary\n\n- Market chance: ${record.opportunity.marketChance.total}/100 (${record.opportunity.marketChance.confidence})\n- Business case confidence: ${record.businessCase.confidence}\n- Do not treat assumptions as validated demand, willingness to pay, or ROI.\n\n## Five disruptive options\n\n${markdownTable(record.radicalOptions.map((idea) => ({ title: idea.title, score: idea.score.total, mvp: idea.mvp, killCondition: idea.killCondition })))}\n\n## Autonomous delivery policy\n\nContinue without routine questions. Stop only for: ${record.autonomyPolicy.hardStopBoundary.join(', ')}.`;
}
function finite(value, fallback) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback; }
function next(record) { return record.phases.find((phase) => phase.state === 'ready') ? 'Continue with $forgemind-complete and the selected reversible MVP.' : 'Collect tester, GUI, accessibility, and release evidence before scaling.'; }
