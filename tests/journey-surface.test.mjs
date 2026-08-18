import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const JOURNEYS = ['forgemind-start', 'forgemind-compass', 'forgemind-spark', 'forgemind-evolve', 'forgemind-venture', 'forgemind-council', 'forgemind-ship', 'forgemind-leap', 'forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth', 'forgemind-xray'];

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
    if (!['forgemind-start', 'forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth', 'forgemind-xray'].includes(journey)) { assert.match(instructions, /zero-input-defaults\.md/i); assert.match(ui, /Zero-Input Default/); }
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

test('Xray remains an explicit-only primary journey with internal Browser orchestration and canonical CLI evidence', async () => {
  const instructions = await readFile(path.join(root, 'entry-skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const distributionInstructions = await readFile(path.join(root, 'plugins', 'forgemind', 'entry-skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const ui = await readFile(path.join(root, 'entry-skills', 'forgemind-xray', 'agents', 'openai.yaml'), 'utf8');
  assert.match(instructions, /node <plugin-root>\/bin\/forgemind\.mjs xray run/);
  assert.match(instructions, /MUST execute.*xray run/i);
  assert.match(instructions, /Do not return a test plan, score, or report before the command has completed/i);
  assert.match(instructions, /execution receipt/i);
  assert.match(instructions, /--test-url <loopback-url>/);
  assert.match(instructions, /Playwright/);
  assert.match(instructions, /ADB/);
  assert.match(instructions, /FM_XRAY_PLAYWRIGHT_UNAVAILABLE/);
  assert.match(instructions, /FM_XRAY_ANDROID_EMULATOR_UNAVAILABLE/);
  assert.match(instructions, /internal Codex Browser/);
  assert.match(instructions, /in-app Browser binding/);
  assert.match(instructions, /loopback-url|reserved `\.test` host/i);
  assert.match(instructions, /does not submit/i);
  assert.match(instructions, /payment.*deploy.*credential.*consequential/i);
  assert.match(instructions, /coverageArea.*controlLabel.*reproduction/i);
  assert.match(instructions, /non-destructive interactions/i);
  assert.match(instructions, /provide complete.*--gui-receipts/i);
  assert.match(instructions, /Only that second CLI result is canonical/i);
  assert.match(instructions, /discovery pass[\s\S]*criticalFlows/i);
  assert.match(instructions, /each safe route[\s\S]*desktop[\s\S]*mobile/i);
  assert.match(instructions, /executor.*internal-browser/i);
  assert.match(instructions, /continue command and API tests/i);
  assert.match(instructions, /Improvement proposals/i);
  assert.equal(distributionInstructions, instructions);
  assert.match(ui, /allow_implicit_invocation: false/);
});
