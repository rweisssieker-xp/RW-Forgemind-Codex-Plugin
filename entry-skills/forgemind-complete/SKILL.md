---
name: forgemind-complete
description: Complete an agreed feature, app improvement, or MVP end to end. Use when the user says fully implement, finish everything, make it production-ready, continue until done, or wants implementation across discovery, code, integration, tests, and handoff without stopping at a partial vertical slice.
---

# Complete

Own the agreed outcome from the current repository state through a working, integrated result. Optimize for the Definition of Done, not the smallest possible diff. Continue autonomously after every completed subtask by checking what acceptance criterion remains unmet.

## Completion Contract

Inspect the repository first. Derive a concise contract from the user's outcome and existing conventions:

1. List observable acceptance criteria, affected flows, integration points, and the smallest useful test set.
2. Treat missing optional market research, visual baselines, telemetry, or test infrastructure as evidence gaps to record, not implementation blockers.
3. Prefer reversible decisions and compatible existing components. Make reasonable local choices instead of asking routine design or naming questions.
4. Use `forgemind complete --goal "<outcome>" --json` to persist the contract and its remaining-work ledger when a durable handoff is useful.

## Autonomous Completion Loop

Repeat until every achievable acceptance criterion is implemented and integrated:

1. Inspect the next unmet criterion and relevant code paths.
2. Implement the coherent change, including all directly affected states and callers.
3. Run the smallest relevant checks. If a check is unavailable, fix the setup when it is local and low-risk; otherwise retain an explicit not-run gap and continue with all independent work.
4. Inspect the diff and reassess the remaining ledger. Do not stop after scaffolding, one screen, one endpoint, or one happy path when the outcome requires more.
5. Finish with changed files, criteria satisfied, tests actually run, residual gaps, and a precise next action only when an external boundary remains.

## Stop Boundary

Do not pause for ordinary ambiguity, missing optional evidence, absent visual tooling, incomplete market data, or a non-critical test failure that can be diagnosed locally. Pause only before secrets or credentials, production access, data deletion, irreversible migration, external spend, legal/compliance commitment, or a high-stakes decision. State the exact boundary and continue every safe independent task.

For a rapid MVP, keep YOLO speed: reduce scope only when it preserves the agreed core outcome. Do not silently downgrade a complete request into a prototype.

Load `playbooks/delivery-yolo.md`, `playbooks/project-intelligence.md`, and `playbooks/quality-security.md` only when their detail is needed.
