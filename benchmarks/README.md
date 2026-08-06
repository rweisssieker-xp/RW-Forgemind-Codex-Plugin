# ForgeMind Quality Benchmarks

This directory contains reproducible checks for the claims that matter to ForgeMind users: evidence-labelled discovery, bounded fast delivery, and honest release decisions.

Run static code coverage before a release:

```text
npm run coverage
```

This writes `coverage/lcov.info`, which Plugin Eval can include in its analysis. The file is intentionally ignored by Git because it is generated evidence.

Run the three real Codex scenarios in an isolated copy of this repository:

```text
plugin-eval benchmark plugins/forgemind --config benchmarks/forgemind-plugin-eval.json
```

The benchmark records task success, retries, tool behavior, time, and token usage. Review a failed run before changing a skill; benchmark workspaces are preserved on failure.
