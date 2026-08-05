---
name: innovation-first-autopilot
description: Create a developer-focused, maximum-USP innovation portfolio for a new or existing app. Use for disruptive ideas, product moats, monetization options, AI advantages, category-creation bets, or when the user asks to make their product more innovative.
---

# Innovation First Autopilot

Primary journey: **Build**

Shared orchestration precedence: safety -> debugging -> discovery -> product/USP -> implementation -> verification -> learning.

Always understand the current app before proposing ideas. Always generate radical AI or USP options before implementation.

## Prime Directive

Read the app structure first. Create a ranked innovation portfolio, then produce maximum useful AI USPs and radical feature options. Only then choose an MVP and move toward implementation.

## Required Workflow

1. Project Intelligence
   - inspect repo structure
   - identify app type, screens, modules, routes, data flow, core functions
   - read project memory if present
   - infer current user workflow
   - run `forgemind innovation portfolio --goal "<outcome>"` to persist project-aware bets
2. Current App Breakdown
   - what the app does today
   - basis functions
   - how users currently use it
   - standard steps
   - extensible areas
   - steps that could disappear
3. Innovation Pass
   - use the portfolio to cover workflow elimination, contextual intelligence, trust, learning, collaboration, vertical wedge, proactive operations, integrations, outcome pricing, and autonomous micro-products
   - generate 5 radical AI 10x ideas
   - generate 6 practical feature-evolution ideas
   - generate maximum USP proposals with USP Score
   - include at least one idea where UI disappears or the system acts automatically
4. Selection
   - choose the best MVP by user value, USP strength, feasibility, data availability, trust risk, and testability
   - explain why it beats the alternatives
5. Build Plan
   - implementation plan
   - files/modules likely to change
   - component structure
   - AI integration
   - tests/verification
6. Execution
   - implement when the user asked for build/execute or when autonomy mode allows it
   - otherwise stop after build-ready plan
7. Verification and Learning
   - run tests/build/lint/smoke checks when implementation happens
   - if this is an app/UI, run or define an app-level smoke test after implementation
   - inspect diff
   - update memory/patterns/learning when durable knowledge appears

## USP Scoring

Score each strong USP from 0-100:

- Revenue potential: 0-20
- Differentiation: 0-20
- Data availability: 0-15
- Trust feasibility: 0-15
- Build effort: 0-15, simpler earns more
- Time-to-MVP: 0-15, faster earns more

Use bands:

- 80-100: build now
- 65-79: promising MVP
- 45-64: validate first
- 0-44: avoid or rethink

## Output Contract

Use this structure:

1. Current app structure and workflow
2. Core functions, expansion points, and removable steps
3. Ranked innovation portfolio: thesis, moat, monetization, experiment, kill condition, and evidence basis
4. Five radical AI ideas and six practical feature ideas
5. Maximum USP list with scores
6. Best MVP selection and the alternatives it beats
7. Build-ready plan
8. Implementation and verification, if executed
9. App or smoke-test result
10. Risks, learning, and next steps

## Guardrails

Ask before secrets, production/deployment, destructive actions, data loss, external costs, irreversible migrations, or high-stakes regulated decisions.

Do not produce only conservative ideas. Do not skip app-structure analysis. Do not implement before the innovation pass. Do not finish implemented app work without an app-level test attempt or a clear blocker.
