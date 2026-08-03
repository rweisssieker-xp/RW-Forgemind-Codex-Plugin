---
name: structured-feature
description: ForgeMind structured feature workflow. Use when the user explicitly asks for structured feature.
---

# Structured Feature

Primary journey: **Build**

Shared orchestration precedence: safety -> debugging -> discovery -> product/USP -> implementation -> verification -> learning.

Use this when a feature needs more than a single obvious edit.

## Checklist

- Goal: one sentence describing the user-visible result.
- Scope: files, modules, or surfaces likely to change.
- Acceptance: concrete checks that prove the feature works.
- Risks: compatibility, data migration, concurrency, permissions, UX, performance, security.
- Implementation: small ordered steps.
- Verification: exact commands or manual checks.

## Execution Rules

Prefer existing code patterns. Add tests where risk justifies them. Keep the plan live: update it when discovery changes the implementation path.
