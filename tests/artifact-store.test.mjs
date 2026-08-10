import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

test('Radical defaults to a stable project-local artifact root and none leaves the project clean', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-artifact-policy-'));
  try {
    const first = await runCli(['radical', 'analyze', '--workspace', workspace], { stdout: sink(), stderr: sink() });
    const second = await runCli(['radical', 'analyze', '--workspace', workspace], { stdout: sink(), stderr: sink() });
    assert.equal(first.data.artifactMode, 'workspace');
    assert.equal(first.data.artifactPath, second.data.artifactPath);
    assert.ok(first.data.artifactPath.startsWith(path.join(workspace, '.codex-orchestrator')));
    await access(path.join(workspace, '.codex-orchestrator'));

    const completion = await runCli(['complete', '--workspace', workspace, '--goal', 'keep every generated artifact external'], { stdout: sink(), stderr: sink() });
    assert.equal(completion.data.artifactMode, 'workspace');
    await access(path.join(workspace, '.codex-orchestrator'));

    const ephemeral = await runCli(['radical', 'analyze', '--workspace', workspace, '--artifacts', 'none'], { stdout: sink(), stderr: sink() });
    assert.equal(ephemeral.data.artifactMode, 'none');
    assert.equal(ephemeral.data.artifactPath, null);
    await access(path.join(workspace, '.codex-orchestrator'));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('decision records and generated state stay in the app project by default', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-decision-documents-'));
  try {
    const context = { stdout: sink(), stderr: sink() };
    const market = await runCli(['experience', 'market-case', '--workspace', workspace, '--goal', 'reduce handoff time'], context);
    const finance = await runCli(['finance', '--workspace', workspace], context);
    const product = await runCli(['product', 'scan', '--workspace', workspace, '--goal', 'eliminate manual handoffs'], context);

    assert.deepEqual(market.data.projectDocuments, ['docs/forgemind/market-opportunity.md']);
    assert.deepEqual(finance.data.projectDocuments, ['docs/forgemind/financial-model.md']);
    assert.deepEqual(product.data.projectDocuments, ['docs/forgemind/product-bet.md']);
    assert.match(await readFile(path.join(workspace, 'docs', 'forgemind', 'market-opportunity.md'), 'utf8'), /Market chance/);
    assert.match(await readFile(path.join(workspace, 'docs', 'forgemind', 'financial-model.md'), 'utf8'), /Scenarios/);
    assert.match(await readFile(path.join(workspace, 'docs', 'forgemind', 'product-bet.md'), 'utf8'), /Recommended bet/);
    await access(path.join(workspace, '.codex-orchestrator'));

    const oneShot = await runCli(['finance', '--workspace', workspace, '--artifacts', 'none'], context);
    assert.deepEqual(oneShot.data.projectDocuments, []);
    await access(path.join(workspace, '.codex-orchestrator'));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

function sink() { return { write() {} }; }
