import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

test('Product OS creates a resumable action loop and evidence graph outside the project', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-product-os-'));
  try {
    const launch = await runCli(['product', 'launch', '--workspace', workspace, '--goal', 'eliminate manual handoffs', '--json'], context());
    assert.equal(launch.data.status, 'active');
    const action = await runCli(['product', 'action', '--workspace', workspace, '--title', 'Prototype outcome operator', '--metric', 'completion', '--owner', 'product', '--json'], context());
    const measured = await runCli(['product', 'measure', '--workspace', workspace, '--id', action.data.action.id, '--outcome', 'iterate', '--evidence', 'session-1', '--json'], context());
    assert.equal(measured.data.action.outcome, 'iterate');
    const graph = await runCli(['product', 'evidence', '--workspace', workspace, '--json'], context());
    assert.equal(graph.data.nodes.length, 1);
    assert.equal(graph.data.artifactMode, 'local');
    assert.match(graph.data.artifactPath, /[\\/]\.cache[\\/]forgemind[\\/]/);
  } finally { await rm(workspace, { recursive: true, force: true }); }
});

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }
