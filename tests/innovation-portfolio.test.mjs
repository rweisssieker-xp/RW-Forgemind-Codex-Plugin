import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createInnovationPortfolio } from '../src/innovation-portfolio.mjs';
import { importSignals } from '../src/signals.mjs';

test('innovation portfolio turns a project and its signals into ranked, testable product bets', async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-innovation-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  const input = path.join(workspace, 'signals.json');
  await writeFile(input, JSON.stringify([{ problem: 'Approvals require too much manual follow-up', severity: 5, frequency: 4 }]));
  await importSignals({ workspace, input, format: 'json' });
  const portfolio = await createInnovationPortfolio({ workspace, goal: 'shorten approval cycles' });
  assert.equal(portfolio.status, 'passed');
  assert.equal(portfolio.candidates.length, 10);
  assert.equal(portfolio.evidence.basis, 'external-signal-ids');
  assert.deepEqual(Object.keys(portfolio.candidates[0].score).sort(), ['differentiation', 'evidenceStrength', 'feasibility', 'monetization', 'timeToMvp', 'total', 'trustFit', 'userValue']);
  assert.ok(portfolio.candidates.every((candidate) => candidate.moat && candidate.monetization && candidate.killCondition && candidate.experiment));
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'innovation-portfolio-latest.json'), 'utf8'));
  assert.equal(saved.goal, 'shorten approval cycles');
});

test('innovation portfolio labels a no-signal result as an assumption instead of market evidence', async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-innovation-empty-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const portfolio = await createInnovationPortfolio({ workspace });
  assert.equal(portfolio.evidence.basis, 'project-profile-assumption');
  assert.match(portfolio.evidence.note, /not market evidence/);
  assert.ok(portfolio.candidates.every((candidate) => candidate.recommendation === 'validate-first'));
});
