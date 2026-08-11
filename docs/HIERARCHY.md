# ForgeMind Journey Hierarchy

ForgeMind has seven primary entry points. They are the complete Marketplace surface; supporting commands are called by the relevant journey and remain available to advanced users.

```text
Compass — choose the smallest safe path
├── Spark   — generate disruptive directions
├── Evolve  — transform an existing app
├── Venture — establish market opportunity and business case
├── Council — make a difficult, evidence-labelled decision
├── Ship    — implement, test, and release a bounded outcome
└── Leap    — developer automode: idea or app to disruptive MVP
```

## Start here

| Journey | Invocation | Best for |
| --- | --- | --- |
| Compass | `$forgemind-compass` | Choosing a path for an unclear outcome. |
| Spark | `$forgemind-spark` | Radical ideation, story, pitch, and creative direction. |
| Evolve | `$forgemind-evolve` | Making an existing application materially more valuable through AI. |
| Venture | `$forgemind-venture` | Market chance, USP, competition, pricing, and business case. |
| Council | `$forgemind-council` | A decision that needs product, customer, technical, risk, and contrarian views. |
| Ship | `$forgemind-ship` | Bounded implementation, GUI/testing expectations, and release readiness. |
| Leap | `$forgemind-leap` | Autonomous developer delivery without routine questions. |

Leap is the automode. It continues through ordinary design and engineering decisions, but stops for credentials, production access, data deletion, irreversible migration, external spend, and high-stakes decisions.

Every journey writes detailed generated state to `.codex-orchestrator/` in the target project and publishes concise reviewed records to `docs/forgemind/` in that same project. `--artifacts local` remains a compatible alias; use `--artifacts none` for one-shot output without persistence. No generated state is written into the installed plugin.
