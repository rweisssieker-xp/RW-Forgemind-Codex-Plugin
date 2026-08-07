import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createCompletionContract, getCompletionContract } from '../src/completion.mjs';

test('Complete persists an end-to-end definition of done without treating evidence gaps as blockers', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgemind-complete-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { test: 'node --test' } }));
  const contract = await createCompletionContract({ workspace: root, goal: 'finish account settings', acceptance: ['Profile updates persist.', 'Password validation is covered.'] });
  assert.equal(contract.executionPolicy.continueByDefault, true);
  assert.equal(contract.executionPolicy.evidenceGapsAreBlockers, false);
  assert.equal(contract.definitionOfDone.length, 2);
  const status = await getCompletionContract({ workspace: root });
  assert.equal(status.status, 'active');
  assert.match(status.nextAction, /Profile updates persist/);
});
