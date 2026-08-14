import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const repository = 'https://github.com/rweisssieker-xp/RW-Forgemind-Codex-Plugin';
const requiredDocs = [
  'CHANGELOG.md', 'SECURITY.md', 'SUPPORT.md', 'PRIVACY.md',
  'TERMS.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md',
];

test('release metadata uses the real project identity and consistent version', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.repository, repository);
  assert.equal(manifest.homepage, 'https://aivana-gmbh.ai/');
  assert.equal(manifest.author.name, 'Aivana GmbH');
  assert.equal(manifest.author.url, 'https://aivana-gmbh.ai/');
  assert.doesNotMatch(JSON.stringify(manifest), /example\.com|github\.com\/reinerw(?:["/])/i);
  assert.equal(manifest.version, pkg.version);
});

test('release package includes community, support, privacy, and terms documents', async () => {
  for (const file of requiredDocs) await access(path.join(root, file));
  const privacy = await readFile(path.join(root, 'PRIVACY.md'), 'utf8');
  assert.match(privacy, /local/i);
  assert.match(privacy, /retention/i);
  assert.match(privacy, /delete|deletion|remove/i);
  const support = await readFile(path.join(root, 'SUPPORT.md'), 'utf8');
  assert.match(support, /github\.com\/rweisssieker-xp\/RW-Forgemind-Codex-Plugin\/issues/);
  const security = await readFile(path.join(root, 'SECURITY.md'), 'utf8');
  assert.match(security, /security\/advisories\/new/);
});

test('marketplace policies omit screenshots when the plugin has no embedded UI', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.interface.privacyPolicyURL, 'https://aivana-gmbh.ai/Privacy');
  assert.equal(manifest.interface.termsOfServiceURL, 'https://aivana-gmbh.ai/Terms');
  assert.equal(Object.hasOwn(manifest.interface, 'screenshots'), false);
});

test('installation and release docs use the portable lifecycle commands', async () => {
  for (const file of ['README.md', 'docs/INSTALL.md', 'docs/RELEASE.md', 'docs/RUNTIME_TEST.md']) {
    const content = await readFile(path.join(root, file), 'utf8');
    assert.match(content, /node bin\/forgemind\.mjs/);
  }
  const install = await readFile(path.join(root, 'docs', 'INSTALL.md'), 'utf8');
  for (const operation of ['install', 'upgrade', 'downgrade', 'uninstall', 'rollback']) {
    assert.match(install, new RegExp(operation, 'i'));
  }
  assert.match(install, /install --source <package-path> --home <codex-home>/);
  assert.match(install, /--plugin-path <codex-home>\/plugins\/forgemind/);
  assert.match(install, /--destination.*compatible alias/i);
});
