import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { initializeWorkspace } from '../src/artifacts.mjs';
import { resolvePluginRoot } from '../src/paths.mjs';

test('initialization creates governed memory and product artifacts', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-init-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const report = await initializeWorkspace({
    workspace: root,
    pluginRoot: await resolvePluginRoot(),
    withMemory: true,
    withArtifacts: true,
  });

  assert.equal(report.status, 'passed');
  for (const expected of [
    '.codex-orchestrator/project.json',
    '.codex-orchestrator/project.md',
    '.codex-orchestrator/memory/shared/decisions.md',
    '.codex-orchestrator/workflow-status.md',
    'docs/forgemind/prd.md',
    'docs/forgemind/stories/_story-template.md',
    'docs/forgemind/acceptance/_acceptance-template.md',
    'docs/forgemind/traceability.md',
  ]) {
    assert.ok(report.created.includes(expected), `expected ${expected} to be created`);
    assert.ok((await readFile(path.join(root, expected), 'utf8')).length > 0);
  }
});

test('repeated initialization preserves existing user files', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-init-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const existing = path.join(root, 'docs', 'forgemind', 'prd.md');
  await mkdir(path.dirname(existing), { recursive: true });
  await writeFile(existing, '# My product decisions\n', 'utf8');
  const options = { workspace: root, pluginRoot: await resolvePluginRoot(), withMemory: true, withArtifacts: true };

  await initializeWorkspace(options);
  const second = await initializeWorkspace(options);

  assert.equal(await readFile(existing, 'utf8'), '# My product decisions\n');
  assert.ok(second.preserved.includes('docs/forgemind/prd.md'));
});
