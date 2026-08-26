import assert from 'node:assert/strict';
import { access, cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
  await assert.rejects(readFile(path.join(first.pluginPath, 'templates', 'forge', 'trust-contract.example.json'), 'utf8'));
  assert.equal(JSON.parse(await readFile(path.join(first.marketplacePath, 'plugins', 'forgemind-trust-fabric', 'templates', 'forge', 'trust-contract.example.json'), 'utf8')).title, 'Portable agent delivery contract');
  await access(path.join(first.marketplacePath, 'plugins', 'forgemind', 'src', 'foundation.mjs'));
  await access(path.join(first.marketplacePath, 'plugins', 'forgemind-trust-fabric', 'bin', 'forgemind.mjs'));
  await access(path.join(first.marketplacePath, 'plugins', 'forgemind-trust-fabric', 'src', 'cli.mjs'));
  const trustFabricSkill = await readFile(path.join(first.marketplacePath, 'plugins', 'forgemind-trust-fabric', 'skills', 'forgemind-trust-fabric', 'SKILL.md'), 'utf8');
  assert.match(trustFabricSkill, /node <plugin-root>\/bin\/forgemind\.mjs forge help/);
  const trustFabricManifest = JSON.parse(await readFile(path.join(first.marketplacePath, 'plugins', 'forgemind-trust-fabric', '.codex-plugin', 'plugin.json'), 'utf8'));
  assert.doesNotMatch(trustFabricManifest.interface.longDescription, /requires ForgeMind Core/i);
});

test('built Marketplace package exposes the Xray skill and CLI runtime', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-package-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceRoot = await resolvePluginRoot();
  const pluginRoot = path.join(sourceRoot, 'plugins', 'forgemind');
  const sourceManifest = JSON.parse(await readFile(path.join(sourceRoot, '.codex-plugin', 'plugin.json'), 'utf8'));
  const distributionManifest = JSON.parse(await readFile(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'));
  const sourcePackage = JSON.parse(await readFile(path.join(sourceRoot, 'package.json'), 'utf8'));
  const distributionPackage = JSON.parse(await readFile(path.join(pluginRoot, 'package.json'), 'utf8'));
  const lockfile = JSON.parse(await readFile(path.join(sourceRoot, 'package-lock.json'), 'utf8'));

  const built = await buildPackages({ pluginRoot, outputRoot: path.join(root, 'dist') });

  assert.match(sourceManifest.version, /^1\.46\.2(?:\+codex\.[a-z0-9-]+)?$/);
  assert.equal(sourceManifest.version, distributionManifest.version);
  const baseVersion = sourceManifest.version.split('+')[0];
  assert.equal(sourcePackage.version, baseVersion);
  assert.equal(distributionPackage.version, baseVersion);
  assert.equal(lockfile.version, baseVersion);
  assert.equal(lockfile.packages[''].version, baseVersion);
  const sourceSkill = await readFile(path.join(sourceRoot, 'skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  const distributionSkill = await readFile(path.join(pluginRoot, 'skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  for (const requiredContract of ['Playwright', 'ADB', 'FM_XRAY_PLAYWRIGHT_UNAVAILABLE', 'FM_XRAY_ANDROID_EMULATOR_UNAVAILABLE']) {
    assert.match(sourceSkill, new RegExp(requiredContract));
    assert.match(distributionSkill, new RegExp(requiredContract));
  }
  await access(path.join(built.marketplacePath, 'plugins', 'forgemind', 'skills', 'forgemind-xray', 'SKILL.md'));
  const builtSkill = await readFile(path.join(built.marketplacePath, 'plugins', 'forgemind', 'skills', 'forgemind-xray', 'SKILL.md'), 'utf8');
  assert.equal(builtSkill, sourceSkill);
  await access(path.join(built.marketplacePath, 'plugins', 'forgemind', 'src', 'xray.mjs'));
  const sourceGuideSkill = await readFile(path.join(sourceRoot, 'skills', 'forgemind-guide', 'SKILL.md'), 'utf8');
  const distributionGuideSkill = await readFile(path.join(pluginRoot, 'skills', 'forgemind-guide', 'SKILL.md'), 'utf8');
  const builtGuideSkill = await readFile(path.join(built.marketplacePath, 'plugins', 'forgemind', 'skills', 'forgemind-guide', 'SKILL.md'), 'utf8');
  assert.equal(distributionGuideSkill, sourceGuideSkill);
  assert.equal(builtGuideSkill, sourceGuideSkill);
  await access(path.join(built.marketplacePath, 'plugins', 'forgemind', 'src', 'start.mjs'));
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
