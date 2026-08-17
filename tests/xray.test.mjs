import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverXrayMission, executeXrayMission, getXrayStatus, runXray, scoreXrayQuality } from '../src/xray.mjs';

async function fixture(t, { packageJson, files = {} } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const allFiles = { ...files };
  if (packageJson) allFiles['package.json'] = JSON.stringify(packageJson, null, 2);
  for (const [name, content] of Object.entries(allFiles)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

async function browserArtifacts(root, scriptArgument, stem = 'home') {
  const runDirectory = path.basename(scriptArgument, '.spec.mjs');
  const artifactDirectory = path.join(root, '.codex-orchestrator', 'xray', 'browser', runDirectory);
  const files = [
    `${stem}-before.png`, `${stem}-before.json`, `${stem}-after.png`, `${stem}-after.json`, `${stem}-trace.zip`,
  ];
  await mkdir(artifactDirectory, { recursive: true });
  await Promise.all(files.map((name) => writeFile(
    path.join(artifactDirectory, name),
    name.endsWith('.json') ? '[]\n' : `xray ${name}\n`,
  )));
  const prefix = `.codex-orchestrator/xray/browser/${runDirectory}`;
  return {
    evidence: files.map((name) => `${prefix}/${name}`),
    screenshot: `${prefix}/${stem}-after.png`,
    trace: `${prefix}/${stem}-trace.zip`,
  };
}

test('Xray discovers CLI, API, GUI, and existing command surfaces without inventing commands', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      bin: { sample: 'bin/sample.mjs' },
      scripts: { test: 'node --test', dev: 'vite --host 127.0.0.1' },
      dependencies: { express: '^5.0.0', vite: '^6.0.0' },
    },
    files: { 'bin/sample.mjs': '', 'src/routes.mjs': 'app.get("/health", () => {});' },
  });

  const mission = await discoverXrayMission({ workspace: root, goal: 'full QA' });

  assert.deepEqual(mission.surfaces.map(({ id }) => id).sort(), ['api', 'cli', 'web-gui']);
  assert.ok(mission.checks.some(({ command, args }) => command === 'npm' && args[0] === 'test'));
  assert.ok(mission.gaps.every(({ code }) => code !== 'FM_XRAY_COMMAND_INVENTED'));
});

test('Xray reports unavailable GUI control as a gap rather than a test result', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6.0.0' } },
  });

  const mission = await discoverXrayMission({ workspace: root, guiControl: { browser: false, computerUse: false } });

  assert.deepEqual(mission.gaps.map(({ code }) => code), ['FM_XRAY_GUI_CONTROL_UNAVAILABLE']);
});

test('Xray accepts complete browser-flow evidence and rejects incomplete GUI evidence', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/home.png'],
      url: 'http://127.0.0.1:4173/', coverageArea: 'home', controlLabel: 'Get started',
      action: 'click', expected: 'The onboarding view opens.', actual: 'The onboarding view opened.',
      reproduction: 'Open the home page and click Get started.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/missing-flow.png'],
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'blocked',
      componentIds: ['gui-usability'], evidence: ['screenshots/auth-wall.png'],
      url: 'http://127.0.0.1:4173/account', coverageArea: 'account', controlLabel: 'Save',
      action: 'submit profile', expected: 'The test profile is saved.', actual: 'Authentication was unavailable.',
      reproduction: 'Open account and submit the test profile.',
    }],
  });
  assert.equal(report.receipts.filter(({ status }) => status === 'passed').length, 1);
  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_RECEIPT_INCOMPLETE'));
  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_FLOW_BLOCKED'));
});

