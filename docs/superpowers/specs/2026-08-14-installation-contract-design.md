# ForgeMind Installation Contract

## Goal

Make ForgeMind installation and update behavior unambiguous, verifiable, and
safe across Windows, macOS, and Linux.

## Canonical interface

The standard command is:

```text
forgemind install --source <package-path> --home <codex-home>
```

`--destination` remains a backward-compatible alias for `--home`.

`--plugin-path <absolute-path>` is added for explicit team or local plugin
locations. It must resolve to a directory named `forgemind` directly beneath a
`plugins` directory. Any other target is rejected before copying files.

When neither `--home` nor `--plugin-path` is supplied, ForgeMind uses the
existing detected Codex home.

## Install flow

1. Resolve exactly one target from `--plugin-path`, `--home`/`--destination`,
   or the default Codex home.
2. Validate package checksums, manifest, and target containment.
3. Stage and atomically swap the plugin, retaining the prior install as a
   recoverable backup.
4. Create the platform wrapper: `forgemind.cmd` on Windows and `forgemind` on
   macOS/Linux.
5. Run the installation self-test.
6. Return the installed version, installation path, command path, smoke-test
   result, removed plugin-local legacy artifacts, and `reloadRequired`.

## Safety boundaries

- Only a target ending in `plugins/forgemind` can be written.
- A supplied `--home` always resolves the target as `<home>/plugins/forgemind`.
- A supplied `--plugin-path` cannot target another plugin or a broad directory.
- Rollback restores the previous plugin if the swap, wrapper, or self-test
  fails.
- Legacy cleanup is limited to `.codex-orchestrator` and
  `.forgemind-artifacts` directories inside ForgeMind's installed target or its
  ForgeMind backup tree. Project-owned directories are never inspected or
  removed.

## Verification

Tests cover the canonical command, the `--destination` alias, explicit valid
and invalid plugin paths, install/upgrade/downgrade rollback, platform wrapper
generation, `forgemind --help`, self-test version reporting, and legacy cleanup.
Documentation presents the canonical command first and labels compatibility
options clearly.

## Marketplace limitation

Marketplace installation may bypass ForgeMind's lifecycle installer. The
embedded Node runner remains the reliable fallback in that case; a plugin does
not modify the PATH of an already-running Codex process.
