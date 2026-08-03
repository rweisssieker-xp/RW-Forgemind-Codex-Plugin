import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { resolvePluginRoot } from '../src/paths.mjs';

const JOURNEYS = ['Discover', 'Design', 'Build', 'Verify', 'Release', 'Learn'];

test('every ForgeMind skill declares exactly one primary journey', async () => {
  const root = await resolvePluginRoot();
  const skillDirectories = await readdir(path.join(root, 'skills'), { withFileTypes: true });
  for (const directory of skillDirectories.filter((entry) => entry.isDirectory())) {
    const file = path.join(root, 'skills', directory.name, 'SKILL.md');
    const content = await readFile(file, 'utf8');
    const matches = [...content.matchAll(/^Primary journey: \*\*(Discover|Design|Build|Verify|Release|Learn)\*\*$/gm)].map((match) => match[1]);
    assert.equal(matches.length, 1, `${directory.name} must declare one primary journey`);
    assert.ok(JOURNEYS.includes(matches[0]));
  }
});

test('overlapping autonomous workflows declare Build and common routing precedence', async () => {
  const root = await resolvePluginRoot();
  for (const name of ['autonomous-orchestrator', 'innovation-first-autopilot', 'delivery-acceleration-mode', 'yolo-feature', 'structured-feature', 'app-evolution-builder']) {
    const content = await readFile(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
    assert.match(content, /Primary journey: \*\*Build\*\*/);
    assert.match(content, /Shared orchestration precedence:/);
  }
});
