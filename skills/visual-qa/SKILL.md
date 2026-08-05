---
name: visual-qa
description: Record local visual QA evidence for a web or app change. Use when Codex needs screenshot-based release evidence, viewport coverage, visual regression review, or a design-validation handoff.
---

# Visual QA

Primary journey: **Verify**

Capture screenshots with the available browser or test environment, review them for task-critical states, then seal the local evidence:

```text
forgemind visual --input <screenshot-file> --label <screen-or-state> --viewport <width>x<height>
```

Record normal, empty, error, and narrow-viewport states where relevant. The CLI stores file name, size, viewport, and SHA-256 locally; it does not upload screenshots or claim pixel comparison it did not perform.
