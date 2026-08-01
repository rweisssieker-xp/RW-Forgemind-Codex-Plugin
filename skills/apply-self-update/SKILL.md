---
name: apply-self-update
description: Review ForgeMind self-update proposals and apply approved changes to skills, templates, prompts, docs, or scripts.
---

# Apply Self-Update

Primary journey: **Learn**

Use when the user asks ForgeMind to improve itself or apply proposals from `self-update-proposals.md`.

## Required Flow

1. Read project and global `self-update-proposals.md` if present.
2. Group proposals by target: skill, template, prompt, script, docs, validator, dashboard.
3. Reject proposals that would store secrets, weaken guardrails, or overfit to one task.
4. Present the planned updates unless the user explicitly asked to apply all.
5. Apply focused changes.
6. Run `scripts/test-forgemind.ps1`.
7. Record the update in `CHANGELOG.md` or a learning log when useful.

## Rules

Self-updates must improve repeatability, safety, verification, product value, or user preference alignment. Do not add vague process text without a concrete trigger or behavior.
