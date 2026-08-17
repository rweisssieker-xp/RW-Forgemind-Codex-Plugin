# Xray Executable Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Xray into an executable, evidence-backed local test suite for command, API, browser-GUI, and Android-emulator surfaces.

**Architecture:** Extract discovery and execution adapters from Xray's monolithic flow. Project inspection supplies safe runnable command candidates; command, Browser/Playwright, and Android/ADB adapters return one normalized receipt shape; `src/xray.mjs` remains the canonical finding, gap, scoring, and reporting layer. The plugin does not silently install dependencies or browsers: missing local runners become precise prerequisite gaps with setup actions.

**Tech Stack:** Node.js ESM, Node test runner, safe child-process execution, local Playwright CLI/runtime, ADB, Gradle, .NET SDK, pytest, Go toolchain.

## Global Constraints

- Run only local or designated-test commands and targets; never production, payment, deploy, publish, credential, deletion, or administration actions.
- Never modify tested product source or configuration; isolated local/test data is permitted only through explicit test flows.
- No score, pass, failure, or coverage without an executed surface-specific receipt.
- Inferred framework commands are executable only after the existing safety classifier accepts them.
- Browser targets must be literal loopback (`127.0.0.0/8`, `::1`, `localhost`) or an explicit designated test URL.
- Browser and Android runner absence is a prerequisite gap with an actionable setup instruction, never a product defect.
- Source and `plugins/forgemind/` runtime/entry-skill mirrors are byte-identical.

---

## File structure

- `src/project.mjs`: discovers framework markers and normalized safe command candidates.
- `src/xray-adapters.mjs` (new): runs command, Playwright, and ADB adapters; emits normalized receipt/gap data.
- `src/xray.mjs`: selects adapter work, maps adapter receipts to findings/gaps/score/report, and renders per-adapter coverage.
- `src/cli.mjs`: accepts explicit test URL and adapter selection options for `xray run`.
- `entry-skills/forgemind-xray/SKILL.md`: documents actual runner selection, local target requirements, and evidence rules.
- mirrored `plugins/forgemind/` files: distribution equivalents.
- `tests/project.test.mjs`, `tests/xray-adapters.test.mjs` (new), `tests/xray.test.mjs`, `tests/cli.test.mjs`, `tests/journey-surface.test.mjs`: regression coverage.

### Task 1: Discover executable framework commands

**Files:**
- Modify: `tests/project.test.mjs`
- Modify: `src/project.mjs`
- Modify: `plugins/forgemind/src/project.mjs`

**Interfaces:**
- Produces candidates `{ command, args, category: 'test' | 'build' | 'lint', source, confidence, adapter: 'command', surfaceHints }`.
- Supports Node package scripts, .NET project markers, Python markers, `go.mod`, and Gradle/Android wrappers.

- [ ] **Step 1: Write failing discovery tests**

Add table-driven fixtures that assert these exact candidates:

