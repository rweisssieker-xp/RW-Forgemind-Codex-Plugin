import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { generateDashboard } from '../src/dashboard.mjs';

test('offline dashboard renders every evidence section and escapes imported content', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-dashboard-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const reports = path.join(root, '.codex-orchestrator', 'reports');
  const product = path.join(root, '.codex-orchestrator', 'product');
  const memory = path.join(root, '.codex-orchestrator', 'memory', 'shared');
  await mkdir(reports, { recursive: true });
  await mkdir(product, { recursive: true });
  await mkdir(memory, { recursive: true });
  const json = (name, value) => writeFile(path.join(reports, name), `${JSON.stringify(value)}\n`);
  await json('verification-latest.json', { status: 'passed', commands: [{ command: 'npm test', status: 'passed' }] });
  await json('risk-radar-latest.json', { status: 'clear', risks: [] });
  await json('release-readiness-latest.json', { status: 'ready', score: 95 });
  await json('route-latest.json', { primaryRoute: 'structured-feature', confidence: 0.8 });
  await writeFile(path.join(root, 'docs-traceability.md'), '# Traceability\nFeature -> test\n');
  await writeFile(path.join(memory, 'decisions.md'), '# Decisions\nUse evidence.\n');
  await writeFile(path.join(memory, 'entries.jsonl'), `${JSON.stringify({ id: 'a', type: 'convention', subject: 'tool', statement: 'Use A.' })}\n${JSON.stringify({ id: 'b', type: 'convention', subject: 'tool', statement: 'Use B.' })}\n`);
  await writeFile(path.join(memory, 'outcomes.jsonl'), `${JSON.stringify({ id: 'out1', route: 'structured-feature', effectiveness: 1 })}\n`);
  await writeFile(path.join(product, 'usp-backlog.jsonl'), `${JSON.stringify({ id: 'usp1', title: '<script>alert(1)</script>', experiment: 'Measure time.' })}\n`);

  const report = await generateDashboard({ workspace: root, sources: { traceability: 'docs-traceability.md' } });
  const html = await readFile(report.path, 'utf8');

  for (const section of ['verification', 'risks', 'readiness', 'proof', 'traceability', 'decisions', 'memory-conflicts', 'outcomes', 'routing', 'usp-experiments', 'experiments', 'discovery-scorecard', 'checkpoints', 'visual-qa', 'design-fidelity', 'capabilities', 'composition', 'delegation', 'hero-control', 'autopilot', 'portfolio', 'twin', 'ux-evolution', 'product-lab', 'outcome-memory', 'growth', 'integration-mesh', 'forge-trust', 'forge-strategy', 'forge-genome', 'forge-flight', 'forge-tournament', 'forge-shrink', 'forge-loop', 'forge-escrow', 'forge-federation']) {
    assert.ok(report.sections.includes(section));
    assert.match(html, new RegExp(`id="${section}"`));
  }
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(html, /<script\s+src=/i);
});

test('dashboard renders explicit missing states instead of failing', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-dashboard-empty-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const report = await generateDashboard({ workspace: root });
  const html = await readFile(report.path, 'utf8');

  assert.match(html, /No evidence available/);
  assert.equal(report.sections.length, 36);
});
