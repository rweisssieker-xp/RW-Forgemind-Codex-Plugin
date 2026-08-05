---
name: outcome-feedback
description: Records opt-in outcome feedback for a completed ForgeMind workflow without raw prompts or source. Use when the user wants to rate whether a workflow helped or record acceptance, corrections, defects, and duration.
---

# Outcome Feedback

Primary journey: **Learn**

Ask only for the minimum optional fields needed to improve routing: accepted result, correction count, residual defects, duration, task category, route, and evidence paths. Never request raw prompts, source code, secrets, identities, or full chat transcripts.

Record feedback with:

```text
forgemind outcome record --task "<summary>" --category <category> --route <route> --accepted <true|false> --corrections <count> --defects <count> --duration <minutes> --evidence <path>
```

Report the stored outcome ID and explain that future routing uses aggregate local outcome effectiveness only.
