import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { advanceMvpLaunch, launchMvp } from '../src/mvp-launch.mjs';
import { recordMvpTestResult } from '../src/mvp-testing.mjs';

test('MVP launch creates linked discovery and tester artifacts with hard stops', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-mvp-launch-'));
  const launch = await launchMvp({ workspace, goal: 'shorten invoice approvals', audience: 'finance teams' });
  assert.equal(launch.status, 'active');
  assert.deepEqual(launch.stages.map((stage) => stage.id), ['discover', 'test', 'build', 'verify', 'release']);
  assert.match(launch.stopConditions.join(' '), /Verification fails/);
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'mvp-launch-latest.json'), 'utf8'));
  assert.equal(saved.goal, 'shorten invoice approvals');
});

test('MVP launch resumes in order and blocks an unresolved tester gate', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-mvp-gates-'));
  await launchMvp({ workspace, goal: 'shorten invoice approvals' });
  const discovered = await advanceMvpLaunch({ workspace, stage: 'discover' });
  assert.equal(discovered.currentStage, 'test');
  await assert.rejects(advanceMvpLaunch({ workspace, stage: 'test' }), /Collect five target-user sessions/);
  for (let index = 0; index < 5; index += 1) await recordMvpTestResult({ workspace, result: { panel: 'target-user', outcome: 'passed', completed: true, evidence: 'session' } });
  for (const panel of ['functional', 'accessibility', 'adversarial']) await recordMvpTestResult({ workspace, result: { panel, outcome: 'passed', completed: true, evidence: 'review' } });
  const tested = await advanceMvpLaunch({ workspace, stage: 'test' });
  const built = await advanceMvpLaunch({ workspace, stage: 'build', evidence: 'acceptance' });
  const verified = await advanceMvpLaunch({ workspace, stage: 'verify', evidence: 'passed' });
  const released = await advanceMvpLaunch({ workspace, stage: 'release', evidence: 'delivery-proof|rollback' });
  assert.equal(tested.currentStage, 'build');
  assert.equal(built.currentStage, 'verify');
  assert.equal(verified.currentStage, 'release');
  assert.equal(released.status, 'ready-for-decision');
});
