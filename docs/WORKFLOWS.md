# ForgeMind Workflows

## Compass

Use `$forgemind-compass` whenever the start is unclear. It routes to one of the six outcome journeys without expanding a generic skill library.

## Spark: create a disruptive direction

`$forgemind-spark Generate radical AI directions for <outcome>.`

Spark creates five interaction-replacement hypotheses. Each has a metric, kill condition, and next handoff. It does not claim demand without external evidence.

## Evolve: transform an existing app

`$forgemind-evolve Transform this existing application around <outcome>.`

Evolve reads repository structure first, identifies the current workflow, creates radical alternatives, and chooses one reversible thin slice. Follow with Council for a contested decision and Ship for implementation.

## Venture: validate an opportunity

`$forgemind-venture Build a market and business case for <outcome>.`

Venture combines explicit inputs, imported evidence, market chance, conservative/base/upside financial scenarios, and discovery needs. Its output is not an investment forecast.

Venture derives a per-project profile from `package.json`, `README.md`, relevant `docs/forgemind/` records, source and integration signals, and local ForgeMind research, telemetry, and outcomes. It applies to every project domain—not only operations software—and stores the profile at `.codex-orchestrator/project-profile.json`. Each profile field and financial input has an `observed`, `inferred`, `assumption`, or `missing` evidence label. Precedence is: explicit CLI value, structured imported evidence or telemetry, local ForgeMind configuration, then a conservative project-derived assumption. Missing evidence is listed with its effect on validation and scenarios.

Venture also stores `.codex-orchestrator/market-intelligence/latest.json`. It ranks imported sources, maps configured competitors, calculates reachable-account scenarios bottom-up, records buyer and pricing hypotheses, sweeps the most sensitive financial parameters, preserves project-local market memory, and proposes the highest-decision-value experiments. These outputs remain scenarios until supported by cited evidence; they are never market facts or forecasts.

## Council: decide

`$forgemind-council Decide whether to <outcome>.`

Council produces product, customer, technical, risk, and contrarian positions plus dissent, owner, metric, kill condition, and next action.

## Ship: build and prove

`$forgemind-ship Implement and prove <outcome>.`

Ship creates an implementation contract, user-experience state coverage, and verification path. It continues through routine work but pauses for credentials, production access, destructive action, irreversible migration, external spend, or a high-stakes decision.

## Leap: developer automode

`$forgemind-leap Turn this app or idea into a disruptive, tested MVP: <outcome>.`

Leap joins app analysis, radical product selection, market and business-case assumptions, kill conditions, tester expectations, and the Ship handoff. In YOLO mode, its Hero Loop controls the mission through four evidence-gated packets: `implement-thin-slice`, `functional-proof`, `experience-proof`, and `risk-and-release`. It continues routine work autonomously, retries failed packets within its repair budget, and stops only at a defined hard stop, exhausted repair budget, or evidence gate. Use `leap status`, `leap continue`, or `leap advance --packet <id> --outcome passed|failed --evidence <reference>` after an interruption.

## Hero Control: Mission Control for YOLO

`hero run` creates the project-local control record at `.codex-orchestrator/hero/control-latest.json`. It combines the active mission, project profile, feature-flag experiment plan, configured connector contracts, release simulation, and benchmark status. Connector configuration is local in `forgemind.config.json`; supported modes are `manual-import` and explicit future `command-adapter` contracts. No connector is contacted automatically.

`hero execute --run` runs detected local verification commands and generates the project UI-test plan, risk scan, and release-readiness record. It neither writes production code on its own nor deploys, opens a pull request, spends money, or invokes an external API. The active Codex session performs routine implementation under the Hero Loop contract; explicit evidence advances the packet.

Hero Control also writes `.codex-orchestrator/experience-intelligence/latest.json`. It defines the visual-quality gate for every critical UI state, an AI UX Critic, outcome and trust metrics, adaptive role-based disclosure, multimodal intake, project-local confirmed-decision memory, counterfactual comparisons, and self-healing UX experiments. These are evidence contracts, not unsupported GUI-quality claims.

## One-Session MVP Launch compatibility

`launch-mvp` remains an advanced CLI compatibility workflow for a resumable staged launch. It records market/MVP preparation, build, verification, and a tester evidence gate. New sessions should prefer Leap for autonomous discovery or Ship for a selected scope.

## Artifact policy

All commands default to `--artifacts workspace`. Detailed generated state is stored in the target project under `.codex-orchestrator/`; concise reviewed documents are published in the same project under `docs/forgemind/`. `--artifacts local` remains a compatible alias. `--artifacts none` leaves no persistent artifacts. ForgeMind never writes generated state into its installed plugin directory.
