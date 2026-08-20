import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ForgeMindError } from './errors.mjs';
import { artifactMetadata, artifactStatePath } from './artifact-store.mjs';
import { writeJsonAtomic } from './io.mjs';
import { publishProjectDocument } from './project-documents.mjs';
import { loadDesignContracts } from './design-fidelity-contract.mjs';
import { compareDesignImages } from './design-fidelity-diff.mjs';
import { captureBrowserScreenshot } from './visual-qa.mjs';
import { loadControlContract } from './design-fidelity-controls.mjs';
import { verifyControlContract } from './design-fidelity-control-receipts.mjs';
import { loadProductDesignDraft } from './design-fidelity-drafts.mjs';

export const ALLOWED_UI_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.html', '.jsx', '.tsx', '.vue', '.svelte', '.svg', '.png', '.jpg', '.jpeg', '.webp'];
export function isAllowedUiEdit(file) { const normalized = String(file).replaceAll('\\', '/').toLowerCase(); return !/(^|\/)(package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|\.env[^/]*|terraform|infra|deploy|payment|identity)(\/|$)/.test(normalized) && ALLOWED_UI_EXTENSIONS.some((extension) => normalized.endsWith(extension)); }

export async function runDesignFidelity({ workspace, references, route, viewport, thresholdPercent, maxIterations, capture, controlContractId, controlObservations = [], draftId }) {
  if (artifactMetadata().artifactMode === 'none') throw new ForgeMindError('FM_DESIGN_FIDELITY_ARTIFACTS_REQUIRED', 'Design Fidelity requires workspace artifacts for its measured correction loop.');
  const draft = draftId ? await loadProductDesignDraft({ workspace, draftId }) : null;
  if (draftId && !draft) throw new ForgeMindError('FM_DESIGN_FIDELITY_DRAFT_NOT_FOUND', `Selected Product Design draft not found: ${draftId}.`);
  const { contracts, gaps } = await loadDesignContracts({ workspace, references: draft?.referencePath ?? references, route: draft?.route ?? route, viewport: draft?.viewport ?? viewport, thresholdPercent, maxIterations });
  const results = []; const corrections = [];
  for (const contract of contracts) {
    const screenshot = artifactStatePath(workspace, 'design-fidelity', 'screenshots', `${contract.id}.png`);
    await mkdir(path.dirname(screenshot), { recursive: true });
    if (capture) await capture({ contract, output: screenshot });
    else await captureBrowserScreenshot({ workspace, url: contract.route, output: screenshot, label: contract.id, viewport: contract.viewport === 'mobile' ? '390x844' : '1440x900' });
    const diff = artifactStatePath(workspace, 'design-fidelity', 'diffs', `${contract.id}.png`);
    try { const comparison = await compareDesignImages({ baseline: path.resolve(workspace, contract.referencePath), candidate: screenshot, output: diff }); const status = comparison.differencePercent <= contract.thresholdPercent ? 'matched' : 'needs-correction'; results.push({ ...contract, screenshot: relative(workspace, screenshot), diff: relative(workspace, diff), comparison, status }); if (status === 'needs-correction') corrections.push({ contractId: contract.id, changedBounds: comparison.changedBounds, allowedExtensions: ALLOWED_UI_EXTENSIONS, reason: `${comparison.differencePercent.toFixed(2)}% differs from reference.` }); } catch { gaps.push({ code: 'FM_DESIGN_FIDELITY_IMAGE_INVALID', contractId: contract.id, message: 'Reference or captured screenshot is not a compatible PNG.' }); }
  }
  const controlContract = controlContractId ? await loadControlContract({ workspace, contractId: controlContractId }) : null;
  const controlEvidence = controlContract ? verifyControlContract({ contract: controlContract, observations: controlObservations }) : { receipts: [], gaps: [] };
  const status = gaps.length ? 'blocked' : results.every(({ status }) => status === 'matched') && !controlEvidence.gaps.length ? 'matched' : 'needs-correction';
  const report = { schemaVersion: 1, status, draft: draft ? { id: draft.id, source: draft.source, selectedBy: draft.selectedBy, sha256: draft.sha256 } : null, contracts: results, corrections, gaps, controlEvidence: controlEvidence.receipts, controlGaps: controlEvidence.gaps, generatedAt: new Date().toISOString(), errors: [] };
  await writeJsonAtomic(artifactStatePath(workspace, 'design-fidelity', 'report-latest.json'), report);
  await publishProjectDocument({ workspace, name: 'design-fidelity-report.md', title: 'ForgeMind Design Fidelity Report', body: render(report) });
  return { ...report, evidencePath: '.codex-orchestrator/design-fidelity/report-latest.json', projectDocuments: ['docs/forgemind/design-fidelity-report.md'] };
}
export async function getDesignFidelityStatus({ workspace }) { try { return JSON.parse(await readFile(artifactStatePath(workspace, 'design-fidelity', 'report-latest.json'), 'utf8')); } catch (error) { if (error?.code === 'ENOENT') return { schemaVersion: 1, status: 'missing', errors: [] }; throw error; } }
function relative(root, target) { return path.relative(root, target).replaceAll('\\', '/'); }
function render(report) { return `Status: ${report.status}\n\n## Contracts\n\n${report.contracts.map((item) => `- ${item.referencePath}: ${item.comparison.differencePercent.toFixed(2)}% (${item.status})`).join('\n') || 'None'}\n\n## Control evidence\n\n${report.controlEvidence.map((item) => `- ${item.role}: ${item.name}`).join('\n') || 'None'}\n\n## Control gaps\n\n${report.controlGaps.map((item) => `- ${item.message}`).join('\n') || 'None'}\n\n## Corrections\n\n${report.corrections.map((item) => `- ${item.contractId}: ${item.reason}`).join('\n') || 'None'}`; }
