---
name: forgemind-leap
description: "Use when a new idea or an existing app needs a one-prompt, disruption-first path to a selected, market-aware, tested MVP without routine questions."
---

# Leap

Leap is ForgeMind's autonomous product-disruption journey. It converts an outcome into five AI-central workflow replacements, an assumption-labelled market chance and business case, one selected reversible MVP, a credible contrarian, and a completion contract.

Resolve this installed plugin's root and run the bundled runner:

```text
node <plugin-root>/bin/forgemind.mjs leap run --goal "<outcome>" --mode yolo --artifacts local --json
```

Then continue autonomously with `$forgemind-ship`. Implement the selected MVP rather than returning only ideas. Use the Leap decision record as the source of truth for the 10x hypothesis, moat, commercial wedge, acceptance criteria, kill condition, evidence boundary, and rollback path.

Do not ask routine design, naming, scope, or sequencing questions. Make the smallest compatible and reversible choices from the existing app. Run relevant tests, GUI states, accessibility checks, risk checks, and a release-readiness assessment before handoff. Treat missing market, customer, ROI, or test evidence as an explicit assumption or gap—not a reason to stop safe work or a reason to invent proof.

Stop only before secrets or credentials, production access, data deletion, irreversible migrations, external spend, legal or compliance commitments, or high-stakes decisions. State the exact boundary, complete all independent work, and request only the minimum decision needed to proceed.

Load `playbooks/leap.md` for the full operating contract.

Resume after any interruption with `leap status` or `leap continue`; pass `--autonomy '{"maxExternalSpend":0,"requireFeatureFlag":true}'` to make the execution envelope explicit.
