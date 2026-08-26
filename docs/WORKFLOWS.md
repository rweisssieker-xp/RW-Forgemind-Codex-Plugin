# ForgeMind Workflows

## Compass: default execution route

Use `$forgemind-compass` for any product, implementation, market, or improvement goal. Compass chooses and applies the smallest safe internal playbook, labels facts, inferences, assumptions, and missing evidence, then reports the next action. It is the only implicit Marketplace skill.

## Guide: choose before executing

Use `$forgemind-guide` when the right route is unclear or when you want an explanation before execution. Guide collects context (`idea`, `project`, or `quality`), outcome (`improve`, `mvp`, or `ship`), and working style (`guided` or `autonomous`), then calls `forgemind guide`. It returns a recommendation, confidence, and alternative route without executing the selected playbook. Missing or conflicting inputs use a low-confidence Compass fallback.

The legacy CLI command `forgemind start` remains a compatibility alias for `forgemind guide`; there is no `$forgemind-start` skill.

## Xray: independent quality evidence

Use `$forgemind-xray` for an evidence-backed, read-only QA pass. With an explicit loopback or `.test` URL, Xray can use the internal Codex Browser for safe, non-destructive local GUI flows and passes workspace-local receipts to its canonical report. Direct CLI use keeps the workspace-local Playwright adapter. Neither path tests production or external URLs, submits forms, logs in, downloads, uploads, or performs consequential actions.

## Internal playbooks and advanced CLI

Compass internally coordinates focused playbooks for ideation, existing-product evolution, market validation, difficult decisions, implementation and release proof, autonomous MVP delivery, autonomous missions, opportunity portfolios, repository modelling, UX experiments, visual-fidelity work, and growth experiments. They are part of the package rather than separate Marketplace entry points, preventing users from having to choose among a long list of overlapping commands.

For scripting and advanced operation, the CLI exposes the corresponding domain commands. All generated work remains project-local under `.codex-orchestrator/`, with concise reviewed records in `docs/forgemind/`. Consequential actions still require the configured policy, adapter, evidence, and rollback boundaries.

### SaaS AI Opportunity Engine

`forgemind innovation saas --goal "<outcome>"` creates a local, ranked set of AI-central SaaS opportunity cards. It covers outcome agents, predictive workflows, multimodal intake, company memory, simulations, and autonomous QA triage. Every card includes the replaced interaction, moat, metric, cohort, feature flag, guardrails, and kill condition.

The report also defines an Activation Map, Churn Radar, Pricing Lab, Feature-to-Revenue Trace, Tenant-Safety Gate, Integration Health plan, and staged release cohorts. Customer demand, churn, pricing, and revenue remain hypotheses unless imported evidence and measured experiments support them. The command does not contact customers, alter billing, read production tenants, or invoke external integrations.

## One-Session MVP Launch compatibility

`launch-mvp` remains an advanced CLI compatibility workflow for a resumable staged launch. It records market/MVP preparation, build, verification, and a tester evidence gate. New sessions should prefer Compass for autonomous discovery and delivery, or the advanced Ship CLI command for a deliberately selected scope.
