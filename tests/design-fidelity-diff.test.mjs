import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { compareDesignImages, encodeRgbaPng } from '../src/design-fidelity-diff.mjs';

test('Design Fidelity writes a deterministic diff image and changed bounds', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'forgemind-design-diff-')); t.after(() => rm(root, { recursive: true, force: true }));
  const left = path.join(root, 'left.png'); const right = path.join(root, 'right.png');
  await writeFile(left, encodeRgbaPng({ width: 1, height: 1, pixels: Buffer.from([255, 0, 0, 255]) }));
  await writeFile(right, encodeRgbaPng({ width: 1, height: 1, pixels: Buffer.from([0, 0, 255, 255]) }));
  const result = await compareDesignImages({ baseline: left, candidate: right, output: path.join(root, 'diff.png') });
  assert.equal(result.differencePercent, 100); assert.deepEqual(result.changedBounds, { x: 0, y: 0, width: 1, height: 1 }); assert.equal((await stat(result.output)).isFile(), true);
});
