---
name: forgemind-verify
description: Prove that a change, MVP, or release is safe and ready. Use when tests, code review, security checks, delivery proof, rollback readiness, tester decisions, or Go/No-Go release decisions are needed.
---

# Verify

Verify claims with artifacts, not confidence. Run the smallest relevant automated checks, inspect the diff, assess security and delivery risks, and keep a clear distinction between passed, failed, blocked, and not-run evidence.

For an MVP, combine target-user, functional, accessibility, and adversarial evidence. Record outcomes with `forgemind testing record` and calculate the decision with `forgemind testing evaluate`; scale, iterate, or stop based on the persisted rule rather than enthusiasm. For release work, require verification, risk review, traceability, delivery proof, and rollback evidence before a Go decision.

For a GUI change, prove the critical task across its intended state matrix: loading, empty, error, success, keyboard-only, narrow viewport, and confirmation or recovery paths. Use semantic and accessibility assertions before pixels; then run the smallest fitting browser flow and capture a screenshot or visual comparison when layout, rendering, or design-system changes matter. Treat focus loss, inaccessible names, unreadable contrast, broken escape routes, flaky visual baselines, and untested responsive states as evidence gaps, never as cosmetic polish.

Persist the GUI evidence plan with `forgemind experience evidence --task "<critical-task>" --states "loading|empty|error|success|keyboard|narrow-viewport|recovery" --json`. Use `experience drift` on explicit JSON snapshots to flag design-system drift, `experience test-repair` only as a review proposal for flaky selectors, and `experience demo` to create a truthful proof-carrying demo script.

Load `playbooks/quality-security.md`, `playbooks/mvp-experiments.md`, and `playbooks/release-evidence.md` when deeper guidance is needed.

Never claim a check passed unless it ran successfully. Never release through a blocker or an unmet kill condition.
