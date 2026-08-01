import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { DEFAULT_POLICY, mergePolicies } from './policy.mjs';

export async function loadConfig(workspace, options = {}) {
  const shared = await readConfig(path.join(workspace, 'forgemind.config.json'));
  const personal = await readConfig(path.join(workspace, '.forgemind.local.json'));
  const merged = mergePolicies(DEFAULT_POLICY, shared?.policy, personal?.policy, {
    approvedWeakening: Boolean(options.approvedWeakening),
  });
  return {
    schemaVersion: 1,
    policy: merged.policy,
    policyRejections: merged.rejections,
    redaction: {
      allowlist: [...new Set([...(shared?.redaction?.allowlist ?? []), ...(personal?.redaction?.allowlist ?? [])])],
    },
    sources: {
      shared: shared ? 'forgemind.config.json' : null,
      personal: personal ? '.forgemind.local.json' : null,
    },
  };
}

async function readConfig(candidate) {
  let content;
  try {
    content = await readFile(candidate, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  let config;
  try {
    config = JSON.parse(content);
  } catch (error) {
    throw new ForgeMindError('FM_CONFIG_INVALID', `${path.basename(candidate)} is not valid JSON: ${error.message}`);
  }
  if (config.schemaVersion !== 1) {
    throw new ForgeMindError('FM_CONFIG_INVALID', `${path.basename(candidate)} must use schemaVersion 1`);
  }
  const unsupported = Object.keys(config).filter((key) => !['schemaVersion', 'policy', 'redaction'].includes(key));
  if (unsupported.length) {
    throw new ForgeMindError('FM_CONFIG_INVALID', `${path.basename(candidate)} has unsupported fields: ${unsupported.join(', ')}`);
  }
  return config;
}
