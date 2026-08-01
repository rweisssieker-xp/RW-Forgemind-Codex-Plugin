---
name: implementation-plan
description: Convert approved intent or feature scope into an executable implementation plan with tasks, file ownership, verification, and rollback notes.
---

# Implementation Plan

Primary journey: **Build**

Use this for non-trivial work before editing code.

## Required Sections

- Goal
- Assumptions
- Acceptance criteria
- Files or modules likely to change
- Ordered tasks
- Test and verification plan
- Risk and rollback notes

## Planning Rules

Keep plans executable. Each task should produce a visible code, test, docs, or verification outcome. Avoid vague tasks like "improve code" unless the exact improvement is named.

Read project memory before planning when `.codex-orchestrator/memory/` exists. Plans should respect recorded conventions, risk zones, and verification commands.
