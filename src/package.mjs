import { createHash } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
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
  await writeChecksums(pluginPath);
  const packageValidation = await verifyPackage(pluginPath);
  if (packageValidation.status !== 'passed') throw new ForgeMindError('FM_PACKAGE_INVALID', 'Standalone package did not validate.', { details: packageValidation.errors });

  const marketplacePlugin = path.join(marketplacePath, 'plugins', 'forgemind');
  await mkdir(path.dirname(marketplacePlugin), { recursive: true });
  await cp(pluginPath, marketplacePlugin, { recursive: true, force: true });
  await writeJsonAtomic(path.join(marketplacePath, '.agents', 'plugins', 'marketplace.json'), {
    name: 'rw-local-productivity',
    interface: { displayName: 'RW Local Productivity' },
    plugins: [{
      name: 'forgemind',
      source: { source: 'local', path: './plugins/forgemind' },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      category: 'Productivity',
    }],
  });
  return { schemaVersion: 1, status: 'passed', pluginPath, marketplacePath };
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