test('Xray executes selected Playwright flows and scores their browser evidence', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      scripts: { dev: 'vite' },
      dependencies: { vite: '^6' },
      devDependencies: { playwright: '^1' },
    },
    files: {
      'node_modules/playwright/package.json': JSON.stringify({
        name: 'playwright', version: '1.0.0', bin: { playwright: 'cli.js' },
      }),
      'node_modules/playwright/cli.js': 'process.exitCode = 0;\n',
    },
  });
  const report = await runXray({
    workspace: root,
    testUrl: 'http://127.0.0.1:4173/',
    adapters: ['browser'],
    runProcess: async (_command, args) => {
      const script = args.find((argument) => String(argument).endsWith('.spec.mjs'));
      const artifacts = await browserArtifacts(root, script);
      return {
        exitCode: 0,
        stderr: '',
        stdout: `${JSON.stringify({
        protocol: 'forgemind-xray-browser-v1',
        type: 'receipt',
        receipt: {
          status: 'passed',
          url: 'http://127.0.0.1:4173/',
          coverageArea: 'home',
          controlLabel: 'Home page',
          action: 'open page',
          expected: 'The local page loads.',
          actual: 'The local page loaded.',
          reproduction: 'Open the local test URL.',
          ...artifacts,
        },
      })}\n`,
      };
    },
  });

  assert.equal(report.mission.testUrl, 'http://127.0.0.1:4173/');
  assert.deepEqual(report.mission.adapters, ['browser']);
  assert.equal(report.receipts.length, 1);
  assert.equal(report.receipts[0].control, 'playwright');
  assert.equal(report.receipts[0].adapter, 'browser');
  assert.deepEqual(report.coverage.areas, ['home']);
  assert.equal(report.score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
  assert.equal(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_CONTROL_UNAVAILABLE'), false);
});

test('an explicit safe test URL establishes web GUI coverage in an API-classified repository', async (t) => {
  const root = await fixture(t, {
    files: { 'src/routes.mjs': 'router.get("/health", () => {});' },
  });
  const report = await runXray({
    workspace: root,
    testUrl: 'http://127.0.0.1:4173/',
    adapters: ['command'],
    guiReceipts: [{
      surfaceId: 'web-gui',
      control: 'browser',
      status: 'passed',
      componentIds: ['gui-usability'],
      evidence: ['screenshots/api-hosted-gui.png'],
      url: 'http://127.0.0.1:4173/',
      coverageArea: 'home',
      controlLabel: 'Home page',
      action: 'open page',
      expected: 'The API-hosted GUI loads.',
      actual: 'The API-hosted GUI loaded.',
      reproduction: 'Open the explicit local test URL.',
    }],
  });

  assert.ok(report.mission.surfaces.some(({ id }) => id === 'web-gui'));
  assert.equal(report.receipts.length, 1);
  assert.equal(report.receipts[0].surfaceId, 'web-gui');
  assert.deepEqual(report.coverage.areas, ['home']);
});

test('Xray keeps Browser prerequisite failures as specific report gaps', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    testUrl: 'http://127.0.0.1:4173/',
    adapters: ['browser'],
    runProcess: async () => { throw new Error('must not execute without a local package'); },
  });

  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_PLAYWRIGHT_UNAVAILABLE'));
  assert.equal(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_CONTROL_UNAVAILABLE'), false);
  assert.equal(report.receipts.length, 0);
});

test('Xray rejects remote Browser receipt URLs and persists normalized local flow fields', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/remote.png'],
      url: 'https://production.example/', coverageArea: 'home', controlLabel: 'Get started',
      action: 'click', expected: 'The onboarding view opens.', actual: 'The onboarding view opened.',
      reproduction: 'Open the home page and click Get started.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/loopback-lookalike.png'],
      url: 'http://127.evil.com/', coverageArea: 'home', controlLabel: 'Get started',
      action: 'click', expected: 'The onboarding view opens.', actual: 'The onboarding view opened.',
      reproduction: 'Open the home page and click Get started.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'passed',
      componentIds: ['gui-usability'], evidence: ['screenshots/local.png'],
      url: ' http://127.0.0.1:4173/ ', coverageArea: ' home ', controlLabel: ' Get started ',
      action: ' click ', expected: ' The onboarding view opens. ', actual: ' The onboarding view opened. ',
      reproduction: ' Open the home page and click Get started. ',
    }],
  });

  assert.equal(report.receipts.filter(({ status }) => status === 'passed').length, 1);
  assert.ok(report.gaps.some(({ code }) => code === 'FM_XRAY_GUI_RECEIPT_TARGET_INVALID'));
  assert.deepEqual(report.receipts[0], {
    id: 'gui-1', status: 'passed', control: 'browser', surfaceId: 'web-gui',
    componentIds: ['gui-usability'], evidence: ['screenshots/local.png'],
    url: 'http://127.0.0.1:4173/', coverageArea: 'home', controlLabel: 'Get started',
    action: 'click', expected: 'The onboarding view opens.', actual: 'The onboarding view opened.',
    reproduction: 'Open the home page and click Get started.',
  });
});

