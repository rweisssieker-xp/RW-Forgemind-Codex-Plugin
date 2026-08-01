# ForgeMind Trust Fabric

Trust Fabric is ForgeMind's local, vendor-neutral execution and evidence layer. It turns agent work, strategy, experiments, delivery history, and cross-team learning into sealed records that can be verified independently on Windows, macOS, and Linux.

Start with:

```text
forgemind forge help
```

All records are redacted before persistence, sealed with canonical SHA-256 digests, and stored below `.codex-orchestrator/forge/`. The command surface is `forgemind forge <capability> <action>`. JSON imports are limited to 2 MiB and malformed input returns exit code 2. A blocked, rejected, held, invalid, or no-eligible-candidate result returns exit code 1.

## Nine capabilities

| Capability | Disruptive advantage | Primary actions |
| --- | --- | --- |
| Agent Trust Protocol | Any supported coding agent can deliver against the same contract and hard gates. | `trust create`, `trust import`, `trust evaluate`, `trust verify` |
| Strategy-to-Code Compiler | Strategy becomes executable constraints, telemetry, policy, and drift checks. | `strategy compile`, `strategy check` |
| Engineering Genome | Routing learns from transparent local outcome cohorts, not intuition. | `genome analyze`, `genome recommend` |
| Delivery Flight Recorder | Every Trust Fabric action joins a tamper-evident chain that can be safely replayed. | `flight verify`, `flight replay`, `flight list` |
| Parallel Future Tournament | Competing futures pass hard gates before weighted scoring and Pareto comparison. | `tournament run` |
| Self-Shrinking Software | Low-value complexity becomes a reversible removal experiment, never an automatic deletion. | `shrink analyze` |
| Autonomous Product Loop | Signals progress through hypothesis, experiment, proof, and measurement to scale, iterate, or rollback. | `loop create`, `loop advance`, `loop status` |
| Evidence Escrow | Acceptance stays held until trusted evidence, milestones, and approvals are complete. | `escrow create`, `escrow evaluate`, `escrow release` |
| Federated Learning Network | Teams pool k-anonymous outcome aggregates without sharing prompts, code, paths, identities, or raw outcomes. | `federate export`, `federate aggregate` |

## Trust boundaries

- Imported agent notes are untrusted data and are never executed as instructions.
- Digest sealing detects record changes but is not a cryptographic identity signature.
- Flight replay reconstructs recorded state and never executes recorded commands.
- Shrink creates plans only and never deletes or mutates source.
- Product loops do not deploy or modify production automatically.
- Evidence escrow holds evidence only; it never holds or transfers money.
- Federation uses cohort aggregation with k-suppression. It does not claim formal differential privacy.
- No Trust Fabric feature transmits data by itself. Sharing an export remains an explicit user or team action.

## Team adoption

Commit strategy inputs and reviewed templates when useful, but treat `.codex-orchestrator/forge/` according to the repository's evidence-retention policy. Teams should agree on acceptance evidence types, approval names, budget units, minimum cohort sizes, and rollback expectations before depending on attestations.

The offline Command Center includes one section for each capability. Run `forgemind dashboard` and open `.codex-orchestrator/dashboard/index.html` to inspect the latest local evidence and explicit missing or invalid states.
