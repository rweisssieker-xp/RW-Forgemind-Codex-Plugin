---
name: outcome-memory
description: ForgeMind outcome memory workflow. Use when the user explicitly asks for outcome memory.
---

# Outcome Memory

Primary journey: **Learn**

Persona name: Outcome Learning.

Use this after completed work, failed checks, release decisions, USP experiments, or review findings.

## Capture

Record:

- task
- intended outcome
- actual outcome
- verification evidence
- defects or misses
- skill route used
- whether the route was effective
- next routing adjustment

Write to `.codex-orchestrator\memory\outcome-memory.md`.

For measurable routing outcomes, prefer `forgemind outcome record`. It stores versioned records under `.codex-orchestrator/memory/shared/outcomes.jsonl`; never place secrets in outcome fields.

## Relationship To Learning

Use `learning-loop` for narrative lessons and self-update proposals. Use outcome memory for evidence that can later support routing and release scoring.
