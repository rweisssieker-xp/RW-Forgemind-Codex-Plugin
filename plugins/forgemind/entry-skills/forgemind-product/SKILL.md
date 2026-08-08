---
name: forgemind-product
description: "Turn a new idea or an existing application into one measurable, release-ready product bet. Use when the user wants an end-to-end product outcome: app analysis, market opportunity, business case, disruptive USP selection, MVP delivery, testing, evidence, or a Go/No-Go decision in one continuous workflow."
---

# Product

Start the Product OS when the request is broader than ideation or a single feature. Keep generated state outside the repository unless the user explicitly requests `--artifacts workspace`.

## Run the product bet

Invoke the bundled runner, not an assumed global `forgemind` command. Marketplace installation makes this skill available to Codex but does not add `forgemind` to the user's shell PATH. Resolve this skill's installed plugin root, then run:

```text
node <plugin-root>/bin/forgemind.mjs product launch --goal "<outcome>" --mode guided --artifacts local --json
node <plugin-root>/bin/forgemind.mjs product scan --artifacts local --json
```

If the normal `forgemind` command is available, it may be used instead. Do not stop only because that command is absent; the installed plugin runner is the portable fallback.

## Continue deliberately

After the scan, create the chosen intervention with `product action`. It must name an owner, metric, expected impact, confidence, evidence basis, a kill condition, and rollback or recovery boundary. Use `product measure` only with a recorded result: `scale`, `iterate`, `kill`, or `inconclusive`.

Run `product evidence` before handoff to expose supporting evidence and gaps. Run `product simulate` before release. Continue from `product continue` after an interruption; do not restart or silently discard open gates.

For maximum disruption, run `$forgemind-radical` inside the scan phase. For a fast MVP, permit YOLO only when the action is reversible, bounded, testable, and free of secrets, production access, destructive changes, external spend, legal commitments, or high-stakes effects.
