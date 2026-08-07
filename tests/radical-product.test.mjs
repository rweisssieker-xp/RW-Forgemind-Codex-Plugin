import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createRadicalBlueprint, createRadicalPortfolio, createShadowModePlan, selectRadicalIdea } from '../src/radical-product.mjs';

test('Radical Product Engine creates five AI-central replacement bets and a build-ready guarded blueprint', async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-radical-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  const portfolio = await createRadicalPortfolio({ workspace, goal: 'eliminate manual approval follow-up' });
  assert.equal(portfolio.ideas.length, 5);
  assert.ok(portfolio.ideas.every((idea) => idea.aiCore && idea.tenXHypothesis && idea.killCondition && idea.moat));
  const selection = await selectRadicalIdea({ workspace, id: portfolio.ideas[0].id });
  const blueprint = await createRadicalBlueprint({ workspace });
  const shadow = await createShadowModePlan({ workspace });
  assert.equal(blueprint.idea.id, selection.selected.id);
  assert.match(blueprint.aiCore.decisionRule, /permission.*cost.*reversibility/i);
  assert.deepEqual(shadow.phases.map((phase) => phase.name), ['observe', 'suggest', 'approve', 'bounded-autopilot']);
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'radical-blueprint-latest.json'), 'utf8'));
  assert.equal(saved.status, 'passed');
});
