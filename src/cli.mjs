import { ForgeMindError, invalidInput } from './errors.mjs';
import { resolvePluginRoot, resolveWorkspace } from './paths.mjs';
import { fileURLToPath } from 'node:url';

const MODULE_PLUGIN_ROOT = fileURLToPath(new URL('../', import.meta.url));

const PRIMARY_COMMANDS = [
  'help',
  'doctor',
  'validate',
  'init',
  'inspect',
  'verify',
  'gaps',
  'risks',
  'readiness',
  'evidence',
  'outcome',
  'route',
  'signals',
  'discovery',
  'checkpoint',
  'visual',
  'memory',
  'dashboard',
  'forge',
  'eval',
  'package',
  'install',
  'uninstall',
];

const HELP = `ForgeMind — vendor-neutral trust and evidence-driven delivery for Codex

Usage: forgemind <command> [options]

Commands:
  ${PRIMARY_COMMANDS.join('\n  ')}

Trust Fabric:
  forgemind forge help
  Nine capabilities: trust, strategy, genome, flight, tournament, shrink, loop, escrow, federate
`;

export async function runCli(argv, context = {}) {
  const stdout = context.stdout ?? process.stdout;
  const stderr = context.stderr ?? process.stderr;
  try {
    const command = argv[0] ?? 'help';
    if (command === 'help' || command === '--help' || command === '-h') {
      stdout.write(HELP);
      return { exitCode: 0, data: { commands: PRIMARY_COMMANDS } };
    }
    const { options, positionals } = parseOptions(argv.slice(1));
    let data;
    if (command === 'validate') {
      const { validatePlugin } = await import('./validate.mjs');
      const pluginRoot = await resolvePluginRoot(options.plugin ?? MODULE_PLUGIN_ROOT);
      data = await validatePlugin(pluginRoot, { strictRelease: Boolean(options['strict-release']) });
    } else if (command === 'doctor') {
      const { diagnose } = await import('./doctor.mjs');
      const pluginRoot = await resolvePluginRoot(options.plugin ?? MODULE_PLUGIN_ROOT);
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      data = await diagnose({ pluginRoot, workspace });
    } else if (command === 'inspect') {
      const { inspectProject } = await import('./project.mjs');
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      data = { status: 'passed', ...await inspectProject(workspace), errors: [] };
    } else if (command === 'init') {
      const { initializeWorkspace } = await import('./artifacts.mjs');
      const pluginRoot = await resolvePluginRoot(options.plugin ?? MODULE_PLUGIN_ROOT);
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      data = await initializeWorkspace({
        pluginRoot,
        workspace,
        withMemory: Boolean(options.memory),
        withArtifacts: Boolean(options.artifacts),
      });
    } else if (command === 'verify') {
      const { verifyWorkspace } = await import('./verify.mjs');
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      data = await verifyWorkspace({ workspace, run: Boolean(options.run), allowInferred: Boolean(options['allow-inferred']) });
    } else if (command === 'gaps') {
      const { scanGaps } = await import('./gaps.mjs');
      data = await scanGaps({ workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()) });
    } else if (command === 'risks') {
      const { scanRisks } = await import('./risks.mjs');
      data = await scanRisks({ workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()) });
    } else if (command === 'readiness') {
      const { scoreReadiness } = await import('./readiness.mjs');
      data = await scoreReadiness({ workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()) });
    } else if (command === 'memory') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const action = positionals[0] ?? 'list';
      const { appendMemoryEntry, findMemoryConflicts, readActiveMemory } = await import('./memory.mjs');
      if (action === 'add') {
        data = await appendMemoryEntry({
          workspace,
          scope: options.scope ?? 'shared',
          entry: {
            type: options.type,
            subject: options.subject,
            statement: options.statement,
            source: options.source,
            evidence: options.evidence ? String(options.evidence).split(',') : [],
            author: options.author ?? process.env.USERNAME ?? process.env.USER ?? 'unknown',
            confidence: Number(options.confidence ?? 0.5),
            reviewState: options['review-state'] ?? 'pending',
            sensitivity: options.sensitivity ?? 'internal',
            nonExpiring: Boolean(options['non-expiring']),
            expiresAt: options.expires,
            supersedes: options.supersedes,
          },
        });
      } else if (action === 'migrate') {
        const { migrateMarkdownMemory } = await import('./migrate-memory.mjs');
        data = await migrateMarkdownMemory({ workspace, author: options.author });
      } else {
        const entries = await readActiveMemory({ workspace, scope: options.scope ?? 'shared' });
        data = action === 'conflicts'
          ? { schemaVersion: 1, status: 'passed', conflicts: findMemoryConflicts(entries), errors: [] }
          : { schemaVersion: 1, status: 'passed', entries, errors: [] };
      }
    } else if (command === 'evidence') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const action = positionals[0] ?? 'verify';
      const { createDeliveryProof, verifyDeliveryProof } = await import('./evidence.mjs');
      if (action === 'create') {
        data = await createDeliveryProof({
          workspace,
          intent: options.intent,
          acceptanceCriteria: splitList(options.acceptance),
          verification: await readWorkspaceReport(workspace, 'verification-latest.json', { status: 'missing', commands: [], errors: [] }),
          risks: await readWorkspaceReport(workspace, 'risk-radar-latest.json', { status: 'missing', risks: [] }),
          decisions: splitList(options.decisions),
          rollback: splitList(options.rollback),
          unresolved: splitList(options.unresolved),
        });
      } else {
        const latest = await readLatestProof(workspace);
        data = await verifyDeliveryProof({ workspace, proofPath: options.proof ?? latest.proofPath });
      }
    } else if (command === 'outcome') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const action = positionals[0] ?? 'list';
      const { listOutcomes, recordOutcome } = await import('./outcomes.mjs');
      if (action === 'record') {
        data = await recordOutcome({ workspace, outcome: {
          task: options.task,
          taskCategory: options.category,
          route: options.route,
          project: { stacks: splitList(options.stacks), packageManager: options['package-manager'] ?? null },
          durationMinutes: Number(options.duration ?? 0),
          verificationStatus: options.verification ?? 'missing',
          correctionCount: Number(options.corrections ?? 0),
          userAccepted: String(options.accepted).toLowerCase() === 'true',
          residualDefects: Number(options.defects ?? 0),
          evidence: splitList(options.evidence),
        } });
      } else {
        data = { schemaVersion: 1, status: 'passed', outcomes: await listOutcomes({ workspace }), errors: [] };
      }
    } else if (command === 'route') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const { listOutcomes } = await import('./outcomes.mjs');
      const { inspectProject } = await import('./project.mjs');
      const { recommendRoute } = await import('./router.mjs');
      const { loadConfig } = await import('./config.mjs');
      const config = await loadConfig(workspace);
      data = { status: 'passed', ...recommendRoute({
        profile: await inspectProject(workspace),
        task: { category: options.category ?? 'unknown', risk: options.risk, path: options.path },
        outcomes: await listOutcomes({ workspace }),
        policy: config.policy,
        routing: config.routing,
      }), errors: [] };
    } else if (command === 'signals') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const action = positionals[0] ?? 'cluster';
      const { clusterSignals, createUspRecords, importSignals, listSignals, saveUspRecords } = await import('./signals.mjs');
      if (action === 'import') {
        data = await importSignals({ workspace, input: options.input, format: options.format, sourceType: options.source ?? 'external-export' });
      } else {
        const clusters = clusterSignals(await listSignals({ workspace }));
        data = action === 'usps'
          ? await saveUspRecords({ workspace, records: createUspRecords(clusters) })
          : { schemaVersion: 1, status: 'passed', clusters, errors: [] };
      }
    } else if (command === 'discovery') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const action = positionals[0] ?? 'list';
      const { createExperiment, decideExperiment, listExperiments } = await import('./discovery.mjs');
      if (action === 'create') data = await createExperiment({ workspace, experiment: { title: options.title, hypothesis: options.hypothesis, metric: options.metric, audience: options.audience, evidence: options.evidence } });
      else if (action === 'decide') data = await decideExperiment({ workspace, id: options.id, decision: options.decision, evidence: options.evidence });
      else data = { schemaVersion: 1, status: 'passed', experiments: await listExperiments({ workspace }), errors: [] };
    } else if (command === 'checkpoint') {
      const workspace = await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd());
      const { listCheckpoints, saveCheckpoint } = await import('./checkpoints.mjs');
      data = positionals[0] === 'save'
        ? await saveCheckpoint({ workspace, summary: options.summary, next: options.next })
        : { schemaVersion: 1, status: 'passed', checkpoints: await listCheckpoints({ workspace }), errors: [] };
    } else if (command === 'visual') {
      const { recordVisualEvidence } = await import('./visual-qa.mjs');
      data = await recordVisualEvidence({ workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()), input: options.input, label: options.label, viewport: options.viewport });
    } else if (command === 'dashboard') {
      const { generateDashboard } = await import('./dashboard.mjs');
      data = await generateDashboard({ workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()) });
    } else if (command === 'forge') {
      const { runForge } = await import('./forge/index.mjs');
      data = await runForge({
        workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()),
        positionals,
        options,
      });
    } else if (command === 'eval') {
      const path = await import('node:path');
      const { loadEvalFixtures, runStructuralEvals } = await import('./evals.mjs');
      const pluginRoot = await resolvePluginRoot(options.plugin ?? MODULE_PLUGIN_ROOT);
      const fixturesRoot = path.resolve(options.fixtures ?? path.join(pluginRoot, 'evals', 'fixtures'));
      data = await runStructuralEvals(await loadEvalFixtures(fixturesRoot));
    } else if (command === 'package') {
      const { buildPackages } = await import('./package.mjs');
      const pluginRoot = await resolvePluginRoot(options.plugin ?? MODULE_PLUGIN_ROOT);
      data = await buildPackages({ pluginRoot, outputRoot: options.output });
    } else if (command === 'install') {
      const { installPlugin } = await import('./lifecycle.mjs');
      data = await installPlugin({ packagePath: options.package, home: options.home ?? await defaultHome() });
    } else if (command === 'uninstall') {
      const { uninstallPlugin } = await import('./lifecycle.mjs');
      data = await uninstallPlugin({
        home: options.home ?? await defaultHome(),
        workspace: options.workspace,
        purgeData: Boolean(options['purge-data']),
        approvedPurge: Boolean(options.approved),
      });
    } else if (command === 'legacy') {
      const { runLegacy } = await import('./legacy.mjs');
      const pluginRoot = await resolvePluginRoot(MODULE_PLUGIN_ROOT);
      data = await runLegacy(positionals[0], positionals.slice(1), { pluginRoot, cwd: context.cwd ?? process.cwd() });
    } else {
      throw invalidInput('FM_COMMAND_UNKNOWN', `Unknown command: ${command}`);
    }

    if (options.json) {
      stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    } else {
      stdout.write(`${command}: ${data.status}\n`);
      for (const error of data.errors ?? []) stderr.write(`${error.code}: ${error.message}\n`);
    }
    return { exitCode: isOperationalFailure(data.status) ? 1 : 0, data };
  } catch (error) {
    const normalized = normalizeError(error);
    stderr.write(`${normalized.code}: ${normalized.message}\n`);
    return { exitCode: normalized.exitCode, data: { error: normalized.code } };
  }
}

