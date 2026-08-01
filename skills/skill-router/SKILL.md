---
name: skill-router
description: Recommend ForgeMind skills with confidence, alternatives, risk level, and the next action for ambiguous work.
---

# Skill Router

Primary journey: **Discover**

Persona name: Orion Signal.

Use this before ambiguous coding, product, review, release, debugging, or workflow requests.

## Routing Output

When outcome evidence exists, run `forgemind route --category <category> --json`. Report its evidence IDs, confidence, alternative, safety escalation, and missing evidence. Learned preferences never override a policy denial.

Provide:

- selected skill
- confidence percentage
- reason
- alternatives
- risk level: low, medium, high
- next action
- escalation trigger

## Routing Rules

- Bugs and failing tests: `systematic-debugging`
- New features: `structured-feature` or `tdd-builder`
- Product differentiation: `usp-ai-strategist`
- Radical workflow removal: `radical-vibe-builder`
- Release/handoff: `release-readiness-score` then `finish-branch`
- Missing-work questions: `gap-scanner`
- Broad autonomous work: `autonomous-orchestrator` or `yolo-feature`

If confidence is below 70%, ask one concise question unless the user requested autonomous execution.
