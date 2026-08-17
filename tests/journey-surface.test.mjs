import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-compass', 'forgemind-spark', 'forgemind-evolve', 'forgemind-venture', 'forgemind-council', 'forgemind-ship', 'forgemind-leap', 'forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth', 'forgemind-xray'];

test('Marketplace exposes the primary journeys while retaining internal modules', async () => {
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
    if (journey === 'forgemind-autopilot') {
      assert.match(instructions, /node <plugin-root>\/bin\/forgemind\.mjs autopilot start/);
      assert.doesNotMatch(instructions, /Run `forgemind autopilot start/);
    }
    if (!['forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth', 'forgemind-xray'].includes(journey)) { assert.match(instructions, /zero-input-defaults\.md/i); assert.match(ui, /Zero-Input Default/); }
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

test('Xray remains an explicit-only primary journey with the bundled runner and GUI-control protocol', async () => {
  const instructions = await readFile(path.join(root, 'entry-skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const distributionInstructions = await readFile(path.join(root, 'plugins', 'forgemind', 'entry-skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const ui = await readFile(path.join(root, 'entry-skills', 'forgemind-xray', 'agents', 'openai.yaml'), 'utf8');
  assert.match(instructions, /node <plugin-root>\/bin\/forgemind\.mjs xray run/);
  assert.match(instructions, /MUST execute.*xray run/i);
  assert.match(instructions, /Do not return a test plan, score, or report before the command has completed/i);
  assert.match(instructions, /execution receipt/i);
  assert.match(instructions, /internal Browser/);
  assert.match(instructions, /Computer Use/);
  assert.match(instructions, /MUST use the internal Browser.*every reachable/i);
  assert.match(instructions, /local or designated test environment/i);
  assert.match(instructions, /production.*payment.*deploy.*credential.*administration/i);
  assert.match(instructions, /coverageArea.*controlLabel.*reproduction/i);
  assert.match(instructions, /positive flow.*validation or error flow/i);
  assert.match(instructions, /isolated local or designated-test application data may be created or updated/i);
  assert.match(instructions, /production.*non-test application data remain immutable/i);
  assert.match(instructions, /rerun.*xray run.*--gui-receipts/i);
  assert.match(instructions, /Improvement proposals/i);
  assert.equal(distributionInstructions, instructions);
  assert.match(ui, /allow_implicit_invocation: false/);
});
