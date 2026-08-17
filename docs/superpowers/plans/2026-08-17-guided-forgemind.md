# Guided ForgeMind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe `$forgemind-start` recommendation entry point and make `$forgemind-xray` use the internal Codex Browser for safe local/test GUI evidence.

**Architecture:** A focused `start` workflow derives the existing project profile, validates optional inputs, selects an existing journey without invoking it, and persists one recommendation using the established artifact store. `forgemind start` exposes it to the CLI; the entry skill collects only the three routing inputs. Source and Marketplace mirror files stay equivalent.

**Tech Stack:** Node.js 20+, native ESM, `node:test`, ForgeMind artifact store, Codex entry-skill Markdown.

## Global Constraints

- Recommendations only: do not invoke another journey, run adapters, mutate product code, contact services, or make irreversible actions.
- Persistent output is project-local in `.codex-orchestrator/`; `--artifacts none` returns the result without retained state.
- Missing inputs or unavailable inspection return low-confidence Compass; invalid enum values return a validation error that lists accepted values.
- Existing journey behavior and artifact contracts stay compatible.
- The source entry skill and `plugins/forgemind` mirror must remain equivalent.
- Xray's internal-Browser path is skill-orchestrated: it accepts only explicit loopback or `.test` URLs, never performs consequential actions, and submits only complete receipts to the canonical CLI report.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/start.mjs` | Local recommendation creation, routing, validation, and artifact write. |
| `plugins/forgemind/src/start.mjs` | Marketplace runtime mirror. |
| `src/cli.mjs`, `plugins/forgemind/src/cli.mjs` | Register and dispatch `start`. |
| both `entry-skills/forgemind-start/SKILL.md` files | Collect minimal inputs and invoke the bundled runner. |
| `tests/start.test.mjs` | Recommendation, safety, and artifact regression tests. |
| `tests/cli.test.mjs`, `tests/package.test.mjs` | CLI help and packaged-Marketplace contracts. |
| `README.md`, `docs/HIERARCHY.md`, `docs/WORKFLOWS.md`, `CHANGELOG.md` | User-facing discovery and behavior documentation. |
| both `entry-skills/forgemind-xray/SKILL.md` files | Internal-Browser execution contract and receipt-to-CLI handoff. |

## Recommendation Interface

```js
export async function runStart({ workspace, context, outcome, mode }) {
  // context: undefined | 'idea' | 'project' | 'quality'
  // outcome: undefined | 'improve' | 'mvp' | 'ship'
  // mode: undefined | 'guided' | 'autonomous'
}
```

The schema-v1 result exposes `status`, `generatedAt`, `inputs`, `projectProfile` or `projectInspection`, `routingSignals`, `recommendedJourney`, `handoff`, `nextAction`, `rationale`, `confidence`, `alternativeJourney`, `autonomyBoundary`, `missingEvidence`, `claimBoundary`, `artifactPath`, and `errors`.

Routing precedence is deterministic: `quality` selects `xray`; `ship` selects `ship`; `project` plus `mvp` or `autonomous` selects `leap`; `idea` plus `mvp` selects `leap`; incomplete evidence selects `compass`. A quality context paired with MVP/improve is a conflict: select `xray`, report `conflicting-inputs`, reduce confidence, and recommend `leap` as alternative.

### Task 1: Implement the local recommendation workflow

**Files:**
- Create: `src/start.mjs`
- Create: `plugins/forgemind/src/start.mjs`
- Create: `tests/start.test.mjs`

**Interfaces:**
- Consumes: `deriveProjectProfile({ workspace })`, `resolveWorkspace()`, `artifactStatePath()`, `writeJsonAtomic()`, and `ForgeMindError`.
- Produces: `runStart({ workspace, context, outcome, mode })`.

- [ ] **Step 1: Write failing direct-workflow tests**

Create `tests/start.test.mjs` with temporary workspaces. Test all four primary routes, zero-input Compass fallback, unavailable inspection fallback, quality/MVP conflict, invalid enum values, artifact persistence, and no persistence via CLI. The main happy-path test is:

