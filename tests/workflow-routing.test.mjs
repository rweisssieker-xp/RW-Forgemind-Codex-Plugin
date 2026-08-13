import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-compass', 'forgemind-leap', 'forgemind-council', 'forgemind-venture', 'forgemind-spark', 'forgemind-evolve', 'forgemind-ship', 'forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth'];

test('thirteen journeys are the complete primary skill hierarchy', async () => {
  const directories = [];
  for (const entry of (await readdir(path.join(root, 'entry-skills'), { withFileTypes: true })).filter((item) => item.isDirectory())) {
    try { await readFile(path.join(root, 'entry-skills', entry.name, 'SKILL.md'), 'utf8'); directories.push(entry.name); } catch {}
  }
  directories.sort();
  assert.deepEqual(directories, [...JOURNEYS].sort());
  const compass = await readFile(path.join(root, 'entry-skills', 'forgemind-compass', 'SKILL.md'), 'utf8');
  for (const journey of JOURNEYS.filter((name) => !['forgemind-compass', 'forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth'].includes(name))) assert.match(compass, new RegExp(`\\$${journey}`));
});

test('journeys load compact playbooks instead of a specialist-skill library', async () => {
  for (const journey of JOURNEYS) {
    const content = await readFile(path.join(root, 'entry-skills', journey, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(content, /skills\//);
  }
  const playbooks = (await readdir(path.join(root, 'playbooks'))).filter((file) => file.endsWith('.md'));
  assert.ok(playbooks.length >= 7);
  assert.ok(playbooks.includes('radical-product.md'));
});
