# Product Design Draft Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import an explicitly selected local Product Design PNG as an immutable Design Fidelity draft.

**Architecture:** A draft module validates, digests and copies the selected PNG into the project artifact store. The CLI exposes `design-fidelity import-draft`; runs resolve only a saved draft ID, never a generated-image order.

**Tech Stack:** Node.js ESM, native `node:test`, ForgeMind artifact store.

**Spec:** `docs/superpowers/specs/2026-08-20-product-design-draft-handoff-design.md`

## Global Constraints

- Require an explicit local PNG and safe local/test route.
- Reject URLs, ordinals, path escapes, non-PNG inputs, and artifact mode `none`.
- Store draft metadata and immutable PNG only under `.codex-orchestrator/design-fidelity/drafts/`.
- Mirror source runtime and skill files under `plugins/forgemind/`.

### Task 1: Draft importer

**Files:** Create `src/design-fidelity-drafts.mjs`, `tests/design-fidelity-drafts.test.mjs`, and Marketplace mirror.

- [ ] Write failing tests for a selected local PNG producing `draft-<sha-prefix>`, and invalid URL/non-PNG input throwing `FM_DESIGN_FIDELITY_DRAFT_INVALID`.
- [ ] Run `node --test tests/design-fidelity-drafts.test.mjs`; expect failure.
- [ ] Implement `importProductDesignDraft({ workspace, input, route, viewport })` and `loadProductDesignDraft({ workspace, draftId })` using containment checks, SHA-256, `copyFile`, `artifactStatePath`, and `writeJsonAtomic`.
- [ ] Run the test again; expect pass.
- [ ] Mirror and commit `feat: import selected Product Design drafts`.

### Task 2: CLI and run resolution

**Files:** Modify `src/cli.mjs`, `src/design-fidelity.mjs`, Design Fidelity skill, relevant tests, and mirrors.

- [ ] Write failing CLI test for `design-fidelity import-draft --input selected.png --route <local-url>`.
- [ ] Run `node --test tests/cli.test.mjs`; expect failure.
- [ ] Dispatch `import-draft` to Task 1 and make `runDesignFidelity({ draftId })` load only the immutable draft reference, route and viewport; unknown drafts return `FM_DESIGN_FIDELITY_DRAFT_NOT_FOUND`.
- [ ] Require in the skill that the user selects and attaches the concrete Product Design PNG; prohibit most-recent, ordinal, or inferred selection.
- [ ] Run `node --test tests/cli.test.mjs tests/design-fidelity.test.mjs tests/journey-surface.test.mjs`; expect pass.
- [ ] Mirror and commit `feat: hand off selected Product Design drafts`.

### Task 3: Release verification

- [ ] Update source and Marketplace manifests, lockfile and package-test expectation to `1.46.0`; add changelog entry.
- [ ] Run `npm run ci`; expect pass.
- [ ] Commit `release: ForgeMind 1.46.0`.
