import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverXrayMission } from '../src/xray.mjs';

async function fixture(t, { packageJson, files = {} } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const allFiles = { ...files };
  if (packageJson) allFiles['package.json'] = JSON.stringify(packageJson, null, 2);
  for (const [name, content] of Object.entries(allFiles)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

test('Xray discovers CLI, API, GUI, and existing command surfaces without inventing commands', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      bin: { sample: 'bin/sample.mjs' },
      scripts: { test: 'node --test', dev: 'vite --host 127.0.0.1' },
      dependencies: { express: '^5.0.0', vite: '^6.0.0' },
    },
    files: { 'bin/sample.mjs': '', 'src/routes.mjs': 'app.get("/health", () => {});' },
  });

  const mission = await discoverXrayMission({ workspace: root, goal: 'full QA' });

  assert.deepEqual(mission.surfaces.map(({ id }) => id).sort(), ['api', 'cli', 'web-gui']);
  assert.ok(mission.checks.some(({ command }) => command === 'npm test'));
  assert.ok(mission.gaps.every(({ code }) => code !== 'FM_XRAY_COMMAND_INVENTED'));
});

test('Xray reports unavailable GUI control as a gap rather than a test result', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6.0.0' } },
  });

  const mission = await discoverXrayMission({ workspace: root, guiControl: { browser: false, computerUse: false } });

  assert.deepEqual(mission.gaps.map(({ code }) => code), ['FM_XRAY_GUI_CONTROL_UNAVAILABLE']);
});

test('Xray identifies an API route without creating an inferred runnable check', async (t) => {
  const root = await fixture(t, { files: { 'src/routes.mjs': 'router.get("/health", () => {});' } });

  const mission = await discoverXrayMission({ workspace: root });

  assert.deepEqual(mission.surfaces.map(({ id }) => id), ['api']);
  assert.deepEqual(mission.checks, []);
});
