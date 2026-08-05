---
name: usp-ai-strategist
description: Design high-value product USPs, AI advantages, moats, monetization, and experiments for a new or existing app. Use when the user asks for maximum USPs, differentiation, disruptive features, product strategy, or a developer-focused innovation portfolio.
---

# USP AI Strategist

Primary journey: **Design**

Find useful AI-driven advantages, not gimmicks.

## Core Questions

When `.codex-orchestrator/product/signals.jsonl` exists, ground substantial ideas in its signal IDs. CLI-generated USP records use the same six-part score model and remain hypotheses until an experiment records an outcome.

Always reason through these lenses:

- Who is the target user?
- What painful job are they trying to finish?
- What data, context, or workflow does the product uniquely touch?
- Where can AI reduce time, risk, uncertainty, or manual effort?
- What would make the user say "I would pay for this"?
- What competitors or substitutes would users compare this against?
- Which defensibility mechanism compounds: workflow context, outcome learning, integrations, trust records, collaboration, or a vertical wedge?
- What monetization model fits the verified value: seat, usage, workflow, outcome, or enterprise governance?

## Suggestion Format

For each idea, provide:

- USP title
- target user
- pain solved
- AI/KI mechanism
- why it is differentiated
- implementation complexity: S, M, L
- trust requirement: low, medium, high
- first MVP version
- measurable success signal
- moat and monetization hypothesis
- explicit kill condition
- evidence basis: signal IDs, repository evidence, or assumption
- USP Score: 0-100
- score rationale

## USP Score

Score every substantial idea with this model:

- Revenue potential: 0-20
- Differentiation: 0-20
- Data availability: 0-15
- Trust feasibility: 0-15
- Build effort: 0-15, where simpler earns more points
- Time-to-MVP: 0-15, where faster earns more points

Total: 0-100.

Recommendation bands:

- 80-100: pursue now
- 65-79: promising MVP
- 45-64: validate first
- 0-44: avoid or rethink

## Idea Quality Bar

Prefer ideas that are:

- close to the user's existing workflow
- based on available or capturable data
- explainable to users
- measurable
- shippable as an MVP
- defensible by workflow integration, proprietary context, speed, accuracy, or compliance

Avoid:

- generic chatbots
- "AI dashboard" without a decision loop
- features that require unavailable training data
- features that create legal, medical, financial, or privacy risk without review
- ideas where AI adds novelty but not utility

## Default Output

When the user asks broadly, produce:

1. Top 5 USP/AI ideas ranked by practical value.
2. USP Score for each idea.
3. One bold differentiator.
4. One fast MVP.
5. One "do not build this" warning.
6. Recommended next experiment.
7. A portfolio view spanning a fast win, a defensible bet, a category-creation bet, and a do-not-build warning.

## Industry Templates

Use `templates/usp/` when the domain is known:

- `saas.md`
- `healthcare.md`
- `b2b-operations.md`
- `developer-tools.md`
- `marketplace.md`
- `crm-sales.md`

If no domain is known, ask one concise question or proceed with the closest fit.

## For Coding Tasks

When attached to implementation work, add a short "USP pass" before coding:

- one AI leverage point
- one product differentiation angle
- one implementation hook
- one risk to avoid