test('Xray retains each blocked Browser flow on the same surface as a distinct gap', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui', control: 'browser', status: 'blocked',
      componentIds: ['gui-usability'], evidence: ['screenshots/login.png'],
      url: 'http://127.0.0.1:4173/login', coverageArea: 'login', controlLabel: 'Sign in',
      action: 'submit credentials', expected: 'The test account signs in.', actual: 'Test credentials were unavailable.',
      reproduction: 'Open login and submit the test credentials.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'blocked',
      componentIds: ['gui-usability'], evidence: ['screenshots/account.png'],
      url: 'http://127.0.0.1:4173/account', coverageArea: 'account', controlLabel: 'Save',
      action: 'submit profile', expected: 'The test profile saves.', actual: 'Authentication was unavailable.',
      reproduction: 'Open account and submit the test profile.',
    }],
  });
  const flowGaps = report.gaps.filter(({ code }) => code === 'FM_XRAY_GUI_FLOW_BLOCKED');

  assert.equal(flowGaps.length, 2);
  assert.deepEqual(flowGaps.map(({ checkId }) => checkId), ['gui-1', 'gui-2']);
  assert.deepEqual(flowGaps.map(({ coverageArea, status }) => [coverageArea, status]), [
    ['login', 'blocked'],
    ['account', 'blocked'],
  ]);
});

test('Xray reports browser coverage and prioritized recommendations from findings and gaps', async (t) => {
  const root = await fixture(t, {
    packageJson: { scripts: { test: 'node --test', dev: 'vite' }, dependencies: { vite: '^6' } },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui', control: 'browser', status: 'failed', severity: 'high',
      componentIds: ['gui-usability'], evidence: ['screenshots/login-error.png'],
      url: 'http://127.0.0.1:4173/login', coverageArea: 'login', controlLabel: 'Sign in',
      action: 'submit invalid credentials', expected: 'A clear validation message appears.',
      actual: 'The form becomes unresponsive.', reproduction: 'Open login and submit invalid credentials.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'blocked',
      componentIds: ['gui-usability'], evidence: ['screenshots/account-auth-wall.png'],
      url: 'http://127.0.0.1:4173/account', coverageArea: 'account', controlLabel: 'Save',
      action: 'submit profile', expected: 'The test profile saves.',
      actual: 'Test authentication was unavailable.', reproduction: 'Open account and submit the test profile.',
    }, {
      surfaceId: 'web-gui', control: 'browser', status: 'skipped',
      componentIds: ['gui-usability'], evidence: ['screenshots/settings-skipped.png'],
      url: 'http://127.0.0.1:4173/settings', coverageArea: 'settings', controlLabel: 'Delete account',
      action: 'open destructive action', expected: 'The destructive action remains unsubmitted.',
      actual: 'The unsafe flow was intentionally not exercised.', reproduction: 'Open settings without submitting the destructive action.',
    }],
    runCommand: async () => ({ exitCode: 0, stdout: 'ok', stderr: '' }),
  });
  assert.deepEqual(report.coverage.areas, ['login']);
  const findingProposal = report.recommendations.find(({ evidence }) => evidence.includes('gui-1'));
  assert.equal(findingProposal.priority, 'high');
  assert.equal(
    findingProposal.recommendation,
    'Address the verified finding "GUI control check failed: web-gui" by achieving the recorded expected outcome: A clear validation message appears.',
  );
  assert.equal(findingProposal.benefit, 'Expected outcome: A clear validation message appears.');
  assert.equal(findingProposal.verification, 'Open login and submit invalid credentials.');
  const blockedProposal = report.recommendations.find(({ evidence }) => evidence.includes('FM_XRAY_GUI_FLOW_BLOCKED'));
  assert.equal(
    blockedProposal.recommendation,
    'Close the recorded gap FM_XRAY_GUI_FLOW_BLOCKED for account: The recorded browser GUI flow was blocked.',
  );
  assert.equal(blockedProposal.benefit, 'Expected outcome: The test profile saves.');
  assert.equal(blockedProposal.verification, 'Open account and submit the test profile.');
  assert.equal(report.recommendations.length, report.findings.length + report.gaps.length);
  for (const gap of report.gaps) {
    const proposal = report.recommendations.find(({ evidence }) => evidence.includes(gap.code)
      && (!gap.checkId || evidence.includes(gap.checkId)));
    assert.ok(proposal, `missing proposal for ${gap.code}`);
    for (const field of ['priority', 'area', 'recommendation', 'benefit', 'verification']) {
      assert.ok(typeof proposal[field] === 'string' && proposal[field].trim(), `${gap.code} proposal lacks ${field}`);
    }
    assert.ok(proposal.evidence.length > 0, `${gap.code} proposal lacks evidence`);
  }
  const markdown = await readFile(path.join(root, 'docs', 'forgemind', 'xray-report.md'), 'utf8');
  assert.match(markdown, /GUI coverage/);
  assert.match(markdown, /Improvement proposals/);
});

