import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-compass', 'forgemind-spark', 'forgemind-evolve', 'forgemind-venture', 'forgemind-council', 'forgemind-ship', 'forgemind-leap'];

test('Marketplace exposes exactly seven primary journeys while retaining internal modules', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.skills, './entry-skills/');
  const entries = await readdir(path.join(root, 'entry-skills'), { withFileTypes: true });
  const journeys = [];
  for (const entry of entries.filter((entry) => entry.isDirectory())) {
    try { await readFile(path.join(root, 'entry-skills', entry.name, 'SKILL.md'), 'utf8'); journeys.push(entry.name); } catch {}
  }
  assert.deepEqual(journeys.sort(), [...JOURNEYS].sort());
  for (const journey of JOURNEYS) {
    const instructions = await readFile(path.join(root, 'entry-skills', journey, 'SKILL.md'), 'utf8');
    const ui = await readFile(path.join(root, 'entry-skills', journey, 'agents', 'openai.yaml'), 'utf8');
    assert.match(instructions, new RegExp(`name: ${journey}`));
    assert.match(ui, new RegExp(`\\$${journey}`));
    assert.match(instructions, /zero-input-defaults\.md/i);
    assert.match(ui, /Zero-Input Default/);
  }
  assert.match(await readFile(path.join(root, 'docs', 'HIERARCHY.md'), 'utf8'), /Compass[\s\S]*Spark[\s\S]*Evolve[\s\S]*Venture[\s\S]*Council[\s\S]*Ship[\s\S]*Leap/);
});

test('zero-input defaults cover every primary journey without treating assumptions as facts', async () => {
  const defaults = await readFile(path.join(root, 'playbooks', 'zero-input-defaults.md'), 'utf8');
  for (const name of ['Compass', 'Spark', 'Evolve', 'Venture', 'Council', 'Ship', 'Leap']) assert.match(defaults, new RegExp(`## ${name}`));
  assert.match(defaults, /never as facts/i);
  assert.match(defaults, /hard safety boundary/i);
});

test('Compass is the sole implicit journey and routes natural-language requests to specialist journeys', async () => {
  for (const journey of JOURNEYS) {
    const ui = await readFile(path.join(root, 'entry-skills', journey, 'agents', 'openai.yaml'), 'utf8');
    const expected = journey === 'forgemind-compass';
    assert.match(ui, new RegExp(`allow_implicit_invocation: ${expected}`));
  }
});
