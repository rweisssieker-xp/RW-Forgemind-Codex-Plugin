---
name: forgemind-build
description: Implement a scoped feature, fix, or MVP end to end. Use when delivering normal work, rapid YOLO MVPs, refactors, debugging, autonomous execution, or an approved plan as tested code.
---

# Build

Inspect the repository and the selected plan first. State the acceptance criteria, boundaries, and verification approach, then make the smallest coherent change. Preserve existing conventions and prefer a testable vertical slice over broad scaffolding.

YOLO is always available when the user asks for a fast MVP: choose the narrowest reversible scope, implement without unnecessary planning loops, then still run relevant tests, inspect risk, capture a rollback path, and report what remains unproven. Stop for secrets, production access, destructive actions, external spend, irreversible migrations, or high-stakes decisions.

Use test-driven development when practical, reproduce defects before fixing them, and avoid unrelated cleanup. Load `playbooks/delivery-yolo.md`, `playbooks/debugging-refactoring.md`, and `playbooks/project-intelligence.md` when deeper guidance is needed.

For a GUI, implement the decisive user task rather than a decorative screen: model loading, empty, error, success, keyboard, narrow-viewport, and destructive-confirmation states. Preserve the existing design system. Make the primary action obvious, keep feedback local and reversible, avoid needless steps, and capture a visual baseline or screenshot when visual output can regress. Prefer the smallest suitable UI test layer: component for state logic, browser flow for the critical task, and screenshot comparison for visual risk.

Load `playbooks/quality-security.md` for interface work, accessibility, visual QA, or browser testing.

Finish with changed files, acceptance evidence, commands actually run, residual risk, and the next decision.
