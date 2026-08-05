import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { launchMvp } from '../src/mvp-launch.mjs';

test('MVP launch creates linked discovery and tester artifacts with hard stops', async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'forgemind-mvp-launch-'));
  const launch = await launchMvp({ workspace, goal: 'shorten invoice approvals', audience: 'finance teams' });
  assert.equal(launch.status, 'active');
  assert.deepEqual(launch.stages.map((stage) => stage.id), ['discover', 'test', 'build', 'verify', 'release']);
  assert.match(launch.stopConditions.join(' '), /Verification fails/);
  const saved = JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'mvp-launch-latest.json'), 'utf8'));
  assert.equal(saved.goal, 'shorten invoice approvals');
});
