import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { analyzeGenome, recommendFromGenome } from '../src/forge/genome.mjs';
import { runTournament } from '../src/forge/tournament.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-genome-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function outcome(id, route, overrides = {}) {
  return {
    id,
    taskCategory: 'feature',
    route,
    project: { stacks: ['node'], packageManager: 'npm' },
    durationMinutes: 30,
    verificationStatus: 'passed',
    correctionCount: 0,
    userAccepted: true,
    residualDefects: 0,
    ...overrides,
  };
}

test('engineering genome aggregates transparent cohorts and recommends the empirically strongest route', async (t) => {
  const root = await workspace(t);
  const outcomes = [
    outcome('o1', 'structured-feature'),
    outcome('o2', 'structured-feature'),
    outcome('o3', 'master-orchestrator', { correctionCount: 3, residualDefects: 1, userAccepted: false, durationMinutes: 90 }),
    outcome('o4', 'master-orchestrator', { verificationStatus: 'failed', durationMinutes: 80 }),
  ];
  const genome = await analyzeGenome({ workspace: root, outcomes, minCohort: 2, now: new Date('2026-01-01T00:00:00Z') });
  assert.equal(genome.status, 'analyzed');
  assert.equal(genome.record.cohorts.length, 2);
  assert.ok(genome.record.cohorts.every((cohort) => cohort.outcomeIds.length === cohort.sampleSize));
  const recommendation = await recommendFromGenome({ genome: genome.record, task: { category: 'feature', stacks: ['node'] } });
  assert.equal(recommendation.route, 'structured-feature');
  assert.equal(recommendation.sampleSize, 2);
  assert.ok(recommendation.evidence.includes('o1'));
  assert.match(recommendation.rationale, /success rate/i);
});

test('genome withholds recommendations below minimum cohort and reports missing evidence', async (t) => {
  const root = await workspace(t);
  const genome = await analyzeGenome({ workspace: root, outcomes: [outcome('single', 'structured-feature')], minCohort: 3 });
  const recommendation = await recommendFromGenome({ genome: genome.record, task: { category: 'feature', stacks: ['node'] } });
  assert.equal(recommendation.status, 'insufficient-evidence');
  assert.equal(recommendation.route, 'master-orchestrator');
  assert.match(recommendation.missingEvidence[0], /minimum cohort/i);
});

test('future tournament disqualifies unsafe candidates before weighted scoring and returns a deterministic Pareto frontier', async (t) => {
  const root = await workspace(t);
  const result = await runTournament({ workspace: root, input: {
    name: 'Support automation futures',
    minimumAcceptance: 80,
    budgets: { maxCostUnits: 20, maxDurationMinutes: 120 },
    candidates: [
      { id: 'flashy', outcomeScore: 99, acceptancePercent: 100, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: ['production write'], risk: 'low', complexity: 2, costUnits: 5, durationMinutes: 30 },
      { id: 'safe', outcomeScore: 88, acceptancePercent: 96, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: [], risk: 'low', complexity: 3, costUnits: 8, durationMinutes: 45 },
      { id: 'cheap', outcomeScore: 72, acceptancePercent: 90, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: [], risk: 'medium', complexity: 2, costUnits: 2, durationMinutes: 20 },
      { id: 'unverified', outcomeScore: 95, acceptancePercent: 95, verificationStatus: 'missing', proofStatus: 'missing', policyViolations: [], risk: 'low', complexity: 1, costUnits: 3, durationMinutes: 15 }
    ]
  }, now: new Date('2026-01-01T00:00:00Z') });

  assert.equal(result.status, 'selected');
  assert.equal(result.winner.id, 'safe');
  assert.equal(result.candidates.find((candidate) => candidate.id === 'flashy').status, 'disqualified');
  assert.equal(result.candidates.find((candidate) => candidate.id === 'unverified').status, 'disqualified');
  assert.deepEqual(result.paretoFrontier.map((candidate) => candidate.id).sort(), ['cheap', 'safe']);
  assert.match(result.rationale, /hard gates/i);
});

test('future tournament preserves a tie instead of inventing certainty', async (t) => {
  const root = await workspace(t);
  const candidate = { outcomeScore: 80, acceptancePercent: 90, verificationStatus: 'passed', proofStatus: 'valid', policyViolations: [], risk: 'low', complexity: 3, costUnits: 5, durationMinutes: 20 };
  const result = await runTournament({ workspace: root, input: {
    name: 'Tied futures',
    minimumAcceptance: 80,
    budgets: { maxCostUnits: 10, maxDurationMinutes: 60 },
    candidates: [{ id: 'alpha', ...candidate }, { id: 'beta', ...candidate }],
  } });
  assert.equal(result.status, 'tie');
  assert.equal(result.winner, null);
  assert.deepEqual(result.tiedCandidates, ['alpha', 'beta']);
});
