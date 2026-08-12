import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

const context = () => ({ stdout: { write() {} }, stderr: { write() {} } });

test('Autopilot persists a goal mission, advances inspection, and safely holds pending adapter work', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-autopilot-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const started = await runCli(['autopilot', 'start', '--workspace', workspace, '--goal', 'Ship a safer release', '--json'], context());
  assert.equal(started.exitCode, 0);
  assert.equal(started.data.mission.goal, 'Ship a safer release');
  assert.equal(started.data.mission.packets[0].state, 'ready');
  const inspected = await runCli(['autopilot', 'run', '--workspace', workspace, '--json'], context());
  assert.equal(inspected.data.mission.packets[0].state, 'verified');
  assert.equal(inspected.data.nextPacket.id, 'implement');
  const held = await runCli(['autopilot', 'run', '--workspace', workspace, '--json'], context());
  assert.equal(held.exitCode, 1);
  assert.equal(held.data.mission.state, 'held');
  const resumed = await runCli(['autopilot', 'resume', '--workspace', workspace, '--json'], context());
  assert.equal(resumed.data.status, 'ready');
});
