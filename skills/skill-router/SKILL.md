---
name: skill-router
description: Routes ambiguous ForgeMind requests to the safest next workflow. Use when a request is unclear or needs a workflow recommendation.
---

# Skill Router

Primary journey: **Discover**

Persona name: Workflow Routing.

Use this before ambiguous coding, product, review, release, debugging, or workflow requests.

## Routing Output

When outcome evidence exists, run `forgemind route --category <category> --json`. Report its evidence IDs, confidence, alternative, safety escalation, and missing evidence. Learned preferences never override a policy denial.

## Context Budget

Keep routing cost-aware: use the router or Autopilot to identify the smallest sufficient specialist, then invoke only that specialist. Do not load adjacent skills merely because they are related. Escalate to an implementation plan only when scope, risk, or uncertainty warrants it.

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