test('Xray safely defaults malformed failed Browser receipt severities before scoring', async (t) => {
  for (const invalidSeverity of ['bogus', 'toString']) {
    await t.test(invalidSeverity, async (t) => {
      const root = await fixture(t, {
        packageJson: { scripts: { dev: 'vite' }, dependencies: { vite: '^6' } },
      });
      const report = await runXray({
        workspace: root,
        guiReceipts: [{
          surfaceId: 'web-gui', control: 'browser', status: 'failed', severity: invalidSeverity,
          componentIds: ['gui-usability', 'accessibility-visual'], evidence: ['screenshots/failure.png'],
          url: 'http://127.0.0.1:4173/', coverageArea: 'home', controlLabel: 'Continue',
          action: 'click', expected: 'The next view opens.', actual: 'The current view remains visible.',
          reproduction: 'Open the home page and click Continue.',
        }],
      });
      const persisted = JSON.parse(await readFile(
        path.join(root, '.codex-orchestrator', 'xray', 'report-latest.json'),
        'utf8',
      ));

      assert.equal(report.receipts[0].severity, 'high');
      assert.equal(report.findings[0].severity, 'high');
      assert.equal(report.score.value, 81);
      assert.equal(report.score.components.find(({ id }) => id === 'gui-usability').score, 75);
      assert.equal(persisted.score.value, 81);
      assert.equal(persisted.score.components.find(({ id }) => id === 'gui-usability').score, 75);
    });
  }
});

test('Xray identifies an API route without creating an inferred runnable check', async (t) => {
  const root = await fixture(t, { files: { 'src/routes.mjs': 'router.get("/health", () => {});' } });

  const mission = await discoverXrayMission({ workspace: root });

  assert.deepEqual(mission.surfaces.map(({ id }) => id), ['api']);
  assert.deepEqual(mission.checks, []);
});

test('Xray turns a failed local command into a detailed functional finding', async (t) => {
  const mission = {
    checks: [{ id: 'command-1', kind: 'command', command: 'npm test', surfaceIds: ['api'] }],
    gaps: [],
  };
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission,
    runCommand: async () => ({
      exitCode: 1,
      stdout: 'TOKEN=secret-value',
      stderr: 'expected 200, got 500',
      startedAt: '2026-08-16T00:00:00.000Z',
      endedAt: '2026-08-16T00:00:01.000Z',
    }),
  });

  assert.equal(result.findings[0].severity, 'high');
  assert.deepEqual(result.findings[0].surfaces, ['api']);
  assert.equal(result.findings[0].expected, 'Command succeeds: npm test');
  assert.equal(result.findings[0].actual, 'Command exited with 1');
  assert.match(result.findings[0].evidence[0], /command-1/);
  assert.match(result.receipts[0].stdout, /\[REDACTED:SECRET_ASSIGNMENT\]/);
});

