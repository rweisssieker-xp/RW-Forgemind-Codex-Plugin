---
name: project-intelligence
description: ForgeMind project intelligence workflow. Use when the user explicitly asks for project intelligence.
---

# Project Intelligence

Primary journey: **Discover**

Create a working map of the repository before making broad decisions.

## Inspect

- top-level files and folders
- package, project, solution, lock, and config files
- README and docs
- test folders and CI config
- recent git status and changed files
- framework-specific routing, entry points, migrations, and generated output

## Output

Create or update `.codex-orchestrator/project.md` when useful. Keep it concise:

- Stack
- Package manager and runtime
- Known commands
- Architecture map
- Test strategy
- Local conventions
- Risk zones
- Open questions

## Rules

Do not invent commands. Mark commands as inferred unless verified. Prefer existing scripts over generic framework commands.

## Automation

Use `scripts/detect-stack.ps1` to detect stack signals and `scripts/write-project-profile.ps1` to create the profile file. Use `scripts/verify-workspace.ps1 -Run` only after reviewing inferred commands.
