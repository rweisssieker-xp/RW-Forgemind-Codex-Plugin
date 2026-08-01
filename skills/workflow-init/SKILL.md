---
name: workflow-init
description: Initialize a governed ForgeMind project workflow. Use when the user asks to start, initialize, set up, onboard, or prepare a project workflow, project profile, memory, verification baseline, or journey state.
---

# Workflow Init

Primary journey: **Discover**

Initialize ForgeMind for the current project.

## Steps

1. Inspect repo structure and project files.
2. Run or emulate `scripts/write-project-profile.ps1 -WithMemory -WithArtifacts`.
3. Identify likely test/build/lint commands.
4. Create or update `.codex-orchestrator/workflow-status.md`:
   - phase
   - current goal
   - selected mode
   - known commands
   - open risks
   - next action
5. Recommend the first workflow command.

## Output

- project type
- detected stack
- initialized memory files
- initialized artifacts:
  - `docs/forgemind/prd.md`
  - `docs/forgemind/epics.md`
  - `docs/forgemind/stories/`
  - `docs/forgemind/acceptance/`
  - `.codex-orchestrator/workflow-status.md`
- verification baseline
- suggested next command
