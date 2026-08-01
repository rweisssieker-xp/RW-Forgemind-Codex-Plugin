import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';
import { appendFlightEvent, readFlightEvents, replayFlight, verifyFlight } from '../src/forge/flight.mjs';
import { sealRecord, verifyRecord } from '../src/forge/integrity.mjs';
import { loadForgeRecord, saveForgeRecord } from '../src/forge/store.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-forge-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function outputBuffer() {
  let value = '';
  return { stream: { write(chunk) { value += String(chunk); } }, text: () => value };
}

test('canonical forge records verify and detect payload or digest tampering', () => {
  const sealed = sealRecord({ schemaVersion: 1, id: 'record_1', value: { beta: 2, alpha: 1 } });
  assert.equal(verifyRecord(sealed).status, 'valid');
  assert.equal(sealed.digest.algorithm, 'sha256');
  assert.equal(sealed.digest.canonicalization, 'forgemind-canonical-json-v1');
  assert.equal(verifyRecord({ ...sealed, value: { beta: 3, alpha: 1 } }).status, 'invalid');
  assert.equal(verifyRecord({ ...sealed, digest: { ...sealed.digest, value: '0'.repeat(64) } }).status, 'invalid');
});

test('forge store contains paths, redacts imported secrets, and verifies on load', async (t) => {
  const root = await workspace(t);
  const saved = await saveForgeRecord({
    workspace: root,
    area: 'trust/evidence',
    record: { schemaVersion: 1, id: 'evidence_safe', text: 'API_KEY=super-secret-value' },
  });
  assert.match(saved.path, /\.codex-orchestrator[\\/]forge[\\/]trust[\\/]evidence/);
  const loaded = await loadForgeRecord({ workspace: root, area: 'trust/evidence', reference: 'evidence_safe' });
  assert.match(loaded.text, /\[REDACTED:SECRET_ASSIGNMENT\]/);
  assert.equal(verifyRecord(loaded).status, 'valid');
  await assert.rejects(
    saveForgeRecord({ workspace: root, area: '../escape', record: { schemaVersion: 1, id: 'bad' } }),
    (error) => error.code === 'FM_FORGE_AREA_INVALID',
  );
});

test('flight chain verifies and replay reconstructs state without executing actions', async (t) => {
  const root = await workspace(t);
  await appendFlightEvent({ workspace: root, event: { capability: 'trust', action: 'create', subject: 'contract_1', status: 'created' }, now: new Date('2026-01-01T00:00:00Z') });
  await appendFlightEvent({ workspace: root, event: { capability: 'strategy', action: 'compile', subject: 'strategy_1', status: 'compiled' }, now: new Date('2026-01-01T00:01:00Z') });
  await appendFlightEvent({ workspace: root, event: { capability: 'trust', action: 'evaluate', subject: 'contract_1', status: 'trusted' }, now: new Date('2026-01-01T00:02:00Z') });
  assert.equal((await verifyFlight({ workspace: root })).status, 'valid');
  const replay = await replayFlight({ workspace: root });
  assert.equal(replay.status, 'replayed');
  assert.equal(replay.eventCount, 3);
  assert.deepEqual(replay.subjects.contract_1, { capability: 'trust', action: 'evaluate', status: 'trusted', sequence: 3 });
  assert.ok(replay.timeline.every((event) => !Object.hasOwn(event, 'execute')));
});

test('flight verification detects mutation, deletion, and reordering', async (t) => {
  const root = await workspace(t);
  for (const [index, action] of ['one', 'two', 'three'].entries()) {
    await appendFlightEvent({ workspace: root, event: { capability: 'trust', action, subject: `s${index}`, status: 'passed' }, now: new Date(2026, 0, 1, 0, index) });
  }
  const flightPath = path.join(root, '.codex-orchestrator', 'forge', 'flights', 'events.jsonl');
  const original = await readFile(flightPath, 'utf8');
  const events = original.trim().split(/\r?\n/).map(JSON.parse);

  events[1].status = 'changed';
  await writeFile(flightPath, `${events.map(JSON.stringify).join('\n')}\n`);
  assert.equal((await verifyFlight({ workspace: root })).status, 'invalid');

  await writeFile(flightPath, `${[JSON.parse(original.split(/\r?\n/)[0]), JSON.parse(original.split(/\r?\n/)[2])].map(JSON.stringify).join('\n')}\n`);
  assert.equal((await verifyFlight({ workspace: root })).status, 'invalid');

  const pristine = original.trim().split(/\r?\n/);
  await writeFile(flightPath, `${[pristine[1], pristine[0], pristine[2]].join('\n')}\n`);
  assert.equal((await verifyFlight({ workspace: root })).status, 'invalid');
});

test('forge help exposes exactly the nine integrated capabilities', async () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();
  const result = await runCli(['forge', 'help', '--json'], { stdout: stdout.stream, stderr: stderr.stream, cwd: process.cwd() });
  assert.equal(result.exitCode, 0, stderr.text());
  assert.deepEqual(result.data.capabilities, ['trust', 'strategy', 'genome', 'flight', 'tournament', 'shrink', 'loop', 'escrow', 'federate']);
});
