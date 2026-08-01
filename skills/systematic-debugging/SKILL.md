---
name: systematic-debugging
description: Diagnose bugs, failing tests, and unexpected behavior before proposing fixes.
---

# Systematic Debugging

Primary journey: **Build**

Do not guess. Build evidence first.

## Flow

1. Reproduce or identify the failing signal.
2. Compare expected behavior with actual behavior.
3. Trace the smallest relevant code path.
4. Form one hypothesis at a time.
5. Test the hypothesis with a focused command, log, assertion, or code read.
6. Make the smallest fix that explains the evidence.
7. Run the reproduction and nearby regression checks.

## Report

Explain the root cause, the fix, and the verification. If the root cause is still uncertain, say so plainly.
