import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-compass', 'forgemind-guide', 'forgemind-innovate', 'forgemind-xray'];

test('four journeys are the complete public skill hierarchy', async () => {
  const directories = [];
  for (const entry of (await readdir(path.join(root, 'skills'), { withFileTypes: true })).filter((item) => item.isDirectory())) {
    try { await readFile(path.join(root, 'skills', entry.name, 'SKILL.md'), 'utf8'); directories.push(entry.name); } catch {}
  }
  directories.sort();
  assert.deepEqual(directories, [...JOURNEYS].sort());
  const compass = await readFile(path.join(root, 'skills', 'forgemind-compass', 'SKILL.md'), 'utf8');
  assert.doesNotMatch(compass, /\$forgemind-(?:spark|evolve|venture|council|ship|leap|autopilot|portfolio|transform|twin|growth|design-fidelity)/);
});

test('public journeys load compact playbooks instead of a specialist-skill library', async () => {
  for (const journey of JOURNEYS) {
    const content = await readFile(path.join(root, 'skills', journey, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(content, /skills\//);
  }
  const playbooks = (await readdir(path.join(root, 'playbooks'))).filter((file) => file.endsWith('.md'));
  assert.ok(playbooks.length >= 7);
  assert.ok(playbooks.includes('radical-product.md'));
});
