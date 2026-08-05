# ForgeMind Trust Fabric templates

Copy a JSON file into the target workspace, adapt the declared values, and pass it with `--input`. Generated IDs and digests are written under `.codex-orchestrator/forge/`; do not add them manually.

The templates contain no secrets, production credentials, personal identifiers, or remote endpoints. Federation aggregation expects an array of genuine, sealed export records produced by `forge federate export`.
