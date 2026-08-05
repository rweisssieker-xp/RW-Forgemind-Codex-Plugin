import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildCapabilityManifest } from '../src/capabilities.mjs';
import { composeTeam } from '../src/composition.mjs';
import { createDelegationPlan } from '../src/delegation.mjs';
import { createWorkspaceSkill } from '../src/skill-factory.mjs';
import { createIdeaToMvpBrief } from '../src/idea-to-mvp.mjs';

test('advanced workflow records remain local, bounded, and reviewable', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-advanced-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const capabilities = await buildCapabilityManifest({ workspace: root });
  const composition = await composeTeam({ workspace: root, goal: 'Ship and test a product MVP', risk: 'medium' });
  const delegation = await createDelegationPlan({ workspace: root, goal: 'Ship a verified MVP', budget: 3 });
  const skill = await createWorkspaceSkill({ workspace: root, name: 'release-note-draft', description: 'draft concise release notes', journey: 'Release' });
  const ideaToMvp = await createIdeaToMvpBrief({ workspace: root, goal: 'Reduce onboarding friction' });
  assert.ok(capabilities.missing.includes('documentation'));
  assert.ok(composition.roles.some((role) => role.id === 'delivery'));
  assert.equal(delegation.execution, 'plan-only');
  assert.match(await readFile(path.join(skill.path, 'agents', 'openai.yaml'), 'utf8'), /allow_implicit_invocation: false/);
  assert.deepEqual(ideaToMvp.routing.slice(0, 3), ['discovery-operations', 'creative-ideation', 'opportunity-design']);
});
