import assert from 'node:assert/strict'; import test from 'node:test'; import { verifyControlContract } from '../src/design-fidelity-control-receipts.mjs';
const contract = { controls: [{ id: 'cta', role: 'button', name: 'Start', visibleText: 'Start', safeInteraction: { type: 'navigate', target: '/signup' } }] };
test('matching receipt proves a safe control', () => assert.equal(verifyControlContract({ contract, observations: [{ id: 'cta', role: 'button', name: 'Start', visibleText: 'Start', status: 'passed', interaction: { type: 'navigate', url: 'http://127.0.0.1:4173/signup' } }] }).status, 'passed'));
test('missing controls remain gaps', () => assert.equal(verifyControlContract({ contract, observations: [] }).gaps[0].code, 'FM_DESIGN_FIDELITY_CONTROL_NOT_EVIDENCED'));