```js
const result = await runStart({
  workspace, context: 'project', outcome: 'mvp', mode: 'autonomous',
});
assert.equal(result.recommendedJourney, 'leap');
assert.equal(result.handoff, '$forgemind-leap');
assert.match(result.autonomyBoundary, /hard stop/i);
assert.equal(
  JSON.parse(await readFile(path.join(workspace, '.codex-orchestrator', 'primary', 'start-latest.json'))).recommendedJourney,
  'leap',
);
```

Assert zero input is `compass`; conflict is low-confidence `xray`, alternative `leap`, and includes `conflicting-inputs`; and `context: 'unknown'` rejects as `FM_START_CONTEXT_INVALID` naming `idea`, `project`, and `quality`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/start.test.mjs`

Expected: FAIL because `../src/start.mjs` does not exist.

- [ ] **Step 3: Implement the minimal workflow**

Create `src/start.mjs` using this public shape:

```js
import { writeJsonAtomic } from './io.mjs';
import { artifactStatePath } from './artifact-store.mjs';
import { ForgeMindError } from './errors.mjs';
import { resolveWorkspace } from './paths.mjs';
import { deriveProjectProfile } from './project-profile.mjs';

const CONTEXTS = new Set(['idea', 'project', 'quality']);
const OUTCOMES = new Set(['improve', 'mvp', 'ship']);
const MODES = new Set(['guided', 'autonomous']);

export async function runStart({ workspace, context, outcome, mode }) {
  validate(context, CONTEXTS, 'CONTEXT');
  validate(outcome, OUTCOMES, 'OUTCOME');
  validate(mode, MODES, 'MODE');
  const root = await resolveWorkspace(workspace);
  const result = await createRecommendation({ root, context, outcome, mode });
  await writeJsonAtomic(artifactStatePath(root, 'primary', 'start-latest.json'), result);
  return result;
}
```

Use a non-exported `createRecommendation` helper for the precedence above. Its `nextAction` must contain the exact bundled command for the selected journey, while `autonomyBoundary` states no journey has run and existing hard stops remain. Catch only project-profile inspection failures and return a persisted, low-confidence Compass recommendation with `projectInspection: 'unavailable'` and failure detail in `missingEvidence`. Do not import `runCompass`, `runLeap`, `runShip`, or `runXray`.

- [ ] **Step 4: Mirror and verify the distributable implementation**

Copy the reviewed file exactly to `plugins/forgemind/src/start.mjs`.

Run: `git diff --no-index -- src/start.mjs plugins/forgemind/src/start.mjs`

Expected: exit 0 and no output.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/start.test.mjs`

Expected: PASS for routes, validation, conflict reporting, persistence, and inspection fallback.

```bash
git add src/start.mjs plugins/forgemind/src/start.mjs tests/start.test.mjs
git commit -m "feat: add guided ForgeMind recommendations"
```

### Task 2: Expose the workflow through CLI and Codex skill

**Files:**
- Modify: `src/cli.mjs: PRIMARY_COMMANDS and command dispatch`
- Modify: `plugins/forgemind/src/cli.mjs: PRIMARY_COMMANDS and command dispatch`
- Modify: `tests/cli.test.mjs: help and start coverage`
- Create: `entry-skills/forgemind-start/SKILL.md`
- Create: `plugins/forgemind/entry-skills/forgemind-start/SKILL.md`

**Interfaces:**
- Consumes: `runStart()` from Task 1 and current named-option parsing.
- Produces: `forgemind start --context <idea|project|quality> --outcome <improve|mvp|ship> --mode <guided|autonomous>` and `$forgemind-start`.

- [ ] **Step 1: Write failing CLI tests**

Add `start` to the stable help command assertions in `tests/cli.test.mjs`. Add:

```js
const result = await runCli([
  'start', '--workspace', workspace, '--context', 'quality', '--outcome', 'ship',
  '--mode', 'guided', '--artifacts', 'none', '--json',
], { stdout: outputBuffer().stream, stderr: outputBuffer().stream });
assert.equal(result.exitCode, 0);
assert.equal(result.data.recommendedJourney, 'xray');
assert.match(result.data.nextAction, /xray run/);
assert.equal(result.data.artifactMode, 'none');
assert.equal(result.data.artifactPath, null);
```

Also assert no `.codex-orchestrator/primary/start-latest.json` exists in the target workspace after that command.

