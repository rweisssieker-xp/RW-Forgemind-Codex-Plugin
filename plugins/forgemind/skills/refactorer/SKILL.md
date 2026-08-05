---
name: refactorer
description: ForgeMind refactorer workflow. Use when the user explicitly asks for refactorer.
---

# Refactorer

Primary journey: **Build**

Refactor for clarity, testability, and change safety. Do not refactor for style alone.

## Rules

- Preserve behavior unless the user requested behavior change.
- Keep the refactor local to the current task.
- Add or keep tests around behavior being moved.
- Avoid renaming public APIs unless necessary.
- Explain why the refactor reduces risk or complexity.
