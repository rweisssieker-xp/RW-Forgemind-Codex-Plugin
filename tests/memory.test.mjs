import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { appendMemoryEntry, findMemoryConflicts, readActiveMemory } from '../src/memory.mjs';

function baseEntry(overrides = {}) {
  return {
    type: 'convention',
    subject: 'tests',
    statement: 'Use node --test.',
    source: 'team-review',
    evidence: ['package.json'],
    author: 'Fixture User',
    confidence: 0.9,
    reviewState: 'approved',
    sensitivity: 'internal',
    nonExpiring: true,
    ...overrides,
  };
}

test('memory entries use stable IDs and preserve provenance without duplicates', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-memory-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const first = await appendMemoryEntry({ workspace: root, scope: 'shared', entry: baseEntry() });
  const second = await appendMemoryEntry({ workspace: root, scope: 'shared', entry: baseEntry() });

  assert.equal(first.entry.id, second.entry.id);
  assert.equal(second.status, 'duplicate');
  assert.equal(first.entry.scope, 'shared');
  assert.equal(first.entry.source, 'team-review');
  const lines = (await readFile(path.join(root, '.codex-orchestrator', 'memory', 'shared', 'entries.jsonl'), 'utf8')).trim().split('\n');
  assert.equal(lines.length, 1);
});

test('active memory separates scopes, expiry, and superseded entries', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-memory-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const old = await appendMemoryEntry({ workspace: root, scope: 'shared', entry: baseEntry({ statement: 'Use npm test.' }) });
  await appendMemoryEntry({ workspace: root, scope: 'shared', entry: baseEntry({ statement: 'Use node --test.', supersedes: old.entry.id }) });
  await appendMemoryEntry({ workspace: root, scope: 'shared', entry: baseEntry({ subject: 'expired', statement: 'Old rule.', nonExpiring: false, expiresAt: '2020-01-01T00:00:00.000Z' }) });
  await appendMemoryEntry({ workspace: root, scope: 'personal', entry: baseEntry({ subject: 'editor', statement: 'Prefer compact output.' }) });

  const shared = await readActiveMemory({ workspace: root, scope: 'shared', now: new Date('2026-07-30T00:00:00.000Z') });
  const personal = await readActiveMemory({ workspace: root, scope: 'personal' });

  assert.deepEqual(shared.map((entry) => entry.statement), ['Use node --test.']);
  assert.deepEqual(personal.map((entry) => entry.statement), ['Prefer compact output.']);
});

test('conflicting active entries are preserved and reported', () => {
  const entries = [
    { id: 'one', type: 'convention', subject: 'formatter', statement: 'Use Prettier.', reviewState: 'approved' },
    { id: 'two', type: 'convention', subject: 'formatter', statement: 'Use Biome.', reviewState: 'approved' },
    { id: 'three', type: 'preference', subject: 'tone', statement: 'Be concise.', reviewState: 'pending' },
  ];

  assert.deepEqual(findMemoryConflicts(entries), [{
    key: 'convention:formatter',
    entryIds: ['one', 'two'],
    statements: ['Use Prettier.', 'Use Biome.'],
  }]);
});

test('memory rejects secrets before persistence', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-memory-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await assert.rejects(
    appendMemoryEntry({ workspace: root, scope: 'shared', entry: baseEntry({ statement: 'Token ghp_abcdefghijklmnopqrstuvwxyz1234567890' }) }),
    (error) => error.code === 'FM_MEMORY_SENSITIVE',
  );
});
