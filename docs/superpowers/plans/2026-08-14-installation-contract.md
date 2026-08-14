# Installation Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ForgeMind installation targets unambiguous while preserving existing `--home` and `--destination` usage.

**Architecture:** Add a lifecycle resolver that maps a Codex home to `plugins/forgemind` or validates an explicit target. Install, self-test, and uninstall use the resolver; the CLI only normalizes aliases.

**Tech Stack:** Node.js 20+, ECMAScript modules, `node:test`, Node filesystem APIs.

## Global Constraints

- Only an exact `plugins/forgemind` target may be written or removed.
- `--home` is canonical and `--destination` remains a compatible alias.
- `--plugin-path` is absolute and must end in `plugins/forgemind`.
- Never inspect or remove project-owned `.codex-orchestrator` directories.
- Keep `src/` and `plugins/forgemind/src/` behavior identical.

---

### Task 1: Resolve and validate installation targets

**Files:** Modify `src/lifecycle.mjs`, `plugins/forgemind/src/lifecycle.mjs`, and `tests/lifecycle.test.mjs`.

**Interfaces:** Export `resolveInstallationTarget({ home, pluginPath })`, returning `{ home, target }`. Reject a path whose basename is not `forgemind` or whose parent basename is not `plugins` with `FM_INSTALL_TARGET_INVALID`.

- [ ] Write tests that a home resolves to `path.join(home, 'plugins', 'forgemind')`, a valid explicit path resolves unchanged, and `path.join(home, 'plugins', 'other-plugin')` rejects with `FM_INSTALL_TARGET_INVALID`.
- [ ] Run `node --test tests/lifecycle.test.mjs`; expect failure because the resolver does not exist.
- [ ] Implement the resolver with `path.resolve`, `path.basename`, `path.dirname`, `assertContained`, and `ForgeMindError`.
- [ ] Replace direct target construction in `installPlugin`, `runInstallationSelfTest`, and `uninstallPlugin` with the resolver result; make the same changes in the Marketplace lifecycle mirror.
- [ ] Run `node --test tests/lifecycle.test.mjs`; expect all target cases to pass.
- [ ] Commit Task 1 with message `feat: validate explicit ForgeMind install targets`.

### Task 2: Expose the canonical and explicit CLI contract

**Files:** Modify `src/cli.mjs`, `plugins/forgemind/src/cli.mjs`, and `tests/lifecycle.test.mjs`.

**Interfaces:** Pass `installPlugin({ packagePath, home, pluginPath })`, `runInstallationSelfTest({ home, pluginPath })`, and `uninstallPlugin({ home, pluginPath })`.

- [ ] Write CLI tests using `runCli(['install', '--source', packagePath, '--plugin-path', pluginPath], context)` and assert a zero exit code plus `installPath === pluginPath`.
- [ ] Add a CLI test using an invalid `--plugin-path` and assert exit code `2`.
- [ ] Run `node --test tests/lifecycle.test.mjs`; expect explicit-path behavior to fail before implementation.
- [ ] Set `home` to `options.home ?? options.destination ?? await defaultHome()` and pass `pluginPath: options['plugin-path']` to install, self-test, and uninstall.
- [ ] Apply identical dispatch changes in `plugins/forgemind/src/cli.mjs`.
- [ ] Run `node --test tests/lifecycle.test.mjs`; expect canonical, alias, valid explicit path, and invalid explicit path tests to pass.
- [ ] Commit Task 2 with message `feat: expose explicit ForgeMind install path`.

### Task 3: Align documentation and release checks

**Files:** Modify `docs/INSTALL.md`, `README.md`, and `tests/release-metadata.test.mjs`.

**Interfaces:** Documentation presents `forgemind install --source <package-path> --home <codex-home>` as canonical; it labels `--destination` compatible and documents `--plugin-path <codex-home>/plugins/forgemind`.

- [ ] Add documentation assertions for the canonical `--home` command, the exact `--plugin-path` suffix, and the compatibility status of `--destination`.
- [ ] Run `node --test tests/release-metadata.test.mjs`; expect failure because the current text calls destination an absolute plugin directory.
- [ ] Update install, upgrade, self-test, and uninstall examples; retain the Marketplace Node-runner fallback and project-artifact boundary.
- [ ] Run `node --test tests/release-metadata.test.mjs && node bin/forgemind.mjs validate --plugin plugins/forgemind --strict-release`; expect pass.
- [ ] Commit Task 3 with message `docs: clarify ForgeMind installation contract`.

### Task 4: Final release verification

**Files:** Verify `tests/lifecycle.test.mjs` and `plugins/forgemind/`.

- [ ] Run `node --test tests/lifecycle.test.mjs`; expect pass.
- [ ] Run `npm run ci && node bin/forgemind.mjs validate --plugin plugins/forgemind --strict-release`; expect tests, evaluations, package build, built-plugin validation, and Marketplace validation to pass.
- [ ] Run `git diff --check && git status --short`; expect no whitespace errors and only planned files.
- [ ] Commit and push the final verified state with message `feat: harden ForgeMind installation contract`.
