# Autonomous Portfolio Design

## Decision

ForgeMind expands from a single-goal autopilot into a repository-native
Autonomous Portfolio. Whenever it is activated in a repository, it discovers
all plausible AI-native, disruptive USP opportunities, treats each as an
evidence-labelled candidate, and advances every safe candidate through its own
reversible experiment lifecycle.

The system does not claim a USP is true merely because it was generated. Each
candidate remains a hypothesis until it has project, customer, usage, or test
evidence. Candidates that fail their kill condition are stopped and preserved
as evidence instead of being silently discarded.

## Entry points

### `$forgemind-portfolio`

The portfolio entry point inspects the current repository and produces a
ranked, evidence-labelled opportunity map. It combines existing ForgeMind
radical paradigms, innovation bets, workflow observations, project profile,
signals, implementation constraints, and prior outcomes. Its zero-input
default is: discover the maximum defensible AI-native opportunities in the
current repository.

### `$forgemind-autopilot`

Autopilot gains two modes:

- `goal`: continue one supplied Codex goal, as implemented today;
- `portfolio`: create or resume the current repository portfolio and drive all
  eligible candidates autonomously.

No supplied goal starts portfolio mode. A supplied goal continues to start a
single-goal mission unless `--mode portfolio` is explicit.

### `$forgemind-transform`

Transform is the high-level product entry point. It runs portfolio discovery,
selects eligible candidates, creates isolated experiment workstreams, and
continues them under Autopilot. It is for requests such as “make this app
maximally AI-native”, “find every disruptive USP”, or “replace this product's
manual workflows with AI”.

## Portfolio model

`src/portfolio-autopilot.mjs` persists a versioned portfolio below
`.codex-orchestrator/portfolio/`. A record contains:

- repository profile and evidence basis;
- candidate USP cards, each with an interaction replaced, 10x hypothesis,
  moat, target user, metric, guardrails, kill condition, evidence references,
  selected MVP, rollback, and isolation boundary;
- a dependency graph so incompatible candidates cannot mutate the same surface
  concurrently;
- queues for `discover`, `validate`, `build`, `prove`, `scale`, `iterate`,
  `rollback`, `stopped`, and `held`;
- a cross-candidate learning ledger that stores only redacted aggregate
  outcomes.

Candidate generation is deliberately broad: it merges the five radical
interaction-replacement paradigms and ten innovation archetypes, then
deduplicates by target workflow, proposed replacement, and conflict surface.
The result is a maximum opportunity set, not a predetermined numeric quota.

## Execution and isolation

The worker has a configurable `maxConcurrentCandidates`, defaulting to three.
This is a concurrency limit, not an ideation limit: all candidates remain in
the portfolio and are processed in priority order. Before a candidate runs,
the scheduler checks its declared paths, adapters, feature flags, data scope,
and dependencies. Conflicting candidates run serially; independent candidates
may run in parallel.

Every candidate becomes a child Autopilot mission with an isolated action
budget, scoped grant, receipts, checkpoints, rollback declaration, and
evidence requirements. Existing adapter and policy hard stops apply unchanged.
Candidate execution never silently deploys or spends money. Remote mutable
adapters continue to require explicit project configuration, scoped grant, and
policy allowance.

## Autonomous decisions

Autopilot decides without routine questions when it can choose between
reversible alternatives using repository evidence, current policy, test
results, candidate score, and declared budgets. It automatically:

- researches local repository context and configured read-only evidence;
- generates and scores candidates;
- launches eligible, non-conflicting experiments;
- implements the smallest reversible slice;
- runs functional, review, visual, accessibility, risk, and readiness checks;
- repairs bounded failures;
- scales, iterates, rolls back, or stops candidates according to their
  evidence and guardrails;
- creates branches, commits, and PR drafts only through configured adapters.

It holds only at the existing real hard stops, a candidate conflict that cannot
be safely isolated, or an objectively blocked candidate. One held candidate
does not halt unrelated candidates.

## USP quality contract

Every published candidate must answer all of:

1. What recurring user interaction or whole workflow is removed or replaced?
2. What outcome improves by at least an order of magnitude or creates a new
   category of value?
3. Why is AI central rather than cosmetic?
4. What local context, data, workflow, trust, or integration moat compounds?
5. Who receives the value and what measurable behavior proves it?
6. What must be true to continue, and what stops the work?
7. What rollback returns the application to a safe state?

Candidates failing this contract remain visible as insufficient rather than
being built as generic feature ideas.

## CLI and dashboard

The CLI adds:

- `portfolio discover`, `status`, `run`, `resume`, `candidate`, and `stop`;
- `transform run`, `status`, and `resume`;
- `autopilot start --mode portfolio`.

The dashboard adds a Portfolio Control section with candidate state, score,
evidence strength, conflict reason, current worker, active grants, last
receipt, guardrail trend, and stop/rollback reason. It must make missing
customer evidence and assumptions explicit.

## Validation

- Portfolio discovery generates the full deduplicated candidate set for a
  repository and does not mark repository-only inferences as market facts.
- Each candidate includes every USP quality-contract field.
- The scheduler never runs conflicting candidates concurrently and starts at
  most the configured concurrency limit.
- A failed candidate rolls back or stops without blocking unrelated work.
- Candidate child missions preserve existing policy, grant, idempotency, lease,
  receipt, and evidence behavior.
- Readiness reports portfolio mode only after successful reversible evidence;
  production, destructive, cost, migration, and unconfigured remote actions
  remain held.
- Existing single-goal Autopilot and all prior ForgeMind workflows remain
  compatible.