test('Xray does not execute a command marked unsafe and records a test gap', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: { checks: [{ id: 'command-1', command: 'npm run migrate' }], gaps: [] },
    runCommand: async () => { throw new Error('must not execute'); },
  });

  assert.equal(result.receipts[0].status, 'skipped');
  assert.deepEqual(result.gaps.map(({ code }) => code), ['FM_XRAY_UNSAFE_CHECK_SKIPPED']);
});

test('Xray recursively holds package scripts whose aliases hide unsafe or remote operations', async (t) => {
  const cases = [
    { category: 'test', scripts: { test: 'npm run verify', verify: 'npm run deploy', deploy: 'node scripts/release.mjs' } },
    { category: 'build', scripts: { build: 'npm run verify', verify: 'node smoke.mjs --target https://remote.example.com' } },
    { category: 'lint', scripts: { prelint: 'node scripts/delete-data.mjs', lint: 'eslint .' } },
  ];

  for (const { category, scripts } of cases) {
    const mission = await discoverXrayMission({ workspace: await fixture(t, { packageJson: { scripts } }) });
    let executed = false;
    const result = await executeXrayMission({
      workspace: await fixture(t),
      mission,
      runCommand: async () => { executed = true; return { exitCode: 0, stdout: '', stderr: '' }; },
    });

    assert.equal(executed, false);
    assert.equal(mission.checks[0].scriptBody, scripts[category]);
    assert.equal(result.receipts[0].status, 'skipped');
    assert.equal(result.gaps.at(-1).code, 'FM_XRAY_UNSAFE_CHECK_SKIPPED');
  }
});

test('Xray defaults destructive shell, unresolved runtime, and environment-derived target scripts to a hold', async (t) => {
  const destructiveBodies = [
    'rm -rf important-data',
    'rimraf important-data',
    'powershell -Command Remove-Item -Recurse important-data',
    'node scripts/cleanup.mjs',
    'playwright test $TARGET_URL',
  ];

  for (const verify of destructiveBodies) {
    const root = await fixture(t, { packageJson: { scripts: { test: 'npm run verify', verify } } });
    const mission = await discoverXrayMission({ workspace: root });
    let executed = false;
    const result = await executeXrayMission({
      workspace: root,
      mission,
      runCommand: async () => { executed = true; return { exitCode: 0, stdout: '', stderr: '' }; },
    });

    assert.equal(executed, false, verify);
    assert.equal(mission.checks[0].unsafe, true, verify);
    assert.equal(result.receipts[0].status, 'skipped', verify);
  }
});

test('Xray turns a failed imported GUI receipt into an evidence-backed surface finding', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: {
      checks: [{
        id: 'gui-1',
        kind: 'gui-control',
        surfaceIds: ['web-gui'],
        componentIds: ['gui-usability'],
        importedReceipt: {
          status: 'failed',
          control: 'browser',
          surfaceId: 'web-gui',
          componentIds: ['gui-usability'],
          evidence: ['screenshots/broken-menu.png'],
        },
      }],
      gaps: [],
    },
  });

  assert.equal(result.findings[0].severity, 'high');
  assert.deepEqual(result.findings[0].surfaces, ['web-gui']);
  assert.deepEqual(result.findings[0].evidence, ['gui-1']);
});

test('Xray classifies a missing test binary as a gap instead of a product defect', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: { checks: [{ id: 'command-1', command: 'npm test', surfaceIds: ['api'] }], gaps: [] },
    runCommand: async () => ({ exitCode: 127, stdout: '', stderr: 'spawn npm ENOENT' }),
  });

  assert.equal(result.receipts[0].status, 'blocked');
  assert.deepEqual(result.findings, []);
  assert.equal(result.gaps[0].code, 'FM_XRAY_TOOL_UNAVAILABLE');
});

