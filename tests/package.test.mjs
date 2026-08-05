import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildPackages, verifyPackage } from '../src/package.mjs';
import { resolvePluginRoot } from '../src/paths.mjs';

test('build creates reproducible standalone and marketplace packages', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-package-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pluginRoot = await resolvePluginRoot();

  const first = await buildPackages({ pluginRoot, outputRoot: path.join(root, 'first') });
  const second = await buildPackages({ pluginRoot, outputRoot: path.join(root, 'second') });
  const firstChecksums = await readFile(path.join(first.pluginPath, 'checksums.json'), 'utf8');
  const secondChecksums = await readFile(path.join(second.pluginPath, 'checksums.json'), 'utf8');
  const marketplace = JSON.parse(await readFile(path.join(first.marketplacePath, '.agents', 'plugins', 'marketplace.json'), 'utf8'));

  assert.equal(firstChecksums, secondChecksums);
  assert.equal(marketplace.plugins[0].source.path, './plugins/forgemind');
  assert.equal(marketplace.plugins[1].source.path, './plugins/forgemind-trust-fabric');
  assert.equal((await verifyPackage(first.pluginPath)).status, 'passed');
  assert.equal((await verifyPackage(path.join(first.marketplacePath, 'plugins', 'forgemind'))).status, 'passed');
  assert.equal((await verifyPackage(path.join(first.marketplacePath, 'plugins', 'forgemind-trust-fabric'))).status, 'passed');
});

test('package verification rejects files outside the checksum allowlist', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-package-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const built = await buildPackages({ pluginRoot: await resolvePluginRoot(), outputRoot: path.join(root, 'dist') });
  await writeFile(path.join(built.pluginPath, 'unexpected.secret'), 'not allowed');

  const report = await verifyPackage(built.pluginPath);

  assert.equal(report.status, 'failed');
  assert.ok(report.errors.some((error) => error.code === 'FM_PACKAGE_UNEXPECTED_FILE'));
});

test('package excludes development state, personal memory, and raw secrets', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-package-hygiene-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const built = await buildPackages({ pluginRoot: await resolvePluginRoot(), outputRoot: path.join(root, 'dist') });
  const files = await walk(built.pluginPath);
  const relative = files.map((file) => path.relative(built.pluginPath, file).replaceAll(path.sep, '/'));
  assert.ok(relative.every((file) => !/(^|\/)(?:\.git|\.github|\.worktrees|tests|dist|\.codex-orchestrator|\.forgemind)(\/|$)/.test(file)));
  assert.ok(relative.every((file) => !/^(?:agents|docs|evals|prompts|scripts)\//.test(file)));
  assert.ok(!relative.includes('README.md'));
  assert.ok(!relative.includes('hooks.json'));
  for (const file of files) {
    if (/\.(?:png|ico)$/i.test(file)) continue;
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
    assert.doesNotMatch(content, /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}\b/);
  }
});

async function walk(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (entry.isFile()) output.push(full);
  }
  return output;
}
