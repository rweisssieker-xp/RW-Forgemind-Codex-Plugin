import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { resolvePluginRoot } from '../src/paths.mjs';

const CAPABILITIES = [
  ['trust', 'agent-trust-v1.schema.json', 'forgemind-agent-trust-v1'], ['strategy', 'executable-strategy-v1.schema.json', 'forgemind-executable-strategy-v1'],
  ['genome', 'engineering-genome-v1.schema.json', 'forgemind-engineering-genome-v1'], ['flight', 'flight-event-v1.schema.json', null],
  ['tournament', 'future-tournament-v1.schema.json', 'forgemind-future-tournament-v1'], ['shrink', 'shrink-plan-v1.schema.json', 'forgemind-self-shrinking-software-v1'],
  ['loop', 'product-loop-v1.schema.json', 'forgemind-autonomous-product-loop-v1'], ['escrow', 'evidence-escrow-v1.schema.json', 'forgemind-evidence-escrow-v1'],
  ['federate', 'federated-bundle-v1.schema.json', 'forgemind-federated-learning-bundle-v1'],
];

test('all nine Trust Fabric capabilities ship executable CLI coverage and public schemas', async () => {
  const root = await resolvePluginRoot();
  const guide = await readFile(path.join(root, 'playbooks', 'trust-fabric.md'), 'utf8');
  for (const [capability, schema, protocol] of CAPABILITIES) {
    assert.match(guide, new RegExp(`forge <capability>|${capability}`));
    const parsed = JSON.parse(await readFile(path.join(root, 'schemas', schema), 'utf8'));
    assert.equal(parsed.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(parsed.type, 'object');
    assert.ok(parsed.required.includes('digest'));
    if (protocol) {
      const declared = parsed.properties.protocol.const ?? parsed.properties.protocol.enum;
      assert.ok(Array.isArray(declared) ? declared.includes(protocol) : declared === protocol, `${schema} protocol`);
    }
  }
});

test('every Trust Fabric input template is valid JSON and carries no generated digest', async () => {
  const root = await resolvePluginRoot();
  const files = (await readdir(path.join(root, 'templates', 'forge'))).filter((file) => file.endsWith('.json'));
  assert.ok(files.length >= 10);
  for (const file of files) assert.equal(Object.hasOwn(JSON.parse(await readFile(path.join(root, 'templates', 'forge', file), 'utf8')), 'digest'), false, file);
});

test('release metadata and documentation expose the complete nine-capability surface', async () => {
  const root = await resolvePluginRoot();
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const guide = await readFile(path.join(root, 'docs', 'TRUST_FABRIC.md'), 'utf8');
  assert.equal(pkg.version, manifest.version.split('+')[0]);
  for (const [capability] of CAPABILITIES) assert.match(guide, new RegExp(`\`${capability}(?: |\`)`));
  assert.match(guide, /not a cryptographic identity signature/i);
  assert.match(guide, /not claim formal differential privacy/i);
  assert.match(guide, /never holds or transfers money/i);
});
