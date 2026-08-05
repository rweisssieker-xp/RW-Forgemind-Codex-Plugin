import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { writeJsonAtomic } from './io.mjs';
import { assertContained, resolveWorkspace } from './paths.mjs';

export async function recordVisualEvidence({ workspace, input, label, viewport = 'unspecified', now = new Date() }) {
  if (!input || !label) throw new ForgeMindError('FM_VISUAL_INVALID', 'Visual evidence requires input and label.');
  const root = await resolveWorkspace(workspace);
  const absolute = path.resolve(input);
  const info = await stat(absolute);
  if (!info.isFile()) throw new ForgeMindError('FM_VISUAL_INVALID', `Visual evidence is not a file: ${absolute}`);
  const digest = createHash('sha256').update(await readFile(absolute)).digest('hex');
  const record = { schemaVersion: 1, id: `vis_${digest.slice(0, 24)}`, recordedAt: now.toISOString(), label: String(label), viewport: String(viewport), file: path.basename(absolute), bytes: info.size, sha256: digest };
  await writeJsonAtomic(assertContained(root, path.join(root, '.codex-orchestrator', 'visual-qa', `${record.id}.json`)), record);
  return { schemaVersion: 1, status: 'recorded', evidence: record, errors: [] };
}
