# Changelog

## 1.36.0

- Added the evidence-to-action Market Engine to Venture: ranked research, competitor mapping, bottom-up market sizing, willingness-to-pay and buyer hypotheses, regional boundaries, sensitivity sweeps, market memory, and decision-value experiments.

## 1.35.0

- Added Hero Control, a project-local YOLO mission control record that connects work packets, feature-flag experiments, connector contracts, release gates, and benchmark status without silent external side effects.
- Added configured project-profile overrides and Hero Control visibility in the local dashboard.

## 1.34.0

- Added the YOLO Hero Loop: ordered, evidence-gated autonomous work packets with real-evidence requirements, bounded repair retries, resumable progress, and hard-stop escalation.

## 1.33.2

- Added the missing portable `compass run` CLI endpoint and documented the bundled runner so Marketplace users never need a global `forgemind` command.

## 1.33.1

- Extended Venture profiling beyond operations projects with commerce and learning product models; all domains continue to fall back to repository-specific, evidence-labelled hypotheses rather than market facts.

## 1.33.0

- Made generated ForgeMind state project-local by default at `.codex-orchestrator/`; `--artifacts local` is now a compatible alias for `workspace`, and the installed plugin is never used for output state.
- Added an isolated, evidence-labelled project profile for Venture and all primary journeys, using repository, ForgeMind research, telemetry, outcomes, and local configuration signals.
- Made Venture pricing, accounts, sales cycle, CAC, churn, build/run cost, go-to-market, and validation hypotheses project-specific with explicit source labels and evidence gaps.

## [1.32.1] - 2026-08-10

- Strengthened the automatic trigger descriptions for Compass, Evolve, and Ship without changing journey behavior.
- Retained the compact, conditionally loaded zero-input defaults; static package-size estimates are now distinguished from actual loaded skill context.

## [1.32.0] - 2026-08-10

- Added full zero-input defaults for every primary journey. Bare skill calls now derive and state a project-aware goal; explicit user intent always takes precedence.
- Made CLI journeys and Leap accept missing `--goal` values and record `goalSource: zero-input-default` for auditable autonomous starts.

## [1.31.0] - 2026-08-10

- Replaced the broad visible surface with seven outcome-oriented entry points: Compass, Spark, Evolve, Venture, Council, Ship, and Leap.
- Made Spark, Evolve, Venture, Council, Ship, and Leap executable, artifact-aware CLI workflows rather than instruction-only entries.
- Established Leap as the developer automode and Ship as the explicit delivery, testing, and release entry point.
- Updated US English documentation and kept generated working state external by default.

## [1.30.0] - 2026-08-10

- Added Council, Venture, Portfolio, and Showcase as focused ForgeMind entry points for decision rounds, market cases, delivery portfolios, and proof-carrying narratives.

## [1.29.0] - 2026-08-09

- Added Leap `status` and `continue`, explicit autonomy envelopes, tester-panel and UX-baseline contracts, and Marketplace cache freshness diagnostics.

## [1.28.0] - 2026-08-09

- Added `$forgemind-leap`, the autonomous disruption journey for turning a new idea or existing app into five radical options, an assumption-labelled market chance and business case, a selected reversible MVP, tested delivery contract, and release-ready proof.
- Added `forgemind leap run --goal "<outcome>" --mode yolo|guided --json`, with a contrarian alternative, kill condition, commercial wedge, shadow-mode plan, and strict hard-stop boundaries.

## [1.27.0] - 2026-08-09

- Added `$forgemind-spark`, a visible creative-intelligence entry point for structured brainstorming, problem solving, design thinking, product narratives, and decision-ready pitches.
- Added App Intelligence for bounded existing-application scans and Evidence Engine commands for traceable external evidence imports and gap assessment.
- Made every JSON response report its resolved artifact mode and path, and extended Distribution Doctor with installation diagnostics.
- Published the complete Marketplace snapshot from the validated source package so GitHub installs include all ten ForgeMind journeys, including Spark.

## [1.26.0] - 2026-08-08

- Published concise, reviewable project decision records automatically: market opportunity, financial model, and product bet now live under `docs/forgemind/` in the app project.
- Kept detailed machine-readable state in the external artifact cache by default; `--artifacts none` now guarantees that neither cache state nor project decision documents persist.

## [1.25.0] - 2026-08-08

- Added `$forgemind-product` as the ninth visible Marketplace journey for the continuous Product OS workflow.
- Documented and embedded the portable plugin-runner fallback so a missing global `forgemind` shell command no longer blocks installed-plugin use.