test('Xray classifies an unavailable local service or credential as a gap', async (t) => {
  for (const stderr of ['connect ECONNREFUSED 127.0.0.1:5432', 'Required credential TEST_API_KEY is not configured']) {
    const result = await executeXrayMission({
      workspace: await fixture(t),
      mission: { checks: [{ id: 'command-1', command: 'npm test', surfaceIds: ['api'] }], gaps: [] },
      runCommand: async () => ({ exitCode: 1, stdout: '', stderr }),
    });

    assert.equal(result.receipts[0].status, 'blocked');
    assert.deepEqual(result.findings, []);
    assert.equal(result.gaps[0].code, 'FM_XRAY_PREREQUISITE_UNAVAILABLE');
  }
});

test('Xray keeps ambiguous application error assertions as product failures', async (t) => {
  for (const stderr of [
    'AssertionError: expected 200, received 503 Service Unavailable',
    'AssertionError: expected connection refused but request succeeded',
  ]) {
    const result = await executeXrayMission({
      workspace: await fixture(t),
      mission: { checks: [{ id: 'command-1', kind: 'command', command: 'npm test', componentIds: ['functional-correctness'], surfaceIds: ['api'] }], gaps: [] },
      runCommand: async () => ({ exitCode: 1, stdout: '', stderr }),
    });

    assert.equal(result.receipts[0].status, 'failed', stderr);
    assert.equal(result.findings.length, 1, stderr);
    assert.deepEqual(result.gaps, [], stderr);
  }
});

test('Xray deduplicates findings with identical surfaces and command outcomes', async (t) => {
  const result = await executeXrayMission({
    workspace: await fixture(t),
    mission: {
      checks: [
        { id: 'command-1', command: 'npm test', surfaceIds: ['api'] },
        { id: 'command-2', command: 'npm test', surfaceIds: ['api'] },
      ],
      gaps: [],
    },
    runCommand: async () => ({ exitCode: 1, stdout: '', stderr: '' }),
  });

  assert.equal(result.findings.length, 1);
  assert.deepEqual(result.findings[0].evidence, ['command-1', 'command-2']);
});

test('Xray redistributes not-applicable weights and deducts high severity deterministically', () => {
  const score = scoreXrayQuality({
    mission: { surfaces: [{ id: 'api' }], checks: [{ id: 'command-1', surfaceIds: ['api'] }] },
    receipts: [{ id: 'command-1', status: 'failed' }],
    gaps: [],
    findings: [{ severity: 'high', surfaces: ['api'] }],
  });

  assert.equal(score.value, 79);
  assert.deepEqual(
    score.components.filter(({ status }) => status === 'not-applicable').map(({ id }) => id).sort(),
    ['accessibility-visual', 'gui-usability'],
  );
  assert.deepEqual(score.components.find(({ id }) => id === 'api-contracts').deductions, [{ findingId: null, severity: 'high', value: 25 }]);
  assert.equal(score.components.find(({ id }) => id === 'robustness-error-paths').status, 'insufficient-evidence');
});

test('Xray marks an API surface without an execution receipt as an evidence gap', () => {
  const score = scoreXrayQuality({
    mission: { surfaces: [{ id: 'api' }], checks: [{ id: 'command-1', surfaceIds: ['api'] }] },
    receipts: [],
    gaps: [],
    findings: [],
  });

  assert.equal(score.value, 0);
  assert.equal(score.status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'api-contracts').status, 'insufficient-evidence');
  assert.deepEqual(score.components.find(({ id }) => id === 'api-contracts').evidence, []);
  assert.equal(score.components.find(({ id }) => id === 'api-contracts').score, null);
  assert.equal(score.gaps[0].code, 'FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE');
  assert.equal(score.gaps[0].surfaceId, 'api');
});

test('Xray does not count a generic repository command as GUI or accessibility evidence', () => {
  const score = scoreXrayQuality({
    mission: {
      surfaces: [{ id: 'web-gui' }],
      checks: [{ id: 'command-1', kind: 'command', surfaceIds: [] }],
    },
    receipts: [{ id: 'command-1', status: 'passed' }],
    gaps: [{ code: 'FM_XRAY_GUI_CONTROL_UNAVAILABLE' }],
    findings: [],
  });

  assert.equal(score.components.find(({ id }) => id === 'gui-usability').status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'accessibility-visual').status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'evidence-coverage').score, 0);
  assert.ok(score.value < 100);
});

