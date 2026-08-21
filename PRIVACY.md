# Privacy

ForgeMind is a local-first Codex plugin published by Aivana GmbH. It has no bundled telemetry service, advertising tracker, remote database, MCP server, or hosted account system. The portable CLI reads repository files and may execute locally detected project commands when the user requests verification. Aivana's website privacy notice is available at https://aivana-gmbh.ai/Privacy.

## Data written locally

Depending on the command, ForgeMind writes project configuration and durable decision documents under the current workspace, including `docs/forgemind/`. By default, generated reports, dashboards, verification evidence, delivery proofs, product signals, governed memory, market calculations, and temporary workflow state are stored in that target project's `.codex-orchestrator/` directory. `--artifacts local` is a compatible alias for this workspace-local default; `--artifacts none` returns one-shot output without persistence. Personal installations may be stored below the destination or home path explicitly selected by the user, but generated project state is never written into the installed plugin directory.

Inputs and command output are redacted for common secret patterns before supported persistence paths. Redaction is risk reduction, not a guarantee. Do not provide credentials, private keys, regulated data, patient data, customer confidential data, or proprietary source as product-signal content.

## Retention and deletion

Project data is retained locally until the user or repository owner deletes it according to team policy. `uninstall` preserves project data by default. Use the documented purge option only after reviewing its exact target, or remove the project-owned ForgeMind directories through normal source-control and filesystem procedures. Shared records can also carry expiry or supersession metadata; expired data remains auditable until deleted by the owner.

## External services

ForgeMind itself does not transmit stored data. Codex, Git hosting, package tools, test commands, or user-configured integrations may process data under their own policies. Review those tools before use. Public repository links in the plugin manifest open GitHub in the user's browser.

Trust Fabric federation exports only cohorts meeting the configured minimum size and excludes raw outcome IDs, tasks, prompts, code, paths, project names, users, authors, and evidence IDs. Suppressed cohorts reveal only aggregate suppression counts. This is k-anonymous cohort aggregation, not a formal differential-privacy guarantee. Evidence escrow stores local evidence and approvals only; it does not hold funds. Exporting, transmitting, or publishing any generated bundle remains an explicit user or team action.

Questions and corrections can be filed through [GitHub Issues](https://github.com/rweisssieker-xp/RW-Forgemind-Codex-Plugin/issues) without including private data.
