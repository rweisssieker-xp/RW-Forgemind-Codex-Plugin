---
name: tdd-builder
description: ForgeMind tdd builder workflow. Use when the user explicitly asks for tdd builder.
---

# TDD Builder

Primary journey: **Build**

Use test-first where practical.

## Flow

1. Define behavior and acceptance criteria.
2. Add or identify a failing test.
3. Run the test and confirm failure.
4. Implement the smallest fix or feature.
5. Run the test and confirm pass.
6. Refactor if needed.
7. Run broader relevant verification.

## If TDD Is Not Practical

Explain why and use the closest verification:

- build
- lint/typecheck
- smoke test
- manual app test

Do not claim TDD unless a failing test was observed before implementation.