## [1.24.0] - 2026-08-08

- Added Product OS: resumable run manifests, autonomous repository-aware scans, closed-loop actions, evidence graphs, release simulation, and benchmark checks.
- Centralized artifact redirection so legacy artifact paths also respect `--artifacts local`, `workspace`, `none`, and `--artifact-dir`.
- Added Product OS guidance to Guide and Explore, plus regression coverage for clean, resumable product operations.

## [1.23.0] - 2026-08-07

- Made external, project-stable local artifact storage the default for ForgeMind CLI workflows.
- Added `--artifacts local|workspace|none` and `--artifact-dir <absolute-path>`; JSON responses now report `artifactMode` and `artifactPath`.
- Updated Radical, finance, experience, signals, innovation, and AI-native workflows to resume from the same clean external artifact root.

## [1.22.0] - 2026-08-07

- Added the AI-Native Execution Layer: Outcome Operator contracts, privacy-minimized workflow observation, experiment autopilot, provider governance registry, AI-native refactor portfolio, customer truth loop, autonomy readiness, and proof-carrying demos.

## [1.21.0] - 2026-08-07

- Promoted Radical to the explicit `$forgemind-radical` Marketplace entry point for direct 10x AI, Vibe Build, workflow-elimination, and autonomous-agent product requests.

## [1.20.1] - 2026-08-07

- Corrected the compact-playbook contract for the new Radical Product Engine playbook.

## [1.20.0] - 2026-08-07

- Added the internal Radical Product Engine to Explore: five AI-central workflow-replacement paradigms, explicit 10x hypotheses, moats, MVP blueprints, kill conditions, and an autonomy ladder from observation through bounded autopilot.
- Added `forgemind radical analyze`, `select`, `blueprint`, and `shadow-mode` with local, evidence-labelled artifacts and safety boundaries.

## [1.19.1] - 2026-08-07

- Reduced always-loaded Marketplace context by making Guide the single implicit entry point; it continues to route natural-language requests to all six specialist journeys.
- Focused Marketplace metadata and starter prompts on the core value proposition while retaining the complete feature set, CLI, docs, YOLO mode, and end-to-end Complete journey.
- Improved the static Plugin Eval score from 82 to 86 by reducing trigger cost from 319 to 91 tokens and normal invocation cost from 3,082 to 656 tokens.

## [1.19.0] - 2026-08-07

- Added the visible `forgemind-complete` journey for autonomous end-to-end delivery: a persistent Definition of Done, safe continuation loop, explicit evidence-gap handling, and a narrow high-risk pause boundary.
- Updated Guide, README, hierarchy, workflows, structural evaluations, and runtime coverage for the seven-journey surface.

## [1.18.1] - 2026-08-07

- Adopted Aivana GmbH as ForgeMind's published provider, including the Aivana website, public policy links, positioning, and authorized Aivana logo asset.
- Completed the README start surface with direct telemetry and GUI-test entry points.

## [1.18.0] - 2026-08-07

- Added Evidence-Connected Product Operations: cited research imports, conservative/base/upside financial scenarios with CAC, churn, sales cycle, product telemetry, a continuous discovery loop, and an evidence-labelled portfolio cockpit.
- Added portable GUI test orchestration: stack-aware test planning, persisted real command results, perceptual-regression report intake, and staged reviewer-only test repairs.
- Extended Explore, Build, Verify, the quality playbook, and workflow documentation with the new evidence and safety boundaries.

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning.

## [Unreleased]

## [1.17.6] - 2026-08-06

### Added

- Added the Experience & Opportunity Lab: market chance scoring, transparent business cases, UX failure forecasting, counterfactual flow tournaments, task-time targets, state-matrix evidence, design-system drift detection, review-only test repair proposals, and trustworthy demo storyboards.
- Made Explore require an assumption-labelled market chance and business case for material product bets; Build and Verify now retain the selected experience and its GUI evidence.

## [1.17.5] - 2026-08-06

### Added

- Added an Experience Evidence Loop to Explore, Build, and Verify: decisive user tasks, state coverage, accessibility semantics, browser behavior, visual comparisons, responsive rendering, and recovery paths now produce explicit GUI quality evidence.

## [1.17.4] - 2026-08-06

### Fixed

- Replaced Marketplace-facing legacy entry points with the six current journeys and clarified that PowerShell wrappers are source-maintainer tools.
- Added release-workflow regression assertions for hidden Marketplace metadata, repository context, and downloadable Core and Marketplace archives.
- Removed an unused Command Center image from the Core and Marketplace payloads.

### Added

