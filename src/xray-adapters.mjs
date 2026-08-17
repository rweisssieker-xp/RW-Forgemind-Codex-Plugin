import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';

import { artifactStatePath } from './artifact-store.mjs';
import { redactText } from './redact.mjs';

const UNSAFE_COMMAND_PATTERN = /\b(?:migrate|deploy|publish|seed|reset|delete|destroy|drop|truncate|production)\b/i;
const WINDOWS_BATCH_COMMAND_PATTERN = /\.(?:bat|cmd)$/i;
const WINDOWS_COMMAND_CHAIN_PATTERN = /[&|<>^%!\r\n]/;
const BROWSER_PROTOCOL = 'forgemind-xray-browser-v1';
const BROWSER_EVIDENCE_PREFIX = '.codex-orchestrator/xray/browser';
const BROWSER_COMPONENT_IDS = ['gui-usability', 'accessibility-visual'];
const BROWSER_STATUSES = new Set(['passed', 'failed', 'blocked', 'skipped']);
const BROWSER_FAILURE_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const DANGEROUS_BROWSER_CONTROL_PATTERN = /\b(?:admin|approve|buy|checkout|credential|delete|deploy|destroy|drop|invite|order|password|pay|payment|production|publish|purchase|release|remove|reset|save|secret|seed|send|sign[ -]?in|submit|token|transfer|truncate|upload)\b/i;
const PLAYWRIGHT_SETUP_ACTION = 'Run `npm install --save-dev playwright`, then `npx playwright install chromium`.';

export async function executeBrowserAdapter({ url, workspace, runProcess }) {
  const target = normalizeBrowserTarget(url);
  if (!target) {
    return [browserGapResult(
      'FM_XRAY_BROWSER_TARGET_UNSAFE',
      'Browser execution is restricted to explicit loopback or reserved .test URLs.',
      'Provide --test-url with an http(s) localhost, 127.0.0.0/8, ::1, or reserved .test target.',
    )];
  }

  const runner = await resolveLocalPlaywright(workspace);
  if (!runner) {
    return [browserGapResult(
      'FM_XRAY_PLAYWRIGHT_UNAVAILABLE',
      'A declared workspace-local playwright or @playwright/test package is unavailable.',
      PLAYWRIGHT_SETUP_ACTION,
    )];
  }

  const runId = randomUUID();
  const artifactDirectory = artifactStatePath(workspace, 'xray', 'browser');
  const flowArtifactDirectory = path.join(artifactDirectory, `run-${runId}`);
  const flowEvidencePrefix = `${BROWSER_EVIDENCE_PREFIX}/run-${runId}`;
  const scriptPath = path.join(artifactDirectory, `run-${runId}.spec.mjs`);
  const configPath = path.join(artifactDirectory, `run-${runId}.config.mjs`);
  const outputDirectory = path.join(flowArtifactDirectory, 'playwright-output');
  await mkdir(artifactDirectory, { recursive: true });
  await writeFile(scriptPath, createBrowserRunnerScript({
    target,
    artifactDirectory: flowArtifactDirectory,
    evidencePrefix: flowEvidencePrefix,
    importSpecifier: runner.importSpecifier,
  }), { encoding: 'utf8', flag: 'wx' });
  await writeFile(configPath, createBrowserRunnerConfig({
    artifactDirectory,
    outputDirectory,
    scriptName: path.basename(scriptPath),
  }), { encoding: 'utf8', flag: 'wx' });

  let result;
  try {
    const scriptArgument = workspaceRelativePath(workspace, scriptPath);
    const configArgument = workspaceRelativePath(workspace, configPath);
    result = await runProcess(process.execPath, [
      runner.cliPath,
      'test',
      scriptArgument,
      '--config',
      configArgument,
      '--reporter=line',
      '--workers=1',
    ], { cwd: workspace });
  } catch (error) {
    result = { exitCode: 127, stdout: '', stderr: error?.message ?? String(error) };
  } finally {
    await Promise.allSettled([
      rm(scriptPath, { force: true }),
      rm(configPath, { force: true }),
    ]);
  }

  const receipts = parseBrowserProtocol(result?.stdout, target);
  if (receipts.length > 0 && result?.exitCode === 0 && !result?.truncated) return receipts;

  const failure = classifyBrowserRunnerFailure(result);
  const gap = browserGapResult(failure.code, failure.message, failure.nextAction, {
    stdout: redactText(result?.stdout ?? '').text,
    stderr: redactText(result?.stderr ?? '').text,
    exitCode: result?.exitCode,
  });
  return receipts.length > 0 ? [...receipts, gap] : [gap];
}

