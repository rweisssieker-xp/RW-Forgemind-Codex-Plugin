---
name: forgemind-build
description: Implement a scoped feature, fix, or MVP end to end. Use for normal delivery, rapid YOLO MVPs, refactors, debugging, autonomous execution, or moving an approved plan into tested code.
---

# Build

Inspect the repository and the selected plan first. State the acceptance criteria, boundaries, and verification approach, then make the smallest coherent change. Preserve existing conventions and prefer a testable vertical slice over broad scaffolding.

YOLO is always available when the user asks for a fast MVP: choose the narrowest reversible scope, implement without unnecessary planning loops, then still run relevant tests, inspect risk, capture a rollback path, and report what remains unproven. Stop for secrets, production access, destructive actions, external spend, irreversible migrations, or high-stakes decisions.

Use test-driven development when practical, reproduce defects before fixing them, and avoid unrelated cleanup. Load `playbooks/delivery-yolo.md`, `playbooks/debugging-refactoring.md`, and `playbooks/project-intelligence.md` when deeper guidance is needed.

Finish with changed files, acceptance evidence, commands actually run, residual risk, and the next decision.
