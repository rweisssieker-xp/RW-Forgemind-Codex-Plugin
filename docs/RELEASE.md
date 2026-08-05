# Release Guide

ForgeMind uses Semantic Versioning. Use patch for compatible fixes, minor for compatible features, and major only for breaking interfaces, paths, schemas, or lifecycle behavior.

## Prepare

1. Confirm manifest and package versions match.
2. Update `CHANGELOG.md` with user-visible behavior and migration notes.
3. Confirm repository, support, security, privacy, terms, license, and icons are accurate. Include screenshots only when the plugin ships an embedded UI.
4. Use a clean branch with no secrets, personal memory, or unrelated generated files.

## Portable release gate

Run on Node.js 20 and the current supported LTS on Windows, macOS, and Linux:

```text
npm ci
npm test
node bin/forgemind.mjs validate
node bin/forgemind.mjs verify --run
node bin/forgemind.mjs gaps
node bin/forgemind.mjs risks
node bin/forgemind.mjs evidence
node bin/forgemind.mjs readiness
node bin/forgemind.mjs package
```

Verify both `dist/plugin` and `dist/marketplace/plugins/forgemind` from their checksums. A ready claim requires current verification, no blocker risk, clean Git evidence, and a valid delivery proof.

## MVP launch evidence

When a release candidate originated from `$launch-mvp`, retain `.codex-orchestrator/product/mvp-launch-latest.json`, the related MVP brief, tester decision, verification report, delivery proof, and rollback evidence. A tester decision of `stop` blocks the release; `iterate` requires a documented follow-up scope before a new release decision.

## Lifecycle smoke test

Use isolated temporary home and workspace directories. Test fresh install, upgrade, valid downgrade, failed-install rollback, uninstall without purge, and explicitly approved purge. Never aim lifecycle tests at a real user home or broad directory.

```text
node bin/forgemind.mjs install --source dist/plugin --destination <temporary-plugin-directory>
node bin/forgemind.mjs legacy runtime-discovery-test --json
node bin/forgemind.mjs uninstall --destination <temporary-plugin-directory>
```

## Publish and hand off

1. Review the package allowlist and reproducibility result.
2. Review acceptance evidence and any residual risk.
3. Tag the verified commit with the manifest version.
4. Attach or publish the immutable package through the approved internal marketplace and/or public release channel.
5. Restart Codex and run [RUNTIME_TEST.md](RUNTIME_TEST.md) against the published package.
6. Retain the previous known-good package for rollback.

Public marketplace submission and organization rollout require the relevant external approval; repository readiness does not grant that approval.
