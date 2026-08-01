import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const repository = 'https://github.com/rweisssieker-xp/RW-Forgemind-Codex-Plugin';
const requiredDocs = [
  'LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'SUPPORT.md', 'PRIVACY.md',
  'TERMS.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md',
];

test('release metadata uses the real project identity and consistent version', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.repository, repository);
  assert.match(manifest.homepage, /^https:\/\/github\.com\/rweisssieker-xp\/RW-Forgemind-Codex-Plugin/);
  assert.equal(manifest.author.url, 'https://github.com/rweisssieker-xp');
  assert.doesNotMatch(JSON.stringify(manifest), /example\.com|github\.com\/reinerw(?:["/])/i);
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.license, 'MIT');
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

test('marketplace policies and screenshots point to publishable assets', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.interface.privacyPolicyURL, `${repository}/blob/main/PRIVACY.md`);
  assert.equal(manifest.interface.termsOfServiceURL, `${repository}/blob/main/TERMS.md`);
  assert.ok(manifest.interface.screenshots.length > 0);
  for (const asset of manifest.interface.screenshots) {
    assert.match(asset, /^\.\/assets\/.*\.png$/);
    const bytes = await readFile(path.join(root, asset));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
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
});
