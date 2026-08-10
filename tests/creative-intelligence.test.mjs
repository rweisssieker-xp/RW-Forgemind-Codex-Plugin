import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('Evolve consolidates creative intelligence and existing-app MVP discovery', async () => {
  const explore = await readFile(path.join(root, 'entry-skills', 'forgemind-evolve', 'SKILL.md'), 'utf8');
  const methods = await readFile(path.join(root, 'playbooks', 'creative-methods.md'), 'utf8');
  const innovation = await readFile(path.join(root, 'playbooks', 'discovery-innovation.md'), 'utf8');
  assert.match(explore, /existing app/i);
  assert.match(explore, /five radical AI-central options/i);
  assert.match(methods, /human-centered|lateral alternatives/i);
  assert.match(innovation, /kill condition/i);
});

test('Ship preserves the always-available bounded YOLO path', async () => {
  const build = await readFile(path.join(root, 'entry-skills', 'forgemind-ship', 'SKILL.md'), 'utf8');
  const yolo = await readFile(path.join(root, 'playbooks', 'delivery-yolo.md'), 'utf8');
  assert.match(build, /without routine questions/i);
  assert.match(build, /irreversible migrations/i);
  assert.match(yolo, /rapid MVP/i);
});

test('Venture and Council preserve evidence and decision gates', async () => {
  const plan = await readFile(path.join(root, 'entry-skills', 'forgemind-venture', 'SKILL.md'), 'utf8');
  const verify = await readFile(path.join(root, 'entry-skills', 'forgemind-council', 'SKILL.md'), 'utf8');
  assert.match(plan, /conservative\/base\/upside scenarios/i);
  assert.match(verify, /Contrarian/i);
  assert.match(verify, /Do not invent consensus/i);
});
