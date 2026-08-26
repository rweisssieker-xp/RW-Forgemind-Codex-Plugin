import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { activateArtifactStore, deactivateArtifactStore } from '../src/artifact-store.mjs';
import { getCommandMetrics, recordCommandOutcome } from '../src/command-metrics.mjs';

test('command metrics keep local success, retry, and duration evidence without raw prompts', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-metrics-'));
  await activateArtifactStore({ workspace });
  t.after(async () => { await deactivateArtifactStore(); await rm(workspace, { recursive: true, force: true }); });

  await recordCommandOutcome({ workspace, command: 'one', status: 'ready', durationMs: 50 });
  await recordCommandOutcome({ workspace, command: 'one', status: 'held', durationMs: 100 });
  const metrics = await getCommandMetrics({ workspace });

  assert.equal(metrics.totalRuns, 2);
  assert.equal(metrics.byCommand.one.successRate, 0.5);
  assert.equal(metrics.byCommand.one.averageDurationMs, 75);
  assert.equal(Object.hasOwn(metrics, 'goal'), false);
});
