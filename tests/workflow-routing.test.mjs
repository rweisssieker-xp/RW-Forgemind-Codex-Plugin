import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-guide', 'forgemind-spark', 'forgemind-product', 'forgemind-explore', 'forgemind-radical', 'forgemind-plan', 'forgemind-build', 'forgemind-complete', 'forgemind-verify', 'forgemind-learn'];

test('ten journeys are the complete skill hierarchy', async () => {
  const directories = (await readdir(path.join(root, 'entry-skills'), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(directories, [...JOURNEYS].sort());
  const guide = await readFile(path.join(root, 'entry-skills', 'forgemind-guide', 'SKILL.md'), 'utf8');
  for (const journey of JOURNEYS.filter((name) => name !== 'forgemind-guide')) assert.match(guide, new RegExp(`\\$${journey}`));
});

test('journeys load compact playbooks instead of a specialist-skill library', async () => {
  for (const journey of JOURNEYS) {
    const content = await readFile(path.join(root, 'entry-skills', journey, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(content, /skills\//);
  }
  const playbooks = (await readdir(path.join(root, 'playbooks'))).filter((file) => file.endsWith('.md'));
  assert.equal(playbooks.length, 14);
  assert.ok(playbooks.includes('radical-product.md'));
});
