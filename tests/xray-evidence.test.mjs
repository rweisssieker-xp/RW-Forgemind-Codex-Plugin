import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { deflateSync } from 'node:zlib';

import { compareVisualEvidence, performanceFinding } from '../src/xray-evidence.mjs';

test('Xray visual evidence establishes and compares a PNG baseline', async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forgemind-xray-visual-'));
  const screenshot = path.join(workspace, 'screen.png');
  await writeFile(screenshot, rgbaPng());
  t.after(() => rm(workspace, { recursive: true, force: true }));

  const baseline = await compareVisualEvidence({ workspace, flowId: 'home', screenshot: 'screen.png', baseline: true });
  const result = await compareVisualEvidence({ workspace, flowId: 'home', screenshot: 'screen.png', thresholdPercent: 0 });

  assert.equal(baseline.gap, null);
  assert.equal(result.differencePercent, 0);
  assert.equal(result.finding, null);
});

function rgbaPng() {
  const chunk = (type, body) => Buffer.concat([Buffer.from([0, 0, 0, body.length]), Buffer.from(type), body, Buffer.alloc(4)]);
  const header = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0, 255]))), chunk('IEND', Buffer.alloc(0))]);
}

test('Xray performance evidence reports missing timing and budget overruns', () => {
  assert.equal(performanceFinding({ id: 'web-1' }, 100).code, 'FM_XRAY_PERFORMANCE_TIMING_UNAVAILABLE');
  const finding = performanceFinding({ id: 'web-1', durationMs: 101, surfaceIds: ['web-gui'], evidence: ['trace.zip'] }, 100);
  assert.match(finding.title, /budget exceeded/i);
});
