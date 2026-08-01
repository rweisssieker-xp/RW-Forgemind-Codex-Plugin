---
name: evidence-escrow
description: Hold delivery acceptance until trusted proof, milestone evidence, and named approvals are complete, then issue a sealed release receipt. Use for governed handoffs.
---

# Evidence Escrow

Primary journey: **Release**

Create an evidence-only escrow, evaluate it against a trusted attestation and milestone submission, then release only a releasable evaluation.

```text
forgemind forge escrow create --input templates/forge/escrow.example.json
forgemind forge escrow evaluate --escrow <escrow-id> --attestation <attestation-id> --input templates/forge/escrow-submission.example.json
forgemind forge escrow release --escrow <escrow-id> --evaluation <evaluation-id>
```

This is not financial escrow and never holds or transfers funds. Missing evidence, contract mismatch, an untrusted attestation, or a missing approval keeps it held.
