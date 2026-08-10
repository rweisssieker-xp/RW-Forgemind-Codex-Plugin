# ForgeMind

ForgeMind is an evidence-first product innovation and delivery plugin for Codex, published by [Aivana GmbH](https://aivana-gmbh.ai/). It turns ideas and existing applications into disruptive, market-aware, testable MVPs while keeping a clear boundary between facts, assumptions, and release proof.

## The seven starting points

| Start | Prompt | Result |
| --- | --- | --- |
| Compass | `$forgemind-compass Help me choose the right path for …` | The smallest safe journey. |
| Spark | `$forgemind-spark Generate disruptive AI directions for …` | Five radical, measurable directions. |
| Evolve | `$forgemind-evolve Transform this existing app around …` | Repository-aware product transformation and MVP bet. |
| Venture | `$forgemind-venture Validate the market chance and business case for …` | Evidence-labelled market, USP, and financial scenarios. |
| Council | `$forgemind-council Decide whether we should …` | One decision with visible dissent, metric, and kill condition. |
| Ship | `$forgemind-ship Implement and prove …` | Delivery contract, UX test surface, and release path. |
| Leap | `$forgemind-leap Autonomously turn this app or idea into a disruptive MVP: …` | Developer automode from idea/app to bounded MVP. |

## Developer automode

Use **Leap** for fast autonomous MVP work:

```text
$forgemind-leap Analyze this existing app, select the strongest disruptive AI opportunity, and implement the tested, reversible MVP autonomously. Do not ask routine questions; pause only for safety, production, legal, or cost decisions.
```

Leap analyzes the repository, creates radical alternatives, calculates an evidence-labelled opportunity and business case, selects a reversible bet with a kill condition, and hands delivery to the completion path. It never claims that an assumption is market evidence.

## What makes it different

- **Disruption before feature lists:** AI must eliminate or replace a user interaction, not merely decorate it.
- **Existing-app first:** product bets start from the actual repository and its constraints.
- **Market and business case:** market chance, sources, financial scenarios, sensitivity, and validation needs are explicit.
- **Kill conditions:** every material bet has a measurable reason to stop.
- **Fast with guardrails:** YOLO-style delivery continues autonomously until a genuine hard stop.
- **Evidence-native:** decisions, tests, risks, dissent, and release claims are visibly separated from assumptions.
- **Clean distribution:** normal use never writes generated state into the installed plugin.

## Clean artifact storage

By default, generated ForgeMind state goes to:

```text
~/.cache/forgemind/workspaces/<stable-project-id>/.codex-orchestrator/
```

The target app remains the source for inspection, implementation, tests, and signals. Durable, human-readable decisions are written only to `docs/forgemind/` in that target app. Nothing is written to the installed plugin directory.

- `--artifacts local` is the default.
- `--artifacts workspace` opts into repository-local generated state.
- `--artifacts none` returns one-shot JSON without persistence.
- `--artifact-dir <absolute-path>` selects an explicit external artifact root.

Every JSON response includes `artifactMode` and absolute `artifactPath`.

## Portable CLI

Marketplace installation makes the skills available in Codex; it does not require a global shell command. The portable runner is:

```text
node <plugin-root>/bin/forgemind.mjs leap run --goal "Eliminate manual case triage" --artifacts local --json
node <plugin-root>/bin/forgemind.mjs venture run --goal "Validate an AI triage copilot" --artifacts local --json
node <plugin-root>/bin/forgemind.mjs ship plan --goal "Release a flagged, reversible MVP" --artifacts local --json
```

From a source checkout, the equivalent maintainer command is `node bin/forgemind.mjs`. The legacy `launch-mvp` CLI remains available for a resumable, staged MVP launch and tester-evidence loop; new work should start through Leap or Ship.

```text
node bin/forgemind.mjs launch-mvp start --goal "Validate a reversible MVP" --json
node bin/forgemind.mjs testing plan --goal "Validate a reversible MVP" --json
node bin/forgemind.mjs testing evaluate --json
```

The tester decision is explicit: scale, iterate, or stop. Target-user, functional, accessibility, and adversarial findings are evidence—not a substitute for the seven primary journeys.

## Install from GitHub

```text
codex plugin marketplace add rweisssieker-xp/RW-Forgemind-Codex-Plugin --ref main
codex plugin add forgemind@forgemind-marketplace
```

To update an existing installation, refresh the marketplace checkout and reinstall:

```text
git -C ~/.codex/.tmp/marketplaces/forgemind-marketplace pull --ff-only origin main
codex plugin add forgemind@forgemind-marketplace
```

See [the hierarchy](docs/HIERARCHY.md), [installation guide](docs/INSTALL.md), and [workflow guide](docs/WORKFLOWS.md) for operational detail.
