import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }

test('Hero Control connects mission, experiment, release, integrations, and benchmark without external side effects', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-hero-control-'));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ name: 'merchant-flow', scripts: { test: 'node --test' }, dependencies: { stripe: '^17.0.0' } }));
  await writeFile(path.join(workspace, 'README.md'), 'Self-serve merchant checkout product.');
  await writeFile(path.join(workspace, 'forgemind.config.json'), JSON.stringify({ hero: { connectors: [{ id: 'posthog', type: 'telemetry', mode: 'manual-import' }] } }));
  t.after(() => rm(workspace, { recursive: true, force: true }));

  await runCli(['leap', 'run', '--workspace', workspace, '--goal', 'reduce checkout setup effort', '--json'], context());
  const result = await runCli(['hero', 'run', '--workspace', workspace, '--json'], context());

  assert.equal(result.exitCode, 0);
  assert.equal(result.data.status, 'ready');
  assert.equal(result.data.mission.nextPacket.id, 'implement-thin-slice');
  assert.equal(result.data.experiment.featureFlag.startsWith('fm-'), true);
  assert.equal(result.data.integrations[0].mode, 'manual-import');
  assert.equal(result.data.release.action, 'run-readiness-before-release');
  assert.equal(result.data.benchmark.observedUsage, 'missing');
  assert.equal(result.data.experience.qualityGate.status, 'planned');
  assert.equal(result.data.experience.multimodalIntake.enabled, true);
  assert.equal(result.data.experience.counterfactuals.length, 2);
  assert.match(result.data.claimBoundary, /does not deploy/i);
  const dryRun = await runCli(['hero', 'execute', '--workspace', workspace, '--json'], context());
  assert.equal(dryRun.data.status, 'dry-run');
});
