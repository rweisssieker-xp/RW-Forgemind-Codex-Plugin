import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadXrayConfig } from '../src/xray-config.mjs';
import { planCriticalFlows } from '../src/xray-flows.mjs';

async function workspace(t, files = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-config-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

test('Xray loads only an explicit local web configuration', async (t) => {
  const root = await workspace(t, {
    'forgemind.config.json': JSON.stringify({ xray: { web: { baseUrl: 'http://127.0.0.1:4173', viewports: ['desktop', 'mobile'] } } }),
  });

  const result = await loadXrayConfig({ workspace: root });

  assert.deepEqual(result.gaps, []);
  assert.deepEqual(result.value.web, { baseUrl: 'http://127.0.0.1:4173/', viewports: ['desktop', 'mobile'], visualBaseline: null, performance: null });
});

test('Xray rejects a remote configured web base URL', async (t) => {
  const root = await workspace(t, {
    'package.json': JSON.stringify({ forgemind: { xray: { web: { baseUrl: 'https://example.com' } } } }),
  });

  const result = await loadXrayConfig({ workspace: root });

  assert.equal(result.value.web, null);
  assert.deepEqual(result.gaps.map(({ code, field }) => [code, field]), [['FM_XRAY_CONFIG_INVALID', 'web.baseUrl']]);
});

test('Xray derives only local app route files as critical flows', () => {
  const result = planCriticalFlows({
    files: ['src/app/page.tsx', 'src/app/settings/page.tsx', 'src/components/card.tsx', 'pages/api/health.ts'],
    config: { web: { baseUrl: 'http://127.0.0.1:4173/', viewports: ['desktop', 'mobile'] } },
    testUrl: null,
  });

  assert.deepEqual(result.gaps, []);
  assert.deepEqual(result.flows, [
    { id: 'flow-home', route: '/', purpose: 'Load /', sourcePaths: ['src/app/page.tsx'], safe: true, viewports: ['desktop', 'mobile'] },
    { id: 'flow-settings', route: '/settings', purpose: 'Load /settings', sourcePaths: ['src/app/settings/page.tsx'], safe: true, viewports: ['desktop', 'mobile'] },
  ]);
});
