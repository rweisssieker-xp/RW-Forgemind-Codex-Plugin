# ForgeMind Trust Fabric Design

Date: 2026-07-30  
Target release: 1.7.0  
Status: accepted for implementation

## Product category

ForgeMind becomes a local-first trust and outcome layer for autonomous software delivery. Existing commands and six journeys remain compatible. Nine new capabilities share one contract, event, policy, integrity, and storage model under:

```text
forgemind forge <capability> <action>
```

The new capabilities are `trust`, `strategy`, `genome`, `flight`, `tournament`, `shrink`, `loop`, `escrow`, and `federate`.

## Shared invariants

1. Production remains dependency-free Node.js 20+ ESM and cross-platform.
2. Every persisted record has `schemaVersion`, a stable ID, a record-type timestamp, relevant source references, and a canonical SHA-256 digest.
3. Writes are contained within `.codex-orchestrator/forge/` and use atomic replacement or append semantics.
4. Imported content is untrusted, size-bounded, redacted, and never interpreted as executable instructions.
5. No capability runs inferred commands, deploys, deletes, spends money, or releases evidence without explicit policy and proof gates.
6. Human-readable output never upgrades an uncertain result into a completion claim.
7. All nine capabilities work offline. External connectors remain optional adapters.
8. Every non-flight action emits a hash-chained flight event without storing secrets.
9. Existing ForgeMind 1.6 commands and artifacts remain supported.

## Capability contracts

### 1. Agent Trust Protocol

Creates a vendor-neutral delivery contract and normalizes evidence produced by Codex, Claude, Copilot, Cursor, CI, or a custom agent. Evaluation scores acceptance, verification, policy, provenance, and rollback. Missing required evidence, policy violations, invalid digests, or failed verification prevent `trusted` status.

Commands:

```text
forgemind forge trust create --input contract.json
forgemind forge trust import --input agent-evidence.json
forgemind forge trust evaluate --contract <id-or-path> --evidence <id-or-path>
forgemind forge trust verify --input <record>
```

### 2. Strategy-to-Code Compiler

Compiles structured strategy into executable product constraints, acceptance rules, telemetry requirements, agent policy additions, and drift checks. Checking a delivery manifest returns evidence for every satisfied or violated strategy rule.

### 3. Engineering Genome

Aggregates measured outcomes by task category, route, and stack. It reports sample size, success rate, corrections, residual defects, duration, and confidence. Recommendations require a minimum cohort and always expose their supporting outcome IDs locally.

### 4. Delivery Flight Recorder

Maintains an append-only, hash-chained event stream. Verification detects mutation, deletion, reordering, and broken linkage. Replay reconstructs a deterministic timeline and delivery state without re-executing tools.

### 5. Parallel Future Tournament

Evaluates independently produced candidate futures through hard disqualification gates, normalized weighted scoring, and a Pareto frontier. A winner must pass policy and verification; ties and insufficient evidence remain explicit.

### 6. Self-Shrinking Software

Analyzes a supplied capability inventory plus repository package/scripts evidence. It proposes removal candidates only when outcome use is low and preservation checks exist. It never deletes code. Each plan includes expected reduction, protected behavior, validation, rollback, and uncertainty.

### 7. Autonomous Product Loop

Implements the guarded state machine:

```text
signal -> hypothesis -> experiment -> delivery -> measurement -> scale | rollback
```

Transitions require the relevant references. Measurement automatically selects `scale`, `iterate`, or `rollback` from declared success and guardrail metrics, never from prose sentiment.

### 8. Evidence Escrow

Holds no money and performs no financial settlement. It is a local evidence escrow that binds milestones, required approvers, and a trust contract. Release produces a tamper-evident receipt only when contract evaluation, milestone evidence, and approvals pass.

### 9. Privacy-Preserving Learning Network

Exports only k-anonymous aggregate cohorts. Raw prompts, code, paths, project names, user names, evidence IDs, and outcome IDs are excluded. Cohorts below the minimum size are suppressed. Multiple bundles can be integrity-checked and pooled into a benchmark without recovering individual records. This is not claimed as differential privacy.

## Shared storage

```text
.codex-orchestrator/forge/
├── trust/contracts/
├── trust/evidence/
├── trust/attestations/
├── strategies/
├── genome/
├── flights/events.jsonl
├── tournaments/
├── shrink/
├── loops/
├── escrows/
└── federation/
```

## Acceptance criteria

1. Existing 1.6 tests remain green.
2. `forgemind forge help` lists exactly the nine capabilities.
3. Trust records are portable, canonical, digest-verifiable, and reject tampering.
4. Trust evaluation cannot pass missing acceptance, failed verification, policy violations, missing provenance, or rollback requirements.
5. Strategy compilation is deterministic and strategy checking reports rule-level evidence.
6. Genome recommendations change with measured outcomes and expose cohort size and confidence.
7. Flight verification catches payload mutation, deleted middle events, reordering, and predecessor mismatch.
8. Flight replay reconstructs state without executing commands.
9. Tournament hard gates override weighted score, and the Pareto frontier is deterministic.
10. Shrink plans never mutate source and require preservation tests plus rollback for actionable removal candidates.
11. Product-loop invalid transitions are rejected; measurement drives scale/iterate/rollback deterministically.
12. Escrow cannot release without a trusted attestation, all milestone evidence, and all required approvals.
13. Federation suppresses undersized cohorts and output contains no raw input identifiers or statements.
14. Federated bundle tampering is rejected and pooled aggregates are weighted by cohort counts.
15. Every persisted forge action is traceable through a valid flight chain.
16. All output is redacted before persistence.
17. Schemas and skill documentation exist for every public record and capability.
18. The offline dashboard displays status for all nine capabilities with explicit missing states.
19. Standalone and marketplace packages contain all runtime files, schemas, skills, and docs with valid checksums.
20. Generic source and built-plugin validation, full CI, lifecycle integration, and release audit pass.

## Release boundary

Version 1.7.0 is additive and preserves all public 1.6 commands. Cryptographic identity signatures, financial escrow, automatic production actions, hosted federation, and claims of formal differential privacy remain out of scope until separately designed and verified.
