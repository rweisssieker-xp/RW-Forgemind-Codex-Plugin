# Runtime Discovery Test

After installation, open a new Codex task and verify the seven skills are discoverable:

```text
$forgemind-compass Choose the safest path for an unclear product goal.
$forgemind-spark Create disruptive AI directions for this app.
$forgemind-evolve Transform this existing app around a measurable outcome.
$forgemind-venture Validate market chance and the business case for this bet.
$forgemind-council Decide whether this bet should proceed.
$forgemind-ship Implement and prove a bounded MVP.
$forgemind-leap Autonomously turn this app into a disruptive MVP.
```

Expected: Compass is the only implicit route; the other six start only when explicitly selected. A distributed Marketplace plugin may not expose a global `forgemind` command. Use `node <plugin-root>/bin/forgemind.mjs help` to verify the bundled runner.

## MVP Command Tests

In a source checkout, run `node bin/forgemind.mjs help` and `node bin/forgemind.mjs leap run --goal "smoke test" --artifacts none --json`. This checks the portable lifecycle without requiring a global command.
