import assert from 'node:assert/strict';
import test from 'node:test';

import { executeApiChecks } from '../src/xray-api.mjs';

test('Xray executes only configured local GET checks and records timing', async () => {
  const calls = [];
  const result = await executeApiChecks({
    config: { baseUrl: 'http://127.0.0.1:3000/', checks: [{ id: 'health', method: 'GET', path: '/health' }], performance: { responseMs: 50 } },
    fetchImpl: async (url, options) => { calls.push([url, options]); return new Response('ok', { status: 200 }); },
    now: sequence(0, 12),
  });
  assert.deepEqual(calls, [['http://127.0.0.1:3000/health', { method: 'GET', redirect: 'error' }]]);
  assert.equal(result.receipts[0].durationMs, 12);
  assert.deepEqual(result.findings, []);
});

test('Xray rejects an unsafe API candidate before fetch', async () => {
  const result = await executeApiChecks({
    config: { baseUrl: 'https://example.com/', checks: [{ id: 'write', method: 'POST', path: '/users' }] },
    fetchImpl: async () => { throw new Error('must not fetch'); },
  });
  assert.equal(result.gaps[0].code, 'FM_XRAY_API_TARGET_UNSAFE');
});

test('Xray converts non-success status and budget breaches to findings', async () => {
  const result = await executeApiChecks({
    config: { baseUrl: 'http://127.0.0.1:3000/', checks: [{ id: 'health', method: 'HEAD', path: '/health' }], performance: { responseMs: 10 } },
    fetchImpl: async () => new Response('', { status: 503 }), now: sequence(0, 20),
  });
  assert.equal(result.findings.length, 2);
  assert.deepEqual(result.findings.map(({ title }) => title), ['API check failed: health', 'Performance budget exceeded: health']);
});

function sequence(...values) { let index = 0; return () => values[index++]; }