export function isSafeBrowserTarget(value) {
  return Boolean(normalizeBrowserTarget(value));
}

export const isLocalOrTestBrowserUrl = isSafeBrowserTarget;

async function resolveLocalPlaywright(workspace) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(workspace, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  for (const packageName of ['playwright', '@playwright/test']) {
    if (!declared.has(packageName)) continue;
    const packageDirectory = path.join(workspace, 'node_modules', ...packageName.split('/'));
    try {
      const packageManifest = JSON.parse(await readFile(path.join(packageDirectory, 'package.json'), 'utf8'));
      const bin = packageManifest.bin;
      const relativeCli = typeof bin === 'string' ? bin : bin?.playwright ?? 'cli.js';
      const cliPath = path.resolve(packageDirectory, relativeCli);
      const relative = path.relative(path.resolve(packageDirectory), cliPath);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) continue;
      await access(cliPath);
      return {
        packageName,
        cliPath,
        importSpecifier: packageName === 'playwright' ? 'playwright/test' : '@playwright/test',
      };
    } catch {
      // Try the other explicitly declared supported package.
    }
  }
  return null;
}

function normalizeBrowserTarget(value) {
  try {
    const target = new URL(String(value ?? '').trim());
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) return null;
    const hostname = target.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    const isIpv4Loopback = isIP(hostname) === 4 && hostname.split('.')[0] === '127';
    const safeHostname = hostname === 'localhost'
      || hostname.endsWith('.localhost')
      || hostname === '::1'
      || isIpv4Loopback
      || hostname === 'test'
      || hostname.endsWith('.test');
    return safeHostname ? target.href : null;
  } catch {
    return null;
  }
}

function browserGapResult(code, message, nextAction, execution = {}) {
  return {
    adapter: 'browser',
    control: 'playwright',
    surfaceId: 'web-gui',
    surfaceIds: ['web-gui'],
    componentIds: [...BROWSER_COMPONENT_IDS],
    status: 'blocked',
    evidence: [],
    ...execution,
    gap: {
      code,
      surfaceId: 'web-gui',
      control: 'playwright',
      message,
      nextAction,
    },
  };
}

