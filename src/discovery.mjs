import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { canonicalJson, writeTextAtomic } from './io.mjs';
import { assertContained, resolveWorkspace } from './paths.mjs';

export async function createExperiment({ workspace, experiment, now = new Date() }) {
  const root = await resolveWorkspace(workspace);
  for (const field of ['title', 'hypothesis', 'metric']) if (!String(experiment[field] ?? '').trim()) throw new ForgeMindError('FM_EXPERIMENT_INVALID', `Experiment field is required: ${field}`);
  const normalized = { schemaVersion: 1, id: `exp_${createHash('sha256').update(canonicalJson({ ...experiment, now: now.toISOString() })).digest('hex').slice(0, 24)}`, createdAt: now.toISOString(), title: String(experiment.title), hypothesis: String(experiment.hypothesis), metric: String(experiment.metric), audience: String(experiment.audience ?? 'unspecified'), status: 'proposed', decision: null, evidence: split(experiment.evidence) };
  const records = await listExperiments({ workspace: root });
  records.push(normalized);
  await save(root, records);
  return { schemaVersion: 1, status: 'created', experiment: normalized, errors: [] };
}

export async function decideExperiment({ workspace, id, decision, evidence, now = new Date() }) {
  if (!['pivot', 'patch', 'persevere', 'stop'].includes(decision)) throw new ForgeMindError('FM_EXPERIMENT_INVALID', 'Decision must be pivot, patch, persevere, or stop.');
  const root = await resolveWorkspace(workspace);
  const records = await listExperiments({ workspace: root });
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) throw new ForgeMindError('FM_EXPERIMENT_NOT_FOUND', `Experiment not found: ${id}`);
  records[index] = { ...records[index], status: 'decided', decision, decidedAt: now.toISOString(), evidence: [...new Set([...records[index].evidence, ...split(evidence)])] };
  await save(root, records);
  return { schemaVersion: 1, status: 'decided', experiment: records[index], errors: [] };
}

export async function listExperiments({ workspace }) {
  const root = await resolveWorkspace(workspace);
  try { return (await readFile(file(root), 'utf8')).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

function split(value) { return value ? String(value).split('|').map((item) => item.trim()).filter(Boolean) : []; }
function file(root) { return assertContained(root, path.join(root, '.codex-orchestrator', 'product', 'experiments.jsonl')); }
async function save(root, records) { await writeTextAtomic(file(root), `${records.map((record) => JSON.stringify(record)).join('\n')}\n`); }
