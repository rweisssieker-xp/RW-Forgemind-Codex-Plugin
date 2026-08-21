# Foundation Planning Spine Design

## Purpose

`forgemind foundation` adds one canonical, zero-question planning spine for projects that need more than a small isolated change. It converts repository evidence and a supplied or inferred outcome into linked planning artifacts:

```text
Project Context -> PRD -> Architecture Spine + NFRs -> Epics -> Stories
-> Readiness Gate -> Sprint Status
```

Foundation must draft conservatively from the repository when information is absent, mark every such value as an assumption, and continue without routine user questions. It pauses only at ForgeMind's existing hard stops: credentials or secrets, irreversible deletion or migration, external spend, production impact, legal or contractual decisions, and platform-required approval.

## Scope and invocation

The public command is `forgemind foundation` with actions `run`, `status`, and `refresh`.

- `run` inspects the workspace, writes or updates all Foundation artifacts, and returns the next executable story.
- `status` loads the canonical graph and reports completeness, stale descendants, blockers, and the next action.
- `refresh` re-inspects repository evidence and recomputes derived fields without overwriting explicit human decisions.

`run` takes an optional `--goal`. With no goal, it derives the same kind of conservative project-local outcome used by existing zero-input journeys. It never asks the user to fill forms before generating a draft.

Foundation is directly invocable. Leap, Ship, and Autopilot call it automatically only when the scope classifier identifies a multi-file, user-facing, architecture-affecting, migration-affecting, integration-affecting, or otherwise non-trivial delivery. Small fixes remain on their existing lightweight path.

## Artifact model

All detailed state is workspace-local below `.codex-orchestrator/foundation/`; concise human-reviewable documents are published below `docs/forgemind/`. Every record contains `schemaVersion`, `id`, `revision`, `generatedAt`, `source`, `evidence`, `assumptions`, `decisionState`, and `dependsOn`.

| Node | State record | Published document | Minimum contents |
| --- | --- | --- | --- |
| Context | `context.json` | `project-context.md` | repository facts, commands, conventions, constraints, open assumptions |
| PRD | `prd.json` | `prd.md` | outcome, users, scope, success measures, exclusions, acceptance criteria |
| Architecture | `architecture.json` | `architecture-spine.md` | decisions, boundaries, integrations, data changes, trade-offs |
| NFRs | `nfrs.json` | `non-functional-requirements.md` | security, performance, accessibility, observability, reliability requirements |
| Epics | `epics.json` | `epics.md` | outcome slices, dependencies, acceptance links, risks |
| Stories | `stories.json` | `stories/<id>.md` | small executable stories, acceptance tests, implementation notes, DoD |
| Readiness | `readiness.json` | `foundation-readiness.md` | pass/concerns/fail, blockers, stale dependencies, next story |
| Sprint | `sprint-status.json` | `sprint-status.md` | ordered story states, WIP, dependencies, blocked reason, completion evidence |

No raw user prompt, secret, or imported untrusted content is copied into published artifacts. Existing redaction and workspace-containment rules remain mandatory.

## State transitions and invalidation

Foundation maintains a directed dependency graph. A node is `draft`, `reviewed`, `ready`, `stale`, `blocked`, or `superseded`.

- A new run creates `draft` records and marks inferred content as assumptions rather than facts.
- An explicit human edit or supported CLI decision changes its target node to `reviewed`.
- A child becomes `stale` when a parent revision changes materially. For example, a changed PRD scope stales affected architecture, epics, stories, readiness, and sprint entries.
- `refresh` preserves reviewed decisions, updates only repository-derived fields, and emits conflicts instead of silently reconciling contradictory edits.
- Readiness is `ready` only when the required nodes exist, have no unresolved critical assumptions, and their dependency revisions match.

The default readiness gate is advisory for direct Foundation runs: it drafts and reports blockers. It is enforcing for the automatic Foundation integration of Leap, Ship, and Autopilot: those journeys may not begin an implementation packet from a stale or failed Foundation graph. They can still complete inspection and planning work.

## Zero-question behaviour

The command follows this order:

1. Inspect repository, existing ForgeMind artifacts, configuration, Git state, and project profile.
2. Infer the smallest useful outcome and generate all planning records.
3. Label missing business, customer, technical, or compliance evidence explicitly.
4. Select the smallest ready story or report the narrowest blocker.
5. Continue to the calling journey without requesting routine confirmation.

The response contains `assumptions`, `decisionsNeeded`, `readiness`, and `nextAction`, so users can correct a generated foundation later without having been forced through an intake interview.

## Integration contracts

`runFoundation({ workspace, goal, mode })` returns a stable result:

```json
{
  "schemaVersion": 1,
  "status": "ready | concerns | blocked",
  "foundationId": "foundation_<id>",
  "revision": 1,
  "scope": "lightweight | foundation-required",
  "assumptions": [],
  "decisionsNeeded": [],
  "readiness": { "status": "pass | concerns | fail", "blockers": [] },
  "nextStory": null,
  "artifactPath": ".codex-orchestrator/foundation/latest.json"
}
```

`runShip` receives an optional Foundation summary and turns `nextStory` acceptance criteria into its completion contract. `startAutopilot` inserts a `foundation-readiness` packet before implementation when `scope` is `foundation-required`. Leap uses Foundation after opportunity selection, before its Hero Loop. The existing `readiness` command remains release-focused; Foundation Readiness is planning-focused and does not replace delivery proof.

## Error handling and compatibility

Unreadable optional source documents, unknown stacks, and absent Git metadata are recorded as evidence gaps and do not stop drafting. Malformed existing Foundation state is rejected with an actionable error rather than overwritten. Writes are atomic and must remain contained inside the target workspace.

Existing `init --artifacts`, PRD templates, `portfolio`, `ship`, `leap`, and `autopilot` continue to work without Foundation state. The new documents use distinct names where needed (`architecture-spine.md`, `non-functional-requirements.md`, `foundation-readiness.md`) to avoid overwriting user material.

## Verification strategy

Tests cover:

1. Zero-input draft generation for a minimal repository.
2. Evidence/assumption labeling and preservation of explicit decisions.
3. Dependency invalidation after PRD and architecture changes.
4. Readiness failures for missing, stale, and contradictory nodes.
5. Automatic integration selection for lightweight versus foundation-required work.
6. Ship, Leap, and Autopilot refusal to implement on a failed mandatory gate.
7. `--artifacts none`, containment, redaction, and atomic-write behaviour.

Release completion requires unit tests, relevant CLI integration tests, documentation validation, and a manual review of the generated artifact chain in a representative repository.
