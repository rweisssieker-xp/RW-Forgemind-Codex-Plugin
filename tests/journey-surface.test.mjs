import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-guide', 'forgemind-leap', 'forgemind-council', 'forgemind-venture', 'forgemind-portfolio', 'forgemind-showcase', 'forgemind-spark', 'forgemind-product', 'forgemind-explore', 'forgemind-radical', 'forgemind-plan', 'forgemind-build', 'forgemind-complete', 'forgemind-verify', 'forgemind-learn'];

test('Marketplace exposes exactly fifteen hierarchical journeys while retaining internal modules', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.skills, './entry-skills/');
  const entries = await readdir(path.join(root, 'entry-skills'), { withFileTypes: true });
  assert.deepEqual(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(), [...JOURNEYS].sort());
  for (const journey of JOURNEYS) {
    const instructions = await readFile(path.join(root, 'entry-skills', journey, 'SKILL.md'), 'utf8');
    const ui = await readFile(path.join(root, 'entry-skills', journey, 'agents', 'openai.yaml'), 'utf8');
    assert.match(instructions, new RegExp(`name: ${journey}`));
    assert.match(ui, new RegExp(`\\$${journey}`));
  }
  assert.match(await readFile(path.join(root, 'docs', 'HIERARCHY.md'), 'utf8'), /Guide[\s\S]*Leap[\s\S]*Spark[\s\S]*Product[\s\S]*Explore[\s\S]*Radical[\s\S]*Plan[\s\S]*Build[\s\S]*Complete[\s\S]*Verify[\s\S]*Learn/);
});

test('Guide is the sole implicit journey and routes natural-language requests to specialist journeys', async () => {
  for (const journey of JOURNEYS) {
    const ui = await readFile(path.join(root, 'entry-skills', journey, 'agents', 'openai.yaml'), 'utf8');
    const expected = journey === 'forgemind-guide';
    assert.match(ui, new RegExp(`allow_implicit_invocation: ${expected}`));
  }
});
