import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createApplicationTwin } from '../src/application-twin.mjs';
import { createGrowthLoop } from '../src/growth-loop.mjs';
import { createIntegrationMesh } from '../src/integration-mesh.mjs';
import { readOutcomeMemory, recordOutcomeMemory } from '../src/outcome-memory.mjs';
import { evaluateProductLab } from '../src/product-lab.mjs';
import { createUxEvolution } from '../src/ux-evolution.mjs';

test('application intelligence produces bounded, evidence-labelled records', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-application-intelligence-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await mkdir(path.join(workspace, 'pages'), { recursive: true });
  await writeFile(path.join(workspace, 'package.json'), '{"name":"sample","type":"module"}\n');
  await writeFile(path.join(workspace, 'pages', 'home.mjs'), 'export const home = true;\n');

  const twin = await createApplicationTwin({ workspace });
  assert.equal(twin.status, 'passed');
  assert.equal(twin.workflows.length, 1);
  assert.match(twin.claimBoundary, /not user, market, or production facts/i);

  const evolution = await createUxEvolution({ workspace });
  assert.equal(evolution.status, 'planned');
  assert.equal(evolution.rollback.required, true);
  assert.equal(evolution.replacement.preserveExistingFlow, true);

  const lab = await evaluateProductLab({ workspace, candidate: { id: 'candidate-1', title: 'Outcome flow' } });
  assert.deepEqual(lab.perspectives.map((item) => item.role), ['builder', 'target-user', 'security', 'sales', 'support', 'contrarian']);
  assert.equal(lab.adjustment.state, 'validate');

  await recordOutcomeMemory({ workspace, subject: 'mission-1', statement: 'Verified a reversible packet.', evidence: ['test'] });
  assert.equal((await readOutcomeMemory({ workspace })).length, 1);

  const growth = await createGrowthLoop({ workspace, goal: 'faster first value' });
  assert.deepEqual(growth.lanes.map((item) => item.id), ['activation', 'retention', 'monetization', 'value-proof']);
  assert.equal(growth.lanes[0].actionBoundary, 'draft-only');

  const mesh = await createIntegrationMesh({ workspace, integrations: [{ name: 'billing', mode: 'production-mutable', operations: ['charge'] }] });
  assert.equal(mesh.status, 'held');
  assert.equal(mesh.connectors[0].status, 'held');
});