- Added an LCOV coverage command and a versioned Plugin Eval benchmark configuration for measurable quality and efficiency improvements.

## [1.17.3] - 2026-08-05

### Fixed

- Restored repository context in the release publishing job so GitHub can create the tagged release after verified artifacts download.

## [1.17.2] - 2026-08-05

### Fixed

- Made release artifacts retain hidden Marketplace metadata and publish downloadable Core and Marketplace archives for every version tag.
- Retried transient Windows file locks during atomic evidence writes and updated the release smoke test to the current CLI.

## [1.17.1] - 2026-08-05

### Fixed

- Trimmed the direct GitHub Core runtime, corrected all six Marketplace trigger descriptions, and limited the manifest to three supported starter prompts.
- Rewrote installation and runtime verification documentation for the six-journey structure and current CLI commands.

## [1.17.0] - 2026-08-05

### Changed

- Replaced 83 source and 74 Marketplace specialist-skill directories with six journey skills and twelve compact internal playbooks.
- Consolidated product discovery, planning, delivery, YOLO, verification, learning, and Trust Fabric guidance without removing executable CLI capabilities.
- Reduced the optional Trust Fabric add-on to one explicit entry skill backed by its executable capability surface.

## [1.16.0] - 2026-08-05

### Changed

- Consolidated the Marketplace skill surface into six hierarchical journeys: Guide, Explore, Plan, Build, Verify, and Learn.
- Preserved the existing specialist workflows as progressively loaded internal modules, so capability depth remains available without an overwhelming skill list.

## [1.15.0] - 2026-08-05

### Added

- Added `forgemind innovation portfolio`, a persisted, project-aware portfolio of ten differentiated product bets with evidence basis, moat, monetization, MVP experiment, and kill condition.

### Changed

- Expanded the innovation and USP workflows from idea scoring to developer-focused portfolio strategy for existing and new apps.

## [1.14.3] - 2026-08-05

### Changed

- Completed US English documentation for the resumable MVP launch, tester evidence loop, lean GitHub runtime snapshot, runtime checks, and release evidence.

## [1.14.2] - 2026-08-05

### Added

- Added evidence-gated MVP launch transitions and persisted tester-result decisions across `collecting`, `scale`, `iterate`, and `stop`.

### Changed

- Reduced the direct GitHub Marketplace payload to runtime capabilities; release archives retain packaging and lifecycle tooling.
- Compacted the MVP skills and restored an A-grade Marketplace evaluation.

## [1.14.1] - 2026-08-05

### Added

- Added resumable `launch-mvp status` and evidence-gated `launch-mvp advance` transitions.
- Added tester-result recording and deterministic `collecting`, `scale`, `iterate`, or `stop` decisions.

### Changed

- Compacted MVP workflow instructions to reduce Marketplace payload cost without reducing the workflow surface.

## [1.14.0] - 2026-08-05

### Added

- Added `launch-mvp`, an explicit one-session entry that persists the market/MVP brief and tester plan, then governs build, verification, and a Go/No-Go release decision with hard stop conditions.

## [1.13.0] - 2026-08-05

### Added

- Added MVP Test Lab: a privacy-conscious tester plan that combines target-user, functional, accessibility, and adversarial perspectives with explicit scale, iterate, or stop rules.
- Added the `forgemind testing plan` command and integrated test planning into opportunity-to-MVP routing.

### Changed

- Expanded the Marketplace positioning around market-tested MVPs, existing-app innovation, kill conditions, evidence-first delivery, and guarded fast MVP execution.

## [1.12.2] - 2026-08-05

### Changed

- Reduced the automatically loaded Marketplace entry text while retaining the three task-oriented front doors.
- Made the GitHub Marketplace snapshots leaner by excluding redundant checksum inventories; generated release archives remain integrity-checked.

## [1.12.1] - 2026-08-05

### Fixed

- Added versioned Core and Trust Fabric Marketplace payloads under `plugins/` and changed the repository catalog to the required `./plugins/<plugin-name>` paths for direct GitHub installation.

## [1.12.0] - 2026-08-05

### Changed

- Simplified ForgeMind to three visible front doors: Explore for opportunity-to-MVP work, Build for concrete delivery, and Guide me for unclear goals.
- Moved routing, guided start, and delivery orchestration behind those entry points; explicit YOLO remains available for fast bounded MVPs.

## [1.11.1] - 2026-08-05

### Added

- Idea-to-MVP entry workflow that captures existing-app context and guides opportunity research, disruptive ideation, measurable MVP selection, implementation, and verification.

### Changed

