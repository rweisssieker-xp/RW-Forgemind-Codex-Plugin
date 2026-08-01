---
name: tdd-builder
description: Test-driven development workflow for ForgeMind. Use for test-first implementation, regression tests, red-green-refactor, bug fixes, or features where behavior can be specified with tests.
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
