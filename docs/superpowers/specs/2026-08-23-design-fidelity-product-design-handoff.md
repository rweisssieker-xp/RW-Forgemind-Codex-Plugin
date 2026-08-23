# Design Fidelity Product Design Handoff

## Goal

Turn Product Design variants into a controlled Design Fidelity workflow: Product Design creates exactly three visual options; ForgeMind persists them as immutable local proposals; the user explicitly selects one; and only that selected proposal may be implemented and measured.

## Workflow

```text
Product Design ideate
  -> three local PNG proposals + proposal manifest
  -> user selects one proposal ID
  -> immutable selection receipt and Design Fidelity draft
  -> selected visual target is implemented
  -> Design Fidelity measured correction loop
```

Product Design remains responsible for visual ideation. ForgeMind does not generate visual variants or infer a preferred variant. Its responsibility starts when Product Design supplies the three local PNGs and their concise metadata.

## Public contract

Add these `design-fidelity` CLI actions:

- `propose --inputs <png,png,png> --route <local-url> [--viewport desktop|mobile] [--goal <text>]` imports exactly three local PNGs, copies them into the workspace artifact store, hashes each file, and creates a proposal manifest.
- `proposals` returns the current manifest and its selection status.
- `select --proposal <id>` is the only required user decision. It creates an immutable selection receipt and an existing Product Design draft from the selected proposal.
- `apply --proposal <id>` returns the selected draft, control-contract requirements, allowed UI edit extensions, and the exact Design Fidelity run command. It does not use an unselected proposal and does not silently edit product code.

`apply` is a structured handoff to the active coding agent. The existing `$forgemind-design-fidelity` skill performs source edits and the measured correction loop; it must use the draft ID issued by `select`.

## Artifact model

State stays under `.codex-orchestrator/design-fidelity/`:

```text
proposals/<proposal-set-id>/proposal-1.png
proposals/<proposal-set-id>/proposal-2.png
proposals/<proposal-set-id>/proposal-3.png
proposals/<proposal-set-id>/manifest.json
selections/<selection-id>.json
drafts/<draft-id>.png
drafts/<draft-id>.json
```

The manifest includes set ID, goal, route, viewport, three ordered proposal records, SHA-256 hashes, source paths, `status: awaiting-selection | selected`, and no inferred preference. The selection receipt includes the selected proposal ID, proposal-set ID, selection timestamp, draft ID, selected file hash, and `selectedBy: user`.

## Safety and fidelity rules

- Require workspace artifacts; no remote URLs, image URLs, or workspace escapes.
- Require exactly three distinct compatible PNGs; reject duplicate content hashes.
- Selection accepts only a proposal ID present in the current manifest.
- Once selected, the visual source is copied to the existing immutable draft store. Subsequent changes to original PNGs cannot change the source of truth.
- The agent may implement only the selected draft. It must not choose by order, filename, recency, or similarity score.
- During `apply` and the subsequent fidelity loop, observable layout, copy, controls, states, and safe interactions must be preserved. Ambiguities are recorded as assumptions, never redesigned implicitly.
- Existing Design Fidelity rules remain: UI-only edit paths, safe local/test targets, no packages, logins, forms, external browsers, deployments, or production configuration changes.

## Product Design orchestration

Extend the entry skill to direct the agent as follows:

1. Use `@Product Design` ideation to produce exactly three variants.
2. Export or place those selected proposal PNGs in the target workspace.
3. Run `design-fidelity propose`; show proposal IDs and previews to the user.
4. Wait only for `select`; do not ask intake questions that Product Design already resolved.
5. Run `apply` and follow its selected draft contract through the existing measured loop.

The selection is intentionally a hard gate, because a visual preference cannot be safely inferred. All other normal implementation decisions remain autonomous.

## Verification

Tests must cover exact-three validation, PNG/hash deduplication, workspace containment, proposal persistence, rejecting unselected apply, selection receipt immutability, generated draft equivalence, none-mode refusal, CLI action routing, and the entry-skill handoff instructions.
