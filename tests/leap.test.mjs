import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

test('Leap creates a disruption-first, evidence-labelled MVP contract with project-local state', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-leap-'));
  try {
    const result = await runCli(['leap', 'run', '--workspace', workspace, '--goal', 'eliminate manual case triage', '--mode', 'yolo', '--json'], context());

    assert.equal(result.exitCode, 0);
    assert.equal(result.data.mode, 'yolo');
    assert.equal(result.data.radicalOptions.length, 5);
    assert.ok(result.data.selectedBet.id);
    assert.ok(result.data.contrarianBet.id);
    assert.notEqual(result.data.selectedBet.id, result.data.contrarianBet.id);
    assert.equal(result.data.opportunity.marketChance.confidence, 'assumption-led');
    assert.match(result.data.businessCase.confidence, /illustrative/);
    assert.match(result.data.selectedBet.killCondition, /./);
    assert.deepEqual(result.data.hardStopBoundary, ['secrets-or-credentials', 'production-access', 'data-deletion', 'irreversible-migration', 'external-spend', 'legal-or-compliance-commitment', 'high-stakes-decision']);
    assert.equal(result.data.completionContract.executionPolicy.continueByDefault, true);
    assert.equal(result.data.heroLoop.status, 'active');
    assert.equal(result.data.heroLoop.packets[0].state, 'ready');
    assert.equal(result.data.heroLoop.packets[0].id, 'implement-thin-slice');
    const resumed = await runCli(['leap', 'continue', '--workspace', workspace, '--json'], context());
    assert.equal(resumed.data.handoff, '$forgemind-ship');
    assert.equal(resumed.data.nextPacket.id, 'implement-thin-slice');
    const advanced = await runCli(['leap', 'advance', '--workspace', workspace, '--packet', 'implement-thin-slice', '--outcome', 'passed', '--evidence', 'unit-test|manual-review', '--json'], context());
    assert.equal(advanced.data.heroLoop.packets[0].state, 'completed');
    assert.equal(advanced.data.nextPacket.id, 'functional-proof');
    assert.equal(result.data.artifactMode, 'workspace');
    assert.ok(result.data.artifactPath.startsWith(path.join(workspace, '.codex-orchestrator')));
    await access(path.join(workspace, '.codex-orchestrator'));
    assert.match(await readFile(path.join(workspace, 'docs', 'forgemind', 'leap-decision.md'), 'utf8'), /Leap Decision/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('Leap Hero Loop retries a failed packet without inventing proof', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-leap-recovery-'));
  try {
    await runCli(['leap', 'run', '--workspace', workspace, '--goal', 'improve a workflow', '--json'], context());
    const failed = await runCli(['leap', 'advance', '--workspace', workspace, '--packet', 'implement-thin-slice', '--outcome', 'failed', '--evidence', 'failing-test', '--json'], context());
    assert.equal(failed.data.heroLoop.packets[0].state, 'ready');
    assert.equal(failed.data.heroLoop.packets[0].attempts, 1);
    assert.match(failed.data.nextAction, /repair/i);
    const missingEvidence = await runCli(['leap', 'advance', '--workspace', workspace, '--packet', 'implement-thin-slice', '--outcome', 'passed', '--json'], context());
    assert.equal(missingEvidence.exitCode, 2);
  } finally { await rm(workspace, { recursive: true, force: true }); }
});

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }
