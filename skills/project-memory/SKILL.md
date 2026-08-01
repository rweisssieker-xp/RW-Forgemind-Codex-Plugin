---
name: project-memory
description: Create, read, and update ForgeMind project memory for decisions, conventions, preferences, mistakes, patterns, risk zones, verification commands, and USP ideas.
---

# Project Memory

Primary journey: **Learn**

Use project memory for facts that should survive across tasks in the same repository.

## Files

Store memory under `.codex-orchestrator/memory/`:

- `decisions.md`: architecture and product decisions with dates.
- `conventions.md`: coding, testing, UI, and repo conventions.
- `risk-zones.md`: sensitive files, fragile flows, migrations, secrets, production integrations.
- `verification.md`: known-good commands and environment notes.
- `usp-ideas.md`: product, AI, KI, and differentiation ideas.
- `preferences.md`: user and project preferences.
- `mistakes.md`: wrong assumptions, recurring bugs, broken commands, and review findings.
- `self-update-proposals.md`: proposed ForgeMind rule, skill, or template improvements.

Store reusable implementation patterns under `.codex-orchestrator/patterns/`.

## Update Rules

- Record durable facts, not transient task notes.
- Do not store secrets, credentials, private personal data, or tokens.
- Include source context when useful: file, command, user instruction, or observed behavior.
- Keep entries short and dated.

## Memory Pass

Before planning substantial work:

- Read `.codex-orchestrator/project.md` if present.
- Read relevant files in `.codex-orchestrator/memory/` if present.
- Apply existing conventions, decisions, risk zones, and verification notes.

At the end of substantial work, ask:

- Did we discover a project convention?
- Did we choose an architecture or product direction?
- Did we identify a risk zone?
- Did verification reveal a reliable command?
- Did the USP strategist produce reusable ideas?
- Did we make a wrong assumption or repeat a mistake?
- Did the user express a durable preference?
- Did we discover a repeatable implementation pattern?
- Should ForgeMind propose a self-update?

If yes, update the relevant memory file.

## Required In SuperDeveloper Mode

SuperDeveloper, YOLO, implementation planning, and verification workflows should use memory as follows:

1. Read memory before planning.
2. Write memory after durable decisions or discoveries.
3. Never store secrets or sensitive personal data.

## Global Memory

Project memory is local. Global memory may live under `%USERPROFILE%\.codex\forgemind\memory`.

Use global memory only for cross-project preferences and patterns, never project secrets or proprietary details.
