import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { activateArtifactStore, deactivateArtifactStore } from '../src/artifact-store.mjs';
import { importProductDesignDraft } from '../src/design-fidelity-drafts.mjs';
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