- [ ] **Step 2: Verify the test fails**

Run: `node --test tests/cli.test.mjs`

Expected: FAIL with `FM_COMMAND_UNKNOWN` and the missing help command.

- [ ] **Step 3: Add dispatch in both runtime copies**

Insert `start` immediately before `compass` in `PRIMARY_COMMANDS`. Add immediately before the Compass branch:

```js
} else if (command === 'start') {
  const { runStart } = await import('./start.mjs');
  data = await runStart({
    workspace: await resolveWorkspace(options.workspace ?? context.cwd ?? process.cwd()),
    context: options.context,
    outcome: options.outcome,
    mode: options.mode,
  });
```

Do not alter `parseOptions`; it already accepts these string options. Preserve normal artifact-store activation and `addArtifactMetadata()`.

- [ ] **Step 4: Add the entry skill and mirror it**

Create the following source skill and copy it byte-for-byte to the Marketplace mirror:

```markdown
---
name: forgemind-start
description: "Use when a ForgeMind user has an idea, existing project, or quality concern but does not know which journey to start."
---

# Guided ForgeMind

Ask only for missing routing inputs, one at a time: context (`idea`, `project`, or `quality`), outcome (`improve`, `mvp`, or `ship`), and working style (`guided` or `autonomous`). Do not ask for a value the user supplied clearly.

Run only:
`node <plugin-root>/bin/forgemind.mjs start --context <context> --outcome <outcome> --mode <mode> --artifacts workspace --json`

It recommends a journey only. State its recommendation, rationale, alternative route when present, next action, and safety boundary. The user explicitly invokes the chosen journey; existing hard stops remain in force.
```

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/cli.test.mjs tests/start.test.mjs`

Expected: PASS, including no target-workspace artifact for `--artifacts none`.

```bash
git add src/cli.mjs plugins/forgemind/src/cli.mjs entry-skills/forgemind-start/SKILL.md plugins/forgemind/entry-skills/forgemind-start/SKILL.md tests/cli.test.mjs
git commit -m "feat: expose guided ForgeMind start journey"
```

### Task 3: Document, package, and verify the end-user entry

**Files:**
- Modify: `README.md: starting-points table and first-run guidance`
- Modify: `docs/HIERARCHY.md: hierarchy and start-here table`
- Modify: `docs/WORKFLOWS.md: guided-start invocation and handoff`
- Modify: `CHANGELOG.md: Unreleased`
- Modify: `tests/package.test.mjs: built start-skill/runtime assertions`

**Interfaces:**
- Consumes: Task 2's command and entry skill.
- Produces: end-user documentation and package proof that the entry skill and runtime ship together.

- [ ] **Step 1: Write the failing package assertion**

In `tests/package.test.mjs`, after building the Marketplace package, add:

```js
const sourceStartSkill = await readFile(path.join(sourceRoot, 'entry-skills', 'forgemind-start', 'SKILL.md'), 'utf8');
const builtStartSkill = await readFile(path.join(built.marketplacePath, 'plugins', 'forgemind', 'entry-skills', 'forgemind-start', 'SKILL.md'), 'utf8');
assert.equal(builtStartSkill, sourceStartSkill);
await access(path.join(built.marketplacePath, 'plugins', 'forgemind', 'src', 'start.mjs'));
```

- [ ] **Step 2: Verify the package assertion fails before the surface exists**

Run: `node --test tests/package.test.mjs`

Expected: FAIL because the source/built start skill and runtime do not yet exist.

- [ ] **Step 3: Document the route**

Add Start as the first README table row:

```markdown
| Start | `$forgemind-start` | One explainable next ForgeMind action for an idea, project, or quality concern. |
```

State immediately below that it recommends a journey and does not execute it. Add Start above Compass in `docs/HIERARCHY.md`; add its three inputs and Compass fallback to `docs/WORKFLOWS.md`; add an Unreleased changelog item describing the recommendation-only guided entry point.

- [ ] **Step 4: Run packaged-runtime verification**

Run:

```bash
node --test tests/package.test.mjs tests/marketplace-source.test.mjs tests/release-metadata.test.mjs
node bin/forgemind.mjs validate --strict-release
node bin/forgemind.mjs package --output dist/guided-forgemind
node dist/guided-forgemind/plugin/bin/forgemind.mjs start --context project --outcome mvp --mode guided --artifacts none --json
```

Expected: PASS; built command returns `recommendedJourney: 'leap'`, no side-effect journey execution, and `artifactPath: null`.

- [ ] **Step 5: Run the complete suite and commit**

Run: `npm test`

Expected: PASS with all existing journeys unchanged.

```bash
git add README.md docs/HIERARCHY.md docs/WORKFLOWS.md CHANGELOG.md tests/package.test.mjs
git commit -m "docs: introduce guided ForgeMind start"
```

## Plan Self-Review

- **Spec coverage:** Tasks 1–2 implement the three inputs, explainable local routing, confidence and alternative route, safety boundary, fallback/error behavior, and both artifact modes. Task 3 provides documentation and package proof.
- **Consistency:** CLI options, skill language, validation constants, and test assertions consistently use `context`, `outcome`, and `mode`.
- **Scope:** No Mission Control UI, connector, or automatic execution is added.

### Task 4: Orchestrate Xray through the internal Codex Browser

**Files:**
- Modify: `entry-skills/forgemind-xray/SKILL.md`
- Modify: `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`
- Modify: `tests/journey-surface.test.mjs`
- Modify: `tests/package.test.mjs`
- Modify: `README.md`, `docs/HIERARCHY.md`, `docs/WORKFLOWS.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: the in-app Browser skill's `iab` binding and `xray run --test-url <safe-url> --gui-receipts '<json-array>' --artifacts workspace --json`.
- Produces: complete browser receipts, or existing Xray gaps when the Browser, target, or safe flow is unavailable.

