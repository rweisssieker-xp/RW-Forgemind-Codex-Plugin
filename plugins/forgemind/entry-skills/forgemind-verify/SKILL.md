---
name: forgemind-verify
description: Prove that a change, MVP, or release is safe and ready. Use for tests, code review, security checks, visual QA, traceability, delivery proof, rollback readiness, tester decisions, or Go/No-Go release decisions.
---

# Verify

Verify claims with artifacts, not confidence. Run the smallest relevant automated checks, inspect the diff, assess security and delivery risks, and keep a clear distinction between passed, failed, blocked, and not-run evidence.

For an MVP, combine target-user, functional, accessibility, and adversarial evidence. Record outcomes with `forgemind testing record` and calculate the decision with `forgemind testing evaluate`; scale, iterate, or stop based on the persisted rule rather than enthusiasm. For release work, require verification, risk review, traceability, delivery proof, and rollback evidence before a Go decision.

Load internal modules only when needed: `skills/verification-gate`, `skills/quality-review`, `skills/code-review-gate`, `skills/security-reviewer`, `skills/visual-qa`, `skills/traceability-mapper`, `skills/release-readiness-score`, `skills/rollback-planner`, `skills/mvp-test-lab`, and `skills/finish-branch`.

Never claim a check passed unless it ran successfully. Never release through a blocker or an unmet kill condition.
