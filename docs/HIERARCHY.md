# ForgeMind Journey Hierarchy

ForgeMind exposes four Marketplace entry points. They are intentionally small: the system chooses and applies the required specialist route internally, while the CLI keeps its advanced commands for deliberate automation and debugging.

```text
Compass — default: choose and apply the smallest safe path
Guide   — explain the best next route without executing it
Innovate — explicit AI-central SaaS opportunities and experiments
Xray    — explicit, read-only quality assessment
```

## Start here

| Journey | Invocation | Best for |
| --- | --- | --- |
| Compass | `$forgemind-compass` | The normal entry point for an idea, existing product, market question, or delivery goal. |
| Guide | `$forgemind-guide` | Understanding the recommended route, confidence, and alternatives before work begins. |
| Innovate | `$forgemind-innovate` | Disruptive AI SaaS USPs, moats, metrics, and safe experiment plans. |
| Xray | `$forgemind-xray` | An evidence-backed, read-only QA pass across detected local surfaces. |

Compass is the only implicit route. It classifies the request, records its evidence boundary, and applies the appropriate internal playbook: ideation, product evolution, market validation, decision support, delivery, autonomous MVP work, portfolio discovery, application modelling, UX work, growth experimentation, or autonomous delivery. These playbooks are packaged with ForgeMind but are not Marketplace skills and cannot be invoked as separate `$forgemind-*` entries.

Guide is non-executing. It asks only for enough context to return a route recommendation; incomplete or conflicting input falls back to Compass with visible confidence and alternatives.

Innovate is explicit because it is a deliberate product-strategy exercise. It runs the SaaS AI Opportunity Engine and produces evidence-labelled opportunity cards with tenant-safety and release-cohort guardrails; it does not contact customers or invoke external systems.

Xray remains explicit because it is an independent QA action. It can use safe read-only local GUI evidence when an eligible local or `.test` URL is supplied.

All journeys write generated state to `.codex-orchestrator/` in the target project and concise reviewed records to `docs/forgemind/`. `--artifacts local` remains a compatible alias; use `--artifacts none` for one-shot output without persistence. No generated state is written into the installed plugin.
