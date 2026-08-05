# ForgeMind Runtime Test Checklist

Use this checklist after installing or upgrading ForgeMind from GitHub.

## Verify The Installed Plugin

From the installed ForgeMind root, run:

```text
node bin/forgemind.mjs validate
node bin/forgemind.mjs help
node bin/forgemind.mjs innovation portfolio --goal "Reduce a recurring user workflow" --json
```

Expected: validation passes, the CLI lists its runtime commands, and the portfolio command writes `.codex-orchestrator/product/innovation-portfolio-latest.json`. A portfolio without imported customer signals must label its bets as assumptions and `validate-first`.

## Verify The Six Journeys

Start a new Codex task and use one prompt for each journey:

```text
Use $forgemind-guide to choose the safest next step for this unclear goal.
Use $forgemind-explore to find the strongest measurable MVP opportunity in this app.
Use $forgemind-plan to turn the selected outcome into a build-ready plan.
Use $forgemind-build to implement and verify this bounded change.
Use $forgemind-verify to assess tests, risk, rollback, and release readiness.
Use $forgemind-learn to retain the measured outcome and improve the next iteration.
```

Expected: only these six journeys are shown as ForgeMind skills. Their deeper guidance comes from compact internal playbooks rather than a long specialist-skill list.

## MVP Command Tests And YOLO Boundaries

```text
Use $forgemind-build to ship a fast YOLO MVP for this bounded feature.
```

Expected: ForgeMind selects a narrow, reversible scope and still reports verification, risk, rollback, and unresolved evidence. It must pause for secrets, destructive actions, production access, external spend, irreversible migrations, or high-stakes decisions.

For a complete, persisted MVP path, run:

```text
node bin/forgemind.mjs launch-mvp --goal "Shorten invoice approvals" --audience "Finance teams" --json
node bin/forgemind.mjs testing plan --goal "Shorten invoice approvals" --audience "Finance teams" --json
```

## Update Verification

After `codex plugin marketplace upgrade forgemind-marketplace`, reinstall the Core plugin and repeat this checklist. Install `forgemind-trust-fabric@forgemind-marketplace` only when the optional advanced evidence commands are needed.
