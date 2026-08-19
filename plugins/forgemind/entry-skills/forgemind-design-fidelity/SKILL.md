---
name: forgemind-design-fidelity
description: Use when local PNG design references must be implemented and verified against a local web UI.
---

# ForgeMind Design Fidelity

Run `node <plugin-root>/bin/forgemind.mjs design-fidelity run --references <local-png-paths> --route <local-or-test-url> --artifacts workspace --json` before changing UI code. Read the report, correction bounds, and allowed file extensions.

When the report is `needs-correction`, automatically edit only matching workspace UI source, styles, templates, or local assets. Never edit manifests, lockfiles, `.env` files, infrastructure, deployment, payment, identity, or production configuration. Run the project's safe verification, then rerun the same Design Fidelity command. Keep an edit only if verification passes and the newly measured difference decreases. Stop and report the exact gap if the difference worsens, verification fails, a target is not local/test, or the iteration limit is reached.

Do not install packages, use external browsers, log in, submit forms, or claim a match without the current measured report.
