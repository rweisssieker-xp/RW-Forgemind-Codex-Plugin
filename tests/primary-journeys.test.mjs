import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }

test('the primary journeys produce decision-ready, evidence-labelled outputs', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-primary-'));
  try {
    for (const [command, action] of [['spark', 'run'], ['evolve', 'run'], ['venture', 'run'], ['council', 'decide'], ['portfolio', 'plan'], ['showcase', 'create'], ['ship', 'plan']]) {
      const result = await runCli([command, action, '--workspace', workspace, '--goal', 'eliminate manual case triage', '--json'], context());
      assert.equal(result.exitCode, 0, `${command} should complete`);
      assert.equal(result.data.status, 'passed');
      assert.equal(result.data.artifactMode, 'workspace');
      assert.ok(result.data.artifactPath.startsWith(path.join(workspace, '.codex-orchestrator')));
      assert.ok(result.data.projectProfile, `${command} should use the shared project profile`);
      assert.ok(result.data.foundation?.foundationId, `${command} should link the canonical Foundation chain`);
    }
    const venture = await runCli(['venture', 'run', '--workspace', workspace, '--goal', 'case triage', '--json'], context());
    assert.match(venture.data.claimBoundary, /not market facts/i);
    const council = await runCli(['council', 'decide', '--workspace', workspace, '--goal', 'case triage', '--json'], context());
    assert.equal(council.data.perspectives.length, 5);
    const ship = await runCli(['ship', 'plan', '--workspace', workspace, '--goal', 'Add authenticated API synchronization to dashboard', '--json'], context());
    assert.equal(ship.data.foundation.scope, 'foundation-required');
    assert.ok(ship.data.foundation.nextStory);
    await readFile(path.join(workspace, 'docs', 'forgemind', 'venture-case.md'), 'utf8');
    await readFile(path.join(workspace, 'docs', 'forgemind', 'council-decision.md'), 'utf8');
  } finally { await rm(workspace, { recursive: true, force: true }); }
});

test('primary journeys derive a documented zero-input default instead of rejecting an empty goal', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-zero-input-'));
  try {
    for (const [command, action] of [['spark', 'run'], ['evolve', 'run'], ['venture', 'run'], ['council', 'decide'], ['portfolio', 'plan'], ['showcase', 'create'], ['ship', 'plan'], ['leap', 'run']]) {
      const result = await runCli([command, action, '--workspace', workspace, '--json'], context());
      assert.equal(result.exitCode, 0, `${command} should derive a default goal`);
      assert.equal(result.data.goalSource, 'zero-input-default');
      assert.match(result.data.goal, /./);
    }
  } finally { await rm(workspace, { recursive: true, force: true }); }
});
