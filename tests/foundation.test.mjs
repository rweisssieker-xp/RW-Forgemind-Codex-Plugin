import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runFoundation } from '../src/foundation.mjs';

async function workspace(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-foundation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  return root;
}

test('Foundation drafts a complete evidence-labelled planning chain without questions', async (t) => {
  const root = await workspace(t);
  const result = await runFoundation({ workspace: root });

  assert.equal(result.goalSource, 'zero-input-default');
  assert.equal(result.foundation.context.evidence, 'repository-derived');
  assert.ok(result.foundation.prd.assumptions.length > 0);
  assert.equal(result.foundation.stories.length, 1);
  await readFile(path.join(root, '.codex-orchestrator', 'foundation', 'latest.json'), 'utf8');
  await readFile(path.join(root, 'docs', 'forgemind', 'project-context.md'), 'utf8');
});
