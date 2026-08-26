# ForgeMind Journey Hierarchy

ForgeMind exposes five Marketplace entry points. They are intentionally small: the system chooses and applies the required specialist route internally, while Commands provides a compact discovery layer for deliberate workflow selection.

```text
Compass — default: choose and apply the smallest safe path
Guide   — explain the best next route without executing it
Innovate — explicit AI-central SaaS opportunities and experiments
Commands — discover and deliberately select advanced workflows
Xray    — explicit, read-only quality assessment
```

## Start here

| Journey | Invocation | Best for |
| --- | --- | --- |
| Compass | `$forgemind-compass` | The normal entry point for an idea, existing product, market question, or delivery goal. |
| Guide | `$forgemind-guide` | Understanding the recommended route, confidence, and alternatives before work begins. |
| Innovate | `$forgemind-innovate` | Disruptive AI SaaS USPs, moats, metrics, and safe experiment plans. |
| Commands | `$forgemind-commands` | A compact navigator for Leap, Spark, Venture, Ship, Growth, and other advanced routes. |
| Xray | `$forgemind-xray` | An evidence-backed, read-only QA pass across detected local surfaces. |

Compass is the only implicit route. It classifies the request, records its evidence boundary, and applies the appropriate internal playbook: ideation, product evolution, market validation, decision support, delivery, autonomous MVP work, portfolio discovery, application modelling, UX work, growth experimentation, or autonomous delivery. These playbooks are packaged with ForgeMind but are not Marketplace skills and cannot be invoked as separate `$forgemind-*` entries.

Guide is non-executing. It asks only for enough context to return a route recommendation; incomplete or conflicting input falls back to Compass with visible confidence and alternatives.

Innovate is explicit because it is a deliberate product-strategy exercise. It runs the SaaS AI Opportunity Engine and produces evidence-labelled opportunity cards with tenant-safety and release-cohort guardrails; it does not contact customers or invoke external systems.

Commands is explicit and acts as a menu, not another orchestration route. It makes the advanced internal capabilities discoverable without turning every one of them into a visible Marketplace entry.

Xray remains explicit because it is an independent QA action. It can use safe read-only local GUI evidence when an eligible local or `.test` URL is supplied.

All journeys write generated state to `.codex-orchestrator/` in the target project and concise reviewed records to `docs/forgemind/`. `--artifacts local` remains a compatible alias; use `--artifacts none` for one-shot output without persistence. No generated state is written into the installed plugin.
