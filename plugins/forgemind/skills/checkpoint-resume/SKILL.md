---
name: checkpoint-resume
description: Save or resume a concise, evidence-aware delivery checkpoint. Use when Codex needs to hand off work, switch branches, pause safely, resume a task, or capture decisions and the next action.
---

# Checkpoint Resume

Primary journey: **Learn**

Save a checkpoint before handoff, context loss, or a risky transition:

```text
forgemind checkpoint save --summary "what changed and why" --next "one concrete next action"
forgemind checkpoint resume --id <checkpoint-id>
forgemind checkpoint list
```

The checkpoint captures the local Git status when available; it never changes the repository. Include unresolved risks and evidence paths in the summary.
