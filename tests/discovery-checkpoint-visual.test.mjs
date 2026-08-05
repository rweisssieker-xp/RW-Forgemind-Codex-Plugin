import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { listExperiments, createExperiment, decideExperiment, scoreDiscovery } from '../src/discovery.mjs';
import { listCheckpoints, resumeCheckpoint, saveCheckpoint } from '../src/checkpoints.mjs';
import { compareVisualEvidence, recordVisualEvidence } from '../src/visual-qa.mjs';

test('discovery experiments preserve hypotheses, metrics, and explicit decisions', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-discovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const created = await createExperiment({ workspace: root, experiment: { title: 'Faster onboarding', hypothesis: 'A guided start reduces abandonment.', metric: 'completion rate', assumptions: 'Users need help|First-use friction matters', interviewSignals: 'int_1', timeframe: 'one week', evidence: 'sig_1' } });
  const decided = await decideExperiment({ workspace: root, id: created.experiment.id, decision: 'persevere', evidence: 'run_1' });
  assert.equal(decided.experiment.decision, 'persevere');
  assert.deepEqual((await listExperiments({ workspace: root }))[0].evidence, ['sig_1', 'run_1']);
  assert.equal((await scoreDiscovery({ workspace: root })).scorecards[0].recommendation, 'persevere');
});

test('visual comparison distinguishes exact visual artifacts without claiming a pixel diff', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-visual-compare-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = path.join(root, 'first.png');
  const second = path.join(root, 'second.png');
  await writeFile(first, 'first-bytes');
  await writeFile(second, 'second-bytes');
  const result = await compareVisualEvidence({ workspace: root, baseline: first, candidate: second });
  assert.equal(result.status, 'different');
  assert.equal(result.comparison.method, 'byte-identity');
});

test('checkpoints capture a resumable summary without requiring Git', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-checkpoint-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const saved = await saveCheckpoint({ workspace: root, summary: 'Implemented discovery', next: 'Run tests' });
  assert.match(saved.checkpoint.id, /^chk_/);
  assert.equal((await listCheckpoints({ workspace: root }))[0].next, 'Run tests');
  assert.equal((await resumeCheckpoint({ workspace: root, id: saved.checkpoint.id })).briefing.summary, 'Implemented discovery');
});

test('visual QA records local screenshot evidence by content hash', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-visual-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const image = path.join(root, 'screen.png');
  await writeFile(image, 'image-bytes');
  const result = await recordVisualEvidence({ workspace: root, input: image, label: 'homepage', viewport: '1280x720' });
  const stored = JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'visual-qa', `${result.evidence.id}.json`), 'utf8'));
  assert.equal(stored.viewport, '1280x720');
  assert.equal(stored.file, 'screen.png');
});
