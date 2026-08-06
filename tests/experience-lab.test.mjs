import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createExperienceCanvas, createOpportunityCase, createTrustworthyDemo, detectDesignDrift, proposeTestRepair, recordExperienceEvidence } from '../src/experience-lab.mjs';
import { importSignals } from '../src/signals.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgemind-experience-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  return root;
}

test('Experience Lab combines market chance, business case, UX forecast, and a safe counterfactual selection', async (t) => {
  const root = await workspace(t);
  const input = path.join(root, 'signals.json');
  await writeFile(input, JSON.stringify([{ problem: 'Approvals are slow and manual', severity: 5, frequency: 4 }]));
  await importSignals({ workspace: root, input, format: 'json' });

  const canvas = await createExperienceCanvas({ workspace: root, goal: 'shorten approval time', options: { 'market-size': 500, penetration: 5, price: 100, 'build-cost': 10000, 'monthly-cost': 500, 'baseline-seconds': 600, 'target-seconds': 240 } });
  assert.equal(canvas.status, 'passed');
  assert.equal(canvas.opportunity.marketChance.confidence, 'signal-informed');
  assert.ok(canvas.opportunity.businessCase.annualRevenue > 0);
  assert.equal(canvas.counterfactualTournament.candidates.length, 3);
  assert.ok(canvas.counterfactualTournament.selected.score.deliveryRisk <= 65);
  assert.equal(canvas.taskTimeOptimizer.targetReductionPercent, 60);
  assert.equal(JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'experience', 'canvas-latest.json'), 'utf8')).task, 'shorten approval time');
});

test('Experience Lab keeps market assumptions honest and records GUI evidence, drift, repair, and demo boundaries', async (t) => {
  const root = await workspace(t);
  const market = await createOpportunityCase({ workspace: root, goal: 'improve onboarding' });
  assert.equal(market.evidence.basis, 'project-profile-assumptions');
  assert.equal(market.businessCase.confidence, 'illustrative-until-validated');

  const evidence = await recordExperienceEvidence({ workspace: root, task: 'complete onboarding', states: 'loading|error|success|keyboard', layers: 'semantic-accessibility|browser-critical-flow', viewport: '390x844' });
  assert.equal(evidence.stateMatrix.length, 4);
  assert.equal(evidence.viewport, '390x844');
  const baseline = path.join(root, 'baseline.json');
  const candidate = path.join(root, 'candidate.json');
  await writeFile(baseline, JSON.stringify({ components: ['Button'], tokens: ['space-2'], copy: ['Save'] }));
  await writeFile(candidate, JSON.stringify({ components: ['Button', 'Dialog'], tokens: ['space-3'], copy: ['Save'] }));
  const drift = await detectDesignDrift({ workspace: root, baseline, candidate });
  assert.equal(drift.status, 'review-required');
  assert.deepEqual(drift.drift.find((item) => item.dimension === 'components').added, ['Dialog']);
  const repair = await proposeTestRepair({ workspace: root, failure: 'button selector changed', selector: '.primary' });
  assert.equal(repair.status, 'review-required');
  assert.equal(repair.proposal.autoApply, false);
  const demo = await createTrustworthyDemo({ workspace: root, title: 'Onboarding proof' });
  assert.equal(demo.storyboard.length, 4);
  assert.match(demo.storyboard[2].claim, /semantic-accessibility/);
});
