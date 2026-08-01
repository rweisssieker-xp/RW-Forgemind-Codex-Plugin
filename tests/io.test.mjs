import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { canonicalJson, writeJsonAtomic } from '../src/io.mjs';

test('canonical JSON sorts object keys recursively without reordering arrays', () => {
  const input = { z: 1, a: { y: 2, b: 3 }, list: [{ d: 4, c: 5 }, 1] };

  assert.equal(
    canonicalJson(input),
    '{\n  "a": {\n    "b": 3,\n    "y": 2\n  },\n  "list": [\n    {\n      "c": 5,\n      "d": 4\n    },\n    1\n  ],\n  "z": 1\n}\n',
  );
});

test('atomic JSON writes leave only the complete destination file', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-io-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = path.join(root, 'nested', 'state.json');

  await writeJsonAtomic(target, { status: 'ready', count: 2 });

  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), { count: 2, status: 'ready' });
  assert.deepEqual(await readdir(path.dirname(target)), ['state.json']);
});
