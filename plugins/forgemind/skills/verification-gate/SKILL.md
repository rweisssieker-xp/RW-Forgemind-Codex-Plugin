---
name: verification-gate
description: ForgeMind verification gate workflow. Use when the user explicitly asks for verification gate.
---

# Verification Gate

Primary journey: **Verify**

Before saying work is complete:

1. Run relevant automated checks when available:
   - unit tests
   - integration tests
   - lint
   - typecheck
   - build
2. For UI work, inspect the result in a browser or screenshot when feasible.
3. Review `git diff` for accidental churn, unrelated edits, generated noise, and missing tests.
4. Confirm the implementation satisfies the user request.
5. Report any commands that could not run and why.

Do not claim a check passed unless you ran it and saw the result.

## Automation

ForgeMind provides `scripts/verify-workspace.ps1`.

- Without `-Run`, it reports detected commands.
- With `-Run`, it executes detected test and build commands and writes `.codex-orchestrator/reports/verification-latest.json`.
- Use `-IncludeInferred` only when inferred commands are reasonable for the repository.
- Reports include command status and a simple failure category to speed up triage.