- [ ] **Step 1: Add failing skill-surface tests**

In `tests/journey-surface.test.mjs`, assert both Xray skill copies contain `internal Codex Browser`, `--gui-receipts`, `loopback`, and `does not submit`. In `tests/package.test.mjs`, assert the built Marketplace Xray skill equals the source skill.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test tests/journey-surface.test.mjs tests/package.test.mjs`

Expected: FAIL because the current Xray skill says the internal Browser is inspection-only.

- [ ] **Step 3: Replace the Xray skill's Browser section with the orchestration protocol**

In both mirrored skills, require this ordered behavior:

```markdown
Use the internal Codex Browser to test the supplied local/test URL. Before control, invoke the Browser skill and use its in-app-browser binding. Create or claim one tab, navigate only to the explicit same-origin loopback or `.test` URL, inspect the visible DOM, and execute only safe page loads, same-origin opted-in links, or non-submitting invalid-input validation. Never log in, download, upload, submit, save, delete, administer, pay, publish, deploy, or transmit data.

For every attempted flow, capture observable before/after state and a screenshot artifact, then form a complete Xray Browser receipt. Pass the complete receipt array to the bundled `xray run --gui-receipts` command. If Browser control, the target, evidence capture, or a safe flow is unavailable, pass no success receipt and report Xray's returned gap and next action.
```

Keep direct-CLI Playwright as a CLI fallback. Do not assert that an interactive tab itself is canonical evidence; the submitted receipt is.

- [ ] **Step 4: Update documentation and package tests**

Update README and workflow documentation: skill invocation uses the internal Codex Browser for safe explicit local/test flows; direct CLI invocation keeps its workspace-local Playwright path. Add an Unreleased changelog entry. Confirm mirror equality.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
node --test tests/journey-surface.test.mjs tests/xray.test.mjs tests/xray-adapters.test.mjs tests/package.test.mjs
node bin/forgemind.mjs validate --strict-release
```

Expected: PASS; no test claims an internal Browser result without a complete receipt, and CLI Playwright behavior remains unchanged.

```bash
git add entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md tests/journey-surface.test.mjs tests/package.test.mjs README.md docs/HIERARCHY.md docs/WORKFLOWS.md CHANGELOG.md
git commit -m "feat: orchestrate Xray through the internal browser"
```

## Xray Plan Self-Review

- The adapter stays in the skill runtime where the internal Browser exists; Node CLI stays the canonical report writer.
- Every Browser flow remains constrained to local/test targets and non-consequential interaction.
- Browser failure produces an explicit Xray gap, never invented pass evidence.
