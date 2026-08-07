import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { runStructuralEvals } from '../src/evals.mjs';

const fixturesRoot = path.resolve(import.meta.dirname, '..', 'evals', 'fixtures');

async function loadFixtures() {
  const files = (await readdir(fixturesRoot)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(fixturesRoot, file), 'utf8'))));
}

test('eight journey fixtures declare route, safety, evidence, and forbidden claims', async () => {
  const fixtures = await loadFixtures();
  assert.deepEqual(fixtures.map((fixture) => fixture.journey).sort(), ['Build', 'Complete', 'Design', 'Discover', 'Learn', 'Radical', 'Release', 'Verify']);
  for (const fixture of fixtures) {
    assert.equal(fixture.schemaVersion, 1);
    assert.match(fixture.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(fixture.prompt.length > 10);
    assert.ok(fixture.expectedRoute);
    assert.ok(fixture.mandatorySafetyBehaviors.length > 0);
    assert.ok(fixture.requiredEvidence.length > 0);
    assert.ok(fixture.forbiddenClaims.length > 0);
  }
});

test('structural evaluator passes the canonical journey contracts', async () => {
  const report = await runStructuralEvals(await loadFixtures());
  assert.equal(report.status, 'passed');
  assert.equal(report.summary.total, 8);
  assert.equal(report.summary.passed, 8);
  assert.equal(report.summary.failed, 0);
  assert.ok(report.results.every((result) => result.checks.length >= 4));
});

test('structural evaluator reports route, safety, evidence, and forbidden-claim failures', async () => {
  const [fixture] = await loadFixtures();
  const report = await runStructuralEvals([fixture], {
    execute: () => ({ route: 'wrong-route', safetyBehaviors: [], evidence: [], claims: fixture.forbiddenClaims }),
  });
  assert.equal(report.status, 'failed');
  assert.equal(report.summary.failed, 1);
  assert.deepEqual(report.results[0].checks.filter((check) => check.status === 'failed').map((check) => check.name).sort(), [
    'forbidden-claims', 'mandatory-safety', 'required-evidence', 'route',
  ]);
});

test('invalid fixture schema fails with actionable validation details', async () => {
  const report = await runStructuralEvals([{ schemaVersion: 1, id: 'broken' }]);
  assert.equal(report.status, 'failed');
  assert.match(report.results[0].errors[0].message, /journey/);
});
