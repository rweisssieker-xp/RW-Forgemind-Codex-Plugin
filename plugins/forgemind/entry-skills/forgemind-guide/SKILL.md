---
name: forgemind-guide
description: Choose the right ForgeMind journey for an unclear goal. Use when the user needs a simple start, asks what to do next, has an ambiguous request, or wants the system to route between exploration, planning, building, verification, and learning.
---

# Guide

Ask at most one question only when the answer materially changes safety, scope, or the selected journey. Otherwise select the smallest sufficient journey and state its first action, success evidence, and stop boundary.

Route brainstorming, problem framing, design thinking, product story, or a pitch to `$forgemind-spark`. Route an end-to-end product outcome, existing-app transformation, market-to-MVP request, product bet, or product operating cycle to `$forgemind-product`. Route market uncertainty, existing-app innovation, and MVP choice to `$forgemind-explore`. Route radical 10x AI, Vibe Build, disappearing UI, workflow elimination, or autonomous-agent product requests to `$forgemind-radical`. Route a selected outcome or architecture to `$forgemind-plan`. Route a concrete feature, bug, or fast MVP to `$forgemind-build`. Route a request to fully implement, finish, continue until done, or complete an outcome end to end to `$forgemind-complete`. Route review, testing, release, or evidence requests to `$forgemind-verify`. Route feedback and completed-work learning to `$forgemind-learn`.

For a one-prompt product bet, launch `forgemind product launch --goal "<outcome>" --mode guided --json`, then use `product scan`, `product action`, `product measure`, and `product simulate`. This is the continuous Product OS path: repository-aware opportunity scan → measurable action → evidence graph → release decision. Use `--mode yolo` only for a bounded reversible MVP.

For a rapid MVP request, route directly to `$forgemind-build` with YOLO boundaries. For secret, production, destructive, irreversible, externally billed, or high-stakes work, pause at the approval boundary.

Load `playbooks/routing-composition.md` when the route needs an explicit rationale.
