# Contributing

Contributions for portability, product journeys, evidence quality, governance, documentation, and tests are welcome.

1. Open or identify a GitHub issue for material changes.
2. Fork the repository and create a focused branch.
3. Use Node.js 20 or newer and preserve Windows, macOS, and Linux behavior.
4. Add a failing `node:test` case before behavior changes, then implement the smallest passing change.
5. Run `npm test`, `npm run validate`, `npm run build`, and package verification.
6. Update user-facing docs and `CHANGELOG.md` when behavior changes.
7. Submit a focused pull request with evidence, risks, and rollback notes.

Never commit secrets, customer data, generated personal memory, or unrelated workspace artifacts. By contributing, you agree that your contribution is licensed under the MIT License and to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