```js
{ files: { 'sample.sln': '' }, expected: { command: 'dotnet', args: ['test'], source: '*.sln', surfaceHints: ['api'] } }
{ files: { 'pyproject.toml': '' }, expected: { command: 'python', args: ['-m', 'pytest'], source: 'pyproject.toml', surfaceHints: ['api'] } }
{ files: { 'go.mod': 'module example.test/app' }, expected: { command: 'go', args: ['test', './...'], source: 'go.mod', surfaceHints: ['api'] } }
{ files: { 'gradlew.bat': '', 'app/src/main/AndroidManifest.xml': '<manifest package="example.app" />' }, expected: { command: 'gradlew.bat', args: ['test'], source: 'gradlew.bat', surfaceHints: ['mobile-gui'] } }
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `node --test tests/project.test.mjs`

Expected: FAIL because Go and Gradle candidates are absent and current candidates are unstructured command strings.

- [ ] **Step 3: Implement normalized command discovery**

Introduce a `commandCandidate` helper in `src/project.mjs` that returns both `command` and `args`, preserves existing `command` display text for compatibility, and assigns `surfaceHints`. Detect `go.mod`, `gradlew`/`gradlew.bat`, and an Android manifest. Use the platform-appropriate Gradle wrapper name already present in the workspace; do not execute either wrapper in discovery. Mirror the final file.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run: `node --test tests/project.test.mjs`

Expected: PASS with exact normalized candidates and existing project-profile expectations preserved.

- [ ] **Step 5: Commit**

```bash
git add tests/project.test.mjs src/project.mjs plugins/forgemind/src/project.mjs
git commit -m "feat: discover Xray framework test commands"
```

### Task 2: Add executable adapter contracts and command/API execution

**Files:**
- Create: `src/xray-adapters.mjs`
- Create: `plugins/forgemind/src/xray-adapters.mjs`
- Create: `tests/xray-adapters.test.mjs`
- Modify: `src/xray.mjs`
- Modify: `plugins/forgemind/src/xray.mjs`

**Interfaces:**
- `executeCommandAdapter({ candidate, workspace, runProcess })` returns `{ adapter: 'command', status, surfaceIds, evidence, stdout, stderr, command }`.
- `selectXrayChecks(profile)` selects safe detected and inferred framework test candidates.
- API surface gets evidence only from an executed candidate with `surfaceHints` containing `api`.

- [ ] **Step 1: Write failing adapter tests**

Add tests for a successful inferred `dotnet test`, a missing `dotnet` executable, and an API-only profile:

```js
assert.equal(result.adapter, 'command');
assert.equal(result.status, 'passed');
assert.deepEqual(result.surfaceIds, ['api']);
assert.equal(blocked.status, 'blocked');
assert.equal(blocked.gap.code, 'FM_XRAY_TOOL_UNAVAILABLE');
assert.ok(apiOnly.gaps.some(({ code }) => code === 'FM_XRAY_SURFACE_EVIDENCE_UNAVAILABLE'));
```

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `node --test tests/xray-adapters.test.mjs tests/xray.test.mjs`

Expected: FAIL because no adapter module or inferred-command selection exists.

- [ ] **Step 3: Implement the command adapter and wire Xray**

Move command invocation into `executeCommandAdapter`; invoke `runProcess(candidate.command, candidate.args, { cwd: workspace })` without a shell. Reuse `classifyPrerequisiteFailure` semantics so a missing tool/local prerequisite is blocked with a gap. Update Xray selection to include inferred framework candidates only when their existing safety checks pass. Map API evidence only through command receipts explicitly associated with `api`; retain API evidence gaps when no executable candidate runs. Mirror both source files.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `node --test tests/xray-adapters.test.mjs tests/xray.test.mjs`

Expected: PASS; inferred .NET/Python/Go/Gradle candidates execute safely and API-only discovery stays an explicit gap.

- [ ] **Step 5: Commit**

```bash
git add tests/xray-adapters.test.mjs src/xray-adapters.mjs plugins/forgemind/src/xray-adapters.mjs src/xray.mjs plugins/forgemind/src/xray.mjs
git commit -m "feat: execute Xray command and API adapters"
```

### Task 3: Implement the local Playwright browser adapter

**Files:**
- Modify: `tests/xray-adapters.test.mjs`
- Modify: `tests/xray.test.mjs`
- Modify: `src/xray-adapters.mjs`
- Modify: `src/xray.mjs`
- Modify: `src/cli.mjs`
- Mirror: matching `plugins/forgemind/src/` files

**Interfaces:**
- CLI accepts `xray run --test-url <url>` and `--adapters command,browser,android`.
- `executeBrowserAdapter({ url, workspace, runProcess })` returns one receipt per mapped flow or one prerequisite/safety gap.
- Browser evidence is stored below `.codex-orchestrator/xray/browser/` and referenced relative to workspace.

- [ ] **Step 1: Write failing Browser adapter tests**

Use a fake `runProcess` to assert:

```js
assert.equal(remote.status, 'blocked');
assert.equal(remote.gap.code, 'FM_XRAY_BROWSER_TARGET_UNSAFE');
assert.equal(missing.status, 'blocked');
assert.equal(missing.gap.code, 'FM_XRAY_PLAYWRIGHT_UNAVAILABLE');
assert.equal(receipt.control, 'playwright');
assert.match(receipt.evidence[0], /^\.codex-orchestrator\/xray\/browser\//);
```

Add a CLI test that `--test-url http://127.0.0.1:4173` reaches `runXray`, and invalid adapter lists return `FM_XRAY_ADAPTERS_INVALID`.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `node --test tests/xray-adapters.test.mjs tests/cli.test.mjs`

Expected: FAIL because Browser adapter and CLI options do not exist.

- [ ] **Step 3: Implement browser execution**

Validate the URL with a strict loopback/test-target helper. Resolve the local Playwright CLI through an explicit `playwright` or `@playwright/test` package in the tested workspace; do not download packages, run `npx`, or edit dependency files. If unavailable, return `FM_XRAY_PLAYWRIGHT_UNAVAILABLE` with `npm install --save-dev playwright` and `npx playwright install chromium` as the next action.

For an available runner, execute a generated temporary local Playwright script under `.codex-orchestrator/xray/browser/` that opens the URL, enumerates reachable anchors/buttons/forms, snapshots before and after interaction, records screenshots/traces, and emits newline-delimited JSON receipts. Limit interaction to safe non-destructive controls and isolated test data; block dangerous labels/actions. Parse only the generated JSON protocol, redact outputs, and preserve each flow's URL, coverage area, control label, action, expected/actual, reproduction, screenshot, and trace evidence. Wire complete receipts into existing Xray scoring and reporting. Mirror all runtime changes.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `node --test tests/xray-adapters.test.mjs tests/xray.test.mjs tests/cli.test.mjs`

Expected: PASS; non-local URLs and missing Playwright are gaps, while a simulated runner creates complete evidence-backed browser receipts.

- [ ] **Step 5: Commit**

```bash
git add tests/xray-adapters.test.mjs tests/xray.test.mjs tests/cli.test.mjs src/xray-adapters.mjs src/xray.mjs src/cli.mjs plugins/forgemind/src/xray-adapters.mjs plugins/forgemind/src/xray.mjs plugins/forgemind/src/cli.mjs
git commit -m "feat: run Xray local browser tests"
```

### Task 4: Implement Android emulator adapter

**Files:**
- Modify: `tests/xray-adapters.test.mjs`
- Modify: `src/xray-adapters.mjs`
- Modify: `src/xray.mjs`
- Mirror: matching `plugins/forgemind/src/` files

**Interfaces:**
- `executeAndroidAdapter({ workspace, profile, runProcess })` returns ADB receipts or explicit tool/emulator/package gaps.
- Android receipts include `adapter: 'android-adb'`, emulator serial, package/activity, UI-tree evidence, screenshot, and log evidence.

- [ ] **Step 1: Write failing Android adapter tests**

Add tests that simulate:

```js
assert.equal(noAdb.gap.code, 'FM_XRAY_ADB_UNAVAILABLE');
assert.equal(noEmulator.gap.code, 'FM_XRAY_ANDROID_EMULATOR_UNAVAILABLE');
assert.equal(receipt.adapter, 'android-adb');
assert.equal(receipt.surfaceIds[0], 'mobile-gui');
assert.ok(receipt.evidence.some((path) => path.endsWith('ui-tree.xml')));
```

- [ ] **Step 2: Run focused tests to verify RED**

Run: `node --test tests/xray-adapters.test.mjs`

Expected: FAIL because Android adapter behavior does not exist.

- [ ] **Step 3: Implement ADB orchestration**

Run `adb devices`, select one `device` serial, resolve the manifest package/activity, start the activity, clear and collect package-scoped logcat, dump the UI tree, and capture screenshot/log artifacts under `.codex-orchestrator/xray/android/`. Derive tappable controls only from UI-tree bounds; do not derive coordinates from screenshots. Treat missing ADB, no device, package resolution failure, or unavailable activity as explicit prerequisite gaps. Do not execute destructive or administrative actions. Mirror runtime files.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `node --test tests/xray-adapters.test.mjs tests/xray.test.mjs`

Expected: PASS with normalized Android evidence and truthful prerequisite gaps.

- [ ] **Step 5: Commit**

```bash
git add tests/xray-adapters.test.mjs src/xray-adapters.mjs src/xray.mjs plugins/forgemind/src/xray-adapters.mjs plugins/forgemind/src/xray.mjs
git commit -m "feat: run Xray Android emulator tests"
```

### Task 5: Update entry skill, package, and release verification

**Files:**
- Modify: `tests/journey-surface.test.mjs`
- Modify: `tests/package.test.mjs`
- Modify: `entry-skills/forgemind-xray/SKILL.md`
- Mirror: `plugins/forgemind/entry-skills/forgemind-xray/SKILL.md`
- Modify: `package.json`, `package-lock.json`, `.codex-plugin/plugin.json`, `plugins/forgemind/package.json`, `plugins/forgemind/.codex-plugin/plugin.json`, `CHANGELOG.md`

**Interfaces:**
- Publishes version `1.41.0`.
- Entry skill states that Xray invokes adapters, and accurately explains Playwright/ADB setup gaps and Codex Browser's interactive role.

- [ ] **Step 1: Write failing release-contract tests**

Add assertions that both source and built Marketplace Xray skills contain `Playwright`, `ADB`, `FM_XRAY_PLAYWRIGHT_UNAVAILABLE`, and `FM_XRAY_ANDROID_EMULATOR_UNAVAILABLE`, and that all package/lockfile versions equal `1.41.0`.

- [ ] **Step 2: Run release-contract tests to verify RED**

Run: `node --test tests/journey-surface.test.mjs tests/package.test.mjs`

Expected: FAIL before updated skill copy and release metadata exist.

- [ ] **Step 3: Update user-facing contract and package metadata**

Rewrite the Xray entry skill to require `xray run --test-url <loopback-url>` for autonomous GUI execution, to state that Xray executes the command/API/Browser/Android adapters, and to preserve explicit gaps when Playwright/ADB are unavailable. Set source/distribution manifests and both root lockfile version fields to `1.41.0`; add changelog entries for executable adapters and truthful prerequisite gaps. Mirror the skill exactly.

- [ ] **Step 4: Run full verification**

Run:

```bash
node --test tests/project.test.mjs tests/xray-adapters.test.mjs tests/xray.test.mjs tests/cli.test.mjs tests/journey-surface.test.mjs tests/package.test.mjs
npm test
npm run build
node bin/forgemind.mjs validate --plugin dist/plugin --strict-release
git diff --check
git diff --no-index -- src/project.mjs plugins/forgemind/src/project.mjs
git diff --no-index -- src/xray-adapters.mjs plugins/forgemind/src/xray-adapters.mjs
git diff --no-index -- src/xray.mjs plugins/forgemind/src/xray.mjs
git diff --no-index -- src/cli.mjs plugins/forgemind/src/cli.mjs
git diff --no-index -- entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md
```

Expected: all tests/build/strict validation pass and all mirrors have no diff.

- [ ] **Step 5: Commit**

```bash
git add tests/journey-surface.test.mjs tests/package.test.mjs entry-skills/forgemind-xray/SKILL.md plugins/forgemind/entry-skills/forgemind-xray/SKILL.md package.json package-lock.json .codex-plugin/plugin.json plugins/forgemind/package.json plugins/forgemind/.codex-plugin/plugin.json CHANGELOG.md
git commit -m "release: Xray 1.41.0"
```

## Self-review

- Spec coverage: Tasks 1–2 deliver safe framework discovery and API execution evidence; Task 3 delivers local Playwright GUI receipts; Task 4 delivers ADB evidence; Task 5 packages and verifies the executable adapter suite.
- Placeholder scan: all tasks provide exact target files, interfaces, tests, and command-level verification.
- Interface consistency: project candidates feed adapter selection; adapter receipts feed Xray; CLI and entry-skill options feed Browser execution; package tests verify shipped copies.
