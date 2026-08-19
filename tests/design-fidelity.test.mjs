import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { activateArtifactStore, deactivateArtifactStore } from '../src/artifact-store.mjs';
import { encodeRgbaPng } from '../src/design-fidelity-diff.mjs';
import { runDesignFidelity } from '../src/design-fidelity.mjs';

test('Design Fidelity produces an evidence-backed correction request when tolerance is exceeded', async (t) => { const root = await mkdtemp(path.join(tmpdir(), 'forgemind-design-')); await writeFile(path.join(root, 'reference.png'), encodeRgbaPng({ width: 1, height: 1, pixels: Buffer.from([255, 0, 0, 255]) })); await activateArtifactStore({ workspace: root }); t.after(async () => { await deactivateArtifactStore(); await rm(root, { recursive: true, force: true }); }); const report = await runDesignFidelity({ workspace: root, references: 'reference.png', route: 'http://127.0.0.1:4173/', capture: async ({ output }) => writeFile(output, encodeRgbaPng({ width: 1, height: 1, pixels: Buffer.from([0, 0, 255, 255]) })) }); assert.equal(report.status, 'needs-correction'); assert.deepEqual(report.corrections[0].allowedExtensions.slice(0, 2), ['.css', '.scss']); });
