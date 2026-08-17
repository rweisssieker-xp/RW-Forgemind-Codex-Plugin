# Guided ForgeMind Design

## Purpose

Make ForgeMind approachable for solo developers, product teams, and non-technical founders who need to improve an existing product, develop an MVP, or ship with confidence. The new entry point must turn an unclear request into one explainable next action without requiring users to understand ForgeMind's journey catalog.

## Scope

Add a `$forgemind-start` entry skill and matching `forgemind start` CLI workflow. It asks for, or derives, three inputs:

1. Starting context: new idea, existing project, or release/quality problem.
2. Desired outcome: improve a product, build an MVP, or ship reliably.
3. Working style: guided or largely autonomous.

It produces a recommendation only. It does not automatically invoke another journey, run an adapter, change code, contact an external service, or make an irreversible action.

## User Experience

The response is a concise “next best action” brief containing:

- the recommended ForgeMind journey;
- an understandable reason for the recommendation;
- the expected outcome;
- explicit safety and autonomy boundaries;
- a directly executable command or skill invocation;
- a confidence level and an alternative route when the recommendation is uncertain.

The entry point is the recommended default for broad or unclear requests. Existing direct journeys remain unchanged and available for users who already know the task they need.

## Routing

The workflow combines declared inputs with existing repository-local project signals. Routing is deterministic and explainable:

| Condition | Recommended journey |
| --- | --- |
| Insufficient context, absent answers, or contradictory signals | Compass |
| Existing project and a requested disruptive or autonomous MVP | Leap |
| Clear bounded implementation, testing, or release outcome | Ship |
| Local quality or release-confidence problem | Xray |

Working style changes the recommended invocation and the stated autonomy envelope; it does not bypass existing safety gates. The result includes the source of each relevant routing signal so users can see whether it came from their answer or repository context.

## Persistence and Compatibility

When artifacts are enabled, write one project-local start recommendation record under the existing `.codex-orchestrator/` artifact structure, using the existing artifact mode behavior. `--artifacts none` returns the same result without writing state. The record preserves the inputs, routing signals, recommendation, confidence, alternative route, and timestamp.

No current CLI command, skill, schema, or artifact contract is changed. The new workflow delegates to existing journey names rather than duplicating their logic.

## Failure Handling

If project inspection is unavailable or an answer is missing, return a valid low-confidence Compass recommendation and name the missing evidence. Invalid option values return a clear validation error with accepted values. Failures to persist an otherwise valid recommendation follow existing artifact behavior and must not obscure the usable recommendation in the response.

## Verification

Automated coverage will verify:

- each primary routing path and its executable recommendation;
- zero-input and incomplete-input fallback to Compass;
- contradictory input handling and confidence/alternative-route output;
- guided and autonomous invocation variants without widening safety boundaries;
- artifact persistence and `--artifacts none` behavior;
- inclusion of the entry skill, command, documentation, and tests in the packaged Marketplace plugin.

## Non-goals

- No new Mission Control UI or dashboard.
- No external product, analytics, customer-feedback, or market-data connectors.
- No autonomous execution after a recommendation.
- No changes to the behavior of existing journeys.
