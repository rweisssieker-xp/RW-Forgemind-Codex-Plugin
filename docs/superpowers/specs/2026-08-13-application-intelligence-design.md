# Application Intelligence Design

## Decision

ForgeMind Core gains an Application Intelligence layer that makes autonomous
product work specific to the active repository rather than limited to generic
USP archetypes. The layer adds a Live Application Twin, Autonomous UX Evolution,
Multi-Agent Product Lab, Outcome Memory, Autonomous Growth Loop, and Integration
Agent Mesh. Trust Fabric remains optional for sealed evidence and cross-team
governance.

## Entry points

### `$forgemind-twin`

Creates and refreshes the project-local Live Application Twin. It maps detected
domain concepts, roles, data/API signals, UI and route signals, workflow
hypotheses, test coverage, external integration candidates, and risk boundaries.
Every inferred relationship is labelled repository-derived or hypothesis.

### `$forgemind-evolve-ui`

Uses the Twin and current evidence to find the highest-friction flow, propose
an outcome-first alternative, and stage a reversible UX experiment. It measures
time-to-outcome, independent completion, correction, undo, accessibility, and
visual evidence. It never deletes the existing flow automatically.

### `$forgemind-growth`

Builds a bounded Growth Loop that turns project-local product evidence into
activation, retention, pricing, and value-proof hypotheses. It produces
experiments, not market facts, and does not contact customers or spend money
without configured adapters and normal hard stops.

Existing entry points gain these roles:

- `$forgemind-portfolio` invokes the Multi-Agent Product Lab before ranking
  USP candidates.
- `$forgemind-autopilot` writes and consumes Outcome Memory.
- `$forgemind-transform` uses the Integration Agent Mesh to coordinate
  configured local/read-only integrations and safe action adapters.

## Live Application Twin

`src/application-twin.mjs` reads the existing App Intelligence scan, project
profile, configured integrations, source structure, and project-local evidence.
It writes `.codex-orchestrator/twin/latest.json`. The Twin schema contains:

- `domain`: repository-derived concepts, sources, and confidence;
- `actors`: inferred roles and permissions, always marked as inference unless
  explicitly configured;
- `surfaces`: routes, UI components, APIs, data models, and tests;
- `workflows`: named hypotheses with source files, user outcome, friction
  signals, risk class, and integration dependencies;
- `integrationCandidates`: read-only/local/remote classifications with
  configuration status;
- `knowledgeGaps`: evidence required before a workflow can be treated as real.

Twin refresh is deterministic for unchanged repository inputs. It cannot read
credentials and excludes `.git`, dependencies, build output, and generated
ForgeMind state.

## Autonomous UX Evolution

`src/ux-evolution.mjs` chooses a Twin workflow, creates an experiment under
`.codex-orchestrator/ux-evolution/`, and links it to a candidate child mission.
Every experiment defines baseline, replacement flow, feature-flag/rollback
boundary, acceptance metric, guardrails, required UI states, and evidence
requirements. It can recommend or stage a repair; a configured reversible
adapter is required to change application source.

The decision rule is scale, iterate, rollback, or hold. A regression in
accessibility, critical defects, or missing rollback blocks scale.

## Multi-Agent Product Lab

`src/product-lab.mjs` evaluates each Portfolio candidate with six deterministic
perspectives: builder, target user, security, sales, support, and contrarian.
Each perspective returns a claim, evidence requirement, primary risk, and
recommendation. The Lab does not impersonate real customers or claim user
research; its outputs are structured counterarguments and validation tasks.

Portfolio scores gain a transparent lab adjustment. A critical security,
support, or contrarian objection moves a candidate to `validate` or `held`; it
cannot be silently outweighed by an optimistic builder score.

## Outcome Memory

`src/outcome-memory.mjs` turns verified local receipts, tests, UX decisions,
candidate outcomes, and explicit human corrections into durable, redacted,
project-local memory. Entries are source-linked and confidence-labelled. The
Autopilot uses approved, non-conflicting entries to choose a route, but memory
cannot override policy, grants, hard stops, or current verification evidence.

Raw prompts, secrets, speculative market claims, and unreviewed external text
are excluded.

## Autonomous Growth Loop

`src/growth-loop.mjs` produces a product-growth contract from the Twin,
Portfolio, Market Intelligence, and Outcome Memory. It has four lanes:
activation, retention, monetization, and value proof. Each lane contains a
single measurable hypothesis, a safe experiment, a guardrail, a kill condition,
evidence labels, and an action boundary.

The Growth Loop can create drafts and analyze supplied local telemetry. It
cannot send messages, change billing, or contact external systems without an
explicit adapter, grant, and policy allowance.

## Integration Agent Mesh

`src/integration-mesh.mjs` normalizes configured integrations into capabilities
and routes candidate work only to allowed adapters. It distinguishes local,
read-only, sandbox mutable, and production mutable operations. The mesh creates
an action plan with data minimization, idempotency, rollback, and evidence
requirements before Autopilot execution.

Production mutable connectors, credentials, external spend, and unconfigured
connectors are always held. The mesh reuses existing adapter receipts and
does not add a second execution bypass.

## Control flow

```text
repository → Twin → Product Lab → Portfolio
                   ├→ UX Evolution
                   ├→ Growth Loop
                   └→ Integration Mesh → Autopilot adapters
                                      ↓
                                Outcome Memory
                                      ↓
                              next Twin/Portfolio run
```

## Validation

- Twin output is project-local, deterministic, bounded, redacted, and labels
  inference versus repository-derived evidence.
- Every UX experiment has baseline, metric, guardrails, rollback, and evidence
  requirements; it cannot scale on missing or failed evidence.
- Product Lab preserves all six perspectives and holds candidates with critical
  objections.
- Outcome Memory rejects sensitive and unsupported entries and cannot weaken
  existing policy decisions.
- Growth outputs label assumptions and never invoke external communication or
  billing by themselves.
- Integration Mesh refuses unconfigured, production mutable, secret-bearing,
  or insufficiently scoped operations.
- All new Core entry skills and Marketplace mirrors are present; existing
  workflows remain compatible.
