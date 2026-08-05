---
name: visual-qa
description: Record local visual QA evidence for a web or app change. Use when Codex needs screenshot-based release evidence, viewport coverage, visual regression review, or a design-validation handoff.
---

# Visual QA

Primary journey: **Verify**

Capture screenshots with the available browser or test environment, review them for task-critical states, then seal the local evidence:

```text
forgemind visual --input <screenshot-file> --label <screen-or-state> --viewport <width>x<height>
forgemind visual capture --url <local-url> --output evidence/screen.png --label <screen> --viewport 1280x720
forgemind visual compare --baseline <before.png> --candidate <after.png> --label <screen>
```

Record normal, empty, error, and narrow-viewport states where relevant. Browser capture uses Playwright only when it is installed locally. Comparison is deliberately byte-identity, not a pixel-diff claim. The CLI never uploads screenshots.
