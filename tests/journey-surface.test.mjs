import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const PUBLIC_JOURNEYS = ['forgemind-commands', 'forgemind-compass', 'forgemind-guide', 'forgemind-innovate', 'forgemind-xray'];
const INTERNAL_JOURNEYS = ['forgemind-spark', 'forgemind-evolve', 'forgemind-venture', 'forgemind-council', 'forgemind-ship', 'forgemind-leap', 'forgemind-autopilot', 'forgemind-portfolio', 'forgemind-transform', 'forgemind-twin', 'forgemind-evolve-ui', 'forgemind-growth', 'forgemind-design-fidelity'];

test('Marketplace exposes the compact ForgeMind command surface while retaining internal journeys', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.skills, './skills/');
  const entries = await readdir(path.join(root, 'skills'), { withFileTypes: true });
  const journeys = [];
  for (const entry of entries.filter((entry) => entry.isDirectory())) {
    try { await readFile(path.join(root, 'skills', entry.name, 'SKILL.md'), 'utf8'); journeys.push(entry.name); } catch {}
  }
  assert.deepEqual(journeys.sort(), [...PUBLIC_JOURNEYS].sort());
  for (const journey of PUBLIC_JOURNEYS) {
    const instructions = await readFile(path.join(root, 'skills', journey, 'SKILL.md'), 'utf8');
    const ui = await readFile(path.join(root, 'skills', journey, 'agents', 'openai.yaml'), 'utf8');
    assert.match(instructions, new RegExp(`name: ${journey}`));
    assert.match(ui, new RegExp(`\\$${journey}`));
    if (journey === 'forgemind-compass') assert.match(instructions, /zero-input-defaults\.md/i);
  }
  for (const journey of INTERNAL_JOURNEYS) await readFile(path.join(root, 'playbooks', 'internal-journeys', journey, 'SKILL.md'), 'utf8');
  assert.match(await readFile(path.join(root, 'docs', 'HIERARCHY.md'), 'utf8'), /Compass[\s\S]*Guide[\s\S]*Innovate[\s\S]*Commands[\s\S]*Xray/);
});

test('zero-input defaults support Compass without treating assumptions as facts', async () => {
  const defaults = await readFile(path.join(root, 'playbooks', 'zero-input-defaults.md'), 'utf8');
  assert.match(defaults, /## Compass/);
  assert.match(defaults, /never as facts/i);
  assert.match(defaults, /hard safety boundary/i);
});

test('Compass is the sole implicit public journey', async () => {
  for (const journey of PUBLIC_JOURNEYS) {
    const ui = await readFile(path.join(root, 'skills', journey, 'agents', 'openai.yaml'), 'utf8');
    const expected = journey === 'forgemind-compass';
    assert.match(ui, new RegExp(`allow_implicit_invocation: ${expected}`));
  }
});

test('Xray remains an explicit-only primary journey with internal Browser orchestration and canonical CLI evidence', async () => {
  const instructions = await readFile(path.join(root, 'skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const distributionInstructions = await readFile(path.join(root, 'plugins', 'forgemind', 'skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const ui = await readFile(path.join(root, 'skills', 'forgemind-xray', 'agents', 'openai.yaml'), 'utf8');
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

test('Innovate is explicit and runs the SaaS AI Opportunity Engine', async () => {
  const instructions = await readFile(path.join(root, 'skills', 'forgemind-innovate', 'SKILL.md'), 'utf8');
  const ui = await readFile(path.join(root, 'skills', 'forgemind-innovate', 'agents', 'openai.yaml'), 'utf8');
  assert.match(instructions, /forgemind\.mjs innovation saas/);
  assert.match(instructions, /AI-central|AI-central/i);
  assert.match(instructions, /do not.*contact customers|does not contact customers/i);
  assert.match(ui, /allow_implicit_invocation: false/);
});

test('Commands is explicit and makes the internal specialist routes discoverable', async () => {
  const instructions = await readFile(path.join(root, 'skills', 'forgemind-commands', 'SKILL.md'), 'utf8');
  const ui = await readFile(path.join(root, 'skills', 'forgemind-commands', 'agents', 'openai.yaml'), 'utf8');
  for (const label of ['Leap', 'Spark', 'Venture', 'Growth']) assert.match(instructions, new RegExp(label));
  assert.match(instructions, /Do not expose.*separate Marketplace skills/i);
  assert.match(ui, /allow_implicit_invocation: false/);
});
