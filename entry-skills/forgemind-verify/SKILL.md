---
name: forgemind-verify
description: Prove that a change, MVP, or release is safe and ready. Use when tests, code review, security checks, delivery proof, rollback readiness, tester decisions, or Go/No-Go release decisions are needed.
---

# Verify

Verify claims with artifacts, not confidence. Run the smallest relevant automated checks, inspect the diff, assess security and delivery risks, and keep a clear distinction between passed, failed, blocked, and not-run evidence.

For an MVP, combine target-user, functional, accessibility, and adversarial evidence. Record outcomes with `forgemind testing record` and calculate the decision with `forgemind testing evaluate`; scale, iterate, or stop based on the persisted rule rather than enthusiasm. For release work, require verification, risk review, traceability, delivery proof, and rollback evidence before a Go decision.

Load `playbooks/quality-security.md`, `playbooks/mvp-experiments.md`, and `playbooks/release-evidence.md` when deeper guidance is needed.

Never claim a check passed unless it ran successfully. Never release through a blocker or an unmet kill condition.
