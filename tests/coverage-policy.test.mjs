import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('coverage never writes into the installable Marketplace source and enforces a floor', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.doesNotMatch(pkg.scripts.coverage, /plugins[\\/]forgemind[\\/]coverage/);
  assert.match(pkg.scripts.coverage, /check-coverage\.mjs/);
});
