import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadConfig } from '../src/config.mjs';
import { DEFAULT_POLICY, evaluateAction, evaluateMissionGrant, mergePolicies } from '../src/policy.mjs';

test('personal policy can become stricter but cannot weaken shared policy', () => {
  const shared = { actions: { deployment: 'deny', network: 'approval' }, protectedPaths: ['production/'] };
  const personal = { actions: { deployment: 'allow', network: 'deny' }, protectedPaths: [] };

  const result = mergePolicies(DEFAULT_POLICY, shared, personal, { approvedWeakening: false });

  assert.equal(result.policy.actions.deployment, 'deny');
  assert.equal(result.policy.actions.network, 'deny');
  assert.ok(result.policy.protectedPaths.includes('production/'));
  assert.deepEqual(result.rejections, [{ path: 'actions.deployment', requested: 'allow', retained: 'deny' }]);
});

test('policy evaluates risky actions and protected paths with source rationale', () => {
  const merged = mergePolicies(DEFAULT_POLICY, {
    actions: { migration: 'deny' },
    protectedPaths: ['infra/production/'],
  }, {}, { approvedWeakening: false }).policy;

  const migration = evaluateAction(merged, { kind: 'migration' });
  const deployment = evaluateAction(merged, { kind: 'deployment' });
  const protectedWrite = evaluateAction(merged, { kind: 'write', path: 'infra/production/main.tf' });

  assert.deepEqual(migration, { decision: 'deny', source: 'actions.migration', rationale: 'Team policy denies migration.' });
  assert.equal(deployment.decision, 'approval');
  assert.equal(protectedWrite.decision, 'deny');
  assert.equal(protectedWrite.source, 'protectedPaths');
});

test('mission grants expire and cannot override a protected path', () => {
  const grant = { missionId: 'm1', expiresAt: '2999-01-01T00:00:00Z', operations: ['write'] };
  const decision = evaluateMissionGrant({ policy: DEFAULT_POLICY, grant, action: { missionId: 'm1', operation: 'write', kind: 'write', path: '.env' } });
  assert.equal(decision.decision, 'deny');
});

test('config loader validates versioned shared and personal configuration', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-config-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'forgemind.config.json'), '{"schemaVersion":1,"policy":{"actions":{"network":"deny"}}}');
  await writeFile(path.join(root, '.forgemind.local.json'), '{"schemaVersion":1,"policy":{"actions":{"cost":"deny"}}}');

  const config = await loadConfig(root);

  assert.equal(config.policy.actions.network, 'deny');
  assert.equal(config.policy.actions.cost, 'deny');
  assert.equal(config.sources.shared, 'forgemind.config.json');
  assert.equal(config.sources.personal, '.forgemind.local.json');
});
