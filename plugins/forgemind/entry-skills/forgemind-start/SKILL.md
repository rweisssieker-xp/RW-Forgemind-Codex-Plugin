---
name: forgemind-start
description: "Use when a ForgeMind user has an idea, existing project, or quality concern but does not know which journey to start."
---

# Guided ForgeMind

Ask only for missing routing inputs, one at a time:

1. Starting context: `idea`, `project`, or `quality`.
2. Desired outcome: `improve`, `mvp`, or `ship`.
3. Working style: `guided` or `autonomous`.

Do not ask for a value the user supplied clearly. Run only:

`node <plugin-root>/bin/forgemind.mjs start --context <context> --outcome <outcome> --mode <mode> --artifacts workspace --json`

It recommends a journey only. State the recommended journey, why it was selected, its alternative route when present, the next action, and the returned safety boundary. The user explicitly invokes the recommended journey; existing hard stops remain in force.

