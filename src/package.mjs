import { createHash } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ForgeMindError } from './errors.mjs';
import { writeJsonAtomic } from './io.mjs';
import { validatePlugin } from './validate.mjs';

export async function buildPackages({ pluginRoot, outputRoot = path.join(pluginRoot, 'dist') }) {
  const root = path.resolve(pluginRoot);
  const output = path.resolve(outputRoot);
  assertSafeBuildTarget(root, output);
  await rm(output, { recursive: true, force: true });
  const pluginPath = path.join(output, 'plugin');
  const marketplacePath = path.join(output, 'marketplace');
  await mkdir(pluginPath, { recursive: true });
  const allowlist = JSON.parse(await readFile(path.join(root, 'package-allowlist.json'), 'utf8'));
  for (const directory of allowlist.directories) {
    const source = path.join(root, directory);
    if (await exists(source)) await cp(source, path.join(pluginPath, directory), { recursive: true, force: true });
  }
  for (const file of allowlist.files) {
    const source = path.join(root, file);
    if (await exists(source)) {
      await mkdir(path.dirname(path.join(pluginPath, file)), { recursive: true });
      await cp(source, path.join(pluginPath, file), { force: true });
    }
  }
  await removeTrustFabricTemplates(pluginPath);
  await writeCoreManifest(pluginPath);
  await writeChecksums(pluginPath);
  const packageValidation = await verifyPackage(pluginPath);
  if (packageValidation.status !== 'passed') throw new ForgeMindError('FM_PACKAGE_INVALID', 'Standalone package did not validate.', { details: packageValidation.errors });

  const marketplacePlugin = path.join(marketplacePath, 'plugins', 'forgemind');
  await mkdir(path.dirname(marketplacePlugin), { recursive: true });
  await cp(pluginPath, marketplacePlugin, { recursive: true, force: true });
  const trustFabricPath = path.join(marketplacePath, 'plugins', 'forgemind-trust-fabric');
  const hasTrustFabric = await exists(path.join(root, 'templates', 'forge')) && await exists(path.join(root, 'playbooks', 'trust-fabric.md'));
  if (hasTrustFabric) await buildTrustFabricAddon({ root, output: trustFabricPath });
  await writeJsonAtomic(path.join(marketplacePath, '.agents', 'plugins', 'marketplace.json'), {
    name: 'forgemind-marketplace',
    interface: { displayName: 'ForgeMind Marketplace' },
    plugins: [
      { name: 'forgemind', source: { source: 'local', path: './plugins/forgemind' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' },
      ...(hasTrustFabric ? [{ name: 'forgemind-trust-fabric', source: { source: 'local', path: './plugins/forgemind-trust-fabric' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }] : []),
    ],
  });
  return { schemaVersion: 1, status: 'passed', pluginPath, trustFabricPath, marketplacePath };
}

async function removeTrustFabricTemplates(pluginPath) {
  await rm(path.join(pluginPath, 'templates', 'forge'), { recursive: true, force: true });
}

async function writeCoreManifest(pluginPath) {
  const manifestPath = path.join(pluginPath, '.codex-plugin', 'plugin.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.description = 'Evidence-first product discovery and delivery for Codex: market-tested MVPs, safe execution, and release-ready proof.';
  manifest.interface.shortDescription = 'Market-tested MVPs and verifiable delivery.';
  manifest.interface.longDescription = 'ForgeMind Core turns discovery, creative exploration, existing-app evidence, and product intent into market-tested MVPs and safe, cost-aware delivery with verifiable release proof. Install the optional ForgeMind Trust Fabric add-on for cross-agent contracts, strategy, learning, and advanced evidence workflows.';
  await writeJsonAtomic(manifestPath, manifest);
}

async function buildTrustFabricAddon({ root, output }) {
  await mkdir(path.join(output, '.codex-plugin'), { recursive: true });
  await mkdir(path.join(output, 'entry-skills', 'forgemind-trust-fabric'), { recursive: true });
  await mkdir(path.join(output, 'playbooks'), { recursive: true });
  await cp(path.join(root, 'playbooks', 'trust-fabric.md'), path.join(output, 'playbooks', 'trust-fabric.md'), { recursive: true, force: true });
  await cp(path.join(root, 'templates', 'forge'), path.join(output, 'templates', 'forge'), { recursive: true, force: true });
  const sourceManifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  await writeJsonAtomic(path.join(output, '.codex-plugin', 'plugin.json'), {
    name: 'forgemind-trust-fabric', version: sourceManifest.version,
    description: 'Optional advanced evidence workflows for ForgeMind Core. Use when cross-agent trust, strategy, governed learning, or sealed delivery proof is required.',
    author: sourceManifest.author, homepage: sourceManifest.homepage, repository: sourceManifest.repository, license: sourceManifest.license,
    keywords: ['forgemind', 'trust-fabric', 'evidence', 'governance'], skills: './entry-skills/',
    interface: {
      displayName: 'ForgeMind Trust Fabric', shortDescription: 'Optional advanced evidence workflows for ForgeMind Core.',
      longDescription: 'Adds nine evidence-native workflows for portable trust contracts, executable strategy, learning, replay, experiments, evidence escrow, and privacy-preserving federation. Requires ForgeMind Core.',
      developerName: sourceManifest.interface.developerName, category: 'Productivity', capabilities: ['Agent Trust', 'Executable Strategy', 'Trust Fabric', 'Federated Learning'],
      websiteURL: sourceManifest.interface.websiteURL, privacyPolicyURL: sourceManifest.interface.privacyPolicyURL, termsOfServiceURL: sourceManifest.interface.termsOfServiceURL,
      defaultPrompt: ['Use ForgeMind Trust Fabric to verify this outcome with portable proof.'], brandColor: sourceManifest.interface.brandColor,
    },
  });
  await writeText(path.join(output, 'entry-skills', 'forgemind-trust-fabric', 'SKILL.md'), `---\nname: forgemind-trust-fabric\ndescription: Use ForgeMind Trust Fabric for portable evidence, strategy checks, auditable delivery records, or privacy-preserving learning.\n---\n\n# Trust Fabric\n\nLoad \`playbooks/trust-fabric.md\`. Run \`forgemind forge help\` and select the capability required by the evidence need. Preserve held, rejected, and insufficient-evidence states.\n`);
  await writeText(path.join(output, 'entry-skills', 'forgemind-trust-fabric', 'agents', 'openai.yaml'), `interface:\n  display_name: "Trust Fabric"\n  short_description: "Portable evidence and advanced trust workflows."\n  default_prompt: "Use $forgemind-trust-fabric to create portable evidence for this delivery."\npolicy:\n  allow_implicit_invocation: false\n`);
  await writeChecksums(output);
  const validation = await verifyPackage(output);
  if (validation.status !== 'passed') throw new ForgeMindError('FM_TRUST_FABRIC_PACKAGE_INVALID', 'Trust Fabric add-on did not validate.', { details: validation.errors });
}

export async function verifyPackage(packagePath) {
  const root = path.resolve(packagePath);
  const errors = [];
  let expected;
  try { expected = JSON.parse(await readFile(path.join(root, 'checksums.json'), 'utf8')); }
  catch (error) { return { schemaVersion: 1, status: 'failed', errors: [{ code: 'FM_PACKAGE_CHECKSUMS_MISSING', message: error.message }] }; }
  const files = (await walk(root)).map((file) => relative(root, file)).filter((file) => file !== 'checksums.json').sort();
  const expectedFiles = Object.keys(expected.files ?? {}).sort();
  for (const file of files) {
    if (!Object.hasOwn(expected.files ?? {}, file)) errors.push({ code: 'FM_PACKAGE_UNEXPECTED_FILE', message: `Unexpected package file: ${file}` });
    else if (await hashFile(path.join(root, file)) !== expected.files[file]) errors.push({ code: 'FM_PACKAGE_CHECKSUM_MISMATCH', message: `Checksum mismatch: ${file}` });
  }
  for (const file of expectedFiles) if (!files.includes(file)) errors.push({ code: 'FM_PACKAGE_FILE_MISSING', message: `Missing package file: ${file}` });
  const pluginValidation = await validatePlugin(root);
  errors.push(...pluginValidation.errors);
  return { schemaVersion: 1, status: errors.length ? 'failed' : 'passed', errors, fileCount: files.length };
}

async function writeChecksums(root) {
  const files = (await walk(root)).map((file) => relative(root, file)).filter((file) => file !== 'checksums.json').sort();
  const hashes = {};
  for (const file of files) hashes[file] = await hashFile(path.join(root, file));
  await writeJsonAtomic(path.join(root, 'checksums.json'), { schemaVersion: 1, algorithm: 'sha256', files: hashes });
}

async function hashFile(file) { return createHash('sha256').update(await readFile(file)).digest('hex'); }

async function writeText(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
}

async function walk(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (entry.isFile()) output.push(full);
  }
  return output;
}

function assertSafeBuildTarget(pluginRoot, output) {
  if (output === pluginRoot || path.dirname(output) === output || pluginRoot.startsWith(`${output}${path.sep}`)) {
    throw new ForgeMindError('FM_PACKAGE_TARGET_UNSAFE', `Unsafe package output target: ${output}`);
  }
}

async function exists(candidate) { try { await access(candidate); return true; } catch { return false; } }
function relative(root, file) { return path.relative(root, file).replaceAll(path.sep, '/'); }
