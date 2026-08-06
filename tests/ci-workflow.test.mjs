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

test('one gated release job retains complete packages and publishes installable release assets', async () => {
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'validate.yml'), 'utf8');
  assert.match(workflow, /release-package:/);
  assert.match(workflow, /needs:\s*validate/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /include-hidden-files:\s*true/);
  assert.match(workflow, /dist\/plugin/);
  assert.match(workflow, /dist\/marketplace/);
  assert.match(workflow, /publish-release/);
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /forgemind-plugin-\$\{GITHUB_REF_NAME\}\.tar\.gz/);
  assert.match(workflow, /forgemind-marketplace-\$\{GITHUB_REF_NAME\}\.tar\.gz/);
  assert.match(workflow, /marketplace\/\.agents\/plugins\/marketplace\.json/);
  assert.match(workflow, /gh release create/);
});
