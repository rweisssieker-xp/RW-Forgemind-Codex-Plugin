import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  browserValidationCandidates,
  executeAndroidAdapter,
  executeBrowserAdapter,
  executeCommandAdapter,
  isSafeBrowserHttpRequest,
  isSafeBrowserLink,
} from '../src/xray-adapters.mjs';
import { runProcess } from '../src/process.mjs';
import { discoverXrayMission, runXray, selectXrayChecks } from '../src/xray.mjs';

async function workspace(t, files = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-adapter-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

async function browserWorkspace(t, packageName = 'playwright') {
  const packageDirectory = path.join('node_modules', ...packageName.split('/'));
  return workspace(t, {
    'package.json': JSON.stringify({ devDependencies: { [packageName]: '^1.0.0' } }),
    [path.join(packageDirectory, 'package.json')]: JSON.stringify({
      name: packageName,
      version: '1.0.0',
      bin: { playwright: 'cli.js' },
    }),
    [path.join(packageDirectory, 'cli.js')]: 'process.exitCode = 0;\n',
  });
}

async function writeBrowserFlowArtifacts(root, scriptArgument, stem = 'flow') {
  const runDirectory = path.basename(scriptArgument, '.spec.mjs');
  assert.match(runDirectory, /^run-[0-9a-f-]+$/);
  const artifactDirectory = path.join(root, '.codex-orchestrator', 'xray', 'browser', runDirectory);
  const files = [
    `${stem}-before.png`,
    `${stem}-before.json`,
    `${stem}-after.png`,
    `${stem}-after.json`,
    `${stem}-trace.zip`,
  ];
  await mkdir(artifactDirectory, { recursive: true });
  await Promise.all(files.map((file) => writeFile(
    path.join(artifactDirectory, file),
    file.endsWith('.json') ? '[]\n' : `xray ${file}\n`,
  )));
  const prefix = `.codex-orchestrator/xray/browser/${runDirectory}`;
  return {
    evidence: files.map((file) => `${prefix}/${file}`),
    screenshot: `${prefix}/${stem}-after.png`,
    trace: `${prefix}/${stem}-trace.zip`,
  };
}

test('browser adapter blocks non-test targets before invoking Playwright', async (t) => {
  let invoked = false;
  const [remote] = await executeBrowserAdapter({
    url: 'https://production.example/',
    workspace: await browserWorkspace(t),
    runProcess: async () => { invoked = true; throw new Error('must not execute'); },
  });

  assert.equal(invoked, false);
  assert.equal(remote.status, 'blocked');
  assert.equal(remote.gap.code, 'FM_XRAY_BROWSER_TARGET_UNSAFE');
});

test('browser adapter reports an explicit setup gap without downloading Playwright', async (t) => {
  let invoked = false;
  const [missing] = await executeBrowserAdapter({
    url: 'http://127.0.0.1:4173/',
    workspace: await workspace(t, { 'package.json': '{}' }),
    runProcess: async () => { invoked = true; throw new Error('must not execute'); },
  });

  assert.equal(invoked, false);
  assert.equal(missing.status, 'blocked');
  assert.equal(missing.gap.code, 'FM_XRAY_PLAYWRIGHT_UNAVAILABLE');
  assert.match(missing.gap.nextAction, /npm install --save-dev playwright/);
  assert.match(missing.gap.nextAction, /npx playwright install chromium/);
});

test('browser adapter executes its isolated local runner and normalizes protocol receipts', async (t) => {
  const root = await browserWorkspace(t);
  let generatedScriptValidated = false;

  const receipts = await executeBrowserAdapter({
    url: 'http://127.0.0.1:4173/',
    workspace: root,
    runProcess: async (command, args, options) => {
      assert.equal(command, process.execPath);
      assert.equal(args[0], path.join(root, 'node_modules', 'playwright', 'cli.js'));
      assert.ok(args.includes('test'));
      assert.ok(args.includes('--config'));
      assert.deepEqual(options, { cwd: root });
      const script = args.find((argument) => String(argument).endsWith('.spec.mjs'));
      assert.ok(script);
      assert.ok((await readFile(path.resolve(root, script), 'utf8')).length > 0);
      const syntax = await runProcess(process.execPath, ['--check', path.resolve(root, script)], { cwd: root });
      assert.equal(syntax.exitCode, 0, syntax.stderr);
      generatedScriptValidated = true;
      const gettingStartedArtifacts = await writeBrowserFlowArtifacts(root, script, 'getting-started');
      const contactArtifacts = await writeBrowserFlowArtifacts(root, script, 'contact');
      const protocolReceipt = {
        protocol: 'forgemind-xray-browser-v1',
        type: 'receipt',
        receipt: {
          status: 'passed',
          url: 'http://127.0.0.1:4173/getting-started',
          coverageArea: 'getting-started',
          controlLabel: 'Get started',
          action: 'open local link',
          expected: 'The getting-started view opens.',
          actual: 'The getting-started view opened. TOKEN=secret-value',
          reproduction: 'Open the home page and follow Get started.',
          ...gettingStartedArtifacts,
        },
      };
      const validationReceipt = {
        protocol: 'forgemind-xray-browser-v1',
        type: 'receipt',
        receipt: {
          ...protocolReceipt.receipt,
          url: 'http://127.0.0.1:4173/contact',
          coverageArea: 'contact',
          controlLabel: 'Contact form',
          action: 'exercise validation without submit',
          expected: 'Invalid input is rejected without submission.',
          actual: 'Browser validation rejected the isolated input.',
          reproduction: 'Open contact and trigger validation without submitting.',
          ...contactArtifacts,
        },
      };
      return {
        exitCode: 0,
        stdout: `Playwright runner noise\n${JSON.stringify({ status: 'failed' })}\n${JSON.stringify(protocolReceipt)}\n${JSON.stringify(validationReceipt)}\n`,
        stderr: '',
      };
    },
  });

  assert.equal(generatedScriptValidated, true);
  assert.equal(receipts.length, 2);
  const [receipt] = receipts;
  assert.equal(receipt.adapter, 'browser');
  assert.equal(receipt.control, 'playwright');
  assert.equal(receipt.surfaceId, 'web-gui');
  assert.deepEqual(receipt.surfaceIds, ['web-gui']);
  assert.equal(receipt.coverageArea, 'getting-started');
  assert.match(receipt.actual, /\[REDACTED:SECRET_ASSIGNMENT\]/);
  assert.match(receipt.evidence[0], /^\.codex-orchestrator\/xray\/browser\/run-[0-9a-f-]+\//);
  assert.match(receipt.screenshot, /\/getting-started-after\.png$/);
  assert.match(receipt.trace, /\/getting-started-trace\.zip$/);
  assert.equal(receipts[1].status, 'passed');
});

test('browser adapter starts and stops a detected local Vite server when the target is initially unavailable', async (t) => {
  const root = await browserWorkspace(t);
  const manifestPath = path.join(root, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.scripts = { dev: 'vite --host 0.0.0.0' };
  manifest.devDependencies.vite = '^6.0.0';
  await writeFile(manifestPath, JSON.stringify(manifest), 'utf8');
  await mkdir(path.join(root, 'node_modules', 'vite', 'bin'), { recursive: true });
  await writeFile(path.join(root, 'node_modules', 'vite', 'package.json'), JSON.stringify({
    name: 'vite', version: '6.0.0', bin: { vite: 'bin/vite.js' },
  }), 'utf8');
  await writeFile(path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'process.exitCode = 0;\n', 'utf8');

  let runnerAttempts = 0;
  let starts = 0;
  let stops = 0;
  const receipts = await executeBrowserAdapter({
    url: 'http://127.0.0.1:4173/',
    workspace: root,
    runProcess: async (_command, args) => {
      runnerAttempts += 1;
      if (runnerAttempts === 1) {
        return { exitCode: 1, stdout: '', stderr: 'page.goto: net::ERR_CONNECTION_REFUSED' };
      }
      const script = args.find((argument) => String(argument).endsWith('.spec.mjs'));
      const artifacts = await writeBrowserFlowArtifacts(root, script, 'home');
      return {
        exitCode: 0,
        stderr: '',
        stdout: `${JSON.stringify({
          protocol: 'forgemind-xray-browser-v1',
          type: 'receipt',
          receipt: {
            status: 'passed', url: 'http://127.0.0.1:4173/', coverageArea: 'home',
            controlLabel: 'Home page', action: 'open page', expected: 'The local page loads.',
            actual: 'The local page loaded.', reproduction: 'Open the explicit test URL.',
            ...artifacts,
          },
        })}\n`,
      };
    },
    startProcess: async (command, args, options) => {
      starts += 1;
      assert.equal(command, process.execPath);
      assert.equal(args[0], path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'));
      assert.deepEqual(args.slice(1), ['--host', '127.0.0.1', '--port', '4173', '--strictPort']);
      assert.equal(options.cwd, root);
      assert.equal(options.shell, false);
      return { stop: async () => { stops += 1; } };
    },
    probeUrl: async (target) => {
      assert.equal(target, 'http://127.0.0.1:4173/');
      return true;
    },
  });

  assert.equal(runnerAttempts, 2);
  assert.equal(starts, 1);
  assert.equal(stops, 1);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].status, 'passed');
});

test('browser request and link policy only permits read-only HTTP and structurally opted-in navigation', () => {
  const targetUrl = 'http://127.0.0.1:4173/';
  assert.equal(isSafeBrowserHttpRequest({ targetUrl, url: `${targetUrl}api/items`, method: 'GET' }), true);
  assert.equal(isSafeBrowserHttpRequest({ targetUrl, url: `${targetUrl}api/items`, method: 'HEAD' }), true);
  assert.equal(isSafeBrowserHttpRequest({ targetUrl, url: `${targetUrl}api/items`, method: 'POST' }), false);
  assert.equal(isSafeBrowserHttpRequest({ targetUrl, url: 'https://example.test/api/items', method: 'GET' }), false);

  assert.equal(isSafeBrowserLink({
    targetUrl, currentUrl: targetUrl, linkUrl: `${targetUrl}eliminar`, explicitlySafe: false,
  }), false);
  assert.equal(isSafeBrowserLink({
    targetUrl, currentUrl: targetUrl, linkUrl: `${targetUrl}docs`, explicitlySafe: true,
  }), true);
  assert.equal(isSafeBrowserLink({
    targetUrl, currentUrl: `${targetUrl}docs`, linkUrl: `${targetUrl}docs#details`, explicitlySafe: false,
  }), true);
});

test('browser adapter rejects missing and prior-run evidence instead of scoring a receipt', async (t) => {
  const root = await browserWorkspace(t);
  const [missing] = await executeBrowserAdapter({
    url: 'http://127.0.0.1:4173/',
    workspace: root,
    runProcess: async (_command, args) => {
      const script = args.find((argument) => String(argument).endsWith('.spec.mjs'));
      const runDirectory = path.basename(script, '.spec.mjs');
      const prefix = `.codex-orchestrator/xray/browser/${runDirectory}`;
      return {
        exitCode: 0,
        stderr: '',
        stdout: `${JSON.stringify({
          protocol: 'forgemind-xray-browser-v1', type: 'receipt', receipt: {
            status: 'passed', url: 'http://127.0.0.1:4173/', coverageArea: 'home',
            controlLabel: 'Home page', action: 'open page', expected: 'The page loads.',
            actual: 'The page loaded.', reproduction: 'Open the page.',
            evidence: [`${prefix}/home-after.png`, `${prefix}/home-snapshot.json`, `${prefix}/home-trace.zip`],
            screenshot: `${prefix}/home-after.png`, trace: `${prefix}/home-trace.zip`,
          },
        })}\n`,
      };
    },
  });
  assert.equal(missing.status, 'blocked');
  assert.equal(missing.gap.code, 'FM_XRAY_BROWSER_EVIDENCE_INVALID');

  const priorDirectory = path.join(root, '.codex-orchestrator', 'xray', 'browser', 'run-prior');
  await mkdir(priorDirectory, { recursive: true });
  await Promise.all(['before.png', 'snapshot.json', 'after.png', 'trace.zip']
    .map((name) => writeFile(path.join(priorDirectory, name), `old ${name}\n`)));
  const [prior] = await executeBrowserAdapter({
    url: 'http://127.0.0.1:4173/',
    workspace: root,
    runProcess: async () => ({
      exitCode: 0,
      stderr: '',
      stdout: `${JSON.stringify({
        protocol: 'forgemind-xray-browser-v1', type: 'receipt', receipt: {
          status: 'passed', url: 'http://127.0.0.1:4173/', coverageArea: 'home',
          controlLabel: 'Home page', action: 'open page', expected: 'The page loads.',
          actual: 'The page loaded.', reproduction: 'Open the page.',
          evidence: [
            '.codex-orchestrator/xray/browser/run-prior/before.png',
            '.codex-orchestrator/xray/browser/run-prior/snapshot.json',
            '.codex-orchestrator/xray/browser/run-prior/after.png',
            '.codex-orchestrator/xray/browser/run-prior/trace.zip',
          ],
          screenshot: '.codex-orchestrator/xray/browser/run-prior/after.png',
          trace: '.codex-orchestrator/xray/browser/run-prior/trace.zip',
        },
      })}\n`,
    }),
  });
  assert.equal(prior.status, 'blocked');
  assert.equal(prior.gap.code, 'FM_XRAY_BROWSER_EVIDENCE_INVALID');
});

test('optional pattern fields receive nonblank invalid candidates without inventing a product failure', () => {
  const candidates = browserValidationCandidates({ required: false, type: 'text', pattern: '[0-9]{4}' });
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((candidate) => candidate.length > 0));
  assert.ok(candidates.some((candidate) => !/^(?:[0-9]{4})$/.test(candidate)));
  assert.deepEqual(browserValidationCandidates({ required: false, type: 'text', pattern: '' }), ['xray-invalid-pattern']);
});

test('Android adapter reports an explicit ADB prerequisite gap', async (t) => {
  const result = await executeAndroidAdapter({
    workspace: await workspace(t, {
      'app/src/main/AndroidManifest.xml': '<manifest package="example.xray" />',
    }),
    runProcess: async () => ({ exitCode: 127, stdout: '', stderr: 'adb: command not found' }),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.gap.code, 'FM_XRAY_ADB_UNAVAILABLE');
});

test('Android adapter reports an explicit emulator prerequisite gap', async (t) => {
  const result = await executeAndroidAdapter({
    workspace: await workspace(t, {
      'app/src/main/AndroidManifest.xml': '<manifest package="example.xray" />',
    }),
    runProcess: async (_command, args) => {
      assert.deepEqual(args, ['devices']);
      return { exitCode: 0, stdout: 'List of devices attached\nemulator-5554\toffline\n', stderr: '' };
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.gap.code, 'FM_XRAY_ANDROID_EMULATOR_UNAVAILABLE');
});

test('Android adapter captures a package-scoped emulator receipt and local artifacts', async (t) => {
  const root = await workspace(t, {
    'app/src/main/AndroidManifest.xml': '<manifest package="example.xray"><application><activity android:name=".MainActivity" /></application></manifest>',
  });
  const receipt = await executeAndroidAdapter({
    workspace: root,
    runProcess: async (_command, args) => {
      const invocation = args.join(' ');
      if (invocation === 'devices') return { exitCode: 0, stdout: 'List of devices attached\nemulator-5554\tdevice\n', stderr: '' };
      if (invocation.includes('resolve-activity')) return { exitCode: 0, stdout: 'example.xray/.MainActivity\n', stderr: '' };
      if (invocation.includes('pidof -s')) return { exitCode: 0, stdout: '4132\n', stderr: '' };
      if (invocation.includes('uiautomator dump')) return {
        exitCode: 0,
        stdout: '<hierarchy><node text="Continue" clickable="true" bounds="[10,20][110,60]" /></hierarchy>',
        stderr: '',
      };
      if (invocation.includes('screencap -p')) return { exitCode: 0, stdout: 'PNG-DATA', stdoutBuffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]), stderr: '' };
      if (invocation.includes('logcat -d --pid 4132')) return { exitCode: 0, stdout: 'I/Xray(4132): ready\n', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    },
  });

  assert.equal(receipt.adapter, 'android-adb');
  assert.equal(receipt.status, 'passed');
  assert.deepEqual(receipt.surfaceIds, ['mobile-gui']);
  assert.equal(receipt.serial, 'emulator-5554');
  assert.equal(receipt.packageName, 'example.xray');
  assert.equal(receipt.activity, 'example.xray/.MainActivity');
  assert.ok(receipt.evidence.some((evidence) => evidence.endsWith('ui-tree.xml')));
  assert.deepEqual(receipt.controls, [{ label: 'Continue', bounds: '[10,20][110,60]', center: { x: 60, y: 40 } }]);
  assert.match(await readFile(path.join(root, '.codex-orchestrator', 'xray', 'android', 'latest', 'ui-tree.xml'), 'utf8'), /Continue/);
  assert.deepEqual(await readFile(path.join(root, '.codex-orchestrator', 'xray', 'android', 'latest', 'screenshot.png')), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

test('Xray imports Android adapter evidence as a mobile GUI receipt', async (t) => {
  const root = await workspace(t, {
    'gradlew.bat': '',
    'app/src/main/AndroidManifest.xml': '<manifest package="example.xray"><application /></manifest>',
  });
  const report = await runXray({
    workspace: root,
    adapters: ['android'],
    runProcess: async (_command, args) => {
      const invocation = args.join(' ');
      if (invocation === 'devices') return { exitCode: 0, stdout: 'List of devices attached\nemulator-5554\tdevice\n', stderr: '' };
      if (invocation.includes('resolve-activity')) return { exitCode: 0, stdout: 'example.xray/.MainActivity\n', stderr: '' };
      if (invocation.includes('pidof -s')) return { exitCode: 0, stdout: '4132\n', stderr: '' };
      if (invocation.includes('uiautomator dump')) return { exitCode: 0, stdout: '<hierarchy />', stderr: '' };
      if (invocation.includes('screencap -p')) return { exitCode: 0, stdout: 'PNG-DATA', stderr: '' };
      return { exitCode: 0, stdout: '', stderr: '' };
    },
  });

  assert.deepEqual(report.adapters.selected, ['android']);
  assert.deepEqual(report.adapters.executed, ['android-adb']);
  assert.equal(report.receipts[0].adapter, 'android-adb');
  assert.equal(report.receipts[0].surfaceId, 'mobile-gui');
  assert.equal(report.score.components.find(({ id }) => id === 'gui-usability').status, 'applicable');
});

test('command adapter records a successful inferred dotnet test receipt', async (t) => {
  const root = await workspace(t, { 'sample.sln': '' });

  const result = await executeCommandAdapter({
    candidate: {
      id: 'command-1', command: 'dotnet', args: ['test'],
      confidence: 'inferred', surfaceHints: ['api'],
    },
    workspace: root,
    runProcess: async (command, args, options) => {
      assert.equal(command, 'dotnet');
      assert.deepEqual(args, ['test']);
      assert.deepEqual(options, { cwd: root });
      return { exitCode: 0, stdout: 'Passed!', stderr: '' };
    },
  });

  assert.equal(result.adapter, 'command');
  assert.equal(result.status, 'passed');
  assert.deepEqual(result.surfaceIds, ['api']);
  assert.deepEqual(result.evidence, ['command-1']);
  assert.equal(result.command, 'dotnet test');
});

test('command adapter blocks an unavailable dotnet executable', async (t) => {
  const result = await executeCommandAdapter({
    candidate: { id: 'command-1', command: 'dotnet', args: ['test'], surfaceHints: ['api'] },
    workspace: await workspace(t),
    runProcess: async () => ({ exitCode: 127, stdout: '', stderr: 'dotnet: command not found' }),
  });

  assert.equal(result.adapter, 'command');
  assert.equal(result.status, 'blocked');
  assert.equal(result.gap.code, 'FM_XRAY_TOOL_UNAVAILABLE');
});

test('Xray retains an API evidence gap when API discovery has no executable candidate', async (t) => {
  const root = await workspace(t, { 'src/routes.mjs': 'router.get("/health", () => {});' });

  const mission = await discoverXrayMission({ workspace: root });
  const apiOnly = await runXray({ workspace: root });

  assert.deepEqual(mission.checks, []);
  assert.ok(apiOnly.gaps.some(({ code }) => code === 'FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE'));
});

test('Xray rejects inferred candidates made unsafe by their arguments', () => {
  const checks = selectXrayChecks({
    commands: [{
      command: 'dotnet', args: ['test', '--environment=production'], category: 'test',
      confidence: 'inferred', source: '*.sln', adapter: 'command', surfaceHints: ['api'],
    }],
    manifest: { scripts: {} },
    surfaces: [{ id: 'api' }],
  });

  assert.deepEqual(checks, []);
});

test('Xray rejects inferred batch candidates with command chaining in their arguments', () => {
  const checks = selectXrayChecks({
    commands: [{
      command: 'gradlew.bat', args: ['test', '&', 'whoami'], category: 'test',
      confidence: 'inferred', source: 'gradlew.bat', adapter: 'command', surfaceHints: [],
    }],
    manifest: { scripts: {} },
    surfaces: [],
  });

  assert.deepEqual(checks, []);
});

test('process adapter executes a Windows batch wrapper without enabling a shell', { skip: process.platform !== 'win32' }, async (t) => {
  const root = await workspace(t, { 'gradlew.bat': '@echo off\r\necho wrapper-%1\r\nexit /b 0\r\n' });

  const result = await runProcess('gradlew.bat', ['test'], { cwd: root });

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /wrapper-test/);
  assert.equal(result.shell, false);
});

test('process adapter rejects Windows batch command-chain arguments before invoking cmd', { skip: process.platform !== 'win32' }, async (t) => {
  const root = await workspace(t, { 'gradlew.bat': '@echo off\r\necho wrapper-%1\r\nexit /b 0\r\n' });

  const result = await runProcess('gradlew.bat', ['test', '&', 'whoami'], { cwd: root });

  assert.equal(result.exitCode, 127);
  assert.match(result.stderr, /unsafe Windows batch invocation/i);
  assert.doesNotMatch(result.stdout, /wrapper-test/);
});
