import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('US English documentation covers the resumable MVP launch and tester evidence loop', async () => {
  const read = async (file) => readFile(path.join(root, file), 'utf8');
  const [readme, handbook, workflows, install, runtime, release] = await Promise.all([
    read('README.md'), read('docs/HANDBOOK.md'), read('docs/WORKFLOWS.md'), read('docs/INSTALL.md'), read('docs/RUNTIME_TEST.md'), read('docs/RELEASE.md'),
  ]);
  assert.match(readme, /launch-mvp/);
  assert.match(handbook, /Record And Evaluate MVP Tests/);
  assert.match(workflows, /One-Session MVP Launch/);
  assert.match(install, /lean runtime payload/);
  assert.match(runtime, /MVP Command Tests/);
  assert.match(release, /MVP launch evidence/);
  for (const document of [readme, handbook, workflows, install, runtime, release]) {
    assert.doesNotMatch(document, /\b(uebernimm|Lies|Erklaere|Liefere|Bewerte|Waehle|Erstelle|Implementiere|Teste|analysiere|implementiere|pruefe|bereite)\b/);
  }
});
