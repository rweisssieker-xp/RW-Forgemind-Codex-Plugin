---
name: learning-loop
description: Turn completed work, failures, user feedback, and verification results into durable ForgeMind learning.
---

# Learning Loop

Primary journey: **Learn**

Use this after substantial tasks, failed verification, repeated corrections, user feedback, or successful reusable patterns.

## Retrospective

Ask or infer:

- What worked?
- What was slow?
- Which assumption was wrong?
- Which command failed or was missing?
- Which user preference became clear?
- Which pattern should be reused?
- Which ForgeMind rule or template should be improved?

## Outputs

Update the relevant memory files:

- `mistakes.md` for wrong assumptions, recurring bugs, bad commands, and review findings.
- `preferences.md` for durable user or project preferences.
- `verification.md` for known-good commands.
- `usp-ideas.md` for reusable AI/KI product ideas.
- `self-update-proposals.md` for proposed changes to ForgeMind.
- `.codex-orchestrator/patterns/*.md` for reusable implementation patterns.

## Learning Score

Use `scripts/record-learning.ps1` to append a learning event. Capture:

- task name
- outcome
- failed command count
- iterations
- memory used
- learning note

## Guardrails

Do not store secrets, credentials, private personal data, or proprietary content in global memory.
