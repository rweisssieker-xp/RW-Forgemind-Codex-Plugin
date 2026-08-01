import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeJsonAtomic, writeTextAtomic } from '../src/io.mjs';

const CRITERIA = [
  ['Local test suite passes.', ['npm run ci'], ['package.json', 'tests/'], ['localCi']],
  ['Generic validator passes source and built plugins.', ['python validate_plugin.py .', 'python validate_plugin.py dist/plugin'], ['.codex-plugin/plugin.json', 'dist/plugin/.codex-plugin/plugin.json'], ['sourceValidator', 'builtValidator']],
  ['CI defines and passes Windows, macOS, and Linux jobs.', ['GitHub Actions: Validate ForgeMind'], ['.github/workflows/validate.yml'], ['remoteCi']],
  ['Runtime features do not require PowerShell; PowerShell files are wrappers.', ['node --test tests/wrappers.test.mjs'], ['tests/wrappers.test.mjs', 'scripts/'], ['localCi']],
  ['Source validation works from repository root.', ['npm run validate'], ['src/validate.mjs', 'tests/validate.test.mjs'], ['sourceValidator']],
  ['Build reproducibly creates standalone and marketplace artifacts.', ['npm run build', 'node scripts/release-audit.mjs'], ['src/package.mjs', 'dist/plugin/checksums.json', 'dist/marketplace/'], ['build', 'reproducibility']],
  ['Built marketplace metadata resolves ./plugins/forgemind and validates.', ['npm run build'], ['dist/marketplace/.agents/plugins/marketplace.json', 'tests/package.test.mjs'], ['builtValidator']],
  ['Install, upgrade, rollback, downgrade, and uninstall pass in isolated homes.', ['node --test tests/lifecycle.test.mjs'], ['tests/lifecycle.test.mjs', 'src/lifecycle.mjs'], ['lifecycle']],
  ['Shared and personal memory separation, provenance, conflict, expiry, and redaction pass.', ['node --test tests/memory.test.mjs'], ['tests/memory.test.mjs', 'src/memory.mjs'], ['localCi']],
  ['Unapproved personal configuration cannot weaken policy.', ['node --test tests/policy.test.mjs'], ['tests/policy.test.mjs', 'src/policy.mjs'], ['localCi']],
  ['Successful fixture produces valid proof and matching digest.', ['node --test tests/evidence.test.mjs'], ['tests/evidence.test.mjs', 'src/evidence.mjs'], ['localCi']],
  ['Failed verification, blocker risk, or stale Git state prevents ready proof.', ['node --test tests/evidence.test.mjs'], ['tests/evidence.test.mjs', 'src/readiness.mjs'], ['localCi']],
  ['Outcomes influence routing with explainable evidence.', ['node --test tests/router.test.mjs tests/outcomes.test.mjs'], ['tests/router.test.mjs', 'src/router.mjs'], ['localCi']],
  ['Product signals remain traceable into scored USP records.', ['node --test tests/signals.test.mjs'], ['tests/signals.test.mjs', 'src/signals.mjs'], ['localCi']],
  ['Offline dashboard renders all core evidence.', ['node --test tests/dashboard.test.mjs'], ['tests/dashboard.test.mjs', 'src/dashboard.mjs'], ['localCi']],
  ['Six primary workflows and overlapping route precedence are consistent.', ['node --test tests/workflow-routing.test.mjs'], ['tests/workflow-routing.test.mjs', 'docs/WORKFLOWS.md'], ['localCi']],
  ['Release metadata has real identity and repository links.', ['node --test tests/release-metadata.test.mjs'], ['tests/release-metadata.test.mjs', '.codex-plugin/plugin.json'], ['sourceValidator']],
  ['License and all community policy documents exist.', ['node --test tests/release-metadata.test.mjs'], ['LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'SUPPORT.md', 'PRIVACY.md', 'TERMS.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'], ['documentation']],
  ['Package is allowlisted, checksummed, and excludes development/personal state.', ['npm run build', 'secret scan'], ['package-allowlist.json', 'dist/plugin/checksums.json', 'tests/package.test.mjs'], ['build', 'packageValidation', 'secretScan']],
  ['Release audit maps all acceptance criteria to authoritative evidence.', ['node --test tests/release-audit.test.mjs', 'node scripts/release-audit.mjs'], ['tests/release-audit.test.mjs', 'docs/release/acceptance-evidence.md'], ['audit']],
  ['Agent Trust Protocol rejects any delivery that fails acceptance, verification, policy, provenance, rollback, or budget gates.', ['node --test tests/forge-trust-strategy.test.mjs'], ['src/forge/trust.mjs', 'tests/forge-trust-strategy.test.mjs', 'schemas/agent-trust-v1.schema.json'], ['localCi']],
  ['Strategy Compiler emits deterministic executable rules and blocks rule-level strategic drift.', ['node --test tests/forge-trust-strategy.test.mjs'], ['src/forge/strategy.mjs', 'tests/forge-trust-strategy.test.mjs', 'schemas/executable-strategy-v1.schema.json'], ['localCi']],
  ['Engineering Genome exposes measured cohorts and suppresses recommendations below the minimum sample.', ['node --test tests/forge-genome-tournament.test.mjs'], ['src/forge/genome.mjs', 'tests/forge-genome-tournament.test.mjs', 'schemas/engineering-genome-v1.schema.json'], ['localCi']],
  ['Delivery Flight Recorder detects mutation, deletion, reordering, and invalid anchors without executing replayed actions.', ['node --test tests/forge-foundation.test.mjs'], ['src/forge/flight.mjs', 'tests/forge-foundation.test.mjs', 'schemas/flight-event-v1.schema.json'], ['localCi']],
  ['Parallel Future Tournament applies hard gates before scoring and preserves ties and the Pareto frontier.', ['node --test tests/forge-genome-tournament.test.mjs'], ['src/forge/tournament.mjs', 'tests/forge-genome-tournament.test.mjs', 'schemas/future-tournament-v1.schema.json'], ['localCi']],
  ['Self-Shrinking Software produces reversible evidence plans and never mutates source.', ['node --test tests/forge-shrink-loop.test.mjs'], ['src/forge/shrink.mjs', 'tests/forge-shrink-loop.test.mjs', 'schemas/shrink-plan-v1.schema.json'], ['localCi']],
  ['Autonomous Product Loop enforces ordered proof gates and measured scale, iterate, or rollback decisions.', ['node --test tests/forge-shrink-loop.test.mjs'], ['src/forge/product-loop.mjs', 'tests/forge-shrink-loop.test.mjs', 'schemas/product-loop-v1.schema.json'], ['localCi']],
  ['Evidence Escrow stays held until trusted proof, all milestones, and every required approval pass, and never handles funds.', ['node --test tests/forge-escrow-federate.test.mjs'], ['src/forge/escrow.mjs', 'tests/forge-escrow-federate.test.mjs', 'schemas/evidence-escrow-v1.schema.json'], ['localCi']],
  ['Federated Learning exports verified k-suppressed aggregates without raw identifiers and makes no differential-privacy claim.', ['node --test tests/forge-escrow-federate.test.mjs'], ['src/forge/federate.mjs', 'tests/forge-escrow-federate.test.mjs', 'schemas/federated-bundle-v1.schema.json'], ['localCi']],
];

export async function collectReleaseAudit({ root, commandResults = {} }) {
  const resolvedRoot = path.resolve(root);
  const inspections = await inspectReleaseState(resolvedRoot);
  const enriched = {
    documentation: inspections.documentation ? { status: 'passed', result: 'All required policy documents exist.' } : { status: 'failed', result: 'One or more required policy documents are missing.' },
    audit: { status: 'passed', result: `All ${CRITERIA.length} criteria have explicit commands and evidence paths.` },
    ...commandResults,
  };
  const criteria = CRITERIA.map(([criterion, commands, evidence, resultKeys], index) => {
    const result = combineResults(resultKeys, enriched);
    return { id: index + 1, criterion, status: result.status, result: result.result, commands, evidence };
  });
  const counts = countStatuses(criteria);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    version: inspections.version,
    status: counts.failed ? 'failed' : counts.pending ? 'pending' : 'passed',
    summary: counts,
    remoteCi: enriched.remoteCi ?? { status: 'pending', result: 'No authenticated GitHub Actions run evidence supplied.' },
    publicSubmission: { status: 'not-claimed', result: 'Public marketplace submission is an external authenticated action.' },
    criteria,
  };
}

export async function writeReleaseAudit({ root, outputRoot = path.join(root, 'docs', 'release'), commandResults = {} }) {
  const audit = await collectReleaseAudit({ root, commandResults });
  const jsonPath = path.join(outputRoot, 'acceptance-evidence.json');
  const markdownPath = path.join(outputRoot, 'acceptance-evidence.md');
  await writeJsonAtomic(jsonPath, audit);
  await writeTextAtomic(markdownPath, renderMarkdown(audit));
  return { audit, jsonPath, markdownPath };
}

async function inspectReleaseState(root) {
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  const required = ['LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'SUPPORT.md', 'PRIVACY.md', 'TERMS.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'];
  const documentation = (await Promise.all(required.map((file) => exists(path.join(root, file))))).every(Boolean);
  return { version: manifest.version, documentation };
}

function combineResults(keys, results) {
  const available = keys.map((key) => results[key]).filter(Boolean);
  if (available.some((item) => item.status === 'failed')) return { status: 'failed', result: available.find((item) => item.status === 'failed').result };
  if (available.length === keys.length && available.every((item) => item.status === 'passed')) return { status: 'passed', result: available.map((item) => item.result).join(' ') };
  return { status: 'pending', result: `Pending authoritative result: ${keys.filter((key) => results[key]?.status !== 'passed').join(', ')}.` };
}

function countStatuses(criteria) {
  return {
    total: criteria.length,
    passed: criteria.filter((item) => item.status === 'passed').length,
    failed: criteria.filter((item) => item.status === 'failed').length,
    pending: criteria.filter((item) => item.status === 'pending').length,
  };
}

function renderMarkdown(audit) {
  const rows = audit.criteria.map((item) => `| ${item.id} | ${item.status} | ${item.criterion} | ${item.result} | ${item.evidence.map((entry) => `\`${entry}\``).join('<br>')} |`).join('\n');
  return `# ForgeMind Release Acceptance Evidence\n\nVersion: \`${audit.version}\`\n\nOverall status: **${audit.status}**\n\nRemote three-OS CI: **${audit.remoteCi.status}** — ${audit.remoteCi.result}\n\nPublic marketplace submission: not claimed.\n\n| # | Status | Criterion | Result | Evidence |\n| --- | --- | --- | --- | --- |\n${rows}\n`;
}

async function exists(candidate) { try { await access(candidate); return true; } catch { return false; } }

async function runFromCommandLine() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const resultsFlag = process.argv.indexOf('--results');
  const commandResults = resultsFlag >= 0 ? JSON.parse(await readFile(path.resolve(process.argv[resultsFlag + 1]), 'utf8')) : {};
  const written = await writeReleaseAudit({ root, commandResults });
  process.stdout.write(`${JSON.stringify({ status: written.audit.status, summary: written.audit.summary, markdownPath: written.markdownPath }, null, 2)}\n`);
  process.exitCode = written.audit.status === 'failed' ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runFromCommandLine();
