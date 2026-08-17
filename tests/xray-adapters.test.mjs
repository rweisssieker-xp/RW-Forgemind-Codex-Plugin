import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { executeBrowserAdapter, executeCommandAdapter } from '../src/xray-adapters.mjs';
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
      evidence: [
        '.codex-orchestrator/xray/browser/getting-started-before.png',
        '.codex-orchestrator/xray/browser/getting-started-after.png',
        '.codex-orchestrator/xray/browser/getting-started-trace.zip',
      ],
      screenshot: '.codex-orchestrator/xray/browser/getting-started-after.png',
      trace: '.codex-orchestrator/xray/browser/getting-started-trace.zip',
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
      evidence: [
        '.codex-orchestrator/xray/browser/contact-before.png',
        '.codex-orchestrator/xray/browser/contact-after.png',
        '.codex-orchestrator/xray/browser/contact-trace.zip',
      ],
      screenshot: '.codex-orchestrator/xray/browser/contact-after.png',
      trace: '.codex-orchestrator/xray/browser/contact-trace.zip',
    },
  };

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
  assert.match(receipt.evidence[0], /^\.codex-orchestrator\/xray\/browser\//);
  assert.equal(receipt.screenshot, '.codex-orchestrator/xray/browser/getting-started-after.png');
  assert.equal(receipt.trace, '.codex-orchestrator/xray/browser/getting-started-trace.zip');
  assert.equal(receipts[1].status, 'passed');
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