test('Xray counts only explicit surface-specific GUI receipt aspects', () => {
  const mission = {
    surfaces: [{ id: 'web-gui' }],
    checks: [{
      id: 'gui-1',
      kind: 'gui-control',
      surfaceIds: ['web-gui'],
      componentIds: ['gui-usability'],
    }],
  };
  const score = scoreXrayQuality({
    mission,
    receipts: [{ id: 'gui-1', status: 'passed', evidence: ['screenshot.png'] }],
    gaps: [],
    findings: [],
  });

  assert.equal(score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
  assert.equal(score.components.find(({ id }) => id === 'accessibility-visual').status, 'insufficient-evidence');
  assert.deepEqual(score.components.find(({ id }) => id === 'gui-usability').evidence, ['gui-1']);
});

test('Xray does not use an accessibility-only GUI receipt for functional or robustness scoring', () => {
  const score = scoreXrayQuality({
    mission: {
      surfaces: [{ id: 'web-gui' }],
      checks: [{
        id: 'gui-1',
        kind: 'gui-control',
        surfaceIds: ['web-gui'],
        componentIds: ['accessibility-visual'],
      }],
    },
    receipts: [{ id: 'gui-1', status: 'failed', evidence: ['axe:button-name'] }],
    gaps: [],
    findings: [{
      id: 'finding-gui-1',
      severity: 'high',
      surfaces: ['web-gui'],
      componentIds: ['accessibility-visual'],
    }],
  });

  assert.equal(score.components.find(({ id }) => id === 'functional-correctness').status, 'insufficient-evidence');
  assert.equal(score.components.find(({ id }) => id === 'robustness-error-paths').status, 'insufficient-evidence');
  assert.deepEqual(score.components.find(({ id }) => id === 'functional-correctness').deductions, []);
  assert.deepEqual(score.components.find(({ id }) => id === 'robustness-error-paths').deductions, []);
  assert.deepEqual(score.components.find(({ id }) => id === 'accessibility-visual').deductions, [{
    findingId: 'finding-gui-1', severity: 'high', value: 25,
  }]);
});

test('Xray discovers standalone native, mobile-emulator, and hybrid GUI surfaces from local signals', async (t) => {
  const native = await fixture(t, {
    files: {
      'DesktopApp.sln': '',
      'DesktopApp.csproj': '<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop"><PropertyGroup><UseWPF>true</UseWPF></PropertyGroup></Project>',
    },
  });
  const mobile = await fixture(t, {
    files: {
      'gradlew': '',
      'app/src/main/AndroidManifest.xml': '<manifest package="example.app" />',
    },
  });
  const hybrid = await fixture(t, {
    packageJson: {
      scripts: { test: 'node --test', dev: 'vite', android: 'react-native run-android' },
      dependencies: { express: '^5', react: '^19', vite: '^6', 'react-native': '^0.81' },
    },
  });

  assert.deepEqual((await discoverXrayMission({ workspace: native })).surfaces.map(({ id }) => id), ['native-gui']);
  assert.deepEqual((await discoverXrayMission({ workspace: mobile })).surfaces.map(({ id }) => id), ['mobile-gui']);
  assert.deepEqual(
    (await discoverXrayMission({ workspace: hybrid })).surfaces.map(({ id }) => id).sort(),
    ['api', 'mobile-gui', 'web-gui'],
  );
  assert.ok((await discoverXrayMission({ workspace: native })).gaps.some(({ code }) => code === 'FM_XRAY_GUI_CONTROL_UNAVAILABLE'));
});

test('Xray treats a standalone React Native start script as mobile-only', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      scripts: { start: 'react-native start', test: 'jest' },
      dependencies: { react: '^19', 'react-native': '^0.81' },
    },
  });

  const mission = await discoverXrayMission({ workspace: root });

  assert.deepEqual(mission.surfaces.map(({ id }) => id), ['mobile-gui']);
  assert.equal(mission.gaps[0].control, 'computer-use');
});

