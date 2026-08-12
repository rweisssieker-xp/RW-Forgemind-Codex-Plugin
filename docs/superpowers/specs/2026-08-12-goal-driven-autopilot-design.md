# Goal-Driven Autopilot Design

## Decision

ForgeMind will add `$forgemind-autopilot`, a goal-driven, persistent delivery
entry point. It treats the supplied Codex goal as the outcome contract and
continues autonomous work through planning, implementation, verification,
review, repair, evidence capture, and handoff. It does not ask routine
implementation questions.

An omitted goal uses the existing repository-aware zero-input default. A
supplied goal takes precedence and is persisted unchanged as the mission goal.

## Autonomy boundary

The normal operating mode is high autonomy. The orchestrator may choose the
smallest safe plan, modify in-scope project files, run permitted commands,
create branches and commits, prepare reviews and pull-request drafts, and use
explicitly configured adapters.

It pauses only for:

- credentials or secrets;
- irreversible deletion or migration;
- real external spend;
- production-impacting actions;
- legally or contractually material decisions;
- a platform-enforced approval; or
- an objectively blocked goal after bounded recovery attempts.

Uncertainty alone is not a pause condition. The orchestrator must inspect,
research, test alternatives, and select the smallest reversible route. A
configured remote adapter is never implicitly trusted: its scope and policy
decision must allow the exact action.

## Components

### Autopilot mission

`src/autopilot.mjs` owns a versioned mission record at
`.codex-orchestrator/autopilot/mission-latest.json`. A mission has a goal,
definition of done, ordered packets, state, budgets, autonomy envelope,
checkpoint references, and evidence references. Packets use the states
`ready`, `running`, `verified`, `repairing`, `blocked`, `held`, and `done`.

The initial packet sequence is: inspect and contract, implement, functional
proof, experience/review proof, risk/release proof, and handoff. The planner
may omit packets that are provably irrelevant, but may not mark a packet done
without its required evidence.

### Action adapter registry

`src/adapters.mjs` defines typed adapter manifests and executes only registered
actions. The first built-in local adapters cover workspace changes, detected
test commands, Git branch/commit, and PR-draft generation. Adapter execution
requires: a scoped capability, a policy allow decision, an action preview,
idempotency key, rollback or compensating action, and redacted audit record.

Remote adapters are configuration-only initially. They can run only when they
declare their endpoint, allowed operations, paths/resources, limits, and
authentication reference; credentials remain outside ForgeMind artifacts.

### Scoped grants and policy

The policy model gains expiring mission grants. A grant names its mission,
allowed adapter operations, workspace paths/resources, maximum actions, time
limit, and optional cost limit. A grant cannot weaken a deny rule, protected
path, or hard-stop category. Every execution records both the effective policy
and grant that authorized it.

### Worker and recovery

`autopilot run` acquires a project-local lease before processing one packet at a
time. The lease prevents competing workers from mutating a mission. Heartbeats,
action receipts, and checkpoints make `autopilot resume` safe after interruption.
Failed reversible work enters repair and retries within packet and mission
budgets; recovery uses the recorded rollback before attempting a new route.

### Evidence-based advancement

The worker automatically advances a packet only after it validates its required
evidence: command result for functional proof, review/visual evidence where
applicable, risk/readiness evidence for release proof, and a validated action
receipt for every adapter action. Held, failed, or missing evidence remains
visible and blocks subsequent dependent packets.

### Observability and experiments

Read-only telemetry and feature-flag adapters provide explicit observations to
the existing Experiment Autopilot. Feature-flag changes use a separate mutable
adapter, require a configured rollback value and grant, and are production
actions unless the adapter declares a local/sandbox environment. Guardrails can
automatically scale, iterate, or roll back only within those limits.

### Readiness

`autonomy readiness` derives its result from actual adapter manifests, policy,
active grants, rollback drills, action receipts, and evidence integrity. It
reports the highest permitted mode: observe, suggest, bounded-autopilot, or
held. `bounded-autopilot` requires at least one successful reversible adapter
exercise; it is not awarded merely because configuration files exist.

## Entry skill

`entry-skills/forgemind-autopilot/SKILL.md` will contain this standard
instruction:

> Treat the user’s goal as the outcome contract. Inspect the workspace, derive
> and execute the smallest safe plan, implement, test, review, repair, document
> evidence, and continue until the Definition of Done is met. Do not ask routine
> questions or request approval for implementation choices. Use configured local
> and remote adapters when permitted. Stop only for credentials, irreversible
> deletion or migration, real external spend, production-impacting actions,
> legally or contractually material decisions, a platform-required approval, or
> an objectively blocked goal. Persist checkpoints, decisions, action previews,
> rollback data, and verification evidence in the project.

## CLI and artifacts

The CLI adds `autopilot start`, `run`, `status`, `resume`, `hold`, `approve`,
`rollback`, and `adapters` subcommands. `start` creates a mission; `run` and
`resume` execute allowed ready packets; `hold` safely pauses; `approve` records
a platform/user hard-stop decision without granting unrelated actions.

Project-owned state lives only below `.codex-orchestrator/autopilot/` and
`.codex-orchestrator/adapters/`. Records are versioned, atomic, redacted, and
link into the existing Forge flight/evidence chain where available.

## Failure behavior

Invalid manifests, expired grants, lost leases, missing rollback, non-idempotent
replay, policy denial, or unverifiable evidence fail closed. The mission is
held or blocked with an actionable reason and remains resumable. No adapter may
execute a side effect after a failed preview, a stale lease, or a missing policy
decision.

## Test and acceptance criteria

- A goal starts a persistent mission and advances permitted local work through
  verified packets without routine user prompts.
- Adapter manifests reject undeclared operations, escaped paths, absent rollback,
  missing idempotency keys, and secret-bearing configuration.
- Re-running an action after interruption produces no duplicate side effect.
- A worker resumes safely from a checkpoint and respects leases and retry budgets.
- Scoped grants expire and cannot weaken default/shared/personal denials.
- Failed verification or evidence blocks automatic advancement and triggers
  recorded rollback before repair.
- Read-only connector data remains bounded and redacted; mutable remote actions
  remain held without an explicit adapter, grant, and policy decision.
- Autonomy readiness becomes `bounded-autopilot` only after real reversible
  execution evidence exists.
- Existing Leap, Hero Control, policy, Trust Fabric, and packaging tests remain
  compatible.

## Delivery slices

1. Mission state machine, entry skill, CLI, checkpoints, leases, and tests.
2. Local adapter registry, scoped grants, previews, receipts, rollback, and
   idempotency.
3. Automatic evidence gates, recovery loop, readiness derivation, and dashboard.
4. Configured read-only connector contracts and sandbox feature-flag adapter.
5. Optional remote mutable adapters, enabled only by explicit project policy.
