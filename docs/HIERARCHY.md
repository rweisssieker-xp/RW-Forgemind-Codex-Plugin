# ForgeMind Journey Hierarchy

ForgeMind has sixteen Marketplace entry points. Ten are recommended starting journeys; six are focused extensions normally reached through Compass or a parent journey. Supporting CLI commands remain available to advanced users.

```text
Start — choose the next ForgeMind action
Compass — choose the smallest safe path
├── Spark   — generate disruptive directions
├── Evolve  — transform an existing app
├── Venture — establish market opportunity and business case
├── Council — make a difficult, evidence-labelled decision
├── Ship    — implement, test, and release a bounded outcome
├── Leap    — developer automode: idea or app to disruptive MVP
├── Xray    — autonomous, read-only quality QA
└── Autopilot — goal-driven autonomous delivery
    ├── Portfolio — discover all AI-native USP candidates
    ├── Transform — run isolated disruptive MVP experiments
    ├── Twin — model the repository application
    ├── Evolve UI — stage outcome-first UX experiments
    └── Growth — create evidence-labelled growth loops
```

## Start here

| Journey | Invocation | Best for |
| --- | --- | --- |
| Start | `$forgemind-start` | Turning an idea, project, or quality concern into one explained next action. |
| Compass | `$forgemind-compass` | Choosing a path for an unclear outcome. |
| Spark | `$forgemind-spark` | Radical ideation, story, pitch, and creative direction. |
| Evolve | `$forgemind-evolve` | Making an existing application materially more valuable through AI. |
| Venture | `$forgemind-venture` | Market chance, USP, competition, pricing, and business case. |
| Council | `$forgemind-council` | A decision that needs product, customer, technical, risk, and contrarian views. |
| Ship | `$forgemind-ship` | Bounded implementation, GUI/testing expectations, and release readiness. |
| Leap | `$forgemind-leap` | Autonomous developer delivery without routine questions. |
| Xray | `$forgemind-xray` | Evidence-backed, read-only QA across detected local surfaces. |
| Autopilot | `$forgemind-autopilot` | Persistent Codex-goal delivery with scoped adapters and recovery. |
| Portfolio *(extension)* | `$forgemind-portfolio` | Discover and prioritize every evidence-labelled AI-native USP. |
| Transform *(extension)* | `$forgemind-transform` | Transform the repository through autonomous reversible experiments. |
| Twin *(extension)* | `$forgemind-twin` | Build a repository-derived application model and show knowledge gaps. |
| Evolve UI *(extension)* | `$forgemind-evolve-ui` | Plan a reversible UX experiment with functional, visual, accessibility, and rollback gates. |
| Design Fidelity *(extension)* | `$forgemind-design-fidelity` | Match local UI implementation to PNG references with measured correction loops. |
| Growth *(extension)* | `$forgemind-growth` | Plan bounded activation, retention, monetization, and value-proof experiments. |

Leap is the automode. It continues through ordinary design and engineering decisions, but stops for credentials, production access, data deletion, irreversible migration, external spend, and high-stakes decisions.

Start asks only for context, desired outcome, and working style. It recommends—but does not execute—the appropriate journey; incomplete or conflicting input falls back to Compass with a visible confidence level and alternative route.

Autopilot is the persistent goal-driven mode. It advances only with policy- and grant-authorized adapters, records previews, receipts, rollback declarations, and checkpoints, and holds at the same consequential boundaries.

Every journey writes detailed generated state to `.codex-orchestrator/` in the target project and publishes concise reviewed records to `docs/forgemind/` in that same project. `--artifacts local` remains a compatible alias; use `--artifacts none` for one-shot output without persistence. No generated state is written into the installed plugin.
