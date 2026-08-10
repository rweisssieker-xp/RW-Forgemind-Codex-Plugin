import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

function context() { return { stdout: { write() {} }, stderr: { write() {} } }; }

async function fixture(prefix, packageJson, readme, source = '') {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  await writeFile(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 2));
  await writeFile(path.join(root, 'README.md'), readme);
  await mkdir(path.join(root, 'src'), { recursive: true });
  await writeFile(path.join(root, 'src', 'app.mjs'), source);
  return root;
}

test('Venture derives isolated project profiles and materially different financial assumptions', async (t) => {
  const operations = await fixture('forgemind-itsm-', {
    name: 'opsdesk-itsm', dependencies: { '@azure/openai': '^1.0.0', '@microsoft/microsoft-graph-client': '^3.0.0' }, scripts: { start: 'node server.mjs' },
  }, '# OpsDesk\n\nAI incident triage for enterprise service desks. Deploy in a private cloud with Microsoft Teams and ServiceNow integrations.', 'export const domain = "incident triage service management";');
  const creator = await fixture('forgemind-creator-', {
    name: 'clipcraft-studio', dependencies: { next: '^15.0.0', stripe: '^17.0.0', openai: '^4.0.0' }, scripts: { dev: 'next dev' },
  }, '# ClipCraft\n\nA self-serve AI video creation studio for independent creators. Subscription checkout uses Stripe.', 'export const domain = "creator video generation";');
  t.after(() => Promise.all([rm(operations, { recursive: true, force: true }), rm(creator, { recursive: true, force: true })]));

  const [left, right] = await Promise.all([
    runCli(['venture', 'run', '--workspace', operations, '--goal', 'reduce incident resolution time', '--json'], context()),
    runCli(['venture', 'run', '--workspace', creator, '--goal', 'reduce video production time', '--json'], context()),
  ]);

  assert.equal(left.exitCode, 0); assert.equal(right.exitCode, 0);
  assert.notEqual(left.data.projectProfile.productCategory.value, right.data.projectProfile.productCategory.value);
  assert.notEqual(left.data.financialModel.assumptions.monthlyPrice, right.data.financialModel.assumptions.monthlyPrice);
  assert.notDeepEqual(left.data.financialModel.assumptionSources, right.data.financialModel.assumptionSources);
  assert.equal(left.data.projectProfile.productCategory.evidence, 'inferred');
  assert.equal(left.data.projectProfile.evidenceSummary.researchRecords, 0);
  assert.equal(left.data.projectProfile.evidenceSummary.telemetryEvents, 0);
  assert.equal(left.data.projectProfile.evidenceSummary.outcomes, 0);
  assert.ok(left.data.evidenceGaps.length > 0);
  assert.match(left.data.claimBoundary, /not market facts/i);
  const [leftDoc, rightDoc] = await Promise.all([
    readFile(path.join(operations, 'docs', 'forgemind', 'venture-case.md'), 'utf8'),
    readFile(path.join(creator, 'docs', 'forgemind', 'venture-case.md'), 'utf8'),
  ]);
  assert.notEqual(leftDoc, rightDoc);
});

test('explicit Venture inputs override profile-derived values reproducibly', async (t) => {
  const root = await fixture('forgemind-venture-explicit-', { name: 'workflow-tool', dependencies: { next: '^15.0.0' } }, '# Workflow Tool\n\nA workflow application for teams.');
  t.after(() => rm(root, { recursive: true, force: true }));
  const args = ['venture', 'run', '--workspace', root, '--goal', 'reduce approvals', '--price', '199', '--market-size', '250', '--cac', '75', '--json'];
  const first = await runCli(args, context());
  const second = await runCli(args, context());
  assert.deepEqual(first.data.financialModel.assumptions, second.data.financialModel.assumptions);
  assert.equal(first.data.financialModel.assumptionSources.monthlyPrice.source, 'cli');
  assert.equal(first.data.financialModel.assumptionSources.addressableAccounts.source, 'cli');
  assert.equal(first.data.financialModel.assumptionSources.customerAcquisitionCost.source, 'cli');
});

test('Venture prioritizes structured imported commercial evidence over local configuration', async (t) => {
  const root = await fixture('forgemind-venture-priority-', { name: 'priority-project' }, '# Priority Project\n\nA business workflow application.');
  const telemetryPath = path.join(root, 'telemetry.json');
  await writeFile(path.join(root, 'forgemind.config.json'), JSON.stringify({ commercial: { monthlyPrice: 101 } }));
  await writeFile(telemetryPath, JSON.stringify([{ name: 'commercial-input', properties: { forgemindCommercial: { monthlyPrice: 123 } } }]));
  t.after(() => rm(root, { recursive: true, force: true }));

  const imported = await runCli(['telemetry', 'record', '--workspace', root, '--input', telemetryPath, '--json'], context());
  const observed = await runCli(['venture', 'run', '--workspace', root, '--goal', 'reduce approvals', '--json'], context());
  const explicit = await runCli(['venture', 'run', '--workspace', root, '--goal', 'reduce approvals', '--price', '199', '--json'], context());

  assert.equal(imported.exitCode, 0);
  assert.equal(observed.data.financialModel.assumptions.monthlyPrice, 123);
  assert.equal(observed.data.financialModel.assumptionSources.monthlyPrice.source, 'project-evidence');
  assert.equal(explicit.data.financialModel.assumptions.monthlyPrice, 199);
  assert.equal(explicit.data.financialModel.assumptionSources.monthlyPrice.source, 'cli');
});

test('Venture differentiates non-ITSM projects from their own product and operating signals', async (t) => {
  const commerce = await fixture('forgemind-commerce-', { name: 'basketly', dependencies: { next: '^15.0.0', stripe: '^17.0.0' } }, '# Basketly\n\nA self-serve storefront and checkout workflow for independent online merchants.', 'export const product = "merchant checkout";');
  const education = await fixture('forgemind-learning-', { name: 'lessonloop', dependencies: { '@azure/openai': '^1.0.0', express: '^4.0.0' } }, '# LessonLoop\n\nAn AI learning workspace for training managers to create, assign, and measure internal learning programs.', 'export const product = "enterprise learning analytics";');
  t.after(() => Promise.all([rm(commerce, { recursive: true, force: true }), rm(education, { recursive: true, force: true })]));

  const [left, right] = await Promise.all([
    runCli(['venture', 'run', '--workspace', commerce, '--goal', 'improve merchant conversion', '--json'], context()),
    runCli(['venture', 'run', '--workspace', education, '--goal', 'improve learning completion', '--json'], context()),
  ]);

  assert.notEqual(left.data.projectProfile.productCategory.value, right.data.projectProfile.productCategory.value);
  assert.notEqual(left.data.financialModel.assumptions.monthlyPrice, right.data.financialModel.assumptions.monthlyPrice);
  assert.match(left.data.projectProfile.primaryJob.value, /checkout|merchant/i);
  assert.match(right.data.projectProfile.primaryJob.value, /learning|training/i);
  assert.equal(left.data.financialModel.assumptionSources.monthlyPrice.evidence, 'inferred');
  assert.equal(right.data.financialModel.assumptionSources.monthlyPrice.evidence, 'inferred');
});
