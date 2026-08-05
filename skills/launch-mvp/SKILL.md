---
name: launch-mvp
description: Drive one idea through market thesis, MVP scope, tester plan, implementation, verification, and a release decision in one Codex session. Use when the user wants to turn an idea or existing app opportunity into a complete, evidence-backed MVP without manually selecting each workflow.
---

# Launch MVP

Primary journey: **Build**

Run `forgemind launch-mvp --goal "<outcome>" --audience "<audience>" --json`, then continue the persisted stages: discover → test → build → verify → release.

Inspect and rank alternatives; select one scoped hypothesis, metric, and kill condition. Use the tester plan, implement the smallest scope, and retain acceptance, verification, risk, traceability, rollback, and delivery-proof evidence. Resume with `forgemind launch-mvp status --json`; complete a stage with `forgemind launch-mvp advance --stage <stage> --evidence "<items>" --json`.

Stop on a kill condition, critical finding, failed verification, or approval gate. `$yolo-feature` may accelerate bounded implementation but never bypasses stops.
