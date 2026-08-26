import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createSaasOpportunityEngine } from '../src/saas-opportunity-engine.mjs';
import { importSignals } from '../src/signals.mjs';

test('SaaS opportunity engine creates disruptive AI-USP cards and bounded SaaS operating controls', async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-saas-opportunity-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ name: 'saas-app', scripts: { test: 'node --test' } }));
  const input = path.join(workspace, 'signals.json');
  await writeFile(input, JSON.stringify([{ problem: 'Teams manually reconstruct customer context before every renewal', severity: 5, frequency: 4 }]));
  await importSignals({ workspace, input, format: 'json' });

  const result = await createSaasOpportunityEngine({ workspace, goal: 'reduce renewal-risk research time' });

  assert.equal(result.status, 'passed');
  assert.equal(result.opportunityCards.length, 6);
  assert.equal(result.evidence.basis, 'imported-signals-plus-project-context');
  assert.ok(result.opportunityCards.every((card) => card.aiCentrality && card.interactionReplaced && card.moat && card.firstExperiment.featureFlag));
  assert.deepEqual(Object.keys(result.saasOperatingPlan).sort(), ['activationMap', 'churnRadar', 'featureToRevenueTrace', 'integrationHealth', 'pricingLab', 'releaseCohorts', 'tenantSafetyGate']);
  assert.match(result.saasOperatingPlan.tenantSafetyGate.rule, /Hold/);
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'saas-ai-opportunity-engine-latest.json'), 'utf8'));
  assert.equal(saved.goal, 'reduce renewal-risk research time');
});

test('SaaS opportunity engine labels missing customer signals as assumptions', async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-saas-assumption-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const result = await createSaasOpportunityEngine({ workspace });
  assert.equal(result.evidence.basis, 'project-context-assumption');
  assert.match(result.evidence.claimBoundary, /assumptions/);
});
