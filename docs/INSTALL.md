# Installing ForgeMind

ForgeMind supports Windows, macOS, and Linux with Node.js 20 or newer. PowerShell is optional and used only by legacy compatibility launchers.

## Build and verify a package

From a clean source checkout:

```text
npm test
node bin/forgemind.mjs validate
node bin/forgemind.mjs package
```

This produces a checksum-protected standalone plugin at `dist/plugin` and a repository marketplace bundle at `dist/marketplace`.

## Personal installation

Choose an explicit destination under your Codex plugin home:

```text
node bin/forgemind.mjs install --source dist/plugin --destination <absolute-plugin-directory>
```

The installer validates checksums, uses a staging directory, backs up an existing installation, swaps atomically where the platform permits, and restores the backup after a failed swap. Restart or reload Codex and run the runtime checks below.

## Team marketplace installation

Publish or copy the complete `dist/marketplace` directory to the governed repository location. Its `.agents/plugins/marketplace.json` points to `./plugins/forgemind` and declares the plugin available for installation. Keep the marketplace file and plugin folder together.

## Direct GitHub Marketplace installation

The repository root now contains a Marketplace catalog that resolves ForgeMind from the same checkout. In Codex, register and install it with:

```text
codex plugin marketplace add rweisssieker-xp/RW-Forgemind-Codex-Plugin
codex plugin add forgemind@forgemind-marketplace
```

Install the optional advanced workflows with `codex plugin add forgemind-trust-fabric@forgemind-marketplace`. Reload Codex after installation. To update, run `codex plugin marketplace upgrade forgemind-marketplace` and then reinstall the selected plugin. The built `dist/marketplace` bundle remains the reproducible option for governed or offline distribution.

The GitHub Marketplace snapshot is intentionally a lean runtime payload. It contains all end-user skills and runtime commands, including MVP launch and tester evidence. Build, package, install, and uninstall lifecycle tooling remains in the checksum-protected source and release artifacts; use a source checkout or `dist/plugin` for those maintainer operations.

## Upgrade and downgrade

Build or obtain the exact desired version, verify its package, and run the same install command. Installing a newer version is an upgrade; installing an older valid version is a downgrade. ForgeMind reports the lifecycle transition and retains a recoverable backup during the operation.

```text
node bin/forgemind.mjs install --source <verified-package> --destination <absolute-plugin-directory>
```

Do not replace individual installed files manually because that invalidates package checksums and makes rollback ambiguous.

## Rollback

If installation fails, automatic rollback restores the prior directory. To roll back after a successful install, reinstall the last known-good, checksum-valid package using the same destination. Preserve release packages according to team retention policy.

## Uninstall

Remove only the installed plugin directory:

```text
node bin/forgemind.mjs uninstall --destination <absolute-plugin-directory>
```

Project memory and evidence are preserved by default. Purge project-owned data only with the explicit purge option and after reviewing the exact workspace target; deletion may be irreversible.

## Runtime verification

From an installed plugin root or source checkout:

```text
node bin/forgemind.mjs doctor
node bin/forgemind.mjs validate
node bin/forgemind.mjs help
```

Then restart or reload Codex, confirm `ForgeMind` is discoverable, and follow [RUNTIME_TEST.md](RUNTIME_TEST.md).

## Data and support

ForgeMind writes local project evidence and memory as described in [PRIVACY.md](../PRIVACY.md). Do not store secrets or confidential customer data. Use [GitHub Issues](https://github.com/rweisssieker-xp/RW-Forgemind-Codex-Plugin/issues) for support and private [Security Advisories](https://github.com/rweisssieker-xp/RW-Forgemind-Codex-Plugin/security/advisories/new) for vulnerabilities.
