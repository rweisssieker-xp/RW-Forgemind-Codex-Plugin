import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ForgeMindError } from '../src/errors.mjs';
import { runStart } from '../src/start.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-start-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('start recommends Leap for an existing-project MVP', async (t) => {
  const root = await workspace(t);

  const result = await runStart({ workspace: root, context: 'project', outcome: 'mvp', mode: 'autonomous' });

  assert.equal(result.recommendedJourney, 'leap');
  assert.equal(result.handoff, '$forgemind-compass');
  assert.equal(result.inputs.mode, 'autonomous');
  assert.match(result.autonomyBoundary, /hard stop/i);
  const persisted = JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'primary', 'start-latest.json'), 'utf8'));
  assert.equal(persisted.recommendedJourney, 'leap');
});

test('start falls back to low-confidence Compass when no routing input is available', async (t) => {
  const result = await runStart({ workspace: await workspace(t) });

  assert.equal(result.recommendedJourney, 'compass');
  assert.ok(result.confidence < 0.5);
  assert.ok(result.missingEvidence.includes('starting-context'));
});

test('start reports quality and MVP input as a low-confidence Xray conflict', async (t) => {
  const result = await runStart({ workspace: await workspace(t), context: 'quality', outcome: 'mvp', mode: 'guided' });

  assert.equal(result.recommendedJourney, 'xray');
  assert.equal(result.alternativeJourney, 'leap');
  assert.ok(result.routingSignals.includes('conflicting-inputs'));
  assert.ok(result.confidence < 0.75);
});

test('start validates declared enum values', async (t) => {
  const root = await workspace(t);
  await assert.rejects(
    () => runStart({ workspace: root, context: 'unknown' }),
    (error) => error instanceof ForgeMindError
      && error.code === 'FM_START_CONTEXT_INVALID'
      && /idea, project, quality/.test(error.message),
  );
});

test('guide does not retain an artifact in none mode through the CLI', async (t) => {
  const root = await workspace(t);
  const { runCli } = await import('../src/cli.mjs');
  const result = await runCli([
    'guide', '--workspace', root, '--context', 'quality', '--outcome', 'ship',
    '--mode', 'guided', '--artifacts', 'none', '--json',
  ], { stdout: { write() {} }, stderr: { write() {} } });

  assert.equal(result.exitCode, 0);
  assert.equal(result.data.recommendedJourney, 'xray');
  assert.equal(result.data.artifactMode, 'none');
  assert.equal(result.data.artifactPath, null);
  await assert.rejects(access(path.join(root, '.codex-orchestrator', 'primary', 'start-latest.json')));
});
