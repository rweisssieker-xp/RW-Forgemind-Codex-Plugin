---
name: forgemind-compass
description: "Use when a product, app, or delivery goal is unclear and ForgeMind should choose the strongest safe starting path."
---

# Compass

Use this as the default start. Ask no question unless the answer changes safety, cost, production access, or the chosen path.

When invoked without user text, load `playbooks/zero-input-defaults.md` and execute **Compass**. State the automatically derived goal and path before continuing.

Run `node <plugin-root>/bin/forgemind.mjs compass run --goal "<outcome>" --artifacts workspace --json`. Marketplace installation does not create a global `forgemind` shell command; always use this bundled runner.

- `$forgemind-spark`: generate disruptive directions before choosing a bet.
- `$forgemind-evolve`: radically improve an existing application.
- `$forgemind-venture`: establish market evidence, USP, and business-case scenarios.
- `$forgemind-council`: make one difficult, evidence-labelled decision.
- `$forgemind-ship`: implement, test, and prepare a bounded release.
- `$forgemind-leap`: developer automode from idea or app to a disruptive MVP.
- `$forgemind-xray`: independently assess an existing application with read-only quality QA.

For a fast but bounded developer run, select Leap. It proceeds without routine questions and pauses only for a hard safety or authority boundary.
