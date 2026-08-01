import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { parseSkillFrontmatter } from '../src/frontmatter.mjs';
import { validatePlugin } from '../src/validate.mjs';

async function createPlugin(t, overrides = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-validator-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, '.codex-plugin'), { recursive: true });
  await mkdir(path.join(root, 'skills', 'example'), { recursive: true });
  await mkdir(path.join(root, 'assets'), { recursive: true });
  const manifest = {
    name: 'fixture-plugin',
    version: '1.0.0',
    description: 'A real fixture plugin.',
    author: { name: 'Fixture Team', url: 'https://github.com/example-org/fixture-plugin' },
    repository: 'https://github.com/example-org/fixture-plugin',
    license: 'MIT',
    skills: './skills/',
    interface: {
      displayName: 'Fixture Plugin',
      shortDescription: 'Fixture workflows.',
      composerIcon: './assets/icon.svg',
      logo: './assets/logo.svg',
    },
    ...overrides.manifest,
  };
  await writeFile(path.join(root, '.codex-plugin', 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(root, 'assets', 'icon.svg'), '<svg/>\n');
  await writeFile(path.join(root, 'assets', 'logo.svg'), '<svg/>\n');
  await writeFile(
    path.join(root, 'skills', 'example', 'SKILL.md'),
    overrides.skill ?? '---\nname: example\ndescription: "A fixture skill: valid YAML."\n---\n\n# Example\n',
  );
  if (overrides.readme !== undefined) {
    await writeFile(path.join(root, 'README.md'), overrides.readme);
  }
  return root;
}

test('a complete plugin passes source validation', async (t) => {
  const root = await createPlugin(t, { readme: '[Skill](skills/example/SKILL.md)\n' });

  const report = await validatePlugin(root);

  assert.equal(report.status, 'passed');
  assert.deepEqual(report.errors, []);
  assert.ok(report.checks.length >= 5);
});

test('frontmatter rejects an unquoted colon in a scalar description', () => {
  assert.throws(
    () => parseSkillFrontmatter('---\nname: broken\ndescription: Has a colon: invalid\n---\n'),
    (error) => error.code === 'FM_FRONTMATTER_INVALID',
  );
});

test('validation reports missing interface assets', async (t) => {
  const root = await createPlugin(t);
  await rm(path.join(root, 'assets', 'logo.svg'));

  const report = await validatePlugin(root);

  assert.equal(report.status, 'failed');
  assert.ok(report.errors.some((error) => error.code === 'FM_ASSET_MISSING'));
});

test('validation rejects unsupported hooks manifest field', async (t) => {
  const root = await createPlugin(t, { manifest: { hooks: './hooks.json' } });

  const report = await validatePlugin(root);

  assert.ok(report.errors.some((error) => error.code === 'FM_MANIFEST_FIELD_UNSUPPORTED'));
});

test('validation reports a broken relative Markdown link', async (t) => {
  const root = await createPlugin(t, { readme: '[Missing](docs/missing.md)\n' });

  const report = await validatePlugin(root);

  assert.ok(report.errors.some((error) => error.code === 'FM_LINK_BROKEN'));
});

test('release-strict validation rejects placeholder author metadata', async (t) => {
  const root = await createPlugin(t, {
    manifest: { author: { name: 'Example', email: 'person@example.com' } },
  });

  const report = await validatePlugin(root, { strictRelease: true });

  assert.ok(report.errors.some((error) => error.code === 'FM_METADATA_PLACEHOLDER'));
});

test('skill names must be unique across directories', async (t) => {
  const root = await createPlugin(t);
  const duplicate = path.join(root, 'skills', 'duplicate');
  await mkdir(duplicate, { recursive: true });
  await writeFile(path.join(duplicate, 'SKILL.md'), '---\nname: example\ndescription: Duplicate name.\n---\n');

  const report = await validatePlugin(root);

  assert.ok(report.errors.some((error) => error.code === 'FM_SKILL_DUPLICATE'));
});
