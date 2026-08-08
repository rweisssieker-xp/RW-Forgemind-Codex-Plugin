import assert from 'node:assert/strict';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

test('Radical defaults to a stable external artifact root and none leaves the project clean', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-artifact-policy-'));
  try {
    const first = await runCli(['radical', 'analyze', '--workspace', workspace], { stdout: sink(), stderr: sink() });
    const second = await runCli(['radical', 'analyze', '--workspace', workspace], { stdout: sink(), stderr: sink() });
    assert.equal(first.data.artifactMode, 'local');
    assert.equal(first.data.artifactPath, second.data.artifactPath);
    assert.match(first.data.artifactPath, /[\\/]\.cache[\\/]forgemind[\\/]workspaces[\\/]/);
    await assert.rejects(access(path.join(workspace, '.codex-orchestrator')));

    const completion = await runCli(['complete', '--workspace', workspace, '--goal', 'keep every generated artifact external'], { stdout: sink(), stderr: sink() });
    assert.equal(completion.data.artifactMode, 'local');
    await assert.rejects(access(path.join(workspace, '.codex-orchestrator')));

    const ephemeral = await runCli(['radical', 'analyze', '--workspace', workspace, '--artifacts', 'none'], { stdout: sink(), stderr: sink() });
    assert.equal(ephemeral.data.artifactMode, 'none');
    assert.equal(ephemeral.data.artifactPath, null);
    await assert.rejects(access(path.join(workspace, '.codex-orchestrator')));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

function sink() { return { write() {} }; }
