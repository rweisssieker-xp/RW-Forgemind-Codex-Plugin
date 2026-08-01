---
name: engineering-genome
description: Learn transparent route recommendations from measured delivery outcomes while suppressing weak cohorts. Use to improve engineering routing with auditable local evidence.
---

# Engineering Genome

Primary journey: **Learn**

Aggregate outcomes by task category, route, and stack. Keep cohort size, success, corrections, residual defects, duration, and contributing outcome IDs visible.

```text
forgemind forge genome analyze --input templates/forge/outcomes.example.json --min-cohort 3
forgemind forge genome recommend --genome <genome-id> --input templates/forge/genome-task.example.json
```

When the minimum cohort is not met, return insufficient evidence and the conservative orchestrator route. Do not invent confidence from a small sample.
