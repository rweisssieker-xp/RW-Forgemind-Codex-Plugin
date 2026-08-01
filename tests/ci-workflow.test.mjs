import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('CI validates all supported operating systems and Node release lines', async () => {
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'validate.yml'), 'utf8');
  for (const os of ['ubuntu-latest', 'macos-latest', 'windows-latest']) assert.match(workflow, new RegExp(os));
  assert.match(workflow, /node-version:\s*\[?[^\n]*20/);
  assert.match(workflow, /node-version:\s*\[?[^\n]*24/);
  assert.match(workflow, /npm run ci/);
});

test('one gated release job uploads the verified marketplace and standalone packages', async () => {
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'validate.yml'), 'utf8');
  assert.match(workflow, /release-package:/);
  assert.match(workflow, /needs:\s*validate/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /dist\/plugin/);
  assert.match(workflow, /dist\/marketplace/);
});
