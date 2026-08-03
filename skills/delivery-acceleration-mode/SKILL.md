---
name: delivery-acceleration-mode
description: ForgeMind delivery-acceleration mode workflow. Use when the user explicitly asks for delivery-acceleration mode.
---

# Delivery Acceleration Mode

Primary journey: **Build**

Shared orchestration precedence: safety -> debugging -> discovery -> product/USP -> implementation -> verification -> learning.

Use this when the user wants Codex to act like a senior autonomous developer.

## Pipeline

1. Project Intelligence: understand repo and commands.
2. Memory Read: load project profile, decisions, conventions, risks, verification notes, and USP ideas if present.
3. Product/USP Pass: identify value and AI leverage when user-facing.
4. Architecture Pass: choose boundaries and risks.
5. Implementation Plan: make tasks executable.
6. Build: implement narrowly.
7. Verify: tests, build, lint, typecheck, UI checks as relevant.
8. Review: inspect diff for bugs and missing tests.
9. Dashboard/Report: generate or update reports when useful.
10. Learning Loop: capture mistakes, preferences, patterns, and self-update proposals.
11. Memory Write: record durable lessons when useful.

## Modes

- safe: read, analyze, plan only.
- normal: implement bounded changes.
- yolo: implement end to end with guardrails.
- surgery: broad refactors, migrations, or irreversible operations; requires explicit approval.

## Decision Standard

Optimize for useful shipped software, not maximal cleverness. AI features must earn their place by improving speed, quality, confidence, revenue, or user retention.
