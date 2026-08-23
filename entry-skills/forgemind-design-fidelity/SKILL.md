---
name: forgemind-design-fidelity
description: Use when local PNG design references must be implemented and verified against a local web UI.
---

# ForgeMind Design Fidelity

## Product Design proposal and selection handoff

When `@Product Design` creates visual alternatives, require exactly three local PNG proposals. Do not infer the preferred variant. Persist them first:

`node <plugin-root>/bin/forgemind.mjs design-fidelity propose --inputs <proposal-1.png,proposal-2.png,proposal-3.png> --route <local-or-test-url> --artifacts workspace --json`

Show the resulting proposal IDs and wait only for the user to choose one. Persist that choice, then obtain the implementation handoff:

`node <plugin-root>/bin/forgemind.mjs design-fidelity select --proposal-set <set-id> --proposal <proposal-id> --artifacts workspace --json`

`node <plugin-root>/bin/forgemind.mjs design-fidelity apply --proposal-set <set-id> --proposal <proposal-id> --artifacts workspace --json`

After selection, implement only the returned immutable draft. Do not reinterpret or redesign its observable layout, copy, controls, states, or safe interactions; record any uncertainty as an assumption. `apply` is a controlled handoff, not permission to edit non-UI files or to skip the measured correction loop.

## Product Design handoff

When Product Design presents PNG variants, first ask the user to choose one concrete PNG. Never infer a variant from its order, name, or recency. The user must place or export that selected PNG inside the target workspace, then import it as the immutable visual input:

`node <plugin-root>/bin/forgemind.mjs design-fidelity import-draft --input <selected-local-png> --route <local-or-test-url> --viewport desktop --artifacts workspace --json`

Use the returned draft ID in every fidelity run for that chosen design: `node <plugin-root>/bin/forgemind.mjs design-fidelity run --draft-id <draft-id> --control-contract <contract-id> --control-observations '<json-array>' --artifacts workspace --json`. Do not substitute `--references`, an ordinal, or a newer PNG for the selected draft. If there is no explicitly selected local PNG, stop and ask the user to choose/export one.

Inspect the local PNG reference and write only observable controls as a contract: roles, accessible names, visible text, optional state, regions, and safe interactions. Mark uncertain content as an assumption; never invent it. Persist it before implementation with `node <plugin-root>/bin/forgemind.mjs design-fidelity contract --contract '<json>' --artifacts workspace --json`.

Run `node <plugin-root>/bin/forgemind.mjs design-fidelity run --references <local-png-paths> --route <local-or-test-url> --control-contract <contract-id> --control-observations '<json-array>' --artifacts workspace --json` before changing UI code. Read the visual report, control evidence, gaps, correction bounds, and allowed file extensions.

When the report is `needs-correction`, automatically edit only matching workspace UI source, styles, templates, or local assets. Implement true accessible controls, not decorative replicas: use the contracted role, accessible name, visible text, state, and only its safe interaction. Never edit manifests, lockfiles, `.env` files, infrastructure, deployment, payment, identity, or production configuration. Run the project's safe verification, then rerun the same Design Fidelity command. Keep an edit only if verification passes and the newly measured difference decreases. Stop and report the exact gap if the difference worsens, verification fails, a target is not local/test, or the iteration limit is reached.

Do not install packages, use external browsers, log in, submit forms, or claim a match without the current measured report.
