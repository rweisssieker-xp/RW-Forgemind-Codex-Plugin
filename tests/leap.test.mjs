import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

test('Leap creates a disruption-first, evidence-labelled MVP contract without project-local state', async () => {
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
    assert.equal(result.data.artifactMode, 'local');
    assert.match(result.data.artifactPath, /[\\/]\.cache[\\/]forgemind[\\/]/);
    await assert.rejects(access(path.join(workspace, '.codex-orchestrator')));
    assert.match(await readFile(path.join(workspace, 'docs', 'forgemind', 'leap-decision.md'), 'utf8'), /Leap Decision/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }
