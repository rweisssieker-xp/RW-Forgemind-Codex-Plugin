import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { resolvePluginRoot } from '../src/paths.mjs';

const FORBIDDEN = [ ['bm', 'ad'].join(''), ['super', 'powers'].join('') ];
const IGNORED = new Set(['.git', 'dist', 'node_modules']);
const TEXT_EXTENSIONS = new Set(['.json', '.md', '.mjs', '.ps1', '.toml', '.txt', '.yml', '.yaml']);

test('ForgeMind source and package paths remain independent of historical framework branding', async () => {
  const root = await resolvePluginRoot();
  const files = await walk(root);
  const violations = [];
  for (const file of files) {
    const relative = path.relative(root, file).replaceAll(path.sep, '/');
    const lowerPath = relative.toLowerCase();
    for (const term of FORBIDDEN) if (lowerPath.includes(term)) violations.push(`${relative}:path`);
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const lowerContent = (await readFile(file, 'utf8')).toLowerCase();
    for (const term of FORBIDDEN) if (lowerContent.includes(term)) violations.push(`${relative}:content`);
  }
  assert.deepEqual(violations, []);
});

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED.has(entry.name)) continue;
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(candidate));
    else if (entry.isFile()) files.push(candidate);
  }
  return files;
}
