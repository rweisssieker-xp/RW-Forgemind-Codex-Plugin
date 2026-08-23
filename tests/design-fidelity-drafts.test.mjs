import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { activateArtifactStore, deactivateArtifactStore } from '../src/artifact-store.mjs';
import { createProductDesignProposals, importProductDesignDraft, selectProductDesignProposal } from '../src/design-fidelity-drafts.mjs';
import { encodeRgbaPng } from '../src/design-fidelity-diff.mjs';

test('Product Design import stores the user-selected PNG as immutable Design Fidelity input', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-design-draft-'));
  const selected = path.join(workspace, 'selected-home.png');
  const source = encodeRgbaPng({ width: 1, height: 1, pixels: Buffer.from([255, 0, 0, 255]) });
  await writeFile(selected, source);
  await activateArtifactStore({ workspace });
  t.after(async () => { await deactivateArtifactStore(); await rm(workspace, { recursive: true, force: true }); });

  const draft = await importProductDesignDraft({ workspace, input: 'selected-home.png', route: 'http://127.0.0.1:4173/', viewport: 'desktop' });

  assert.equal(draft.source, 'product-design');
  assert.equal(draft.selectedBy, 'user');
  assert.match(draft.id, /^draft-[a-f0-9]{16}$/);
  await writeFile(selected, Buffer.from('changed after selection'));
  assert.deepEqual(await readFile(path.join(workspace, draft.referencePath)), source);
});

test('Product Design import rejects inferred or remote draft references', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-design-draft-invalid-'));
  await activateArtifactStore({ workspace });
  t.after(async () => { await deactivateArtifactStore(); await rm(workspace, { recursive: true, force: true }); });

  await assert.rejects(
    importProductDesignDraft({ workspace, input: 'https://example.test/selected.png', route: 'http://127.0.0.1:4173/' }),
    { code: 'FM_DESIGN_FIDELITY_DRAFT_INVALID' },
  );
});

test('Product Design stores exactly three unique proposals before an explicit selection', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-design-proposals-'));
  await activateArtifactStore({ workspace });
  t.after(async () => { await deactivateArtifactStore(); await rm(workspace, { recursive: true, force: true }); });
  for (const [name, color] of [['a.png', 255], ['b.png', 128], ['c.png', 0]]) await writeFile(path.join(workspace, name), encodeRgbaPng({ width: 1, height: 1, pixels: Buffer.from([color, 0, 0, 255]) }));

  const set = await createProductDesignProposals({ workspace, inputs: 'a.png,b.png,c.png', route: 'http://127.0.0.1:4173/', goal: 'Improve CRM onboarding' });

  assert.equal(set.status, 'awaiting-selection');
  assert.equal(set.proposals.length, 3);
  assert.equal(new Set(set.proposals.map((item) => item.sha256)).size, 3);
  const selected = await selectProductDesignProposal({ workspace, proposalSetId: set.id, proposalId: set.proposals[1].id });
  assert.equal(selected.selection.selectedBy, 'user');
  assert.equal(selected.draft.selectedBy, 'user');
});
