import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { redactText } from '../src/redact.mjs';
import { verifyWorkspace } from '../src/verify.mjs';

test('redaction removes common tokens, assignments, and private keys while preserving allowlisted examples', () => {
  const input = [
    'github=ghp_abcdefghijklmnopqrstuvwxyz1234567890',
    'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz1234567890',
    '-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----',
    'safe=EXAMPLE_TOKEN',
  ].join('\n');

  const result = redactText(input, { allowlist: ['EXAMPLE_TOKEN'] });

  assert.doesNotMatch(result.text, /ghp_|sk-|abc123/);
  assert.match(result.text, /\[REDACTED:GITHUB_TOKEN\]/);
  assert.match(result.text, /\[REDACTED:PRIVATE_KEY\]/);
  assert.match(result.text, /EXAMPLE_TOKEN/);
  assert.ok(result.matches >= 3);
});

test('verification redacts command output before writing the report', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-redact-report-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const secret = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
  const commands = [{
    command: `"${process.execPath}" -e "console.log('${secret}')"`,
    category: 'test',
    confidence: 'detected',
    source: 'fixture',
  }];

  const report = await verifyWorkspace({ workspace: root, commands, run: true });
  const persisted = await readFile(path.join(root, '.codex-orchestrator', 'reports', 'verification-latest.json'), 'utf8');

  assert.equal(report.status, 'passed');
  assert.doesNotMatch(persisted, new RegExp(secret));
  assert.match(persisted, /REDACTED:GITHUB_TOKEN/);
});
