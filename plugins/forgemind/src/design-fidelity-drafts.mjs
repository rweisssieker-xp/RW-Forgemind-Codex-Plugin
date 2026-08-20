import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { artifactMetadata, artifactStatePath } from './artifact-store.mjs';
import { writeJsonAtomic } from './io.mjs';
import { assertContained } from './paths.mjs';
import { isSafeBrowserTarget } from './xray-adapters.mjs';

const VIEWPORTS = new Set(['desktop', 'mobile']);

export async function importProductDesignDraft({ workspace, input, route, viewport = 'desktop' }) {
  if (artifactMetadata().artifactMode === 'none' || !input || /^[a-z][a-z0-9+.-]*:/i.test(input) || !isSafeBrowserTarget(route) || !VIEWPORTS.has(viewport)) throw invalidDraft();
  let source;
  try {
    source = assertContained(workspace, path.resolve(workspace, input));
    if (!(await stat(source)).isFile() || !/\.png$/i.test(source)) throw invalidDraft();
  } catch (error) {
    if (error?.code === 'FM_DESIGN_FIDELITY_DRAFT_INVALID') throw error;
    throw invalidDraft();
  }
  const bytes = await readFile(source);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const id = `draft-${sha256.slice(0, 16)}`;
  const image = artifactStatePath(workspace, 'design-fidelity', 'drafts', `${id}.png`);
  await mkdir(path.dirname(image), { recursive: true });
  await copyFile(source, image);
  const draft = { schemaVersion: 1, id, source: 'product-design', selectedBy: 'user', referencePath: `.codex-orchestrator/design-fidelity/drafts/${id}.png`, sha256, route, viewport };
  await writeJsonAtomic(artifactStatePath(workspace, 'design-fidelity', 'drafts', `${id}.json`), draft);
  return draft;
}

export async function loadProductDesignDraft({ workspace, draftId }) {
  try { return JSON.parse(await readFile(artifactStatePath(workspace, 'design-fidelity', 'drafts', `${draftId}.json`), 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
}

function invalidDraft() { return new ForgeMindError('FM_DESIGN_FIDELITY_DRAFT_INVALID', 'A user-selected local Product Design PNG and safe local/test route are required.'); }