function classifyBrowserRunnerFailure(result = {}) {
  const output = `${result.stderr ?? ''}\n${result.stdout ?? ''}`;
  if (result.truncated) {
    return {
      code: 'FM_XRAY_BROWSER_PROTOCOL_TRUNCATED',
      message: 'The Playwright protocol output was truncated before all browser flows could be recorded.',
      nextAction: 'Reduce the mapped test surface or rerun Xray after increasing the local process output limit.',
    };
  }
  if (/executable doesn'?t exist|browser executable|please run .*playwright install|browserType\.launch|failed to launch.*(?:chromium|browser)/i.test(output)) {
    return {
      code: 'FM_XRAY_PLAYWRIGHT_UNAVAILABLE',
      message: 'The local Playwright package is installed, but its Chromium runtime is unavailable.',
      nextAction: PLAYWRIGHT_SETUP_ACTION,
    };
  }
  if (/ECONNREFUSED|ERR_CONNECTION_REFUSED|connection refused|net::ERR_|NS_ERROR_CONNECTION_REFUSED|timed out while (?:waiting|connecting)/i.test(output)) {
    return {
      code: 'FM_XRAY_BROWSER_TARGET_UNAVAILABLE',
      message: 'Playwright could not reach the explicit local/test browser target.',
      nextAction: 'Start the local test server, verify the supplied --test-url, and rerun Xray.',
    };
  }
  if (result.exitCode === 0) {
    return {
      code: 'FM_XRAY_BROWSER_PROTOCOL_INVALID',
      message: 'The isolated Playwright runner completed without a valid ForgeMind browser receipt.',
      nextAction: 'Rerun Xray and inspect the redacted Playwright output for a runner or protocol error.',
    };
  }
  return {
    code: 'FM_XRAY_BROWSER_EXECUTION_UNAVAILABLE',
    message: 'The isolated Playwright runner stopped before it could record a browser flow.',
    nextAction: 'Resolve the reported local runner prerequisite, then rerun Xray against the same test URL.',
  };
}

function parseBrowserProtocol(stdout, target) {
  const receipts = [];
  for (const line of String(stdout ?? '').split(/\r?\n/)) {
    let envelope;
    try {
      envelope = JSON.parse(line);
    } catch {
      continue;
    }
    if (envelope?.protocol !== BROWSER_PROTOCOL || envelope?.type !== 'receipt') continue;
    const receipt = normalizeBrowserReceipt(envelope.receipt, target);
    if (receipt) receipts.push(receipt);
  }
  return receipts;
}

function normalizeBrowserReceipt(candidate, target) {
  if (!candidate || !BROWSER_STATUSES.has(candidate.status)) return null;
  const fields = ['coverageArea', 'controlLabel', 'action', 'expected', 'actual', 'reproduction'];
  const flow = Object.fromEntries(fields.map((field) => [field, redactField(candidate[field])]));
  if (fields.some((field) => !flow[field])) return null;
  const receiptUrl = normalizeBrowserTarget(candidate.url);
  if (!receiptUrl || new URL(receiptUrl).origin !== new URL(target).origin) return null;
  const candidateEvidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];
  const evidence = [...new Set(candidateEvidence.map(normalizeBrowserEvidence).filter(Boolean))];
  const screenshot = normalizeBrowserEvidence(candidate.screenshot);
  const trace = normalizeBrowserEvidence(candidate.trace);
  if (!screenshot || !trace || evidence.length === 0) return null;
  if (!evidence.includes(screenshot)) evidence.push(screenshot);
  if (!evidence.includes(trace)) evidence.push(trace);
  const safetyAction = flow.action.replace(/\bwithout\s+(?:submit|submitting|submission)\b/gi, '');
  const dangerous = DANGEROUS_BROWSER_CONTROL_PATTERN.test(`${flow.controlLabel} ${safetyAction}`);
  const status = dangerous && ['passed', 'failed'].includes(candidate.status) ? 'skipped' : candidate.status;
  return {
    adapter: 'browser',
    control: 'playwright',
    surfaceId: 'web-gui',
    surfaceIds: ['web-gui'],
    componentIds: [...BROWSER_COMPONENT_IDS],
    status,
    ...(status === 'failed' ? {
      severity: BROWSER_FAILURE_SEVERITIES.has(candidate.severity) ? candidate.severity : 'high',
    } : {}),
    url: redactField(receiptUrl),
    ...flow,
    ...(dangerous ? {
      actual: 'The unsafe browser control was intentionally not exercised.',
    } : {}),
    evidence,
    screenshot,
    trace,
  };
}

function normalizeBrowserEvidence(value) {
  const normalized = String(value ?? '').trim().replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized.startsWith(`${BROWSER_EVIDENCE_PREFIX}/`)) return null;
  if (normalized.split('/').some((segment) => segment === '..') || normalized.includes('\0')) return null;
  return redactText(normalized).text;
}

