---
name: innovation-delivery-lab
description: Turn a bold product idea into a safe, measurable delivery contract. Use when Codex needs counterfactual delivery options, outcome contracts, change budgets, proof-carrying PR evidence, expiring organizational memory, or privacy-preserving team learning.
---

# Innovation Delivery Lab

Primary journey: **Design**

Convert an idea into an execution contract before building it.

1. Write an outcome contract: target user, measurable result, acceptance criteria, explicit non-goals, and safety boundaries.
2. Compare at least two delivery paths. For each, record expected value, risk, effort, test strategy, rollback, and missing evidence. Choose the smallest sufficient path.
3. Set a change budget: permitted files or components, dependency additions, migration scope, test expectation, and a review trigger for budget overrun.
4. Require proof-carrying delivery: link acceptance criteria to changed files, verification results, known risks, rollback instructions, and any approvals in the PR summary.
5. Record the outcome with expiry and confidence. Share only aggregate, non-identifying lessons across teams; never export source, prompts, secrets, or customer data.

## Fast MVP Exception

When the user explicitly requests YOLO mode, keep the outcome contract and bounded change budget lightweight, then invoke `yolo-feature` immediately. YOLO may skip extended option analysis, but never bypasses destructive, credential, cost, or production safeguards.
