import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { collectReleaseAudit, writeReleaseAudit } from '../scripts/release-audit.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('release audit maps all 29 criteria to status, result, commands, and evidence', async () => {
  const audit = await collectReleaseAudit({ root });
  assert.equal(audit.criteria.length, 29);
  assert.deepEqual(audit.criteria.map((criterion) => criterion.id), Array.from({ length: 29 }, (_, index) => index + 1));
  for (const criterion of audit.criteria) {
    assert.match(criterion.status, /^(passed|failed|pending)$/);
    assert.ok(criterion.result);
    assert.ok(criterion.commands.length > 0);
    assert.ok(criterion.evidence.length > 0);
  }
});

test('release audit never infers remote CI success from workflow existence', async () => {
  const pending = await collectReleaseAudit({ root, commandResults: { localCi: { status: 'passed', result: '73 tests passed' } } });
  assert.equal(pending.criteria.find((criterion) => criterion.id === 3).status, 'pending');
  const passed = await collectReleaseAudit({ root, commandResults: { remoteCi: { status: 'passed', result: 'All six matrix jobs passed', evidence: 'https://github.com/example/actions/runs/1' } } });
  assert.equal(passed.criteria.find((criterion) => criterion.id === 3).status, 'passed');
});

test('release audit writes machine-readable and human-readable acceptance evidence', async (t) => {
  const output = await mkdtemp(path.join(tmpdir(), 'forgemind-audit-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const written = await writeReleaseAudit({ root, outputRoot: output });
  assert.equal(JSON.parse(await readFile(written.jsonPath, 'utf8')).criteria.length, 29);
  const markdown = await readFile(written.markdownPath, 'utf8');
  assert.match(markdown, /Remote three-OS CI/);
  assert.match(markdown, /Public marketplace submission: not claimed/);
});
