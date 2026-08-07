import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { autonomyReadiness, experimentAutopilot, observeWorkflow, operator, providerRegistry, refactorPortfolio, truthfulDemo, truthLoop } from '../src/ai-native-suite.mjs';

test('AI-native suite persists all eight bounded product operations without external calls', async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-ai-native-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  const events = path.join(workspace, 'events.json');
  await writeFile(events, JSON.stringify([{ workflow: 'approve' }, { workflow: 'approve' }, { workflow: 'approve' }]));
  assert.equal((await operator({ workspace, action: 'plan', goal: 'Approve invoices' })).status, 'passed');
  assert.equal((await operator({ workspace, action: 'authorize', approved: true })).status, 'approved');
  assert.equal((await observeWorkflow({ workspace, input: events })).candidates[0].recommendation, 'observe-for-elimination');
  assert.equal((await experimentAutopilot({ workspace, action: 'create', goal: 'Reduce approvals' })).status, 'draft');
  assert.equal((await providerRegistry({ workspace })).defaultPolicy.credentialsRead, false);
  assert.equal((await refactorPortfolio({ workspace })).candidates.length, 3);
  assert.equal((await truthLoop({ workspace, goal: 'Reduce approvals' })).evidence.state, 'assumption-only');
  assert.equal((await autonomyReadiness({ workspace })).allowedNow[0], 'observe');
  assert.equal((await truthfulDemo({ workspace, title: 'Proof' })).status, 'passed');
});
