import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { migrateMarkdownMemory } from '../src/migrate-memory.mjs';
import { readActiveMemory } from '../src/memory.mjs';

test('legacy Markdown memory is imported without changing the source file', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-memory-migrate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const legacyDir = path.join(root, '.codex-orchestrator', 'memory');
  await mkdir(legacyDir, { recursive: true });
  const legacy = path.join(legacyDir, 'conventions.md');
  const original = '# Conventions\n\n- Run npm test before release.\n';
  await writeFile(legacy, original);

  const report = await migrateMarkdownMemory({ workspace: root, author: 'Migration' });
  const entries = await readActiveMemory({ workspace: root, scope: 'shared' });

  assert.equal(report.imported, 1);
  assert.equal(await readFile(legacy, 'utf8'), original);
  assert.equal(entries[0].source, '.codex-orchestrator/memory/conventions.md');
  assert.match(entries[0].statement, /Run npm test before release/);
});
