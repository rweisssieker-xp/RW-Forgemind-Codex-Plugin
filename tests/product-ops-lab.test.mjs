import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createFinancialModel, createPortfolioCockpit, planUiTesting, recordPerceptualComparison, recordResearch, recordTelemetry, runDiscoveryLoop, runUiTest, stageTestRepair } from '../src/product-ops-lab.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgemind-product-ops-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  return root;
}

test('Product Ops Lab keeps cited research, financial scenarios, telemetry, and discovery evidence separate', async (t) => {
  const root = await workspace(t);
  const research = path.join(root, 'research.json');
  const telemetry = path.join(root, 'telemetry.json');
  await writeFile(research, JSON.stringify([{ title: 'Interview synthesis', url: 'https://example.test/interviews', claim: 'Approvals are a recurring delay', confidence: 0.8 }]));
  await writeFile(telemetry, JSON.stringify([{ name: 'approval_started', user: 'u1' }, { name: 'approval_completed', user: 'u1' }]));
  const imported = await recordResearch({ workspace: root, input: research });
  assert.equal(imported.records.length, 1);
  const financial = await createFinancialModel({ workspace: root, options: { price: 100, 'new-customers': 20, cac: 100, 'build-cost': 1000, 'monthly-cost': 20 } });
  assert.deepEqual(financial.scenarios.map((item) => item.name), ['conservative', 'base', 'upside']);
  const events = await recordTelemetry({ workspace: root, input: telemetry });
  assert.equal(events.metrics.uniqueKnownUsers, 1);
  const loop = await runDiscoveryLoop({ workspace: root, goal: 'reduce approval delay' });
  assert.equal(loop.inputs.citedResearch, 1);
  const cockpit = await createPortfolioCockpit({ workspace: root });
  assert.ok(['prioritize', 'validate', 'park'].includes(cockpit.band));
});

test('Product Ops Lab plans executable UI evidence and leaves visual repair under review', async (t) => {
  const root = await workspace(t);
  const plan = await planUiTesting({ workspace: root, url: 'http://localhost:3000' });
  assert.ok(plan.tools.some((item) => item.layer === 'perceptual-visual-regression'));
  const report = path.join(root, 'visual.json');
  await writeFile(report, JSON.stringify({ method: 'ssim', differenceRatio: 0.01, baseline: 'a.png', candidate: 'b.png' }));
  const comparison = await recordPerceptualComparison({ workspace: root, input: report, threshold: 0.02 });
  assert.equal(comparison.status, 'passed');
  const repair = await stageTestRepair({ workspace: root, failure: 'login CTA renamed', replacement: "getByRole('button', { name: 'Sign in' })" });
  assert.equal(repair.status, 'review-required');
  assert.equal(repair.mode, 'staged-no-source-write');
});

test('UI test runner executes only a declared package script', async (t) => {
  const root = await workspace(t);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { smoke: "node -e \"console.log('safe')\"" } }));

  const result = await runUiTest({ workspace: root, command: 'smoke' });

  assert.equal(result.status, 'passed');
  assert.equal(result.command, 'npm run smoke');
  assert.equal(result.script, 'smoke');
  await assert.rejects(
    () => runUiTest({ workspace: root, command: 'smoke; Remove-Item -Force important-file' }),
    (error) => error.code === 'FM_UI_TEST_SCRIPT_INVALID',
  );
});