async function readWorkspaceReport(workspace, name, fallback) {
  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    return JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'reports', name), 'utf8'));
  } catch {
    return fallback;
  }
}

async function defaultHome() {
  const { homedir } = await import('node:os');
  const path = await import('node:path');
  return process.env.CODEX_HOME ?? path.join(homedir(), '.codex');
}

async function readLatestProof(workspace) {
  const { readFile } = await import('node:fs/promises');
  const path = await import('node:path');
  return JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'evidence', 'latest.json'), 'utf8'));
}

function splitList(value) {
  return value ? String(value).split('|').map((item) => item.trim()).filter(Boolean) : [];
}

function parseOptions(args) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }
    const key = argument.slice(2);
    if (['json', 'strict-release', 'memory', 'artifacts', 'run', 'allow-inferred', 'non-expiring', 'purge-data', 'approved'].includes(key)) {
      options[key] = true;
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw invalidInput('FM_OPTION_VALUE_MISSING', `Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return { options, positionals };
}

function normalizeError(error) {
  if (error instanceof ForgeMindError) {
    return error;
  }
  return new ForgeMindError('FM_INTERNAL', error instanceof Error ? error.message : String(error));
}

function isOperationalFailure(status) {
  return ['failed', 'blocked', 'rejected', 'invalid', 'held', 'no-eligible-candidate'].includes(status);
}
