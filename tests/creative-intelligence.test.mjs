import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('Explore consolidates creative intelligence and existing-app MVP discovery', async () => {
  const explore = await readFile(path.join(root, 'entry-skills', 'forgemind-explore', 'SKILL.md'), 'utf8');
  const methods = await readFile(path.join(root, 'playbooks', 'creative-methods.md'), 'utf8');
  const innovation = await readFile(path.join(root, 'playbooks', 'discovery-innovation.md'), 'utf8');
  assert.match(explore, /existing app/i);
  assert.match(explore, /portfolio rather than an idea dump/i);
  assert.match(methods, /human-centered|lateral alternatives/i);
  assert.match(innovation, /kill condition/i);
});

test('Build preserves the always-available bounded YOLO path', async () => {
  const build = await readFile(path.join(root, 'entry-skills', 'forgemind-build', 'SKILL.md'), 'utf8');
  const yolo = await readFile(path.join(root, 'playbooks', 'delivery-yolo.md'), 'utf8');
  assert.match(build, /YOLO is always available/i);
  assert.match(build, /rollback/i);
  assert.match(yolo, /rapid MVP/i);
});

test('Plan and Verify preserve launch and tester decision gates', async () => {
  const plan = await readFile(path.join(root, 'entry-skills', 'forgemind-plan', 'SKILL.md'), 'utf8');
  const verify = await readFile(path.join(root, 'entry-skills', 'forgemind-verify', 'SKILL.md'), 'utf8');
  assert.match(plan, /forgemind launch-mvp/i);
  assert.match(verify, /target-user, functional, accessibility, and adversarial/i);
  assert.match(verify, /scale, iterate, or stop/i);
});
