import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadDesignContracts } from '../src/design-fidelity-contract.mjs';

test('Design Fidelity expands local PNG files and directories into deterministic contracts', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-design-contract-'));
  await mkdir(path.join(root, 'design')); await writeFile(path.join(root, 'design', 'a.png'), 'a'); await writeFile(path.join(root, 'design', 'b.png'), 'b');
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await loadDesignContracts({ workspace: root, references: 'design/a.png,design', route: 'http://127.0.0.1:4173/', viewport: 'desktop' });
  assert.equal(result.gaps.length, 0);
  assert.deepEqual(result.contracts.map(({ referencePath }) => referencePath), ['design/a.png', 'design/b.png']);
});

test('Design Fidelity rejects URLs, workspace escapes, invalid viewports, and non-PNG references', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-design-contract-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await loadDesignContracts({ workspace: root, references: 'https://example.com/a.png,../outside.png,design/a.jpg', route: 'http://127.0.0.1:4173/', viewport: 'tablet' });
  assert.ok(result.gaps.length > 0);
  assert.ok(result.gaps.every(({ code }) => code === 'FM_DESIGN_FIDELITY_REFERENCE_INVALID'));
});
