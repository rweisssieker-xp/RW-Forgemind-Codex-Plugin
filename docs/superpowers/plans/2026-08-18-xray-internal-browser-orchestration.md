# Xray Internal Browser Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Xray skill actively orchestrate safe internal-Browser GUI evidence and submit it to the canonical CLI report without losing command/API evidence when the Browser is unavailable.

**Architecture:** The skill runs a discovery pass, uses the mission's safe critical flows and viewports to drive the Codex Browser, then invokes the canonical CLI run with validated GUI receipts. The Node CLI remains unable to call Browser tools and reports executor metadata only from submitted receipts.

**Tech Stack:** Codex in-app Browser skill, Node.js ES modules, existing Xray receipt validation, `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-18-xray-internal-browser-orchestration-design.md`

## Global Constraints

- Browser targets are explicit loopback or `.test` HTTP(S) URLs only.
- Browser flows are same-origin, read-only, non-submitting, and never access credentials, storage, uploads, downloads, payments, administration, or production endpoints.
- Browser absence preserves command/API execution and becomes an evidence gap, never a claimed successful GUI test.
- Direct CLI execution remains Playwright-or-gap and never claims internal Browser execution.
- Source and Marketplace skill/runtime mirrors remain byte-identical.

---

### Task 1: Make the Xray skill execute the discovery-to-receipt Browser protocol

**Files:**
- Modify: `entry-skills/forgemind-xray/SKILL.md`
- Modify: `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`
- Modify: `tests/journey-surface.test.mjs`

**Interfaces:**
- Consumes: discovery result `mission.criticalFlows` with `{ id, route, viewports, safe }` and a safe `mission.testUrl` or configured `web.baseUrl`.
- Produces: one complete `--gui-receipts` record per attempted route/viewport, adding `executor: 'internal-browser'` and `viewport`.

- [ ] **Step 1: Write failing skill-contract assertions**

```js
assert.match(instructions, /discovery pass.*criticalFlows/i);
assert.match(instructions, /each safe route.*desktop.*mobile/i);
assert.match(instructions, /executor.*internal-browser/i);
assert.match(instructions, /continue command and API tests/i);
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `node --test tests/journey-surface.test.mjs`

Expected: FAIL because the current skill does not require mission-derived route/viewport iteration or executor metadata.

- [ ] **Step 3: Replace descriptive Browser guidance with the executable protocol**

```text
1. Run the initial canonical xray command and read mission.criticalFlows.
2. For each flow and declared viewport, use the internal Browser only at new URL(baseUrl, route).
3. Capture before/after state and a workspace-local screenshot; create a complete receipt with executor=internal-browser and viewport.
4. Run the second canonical xray command with all receipts. If Browser work cannot happen, retain its exact gap and continue all non-GUI evidence.
```

Keep all current Browser safety restrictions verbatim and copy the source skill to the Marketplace mirror.

- [ ] **Step 4: Run the skill contract test and mirror check**

Run: `node --test tests/journey-surface.test.mjs; git diff --no-index -- entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`

Expected: PASS and mirror comparison exit 0.

- [ ] **Step 5: Commit the skill protocol**

```text
git add entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md tests/journey-surface.test.mjs
git commit -m "feat: orchestrate Xray internal browser evidence"
```

### Task 2: Preserve executor and viewport evidence in Xray results

**Files:**
- Modify: `src/xray.mjs:703-795,481-559`
- Modify: `plugins/forgemind/src/xray.mjs:703-795,481-559`
- Modify: `tests/xray.test.mjs`

**Interfaces:**
- Consumes: Browser receipt optional fields `executor` and `viewport`.
- Produces: normalized receipts retain `executor: 'internal-browser'|'playwright'` and `viewport: 'desktop'|'mobile'`; `report.guiExecution` is `{ executor, coveredRoutes, viewports }`.

- [ ] **Step 1: Write failing receipt/report tests**

```js
const report = await runXray({ workspace: root, guiReceipts: [completeReceipt({ executor: 'internal-browser', viewport: 'mobile', coverageArea: 'settings' })] });
assert.equal(report.receipts.find(({ id }) => id === 'gui-1').executor, 'internal-browser');
assert.deepEqual(report.guiExecution, { executor: 'internal-browser', coveredRoutes: ['settings'], viewports: ['mobile'] });
assert.match(renderXrayMarkdown(report), /GUI execution[\s\S]*internal-browser/);
```

- [ ] **Step 2: Run the Xray test and verify it fails**

Run: `node --test tests/xray.test.mjs`

Expected: FAIL because receipt metadata and `guiExecution` are currently omitted.

- [ ] **Step 3: Preserve normalized metadata and derive the report summary**

```js
function guiExecution(receipts) {
  const gui = receipts.filter(({ control, status }) => ['browser', 'playwright'].includes(control) && ['passed', 'failed'].includes(status));
  return { executor: gui.some(({ executor }) => executor === 'internal-browser') ? 'internal-browser' : gui.some(({ control }) => control === 'playwright') ? 'playwright' : 'unavailable', coveredRoutes: [...new Set(gui.map(({ coverageArea }) => coverageArea).filter(Boolean))].sort(), viewports: [...new Set(gui.map(({ viewport }) => viewport).filter(Boolean))].sort() };
}
```

Validate enum values before retaining them; invalid metadata is omitted. Render a `GUI execution` section that is distinct from findings and gaps.

- [ ] **Step 4: Run focused tests and mirror runtime**

Run: `node --test tests/xray.test.mjs; Copy-Item src\xray.mjs plugins\forgemind\src\xray.mjs; git diff --no-index -- src/xray.mjs plugins/forgemind/src/xray.mjs`

Expected: PASS and mirror comparison exit 0.

- [ ] **Step 5: Commit and release-verify**

```text
git add src/xray.mjs plugins/forgemind/src/xray.mjs tests/xray.test.mjs docs/superpowers/plans/2026-08-18-xray-internal-browser-orchestration.md
git commit -m "feat: report Xray GUI executor evidence"
npm run ci
git push origin main
```
