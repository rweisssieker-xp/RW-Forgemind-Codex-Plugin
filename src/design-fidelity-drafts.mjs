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

export async function createProductDesignProposals({ workspace, inputs, route, viewport = 'desktop', goal = null }) {
  if (artifactMetadata().artifactMode === 'none' || !isSafeBrowserTarget(route) || !VIEWPORTS.has(viewport)) throw invalidProposals();
  const values = String(inputs ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  if (values.length !== 3) throw invalidProposals();
  const imported = [];
  for (const [index, input] of values.entries()) {
    let source;
    try {
      source = assertContained(workspace, path.resolve(workspace, input));
      if (!(await stat(source)).isFile() || !/\.png$/i.test(source)) throw invalidProposals();
    } catch (error) { if (error?.code === 'FM_DESIGN_FIDELITY_PROPOSALS_INVALID') throw error; throw invalidProposals(); }
    const bytes = await readFile(source); const sha256 = createHash('sha256').update(bytes).digest('hex');
    imported.push({ source, sha256, bytes, index });
  }
  if (new Set(imported.map((item) => item.sha256)).size !== 3) throw invalidProposals();
  const id = `proposal-set-${createHash('sha256').update(imported.map((item) => item.sha256).join('|')).digest('hex').slice(0, 16)}`;
  const proposals = [];
  for (const item of imported) {
    const name = `proposal-${item.index + 1}.png`;
    const target = artifactStatePath(workspace, 'design-fidelity', 'proposals', id, name);
    await mkdir(path.dirname(target), { recursive: true }); await copyFile(item.source, target);
    proposals.push({ id: `proposal-${item.index + 1}`, sha256: item.sha256, referencePath: `.codex-orchestrator/design-fidelity/proposals/${id}/${name}` });
  }
  const result = { schemaVersion: 1, id, status: 'awaiting-selection', source: 'product-design', goal, route, viewport, proposals, selectedProposalId: null, generatedAt: new Date().toISOString() };
  await writeJsonAtomic(artifactStatePath(workspace, 'design-fidelity', 'proposals', id, 'manifest.json'), result);
  return result;
}

export async function selectProductDesignProposal({ workspace, proposalSetId, proposalId }) {
  const manifestPath = artifactStatePath(workspace, 'design-fidelity', 'proposals', String(proposalSetId), 'manifest.json');
  let set;
  try { set = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { throw new ForgeMindError('FM_DESIGN_FIDELITY_PROPOSAL_UNKNOWN', 'Select a proposal from an existing Product Design proposal set.'); }
  const proposal = set.proposals.find((item) => item.id === proposalId);
  if (!proposal || (set.selectedProposalId && set.selectedProposalId !== proposalId)) throw new ForgeMindError('FM_DESIGN_FIDELITY_PROPOSAL_UNKNOWN', 'Select a proposal ID from the current Product Design proposal set.');
  const draft = await importProductDesignDraft({ workspace, input: proposal.referencePath, route: set.route, viewport: set.viewport });
  const selection = { schemaVersion: 1, id: `selection-${proposal.sha256.slice(0, 16)}`, proposalSetId: set.id, proposalId, selectedBy: 'user', selectedAt: new Date().toISOString(), draftId: draft.id, sha256: proposal.sha256 };
  set.status = 'selected'; set.selectedProposalId = proposalId; await writeJsonAtomic(manifestPath, set);
  await writeJsonAtomic(artifactStatePath(workspace, 'design-fidelity', 'selections', `${selection.id}.json`), selection);
  return { selection, draft };
}

export async function loadProductDesignProposals({ workspace, proposalSetId }) {
  try { return JSON.parse(await readFile(artifactStatePath(workspace, 'design-fidelity', 'proposals', String(proposalSetId), 'manifest.json'), 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
}

export async function applySelectedProductDesignProposal({ workspace, proposalSetId, proposalId }) {
  const set = await loadProductDesignProposals({ workspace, proposalSetId });
  const proposal = set?.proposals.find((item) => item.id === proposalId);
  if (!proposal || set.selectedProposalId !== proposalId) throw new ForgeMindError('FM_DESIGN_FIDELITY_SELECTION_REQUIRED', 'Select a Product Design proposal before applying it.');
  const selection = { proposalSetId: set.id, proposalId, draftId: `draft-${proposal.sha256.slice(0, 16)}`, referencePath: proposal.referencePath };
  return { schemaVersion: 1, status: 'ready-to-apply', selection, draft: await loadProductDesignDraft({ workspace, draftId: selection.draftId }), allowedExtensions: ['.css', '.scss', '.sass', '.less', '.html', '.jsx', '.tsx', '.vue', '.svelte', '.svg', '.png', '.jpg', '.jpeg', '.webp'], nextAction: `Run design-fidelity run --draft-id ${selection.draftId} with an explicit control contract.` , errors: [] };
}

export async function loadProductDesignDraft({ workspace, draftId }) {
  try { return JSON.parse(await readFile(artifactStatePath(workspace, 'design-fidelity', 'drafts', `${draftId}.json`), 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
}

function invalidDraft() { return new ForgeMindError('FM_DESIGN_FIDELITY_DRAFT_INVALID', 'A user-selected local Product Design PNG and safe local/test route are required.'); }
function invalidProposals() { return new ForgeMindError('FM_DESIGN_FIDELITY_PROPOSALS_INVALID', 'Exactly three unique local Product Design PNGs and a safe local/test route are required.'); }
