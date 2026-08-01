import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { clusterSignals, createUspRecords, importSignals } from '../src/signals.mjs';

async function root(t) {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-signals-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  return workspace;
}

test('imports JSON, JSONL, Markdown, and CSV into the same traceable signal contract', async (t) => {
  const workspace = await root(t);
  const fixtures = {
    json: JSON.stringify([{ problem: 'Release evidence is hard to find', audience: 'tech leads', severity: 4 }]),
    jsonl: `${JSON.stringify({ problem: 'Release proof is scattered', audience: 'developers', severity: 3 })}\n`,
    md: '- Teams cannot find release decisions\n',
    csv: 'problem,audience,severity,frequency\n"Release reviews take too long",release managers,5,4\n',
  };

  const imported = [];
  for (const [format, content] of Object.entries(fixtures)) {
    const file = path.join(workspace, `signals.${format === 'md' ? 'md' : format}`);
    await writeFile(file, content);
    imported.push(...(await importSignals({ workspace, input: file, format, sourceType: 'customer-export' })).signals);
  }

  assert.equal(imported.length, 4);
  for (const signal of imported) {
    assert.match(signal.id, /^sig_[a-f0-9]{24}$/);
    assert.equal(signal.trust, 'external-untrusted');
    assert.equal(signal.source.type, 'customer-export');
    assert.ok(signal.problem.length > 5);
  }
});

test('malformed signal rows fail with an actionable code', async (t) => {
  const workspace = await root(t);
  const file = path.join(workspace, 'bad.csv');
  await writeFile(file, 'audience,severity\ndevelopers,5\n');

  await assert.rejects(importSignals({ workspace, input: file, format: 'csv' }), (error) => error.code === 'FM_SIGNAL_INVALID');
});

test('external signal secrets are redacted before persistence', async (t) => {
  const workspace = await root(t);
  const secret = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
  const file = path.join(workspace, 'secret.json');
  await writeFile(file, JSON.stringify([{ problem: `Login fails with ${secret}`, severity: 5 }]));

  const report = await importSignals({ workspace, input: file, format: 'json' });
  const persisted = await readFile(path.join(workspace, '.codex-orchestrator', 'product', 'signals.jsonl'), 'utf8');

  assert.doesNotMatch(persisted, new RegExp(secret));
  assert.match(report.signals[0].problem, /REDACTED:GITHUB_TOKEN/);
  assert.equal(report.signals[0].redacted, true);
});

test('clusters retain source IDs and produce six-part scored USP experiments', () => {
  const signals = [
    { id: 'sig_one', problem: 'Release evidence is scattered', frequency: 4, severity: 5, sensitivity: 'internal' },
    { id: 'sig_two', problem: 'Release evidence takes hours to collect', frequency: 3, severity: 4, sensitivity: 'internal' },
    { id: 'sig_three', problem: 'Release approval lacks evidence', frequency: 2, severity: 4, sensitivity: 'public' },
  ];

  const clusters = clusterSignals(signals);
  const records = createUspRecords(clusters);

  assert.equal(clusters[0].key, 'evidence');
  assert.deepEqual(clusters[0].sourceSignalIds, ['sig_one', 'sig_three', 'sig_two']);
  assert.deepEqual(records[0].sourceSignalIds, clusters[0].sourceSignalIds);
  assert.deepEqual(Object.keys(records[0].score).sort(), ['buildEffort', 'dataAvailability', 'differentiation', 'revenuePotential', 'timeToMvp', 'total', 'trustFeasibility'].sort());
  assert.equal(records[0].score.total, Object.entries(records[0].score).filter(([key]) => key !== 'total').reduce((sum, [, value]) => sum + value, 0));
  assert.match(records[0].experiment, /Measure/);
});
