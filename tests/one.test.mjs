import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { activateArtifactStore, deactivateArtifactStore } from '../src/artifact-store.mjs';
import { getForgeMindStatus, runForgeMindOne } from '../src/one.mjs';

test('ForgeMind One creates one linked foundation and autonomous delivery mission for an implementation outcome', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-one-'));
  await activateArtifactStore({ workspace });
  t.after(async () => { await deactivateArtifactStore(); await rm(workspace, { recursive: true, force: true }); });

  const result = await runForgeMindOne({ workspace, goal: 'Build a CRM for our sales team' });

  assert.equal(result.status, 'ready');
  assert.equal(result.route, 'ship');
  assert.ok(result.foundation.foundationId);
  assert.equal(result.autopilot.mission.goal, 'Build a CRM for our sales team');
  assert.match(result.nextAction, /Foundation story|Implement/);
});

test('ForgeMind status combines linked workflow state into one next action', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-one-status-'));
  await activateArtifactStore({ workspace });
  t.after(async () => { await deactivateArtifactStore(); await rm(workspace, { recursive: true, force: true }); });
  await runForgeMindOne({ workspace, goal: 'Build a CRM for our sales team' });

  const status = await getForgeMindStatus({ workspace });

  assert.equal(status.status, 'ready');
  assert.equal(status.foundation.status, 'concerns');
  assert.equal(status.autopilot.status, 'passed');
  assert.ok(status.nextAction);
});
