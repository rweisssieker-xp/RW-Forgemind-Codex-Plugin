import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { diagnose } from '../src/doctor.mjs';
import { resolvePluginRoot } from '../src/paths.mjs';

test('doctor reports environment checks without mutating the workspace', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-doctor-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const before = await readdir(workspace);

  const report = await diagnose({ pluginRoot: await resolvePluginRoot(), workspace });

  assert.ok(['passed', 'warning'].includes(report.status));
  for (const name of ['node-version', 'plugin-manifest', 'workspace-readable', 'workspace-writable']) {
    assert.ok(report.checks.some((check) => check.name === name && check.status === 'passed'));
  }
  assert.deepEqual(await readdir(workspace), before);
});
