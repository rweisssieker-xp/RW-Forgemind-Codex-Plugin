import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { resolvePluginRoot } from '../src/paths.mjs';

const CAPABILITIES = [
  ['trust', 'agent-trust-protocol', 'agent-trust-v1.schema.json', 'forgemind-agent-trust-v1'],
  ['strategy', 'strategy-to-code-compiler', 'executable-strategy-v1.schema.json', 'forgemind-executable-strategy-v1'],
  ['genome', 'engineering-genome', 'engineering-genome-v1.schema.json', 'forgemind-engineering-genome-v1'],
  ['flight', 'delivery-flight-recorder', 'flight-event-v1.schema.json', null],
  ['tournament', 'parallel-future-tournament', 'future-tournament-v1.schema.json', 'forgemind-future-tournament-v1'],
  ['shrink', 'self-shrinking-software', 'shrink-plan-v1.schema.json', 'forgemind-self-shrinking-software-v1'],
  ['loop', 'autonomous-product-loop', 'product-loop-v1.schema.json', 'forgemind-autonomous-product-loop-v1'],
  ['escrow', 'evidence-escrow', 'evidence-escrow-v1.schema.json', 'forgemind-evidence-escrow-v1'],
  ['federate', 'federated-learning-network', 'federated-bundle-v1.schema.json', 'forgemind-federated-learning-bundle-v1'],
];

test('all nine Trust Fabric capabilities ship a discoverable skill and public schema', async () => {
  const root = await resolvePluginRoot();
  for (const [capability, skill, schema, protocol] of CAPABILITIES) {
    const skillText = await readFile(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(skillText, new RegExp(`forge ${capability}`), skill);
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
  const directory = path.join(root, 'templates', 'forge');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.json'));
  assert.ok(files.length >= 10);
  for (const file of files) {
    const parsed = JSON.parse(await readFile(path.join(directory, file), 'utf8'));
    assert.equal(Object.hasOwn(parsed, 'digest'), false, file);
  }
});

test('release metadata and documentation expose the complete nine-capability surface', async () => {
  const root = await resolvePluginRoot();
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const guide = await readFile(path.join(root, 'docs', 'TRUST_FABRIC.md'), 'utf8');
  assert.equal(manifest.version, '1.8.0');
  assert.equal(pkg.version, manifest.version);
  for (const [capability] of CAPABILITIES) assert.match(guide, new RegExp(`\`${capability}(?: |\`)`));
  assert.match(guide, /not a cryptographic identity signature/i);
  assert.match(guide, /not claim formal differential privacy/i);
  assert.match(guide, /never holds or transfers money/i);
});
