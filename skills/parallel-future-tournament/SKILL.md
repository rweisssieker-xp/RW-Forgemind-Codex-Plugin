---
name: parallel-future-tournament
description: Compare multiple implementation futures with hard safety gates, weighted outcomes, and a deterministic Pareto frontier. Use when selecting among competing approaches.
---

# Parallel Future Tournament

Primary journey: **Design**

Describe candidates using the same gates and normalized metrics. Disqualify unsafe, unverified, policy-breaking, or under-evidenced futures before scoring.

```text
forgemind forge tournament run --input templates/forge/tournament.example.json
```

Preserve ties and the Pareto frontier. Do not manufacture a winner where the evidence cannot distinguish candidates.
