import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { scanGaps } from '../src/gaps.mjs';
import { scoreReadiness } from '../src/readiness.mjs';
import { scanRisks } from '../src/risks.mjs';
import { runProcess } from '../src/process.mjs';

test('gap scan reports missing verification, changelog, and CI with stable evidence paths', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-gaps-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const report = await scanGaps({ workspace: root });

  assert.equal(report.status, 'needs-work');
  for (const area of ['verification', 'release', 'ci']) {
    assert.ok(report.gaps.some((gap) => gap.area === area && gap.severity === 'high'));
  }
  assert.equal(report.evidencePath, '.codex-orchestrator/reports/gap-scan-latest.json');
});

test('risk scan detects secrets, migrations, and dependency changes', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-risks-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'migrations'));
  await writeFile(path.join(root, '.env'), 'TOKEN=secret');
  await writeFile(path.join(root, 'migrations', '001.sql'), 'alter table example add column value text;');

  const report = await scanRisks({ workspace: root, changedFiles: ['.env', 'migrations/001.sql', 'package-lock.json'] });

  assert.ok(report.risks.some((risk) => risk.category === 'secrets' && risk.severity === 'blocker'));
  assert.ok(report.risks.some((risk) => risk.category === 'migration'));
  assert.ok(report.risks.some((risk) => risk.category === 'dependency'));
});

test('risk scan derives changed files from Git when callers omit them', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-git-risks-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await runProcess('git', ['init'], { cwd: root });
  await runProcess('git', ['config', 'user.email', 'fixture@example.invalid'], { cwd: root });
  await runProcess('git', ['config', 'user.name', 'Fixture'], { cwd: root });
  await writeFile(path.join(root, 'README.md'), 'fixture');
  await runProcess('git', ['add', 'README.md'], { cwd: root });
  await runProcess('git', ['commit', '-m', 'fixture'], { cwd: root });
  await writeFile(path.join(root, '.env'), 'TOKEN=secret');

  const report = await scanRisks({ workspace: root });

  assert.equal(report.status, 'blocked');
  assert.ok(report.risks.some((risk) => risk.category === 'secrets' && risk.evidence === '.env'));
});

test('readiness is blocked by failed verification or blocker risk', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-readiness-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const verification = { status: 'failed', commands: [], errors: [{ code: 'FM_VERIFY_FAILED' }] };
  const gaps = { status: 'needs-work', gaps: [{ severity: 'high', area: 'ci' }] };
  const risks = { status: 'blocked', risks: [{ severity: 'blocker', category: 'secrets' }] };

  const report = await scoreReadiness({ workspace: root, verification, gaps, risks });

  assert.equal(report.status, 'blocked');
  assert.ok(report.score < 50);
  assert.ok(report.blockers.includes('verification'));
  assert.ok(report.blockers.includes('secrets'));
});
