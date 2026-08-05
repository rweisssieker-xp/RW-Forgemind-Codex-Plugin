---
name: mvp-test-lab
description: Plan a decisive MVP test with target users, functional checks, accessibility checks, and a clear scale, iterate, or stop decision. Use when preparing user tests, beta validation, usability sessions, or release acceptance for a new or changed product.
---

# MVP Test Lab

Primary journey: **Verify**

Run `forgemind testing plan --goal "<outcome>" --audience "<audience>" --json` before recruiting or simulating tests.

1. State one testable hypothesis, the smallest realistic task, a success metric, and a kill condition.
2. Use four complementary testers: target user for desirability, functional tester for acceptance and edge cases, accessibility tester for inclusion, and adversarial tester for misuse and trust gaps.
3. Keep tests observational: do not coach a participant or treat simulated feedback as real evidence.
4. Record quotes, task completion, time, defects, and confidence separately; redact personal data before storage.
5. Decide only from the evidence: scale when the threshold passes, iterate when the signal is mixed, and stop when the kill condition is met.

Hand off functional findings to `acceptance-criteria-builder`, visual findings to `visual-qa`, product evidence to `discovery-operations`, and durable feedback to `user-feedback-capture`.
