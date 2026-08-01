---
name: workflow-status
description: Report governed ForgeMind workflow status. Use when the user asks for current status, phase, progress, next action, blockers, selected skill, current mode, or journey status.
---

# Workflow Status

Primary journey: **Discover**

Report where the work stands.

## Check

- `.codex-orchestrator/workflow-status.md` when present
- current task
- selected workflow or skill
- autonomy level
- completed steps
- pending steps
- verification status
- blockers
- risk escalation
- memory/learning updates
- next action

## Output

Use concise status:

- Phase:
- Mode:
- Active skill:
- Done:
- Next:
- Blockers:
- Verification:
- Risks:

After reporting, update `.codex-orchestrator/workflow-status.md` when project files are writable.