- Delivery Orchestrator and YOLO mode now apply a compact Idea-to-MVP preflight for product, market, innovation, and existing-app evolution work while preserving immediate execution for narrow scoped changes.

## [1.11.0] - 2026-08-05

### Added

- Discovery scorecards that rank evidence, assumptions, interview signals, and execution readiness with a clear next-experiment recommendation.
- Browser screenshot capture when Playwright is available, byte-identity visual comparison, capability manifests, role composition, bounded delegation plans, and workspace-local skill scaffolding.
- Root Marketplace metadata for direct GitHub Marketplace registration, plus UI metadata for all implicit entry workflows.

### Changed

- Replaced personified role labels and template-like workflow naming with functional ForgeMind workflow names.
- Clarified Marketplace positioning around scored discovery, local visual evidence, safe YOLO MVP delivery, and release proof.

## [1.10.0] - 2026-08-05

### Added

- Discovery Operations with persistent, evidence-linked hypotheses and explicit pivot, patch, persevere, or stop decisions.
- Checkpoint Resume for safe handoffs with local Git-state context and an explicit next action.
- Visual QA evidence records that seal local screenshot metadata and SHA-256 digests without uploads or unverified pixel-diff claims.

## [1.9.0] - 2026-08-05

### Added

- Native Creative Intelligence workflows for ideation, human-centered design, systems diagnosis, lateral solutions, opportunity design, product narrative, and presentation architecture.
- Innovation Delivery Lab for outcome contracts, counterfactual delivery choices, change budgets, proof-carrying PR evidence, expiring knowledge, and privacy-preserving team learning.

### Changed

- Made explicit YOLO and fast-MVP requests select the rapid build workflow automatically while preserving destructive, credential, cost, and production safeguards.

## [1.8.1] - 2026-08-05

### Changed

- Slimmed the installed Core package to runtime files, removing development documentation, benchmark fixtures, release helpers, and duplicate repository metadata from Marketplace artifacts.
- Added regression coverage that prevents development-only root directories and files from returning to installable packages.

## [1.8.0] - 2026-08-03

### Changed

- Replaced historical third-party framework positioning with ForgeMind-native journey, artifact, orchestration, and benchmark terminology.
- Renamed Delivery Acceleration Mode and removed legacy framework-like naming from skills, prompts, documentation, and metadata.
- Made specialist skills explicit-only while keeping the router and autonomous workflow available for automatic selection, reducing active skill context.
- Added a repeatable ForgeMind benchmark configuration for release validation, trust verification, and destructive-action boundaries.
- Removed the marketplace screenshot because ForgeMind does not ship an embedded plugin UI.
- Clarified the Marketplace positioning around evidence-first delivery, safe autonomy, cost-aware routing, reproducible collaboration, and privacy-preserving team learning.
- Added budget-enforced route fallback, guided entry paths, opt-in outcome feedback, and a Core plus optional Trust Fabric marketplace package split.

## [1.7.0] - 2026-07-30

### Added

- ForgeMind Trust Fabric with nine integrated capabilities: Agent Trust Protocol, Strategy-to-Code Compiler, Engineering Genome, Delivery Flight Recorder, Parallel Future Tournament, Self-Shrinking Software, Autonomous Product Loop, Evidence Escrow, and Federated Learning Network.
- Canonically sealed and redacted Forge records, hash-linked flight events, public JSON schemas, portable templates, CLI actions, and nineteen-section offline dashboard.
- Hard-gated trust, strategy drift checks, cohort suppression, deterministic Pareto selection, evidence-only escrow receipts, and measured scale/iterate/rollback decisions.

### Security

- Imported agent content remains untrusted data; oversized or malformed JSON is rejected.
- Federation explicitly excludes raw identifying and source fields and makes no differential-privacy claim.
- Shrink is plan-only, replay is non-executing, and evidence escrow cannot hold funds.

## [1.6.0] - 2026-07-30

### Added

- Portable Node.js CLI for Windows, macOS, and Linux.
- Governed team and personal memory with provenance, expiry, conflict reporting, and secret rejection.
- Proof-carrying delivery evidence, offline command center, explainable routing, product signal ingestion, and reproducible packages.
- Six primary journeys: Discover, Design, Build, Verify, Release, and Learn.

### Changed

- PowerShell scripts are compatibility launchers for the portable CLI.
- Release, support, privacy, security, and community documentation now support internal and public distribution.

## [1.5.0] - 2026-07-30

### Added

- ForgeMind skill collection, personas, prompts, dashboard, workflow artifacts, and PowerShell automation baseline.
