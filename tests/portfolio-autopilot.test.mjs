import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverPortfolio, runPortfolio, stopCandidate } from '../src/portfolio-autopilot.mjs';

test('portfolio discovers complete evidence-labelled AI USP cards and schedules non-conflicting work within budget', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-portfolio-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  const portfolio = await discoverPortfolio({ workspace, goal: 'Remove manual triage', maxConcurrentCandidates: 3 });
  assert.ok(portfolio.candidates.length >= 10);
  for (const candidate of portfolio.candidates) for (const field of ['interactionReplaced', 'tenXHypothesis', 'aiCentrality', 'moat', 'targetUser', 'metric', 'guardrails', 'killCondition', 'rollback']) assert.ok(candidate[field]);
  const run = await runPortfolio({ workspace });
  assert.equal(run.activeCandidates.length, 3);
  const stopped = await stopCandidate({ workspace, id: portfolio.candidates.at(-1).id, reason: 'insufficient evidence' });
  assert.equal(stopped.candidate.state, 'stopped');
});
