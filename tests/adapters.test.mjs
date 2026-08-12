import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { executeAdapter, evaluateGrant, validateAdapterManifest } from '../src/adapters.mjs';
import { DEFAULT_POLICY } from '../src/policy.mjs';

const manifest = { type: 'local-command', operations: ['test'], rollback: { kind: 'none', reason: 'command is read-only' } };

test('adapters reject unsafe manifests and grants and replay receipts idempotently', async (t) => {
  assert.throws(() => validateAdapterManifest({ type: 'local-command', operations: ['test'] }), /rollback/i);
  assert.throws(() => validateAdapterManifest({ ...manifest, token: 'secret' }), /secret/i);
  assert.equal(evaluateGrant({ policy: DEFAULT_POLICY, grant: { missionId: 'm1', expiresAt: '2000-01-01T00:00:00Z', operations: ['test'] }, action: { missionId: 'm1', operation: 'test', kind: 'command' } }).decision, 'deny');
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-adapter-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const action = { missionId: 'm1', idempotencyKey: 'one', manifest, operation: 'test', kind: 'command', command: process.execPath, args: ['--version'] };
  const grant = { missionId: 'm1', expiresAt: '2999-01-01T00:00:00Z', operations: ['test'], maxActions: 1 };
  const first = await executeAdapter({ workspace, mission: { id: 'm1' }, action, grant, policy: DEFAULT_POLICY });
  const second = await executeAdapter({ workspace, mission: { id: 'm1' }, action, grant, policy: DEFAULT_POLICY });
  assert.equal(first.status, 'succeeded');
  assert.equal(second.replayed, true);
});
