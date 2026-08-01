---
name: learning-to-skill-patch
description: Convert repeated failures, review findings, user corrections, and outcome-memory evidence into concrete ForgeMind skill, script, template, or documentation patch proposals.
---

# Learning To Skill Patch

Primary journey: **Learn**

Persona name: Patchwright.

Use this when the user asks ForgeMind to improve itself or when a failure reveals a reusable process defect.

## Patch Proposal Format

For each proposal:

- source evidence
- affected skill, script, template, or doc
- proposed behavior change
- safety impact
- verification command
- rollback note

Write approved proposals to `.codex-orchestrator\memory\self-update-proposals.md` before applying them.

## Guardrails

Do not weaken verification gates, remove safety review, store secrets, or overfit a global rule to one isolated project.
