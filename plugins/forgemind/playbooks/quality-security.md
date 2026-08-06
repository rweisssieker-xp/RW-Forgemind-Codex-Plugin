# Quality, Security, and Experience Evidence

Run relevant automated checks, inspect the diff, review code paths for regressions, and assess secrets, dependencies, authorization, data exposure, misuse, and AI safety. Distinguish passed, failed, blocked, and not-run evidence. Never infer success from workflow intent.

## Experience Evidence Loop

For a user-facing change, define one decisive task and a compact state matrix: loading, empty, error, success, keyboard-only, narrow viewport, and destructive confirmation or recovery when applicable. Reuse the product's components, copy, and interaction conventions; do not invent a parallel design system.

Prove in this order:

1. **Meaning:** accessible names, labels, focus order, keyboard escape routes, status/error announcements, contrast, and touch targets.
2. **Behavior:** component tests for state transitions and a browser test for the critical user task, including an unhappy path.
3. **Appearance:** a screenshot baseline or visual comparison only where layout, rendering, or responsive behavior is material; inspect meaningful diffs rather than accepting pixel noise.
4. **Resilience:** no trapped focus, lost input, duplicate submission, silent failure, hidden destructive action, or inaccessible recovery path.

Record which layers ran, their viewport or browser context, screenshot evidence when used, and residual states not covered. If the repository lacks a UI test harness, add the smallest compatible layer or record the gap and block a visual-quality claim.