function redactField(value) {
  return redactText(String(value ?? '').trim()).text;
}

function workspaceRelativePath(workspace, target) {
  return path.relative(path.resolve(workspace), target).replaceAll(path.sep, '/');
}

function createBrowserRunnerConfig({ artifactDirectory, outputDirectory, scriptName }) {
  return `export default ${JSON.stringify({
    testDir: artifactDirectory,
    testMatch: `**/${scriptName}`,
    timeout: 120_000,
    expect: { timeout: 5_000 },
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    workers: 1,
    outputDir: outputDirectory,
    projects: [{
      name: 'xray-chromium',
      use: {
        browserName: 'chromium',
        headless: true,
        acceptDownloads: false,
        serviceWorkers: 'block',
      },
    }],
  }, null, 2)};\n`;
}

function createBrowserRunnerScript({ target, artifactDirectory, evidencePrefix, importSpecifier }) {
  return String.raw`import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from ${JSON.stringify(importSpecifier)};

const PROTOCOL = ${JSON.stringify(BROWSER_PROTOCOL)};
const TEST_URL = ${JSON.stringify(target)};
const ARTIFACT_DIRECTORY = ${JSON.stringify(artifactDirectory)};
const EVIDENCE_PREFIX = ${JSON.stringify(evidencePrefix)};
const MAX_PAGES = 12;
const MAX_CONTROLS = 8;
const DANGEROUS = /\b(?:admin|approve|buy|checkout|credential|delete|deploy|destroy|drop|invite|order|password|pay|payment|production|publish|purchase|release|remove|reset|save|secret|seed|send|sign[ -]?in|submit|token|transfer|truncate|upload)\b/i;
const SAFE_BUTTON = /\b(?:back|cancel|close|continue|details|get started|help|learn|menu|more|next|open|previous|show|start|toggle|view)\b/i;
let flowNumber = 0;

function cleanText(value) {
  return String(value ?? '')
    .replace(/\b(?:API[_-]?KEY|TOKEN|PASSWORD|SECRET|CREDENTIALS?)\s*=\s*[^\s]+/gi, '[REDACTED:SECRET_ASSIGNMENT]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})\b/g, '[REDACTED:TOKEN]')
    .trim()
    .slice(0, 500);
}

function cleanValue(value) {
  if (typeof value === 'string') return cleanText(value);
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cleanValue(child)]));
  }
  return value;
}

function emit(receipt) {
  process.stdout.write(JSON.stringify({ protocol: PROTOCOL, type: 'receipt', receipt: cleanValue(receipt) }) + '\n');
}

function slug(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'flow';
}

function evidencePath(fileName) {
  return EVIDENCE_PREFIX + '/' + fileName;
}

function coverageArea(url) {
  const parsed = new URL(url);
  const pathArea = parsed.pathname.replace(/^\/+|\/+$/g, '');
  return slug(pathArea || 'home');
}

function isAllowedNavigation(value) {
  try {
    const candidate = new URL(value);
    return ['http:', 'https:'].includes(candidate.protocol) && candidate.origin === new URL(TEST_URL).origin;
  } catch {
    return false;
  }
}

function isAllowedRequest(value) {
  try {
    const candidate = new URL(value);
    if (['http:', 'https:'].includes(candidate.protocol)) return candidate.origin === new URL(TEST_URL).origin;
    return ['about:', 'blob:', 'data:'].includes(candidate.protocol);
  } catch {
    return false;
  }
}

function isAllowedSocket(value) {
  try {
    const candidate = new URL(value);
    const base = new URL(TEST_URL);
    const expectedProtocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    return candidate.protocol === expectedProtocol && candidate.host === base.host;
  } catch {
    return false;
  }
}

async function domSnapshot(page, targetPath) {
  const snapshot = await page.locator('body').evaluate((body) => [...body.querySelectorAll('*')]
    .slice(0, 800)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute('role') || '',
      label: element.getAttribute('aria-label') || element.getAttribute('title') || '',
      name: element.getAttribute('name') || '',
      type: element.getAttribute('type') || '',
      href: element instanceof HTMLAnchorElement ? element.href : '',
      visible: Boolean(element.getClientRects().length),
    })));
  await writeFile(targetPath, JSON.stringify(cleanValue(snapshot), null, 2), 'utf8');
}

async function recordFlow({ page, context, url, area, controlLabel, action, expected, reproduction, operation, skipReason }) {
  flowNumber += 1;
  const baseName = String(flowNumber).padStart(3, '0') + '-' + slug(area + '-' + controlLabel + '-' + action);
  const beforeScreenshot = baseName + '-before.png';
  const afterScreenshot = baseName + '-after.png';
  const beforeSnapshot = baseName + '-before.json';
  const afterSnapshot = baseName + '-after.json';
  const traceName = baseName + '-trace.zip';
  const evidence = [beforeScreenshot, beforeSnapshot, afterScreenshot, afterSnapshot, traceName].map(evidencePath);
  let status = skipReason ? 'skipped' : 'passed';
  let actual = skipReason || '';
  let tracing = false;
  let prerequisiteError = null;
  try {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    tracing = true;
    await page.screenshot({ path: path.join(ARTIFACT_DIRECTORY, beforeScreenshot), fullPage: true });
    await domSnapshot(page, path.join(ARTIFACT_DIRECTORY, beforeSnapshot));
    if (!skipReason) actual = cleanText(await operation());
    await page.screenshot({ path: path.join(ARTIFACT_DIRECTORY, afterScreenshot), fullPage: true });
    await domSnapshot(page, path.join(ARTIFACT_DIRECTORY, afterSnapshot));
  } catch (error) {
    status = 'failed';
    actual = cleanText(error?.message || error);
    if (/ECONNREFUSED|ERR_CONNECTION_REFUSED|ERR_NAME_NOT_RESOLVED|NS_ERROR_CONNECTION_REFUSED|page\.goto: Timeout/i.test(actual)) {
      prerequisiteError = error;
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIRECTORY, afterScreenshot), fullPage: true }).catch(() => {});
    await domSnapshot(page, path.join(ARTIFACT_DIRECTORY, afterSnapshot)).catch(() => {});
  } finally {
    if (tracing) {
      try {
        await context.tracing.stop({ path: path.join(ARTIFACT_DIRECTORY, traceName) });
      } catch (error) {
        status = 'failed';
        actual = cleanText(error?.message || error);
      }
    }
  }
  if (prerequisiteError) throw prerequisiteError;
  emit({
    status,
    ...(status === 'failed' ? { severity: 'high' } : {}),
    url: cleanText(page.url() === 'about:blank' ? url : page.url()),
    coverageArea: cleanText(area),
    controlLabel: cleanText(controlLabel),
    action: cleanText(action),
    expected: cleanText(expected),
    actual: actual || 'The expected visible state was observed.',
    reproduction: cleanText(reproduction),
    evidence,
    screenshot: evidencePath(afterScreenshot),
    trace: evidencePath(traceName),
  });
  return status;
}

test('ForgeMind Xray maps safe local browser flows', async ({ page, context }) => {
  await mkdir(ARTIFACT_DIRECTORY, { recursive: true });
  await context.route('**/*', async (route) => {
    if (!isAllowedRequest(route.request().url())
      || (route.request().isNavigationRequest() && !isAllowedNavigation(route.request().url()))) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  if (typeof context.routeWebSocket === 'function') {
    await context.routeWebSocket('**/*', async (socket) => {
      if (isAllowedSocket(socket.url())) socket.connectToServer();
      else await socket.close({ code: 1008, reason: 'ForgeMind Xray blocks non-test WebSocket targets.' });
    });
  }

  const queue = [TEST_URL];
  const visited = new Set();
  while (queue.length && visited.size < MAX_PAGES) {
    const requestedUrl = queue.shift();
    if (!isAllowedNavigation(requestedUrl) || visited.has(requestedUrl)) continue;
    visited.add(requestedUrl);
    const area = coverageArea(requestedUrl);
    const pageStatus = await recordFlow({
      page,
      context,
      url: requestedUrl,
      area,
      controlLabel: area === 'home' ? 'Home page' : area,
      action: 'open page',
      expected: 'The explicit local/test page loads and exposes a visible state.',
      reproduction: 'Open ' + requestedUrl + ' in the local Playwright test browser.',
      operation: async () => {
        const response = await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {});
        if (!isAllowedNavigation(page.url())) throw new Error('Navigation left the explicit local/test origin.');
        if (response && !response.ok()) throw new Error('The page returned HTTP ' + response.status() + '.');
        if (await page.locator('body').count() === 0) throw new Error('The page did not expose a document body.');
        return 'The page loaded at ' + page.url() + '.';
      },
    });
    if (pageStatus === 'failed' || !isAllowedNavigation(page.url())) continue;
    const currentUrl = page.url();

    const links = await page.locator('a[href]').evaluateAll((elements) => elements.slice(0, 100).map((element) => ({
      href: element.href,
      label: element.getAttribute('aria-label') || element.textContent || element.href,
      visible: Boolean(element.getClientRects().length),
    })));
    let recordedUnsafeLinks = 0;
    for (const link of links.filter(({ visible }) => visible)) {
      const label = cleanText(link.label);
      if (!isAllowedNavigation(link.href)) continue;
      if (DANGEROUS.test(label + ' ' + link.href)) {
        if (recordedUnsafeLinks < MAX_CONTROLS) {
          recordedUnsafeLinks += 1;
          await recordFlow({
            page, context, url: currentUrl, area, controlLabel: label || 'Unsafe link', action: 'open local link',
            expected: 'The destructive or privileged link remains unvisited.',
            reproduction: 'Open ' + currentUrl + ' and inspect ' + (label || link.href) + ' without activating it.',
            skipReason: 'The unsafe browser control was intentionally not exercised.',
          });
        }
        continue;
      }
      if (!visited.has(link.href) && !queue.includes(link.href)) {
        queue.push(link.href);
      }
    }

    const dialogs = await page.locator('dialog,[role="dialog"]').evaluateAll((elements) => elements.slice(0, MAX_CONTROLS).map((element) => ({
      label: element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || 'Dialog',
      visible: Boolean(element.getClientRects().length),
    })));
    for (const dialog of dialogs.filter(({ visible }) => visible)) {
      await recordFlow({
        page, context, url: currentUrl, area, controlLabel: cleanText(dialog.label), action: 'inspect visible dialog',
        expected: 'The visible dialog can be inspected without a state-changing action.',
        reproduction: 'Open ' + currentUrl + ' and inspect the visible dialog.',
        operation: async () => 'The visible dialog was present and inspectable.',
      });
    }

    const buttons = await page.locator('button,[role="button"],input[type="button"]').evaluateAll((elements) => elements.slice(0, MAX_CONTROLS).map((element, index) => ({
      index,
      label: element.getAttribute('aria-label') || element.value || element.textContent || 'Button',
      disabled: element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true',
      submitsForm: element instanceof HTMLButtonElement && element.type === 'submit',
      visible: Boolean(element.getClientRects().length),
    })));
    for (const button of buttons.filter(({ visible, disabled }) => visible && !disabled)) {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      const label = cleanText(button.label);
      const unsafeReason = button.submitsForm
        ? 'The button can submit a form and was intentionally not exercised.'
        : DANGEROUS.test(label) || !SAFE_BUTTON.test(label)
        ? 'The control was not in the non-destructive browser allowlist and was intentionally not exercised.'
        : '';
      await recordFlow({
        page, context, url: currentUrl, area, controlLabel: label, action: 'click safe button',
        expected: unsafeReason
          ? 'The unclassified or dangerous button remains unclicked.'
          : 'The safe local control responds with a visible state or same-origin navigation.',
        reproduction: 'Open ' + currentUrl + ' and locate the ' + label + ' control.',
        skipReason: unsafeReason,
        operation: async () => {
          const beforeUrl = page.url();
          const beforeState = await page.locator('body').evaluate((element) => element.outerHTML);
          await page.locator('button,[role="button"],input[type="button"]').nth(button.index).click({ timeout: 5_000 });
          await page.waitForLoadState('domcontentloaded', { timeout: 2_000 }).catch(() => {});
          if (!isAllowedNavigation(page.url())) throw new Error('The control attempted navigation outside the test origin.');
          const afterState = await page.locator('body').evaluate((element) => element.outerHTML);
          if (page.url() === beforeUrl && afterState === beforeState) {
            throw new Error('The control produced no visible page or navigation change.');
          }
          return 'The safe control responded at ' + page.url() + '.';
        },
      });
      if (isAllowedNavigation(page.url()) && !visited.has(page.url()) && !queue.includes(page.url())) queue.push(page.url());
    }

    await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const forms = await page.locator('form').evaluateAll((elements) => elements.slice(0, MAX_CONTROLS).map((form, index) => {
      const controls = [...form.querySelectorAll('input,textarea,select')];
      return {
        index,
        label: form.getAttribute('aria-label') || form.getAttribute('name') || 'Form ' + (index + 1),
        dangerous: controls.some((control) => /admin|credential|delete|destroy|password|payment|publish|secret|token|transfer|truncate|upload|card/i.test([
          control.getAttribute('name'), control.getAttribute('type'), control.getAttribute('autocomplete'),
        ].join(' '))),
        validationCapable: controls.some((control) => control.required || control.hasAttribute('pattern') || control.getAttribute('type') === 'email'),
        visible: Boolean(form.getClientRects().length),
      };
    }));
    for (const form of forms.filter(({ visible }) => visible)) {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      const label = cleanText(form.label);
      const skipReason = form.dangerous || DANGEROUS.test(label)
        ? 'The credential, payment, or privileged form was intentionally not exercised.'
        : !form.validationCapable
          ? 'The form has no safe browser-native validation flow and was not submitted.'
          : '';
      await recordFlow({
        page, context, url: currentUrl, area, controlLabel: label, action: 'exercise validation without submit',
        expected: skipReason
          ? 'The form remains unsubmitted.'
          : 'Invalid isolated test input is rejected without submitting the form.',
        reproduction: 'Open ' + currentUrl + ', locate ' + label + ', and trigger validation without submitting.',
        skipReason,
        operation: async () => {
          const formLocator = page.locator('form').nth(form.index);
          const fields = formLocator.locator('input:not([type="hidden"]):not([type="submit"]),textarea');
          for (let index = 0; index < Math.min(await fields.count(), MAX_CONTROLS); index += 1) {
            const field = fields.nth(index);
            const details = await field.evaluate((element) => ({
              required: element.required,
              type: element.getAttribute('type') || '',
            }));
            if (details.type === 'email') await field.fill('xray-invalid-email');
            else if (details.required && !['checkbox', 'radio', 'file'].includes(details.type)) await field.fill('');
          }
          const valid = await formLocator.evaluate((element) => {
            const result = element.checkValidity();
            element.reportValidity();
            return result;
          });
          if (valid) throw new Error('The isolated invalid input was accepted by browser validation.');
          return 'Browser validation rejected the isolated invalid input without submission.';
        },
      });
    }
  }
});
`;
}

