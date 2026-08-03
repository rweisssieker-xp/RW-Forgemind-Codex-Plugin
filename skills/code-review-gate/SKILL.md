---
name: code-review-gate
description: ForgeMind code review gate workflow. Use when the user explicitly asks for code review gate.
---

# Code Review Gate

Primary journey: **Verify**

Use a review stance. Findings come first and should be specific, actionable, and tied to files and lines.

## Review Priorities

- correctness bugs
- data loss or migration risk
- security and permission regressions
- broken user flows
- concurrency or lifecycle issues
- missing tests for changed behavior
- maintainability issues that are likely to cause defects

If no issues are found, say so and mention any remaining test gaps.
