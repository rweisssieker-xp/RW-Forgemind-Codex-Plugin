---
name: yolo-feature
description: ForgeMind yolo feature workflow. Use when the user explicitly asks for yolo feature.
---

# YOLO Feature

Primary journey: **Build**

Shared orchestration precedence: safety -> debugging -> discovery -> product/USP -> implementation -> verification -> learning.

YOLO mode means high autonomy, not low standards. Move decisively, but keep the blast radius bounded.

## Autonomy Contract

You may:

- inspect the repository and infer conventions
- create or modify application code, tests, docs, and small config files needed for the feature
- choose conservative implementation details when the user leaves gaps
- run local verification commands
- start a local dev server for frontend work when useful

You must not:

- delete user work or reset git history
- make broad unrelated refactors
- change secrets, credentials, production endpoints, billing settings, or deployment targets without explicit instruction
- skip verification unless the environment blocks it
- leave long-running processes unresolved at final response time

## Required Flow

1. State "YOLO feature mode active" in a short user update.
2. Determine risk mode:
   - safe: read, analyze, plan only
   - normal: bounded edits and verification
   - yolo: end-to-end implementation with guardrails
   - surgery: broad refactor, migration, destructive operation, cost, secrets, or deployment change; requires explicit approval
3. Inspect repo structure, package metadata, tests, and relevant code. If no project profile exists, create or infer one.
4. Define acceptance criteria from the request. If uncertain, choose a conservative default and continue.
5. For user-facing features, run a compact USP/AI pass: identify one practical AI leverage point, one differentiation angle, and one avoidable gimmick.
6. Implement in small commits of thought, not necessarily git commits:
   - update tests first when practical
   - update code
   - update docs only if behavior or usage changes
7. Run relevant verification. Prefer `scripts/verify-workspace.ps1 -Run` after reviewing commands.
8. Inspect the final diff and check for unrelated changes.
9. Run a learning pass: capture mistakes, preferences, patterns, and self-update proposals.
10. Final response includes:
   - what changed
   - files touched
   - verification run
   - any blocked checks or residual risks

## Risk Escalation

Pause and ask the user only when proceeding could cause data loss, real cost, credential exposure, or an irreversible external action.