export async function executeCommandAdapter({ candidate, workspace, runProcess }) {
  if (!isSafeXrayCommandCandidate(candidate)) {
    return {
      adapter: 'command',
      status: 'skipped',
      surfaceIds: commandSurfaceIds(candidate),
      evidence: commandEvidence(candidate),
      stdout: '',
      stderr: '',
      command: formatCommandCandidate(candidate),
      gap: unsafeCommandGap(candidate),
    };
  }

  let result;
  try {
    result = await runProcess(candidate.command, candidate.args ?? [], { cwd: workspace });
  } catch (error) {
    result = { exitCode: 127, stdout: '', stderr: error?.message ?? String(error) };
  }
  const prerequisite = classifyPrerequisiteFailure(result);
  return {
    adapter: 'command',
    status: result.exitCode === 0 ? 'passed' : prerequisite ? 'blocked' : 'failed',
    surfaceIds: commandSurfaceIds(candidate),
    evidence: commandEvidence(candidate),
    stdout: redactText(result.stdout ?? '').text,
    stderr: redactText(result.stderr ?? '').text,
    command: formatCommandCandidate(candidate),
    exitCode: result.exitCode,
    ...(prerequisite ? { gap: prerequisiteGap(candidate, prerequisite) } : {}),
  };
}

export function formatCommandCandidate(candidate = {}) {
  return [candidate.command, ...(candidate.args ?? [])]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

export function isSafeXrayCommandCandidate(candidate = {}) {
  return !candidate.unsafe
    && !(candidate.safetyReasons?.length)
    && !UNSAFE_COMMAND_PATTERN.test(formatCommandCandidate(candidate))
    && (!WINDOWS_BATCH_COMMAND_PATTERN.test(String(candidate.command ?? ''))
      || ![candidate.command, ...(candidate.args ?? [])].some((value) => WINDOWS_COMMAND_CHAIN_PATTERN.test(String(value))));
}

export function classifyPrerequisiteFailure(result) {
  const output = `${result?.stderr ?? ''}\n${result?.stdout ?? ''}`;
  if (result?.exitCode === 127 || /\b(?:ENOENT|command not found|not recognized as an internal or external command|cannot find (?:the )?(?:file|command|executable))\b/i.test(output)) {
    return 'tool';
  }
  const localServiceUnavailable = /(?:\b(?:localhost|127\.0\.0\.1|\[?::1\]?|local (?:service|server|database))\b[^\n]*(?:unavailable|not running|failed to connect|ECONNREFUSED|connection refused)|(?:unavailable|not running|failed to connect|ECONNREFUSED|connection refused)[^\n]*\b(?:localhost|127\.0\.0\.1|\[?::1\]?|local (?:service|server|database))\b)/i.test(output);
  if (/\b(?:no (?:running )?(?:emulator|simulator|device)|(?:credential|api[_-]?key|token).*(?:missing|not configured|unavailable|required))\b/i.test(output)
    || localServiceUnavailable) {
    return 'prerequisite';
  }
  return null;
}

export function prerequisiteGap(candidate, kind) {
  return {
    code: kind === 'tool' ? 'FM_XRAY_TOOL_UNAVAILABLE' : 'FM_XRAY_PREREQUISITE_UNAVAILABLE',
    ...(candidate?.id ? { checkId: candidate.id } : {}),
    message: kind === 'tool'
      ? 'The detected check could not start because its executable is unavailable.'
      : 'The detected check could not assess application behavior because a local prerequisite is unavailable.',
  };
}

function commandSurfaceIds(candidate = {}) {
  return [...(candidate.surfaceIds ?? candidate.surfaceHints ?? [])];
}

function commandEvidence(candidate = {}) {
  return candidate.id ? [candidate.id] : [];
}

function unsafeCommandGap(candidate) {
  return {
    code: 'FM_XRAY_UNSAFE_CHECK_SKIPPED',
    ...(candidate?.id ? { checkId: candidate.id } : {}),
    message: 'This check was not executed because its command may be destructive or irreversible.',
  };
}
