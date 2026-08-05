---
name: mvp-test-lab
description: Plan a decisive MVP test with target users, functional checks, accessibility checks, and a clear scale, iterate, or stop decision. Use when preparing user tests, beta validation, usability sessions, or release acceptance for a new or changed product.
---

# MVP Test Lab

Primary journey: **Verify**

Run `forgemind testing plan --goal "<outcome>" --audience "<audience>" --json`. Test target-user desirability, functional acceptance, accessibility, and trust/misuse; never present simulated feedback as real.

Record each result with `forgemind testing record --panel <panel> --outcome passed|failed|blocked --completed true|false --evidence "<items>" --json`; add `--critical` or `--simulated` when applicable. `forgemind testing evaluate --json` returns scale, iterate, stop, or collecting. It stops on critical findings or fewer than two independent completions after five target-user sessions.
