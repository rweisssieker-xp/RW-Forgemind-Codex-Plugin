---
name: launch-mvp
description: Drive one idea through market thesis, MVP scope, tester plan, implementation, verification, and a release decision in one Codex session. Use when the user wants to turn an idea or existing app opportunity into a complete, evidence-backed MVP without manually selecting each workflow.
---

# Launch MVP

Primary journey: **Build**

Start with `forgemind launch-mvp --goal "<outcome>" --audience "<audience>" --json`. This creates the persisted launch record, an app-aware idea-to-MVP brief, and a decisive tester plan.

Run the stages in order without asking routine clarification questions:

1. Inspect the existing app and separate market evidence from assumptions.
2. Generate and rank alternatives; select one hypothesis, scope, metric, and kill condition.
3. Use the tester plan to define target-user, functional, accessibility, and trust checks.
4. Create acceptance criteria, implement the smallest useful scope, and run verification.
5. Record risks, traceability, rollback, and a delivery proof; make a Go/No-Go release decision.

Stop rather than claim completion when the kill condition is met, a critical tester finding remains, verification fails, or a safety gate requires approval. Use `$yolo-feature` only when the user explicitly requests the fastest bounded implementation; it never bypasses those stops.
