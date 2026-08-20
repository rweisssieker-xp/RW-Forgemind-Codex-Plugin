import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { activateArtifactStore, deactivateArtifactStore } from '../src/artifact-store.mjs';
import { loadControlContract, saveControlContract } from '../src/design-fidelity-controls.mjs';

test('Control contracts retain approved roles and safe same-origin interactions', async (t) => { const root = await mkdtemp(path.join(tmpdir(), 'forgemind-controls-')); await activateArtifactStore({ workspace: root }); t.after(async () => { await deactivateArtifactStore(); await rm(root, { recursive: true, force: true }); }); const saved = await saveControlContract({ workspace: root, contract: { id: 'home', route: 'http://127.0.0.1:4173/', controls: [{ id: 'cta', role: 'button', name: 'Start', safeInteraction: { type: 'navigate', target: '/signup' } }] } }); assert.equal(saved.controls[0].role, 'button'); assert.deepEqual(await loadControlContract({ workspace: root, contractId: 'home' }), saved); });
test('Control contracts reject unsafe role, duplicate ID, and consequential action', async (t) => { const root = await mkdtemp(path.join(tmpdir(), 'forgemind-controls-')); t.after(() => rm(root, { recursive: true, force: true })); await assert.rejects(() => saveControlContract({ workspace: root, contract: { id: 'home', route: 'http://127.0.0.1:4173/', controls: [{ id: 'x', role: 'dialog', name: 'X' }, { id: 'x', role: 'button', name: 'Pay', safeInteraction: { type: 'payment' } }] } }), (error) => error.code === 'FM_DESIGN_FIDELITY_CONTROL_INVALID'); });
