import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { resolvePluginRoot } from '../src/paths.mjs';

const CREATIVE_SKILLS = [
  'creative-ideation', 'human-centered-design', 'systematic-problem-solving', 'lateral-solution-lab',
  'opportunity-design', 'product-narrative', 'presentation-architecture', 'innovation-delivery-lab',
];

test('creative intelligence workflows are discoverable and explicit-only', async () => {
  const root = await resolvePluginRoot();
  for (const skill of CREATIVE_SKILLS) {
    const directory = path.join(root, 'skills', skill);
    const instructions = await readFile(path.join(directory, 'SKILL.md'), 'utf8');
    const policy = await readFile(path.join(directory, 'agents', 'openai.yaml'), 'utf8');
    assert.match(instructions, new RegExp(`name: ${skill}`));
    assert.match(instructions, /^Primary journey: \*\*(Discover|Design|Build|Verify|Release|Learn)\*\*$/m);
    assert.match(policy, /allow_implicit_invocation: false/);
  }
});

test('explicit YOLO requests remain an automatic rapid-MVP path', async () => {
  const root = await resolvePluginRoot();
  const instructions = await readFile(path.join(root, 'skills', 'yolo-feature', 'SKILL.md'), 'utf8');
  const policy = await readFile(path.join(root, 'skills', 'yolo-feature', 'agents', 'openai.yaml'), 'utf8');
  assert.match(instructions, /fast MVP/i);
  assert.match(instructions, /always selects this workflow/i);
  assert.match(policy, /allow_implicit_invocation: true/);
});

test('idea-to-MVP is the focused entry point for existing-app opportunity work', async () => {
  const root = await resolvePluginRoot();
  const instructions = await readFile(path.join(root, 'skills', 'idea-to-mvp', 'SKILL.md'), 'utf8');
  const orchestrator = await readFile(path.join(root, 'skills', 'delivery-orchestrator', 'SKILL.md'), 'utf8');
  assert.match(instructions, /existing app/i);
  assert.match(instructions, /market alternatives/i);
  assert.match(orchestrator, /start with `idea-to-mvp`/i);
});

test('three front doors are implicit while internal routing stays explicit', async () => {
  const root = await resolvePluginRoot();
  for (const skill of ['forgemind-explore', 'forgemind-build', 'forgemind-guide']) {
    const policy = await readFile(path.join(root, 'skills', skill, 'agents', 'openai.yaml'), 'utf8');
    assert.match(policy, /allow_implicit_invocation: true/);
  }
  for (const skill of ['autonomous-orchestrator', 'guided-start', 'skill-router']) {
    const policy = await readFile(path.join(root, 'skills', skill, 'agents', 'openai.yaml'), 'utf8');
    assert.match(policy, /allow_implicit_invocation: false/);
  }
});
