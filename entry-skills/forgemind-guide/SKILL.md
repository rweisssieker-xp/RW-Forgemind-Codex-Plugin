---
name: forgemind-guide
description: Choose the right ForgeMind journey for an unclear goal. Use when the user needs a simple start, asks what to do next, has an ambiguous request, or wants the system to route between exploration, planning, building, verification, and learning.
---

# Guide

Ask at most one question only when the answer materially changes safety, scope, or the selected journey. Otherwise select the smallest sufficient journey and state its first action, success evidence, and stop boundary.

Route autonomous disruptive delivery to `$forgemind-leap`; multi-perspective decisions to `$forgemind-council`; market, competition, pricing, and business-case work to `$forgemind-venture`; epics, stories, sprints, and retrospectives to `$forgemind-portfolio`; and proof-carrying demos or pitches to `$forgemind-showcase`. Route brainstorming to `$forgemind-spark`, product bets to `$forgemind-product`, radical workflow replacement to `$forgemind-radical`, concrete delivery to `$forgemind-build`, and end-to-end completion to `$forgemind-complete`.

Route opportunity research to `$forgemind-explore`, scope and architecture to `$forgemind-plan`, quality and release proof to `$forgemind-verify`, and outcome feedback to `$forgemind-learn`.

For a one-prompt product bet, launch `forgemind product launch --goal "<outcome>" --mode guided --json`, then use `product scan`, `product action`, `product measure`, and `product simulate`. This is the continuous Product OS path: repository-aware opportunity scan → measurable action → evidence graph → release decision. Use `--mode yolo` only for a bounded reversible MVP.

For a rapid MVP request, route directly to `$forgemind-build` with YOLO boundaries. For secret, production, destructive, irreversible, externally billed, or high-stakes work, pause at the approval boundary.

Load `playbooks/routing-composition.md` when the route needs an explicit rationale.
