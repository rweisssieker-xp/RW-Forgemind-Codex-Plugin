import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }

test('Venture produces evidence-labelled market intelligence and decision-value experiments', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-market-intelligence-'));
  await writeFile(path.join(workspace, 'package.json'), JSON.stringify({ name: 'merchant-flow', dependencies: { stripe: '^17.0.0' } }));
  await writeFile(path.join(workspace, 'README.md'), 'Self-serve checkout tooling for independent merchants.');
  await writeFile(path.join(workspace, 'forgemind.config.json'), JSON.stringify({ marketIntelligence: { region: 'DACH', reachableAccounts: 120, competitors: [{ name: 'Existing Commerce Suite', segment: 'independent merchants', pricing: 'unknown', source: 'internal-sales-note' }] } }));
  await mkdir(path.join(workspace, '.codex-orchestrator', 'product-ops'), { recursive: true });
  await writeFile(path.join(workspace, '.codex-orchestrator', 'product-ops', 'research-latest.json'), JSON.stringify({ records: [{ id: 'r1', title: 'Merchant interview', url: 'https://example.test/interview', claim: 'Merchants report setup friction.', source: 'customer-interview', evidenceType: 'primary', confidence: 0.8, publishedAt: '2026-08-01' }] }));
  t.after(() => rm(workspace, { recursive: true, force: true }));

  const result = await runCli(['venture', 'run', '--workspace', workspace, '--goal', 'reduce merchant checkout setup effort', '--json'], context());
  const market = result.data.marketIntelligence;
  assert.equal(result.exitCode, 0);
  assert.equal(market.sources[0].rank, 'primary');
  assert.equal(market.competitors[0].evidence, 'observed');
  assert.equal(market.marketSizing.reachableAccounts.value, 120);
  assert.equal(market.marketSizing.reachableAccounts.evidence, 'observed');
  assert.equal(market.region.value, 'DACH');
  assert.equal(market.sensitivity.method, 'deterministic-parameter-sweep');
  assert.ok(market.nextExperiments.length >= 3);
  assert.match(market.claimBoundary, /not market facts/i);
});