test('Xray effective component weights total exactly 100 after redistribution', () => {
  const score = scoreXrayQuality({
    mission: { surfaces: [{ id: 'api' }], checks: [{ id: 'command-1' }] },
    receipts: [{ id: 'command-1', status: 'passed' }],
    gaps: [],
    findings: [],
  });

  assert.equal(score.components.reduce((total, component) => total + component.effectiveWeight, 0), 100);
});

test('Xray writes canonical evidence and a readable Markdown report without changing product files', async (t) => {
  const packageJson = { scripts: { test: 'node --test' } };
  const root = await fixture(t, { packageJson });

  const report = await runXray({
    workspace: root,
    now: new Date('2026-08-16T00:00:00.000Z'),
    runCommand: async () => ({ exitCode: 0, stdout: 'ok', stderr: '' }),
  });

  assert.equal(report.evidencePath, '.codex-orchestrator/xray/report-latest.json');
  assert.match(await readFile(path.join(root, 'docs', 'forgemind', 'xray-report.md'), 'utf8'), /Quality score/);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'xray', 'report-latest.json'), 'utf8')),
    Object.fromEntries(Object.entries(report).filter(([key]) => !['evidencePath', 'projectDocuments'].includes(key))),
  );
  assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), JSON.stringify(packageJson, null, 2));
});

test('Xray imports GUI receipts and persists executed and skipped mission outcomes', async (t) => {
  const root = await fixture(t, {
    packageJson: {
      scripts: { test: 'node --test', build: 'npm run deploy', deploy: 'node release.mjs', dev: 'vite' },
      dependencies: { vite: '^6' },
    },
  });
  const report = await runXray({
    workspace: root,
    guiReceipts: [{
      surfaceId: 'web-gui',
      control: 'browser',
      status: 'passed',
      componentIds: ['gui-usability', 'accessibility-visual'],
      evidence: ['screenshots/home.png', 'axe:0-critical'],
      url: 'http://127.0.0.1:4173/',
      coverageArea: 'home',
      controlLabel: 'Get started',
      action: 'click',
      expected: 'The onboarding view opens.',
      actual: 'The onboarding view opened.',
      reproduction: 'Open the home page and click Get started.',
    }],
    runCommand: async (check) => {
      assert.equal(check.command, 'npm');
      assert.deepEqual(check.args, ['test']);
      return { exitCode: 0, stdout: 'ok', stderr: '' };
    },
  });
  const persisted = JSON.parse(await readFile(path.join(root, '.codex-orchestrator', 'xray', 'test-mission-latest.json'), 'utf8'));

  assert.equal(report.receipts.find(({ id }) => id === 'gui-1').status, 'passed');
  assert.equal(report.score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
  assert.equal(persisted.checks.find(({ id }) => id === 'command-1').outcome, 'skipped');
  assert.equal(persisted.checks.find(({ id }) => id === 'command-2').outcome, 'passed');
  assert.equal(persisted.checks.find(({ id }) => id === 'gui-1').outcome, 'passed');
  assert.deepEqual(persisted.skippedChecks, ['command-1']);
  assert.deepEqual(persisted.selectedChecks, ['command-2', 'gui-1']);
  assert.deepEqual(persisted.receipts, report.receipts);
  assert.ok(persisted.gaps.some(({ code }) => code === 'FM_XRAY_UNSAFE_CHECK_SKIPPED'));
});

test('Xray status identifies a workspace with no evidence report', async (t) => {
  const status = await getXrayStatus({ workspace: await fixture(t) });

  assert.deepEqual(status, {
    schemaVersion: 1,
    status: 'missing',
    nextAction: 'Run xray run first.',
    errors: [],
  });
});

test('Xray labels a mission with no test surface as insufficient evidence', () => {
  const score = scoreXrayQuality({ mission: { surfaces: [], checks: [] }, receipts: [], gaps: [], findings: [] });

  assert.equal(score.value, 0);
  assert.equal(score.status, 'insufficient-evidence');
  assert.deepEqual(score.gaps, [{ code: 'FM_XRAY_NO_TEST_SURFACE' }]);
});
