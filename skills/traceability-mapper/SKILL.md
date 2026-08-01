---
name: traceability-mapper
description: Map PRD goals, stories, acceptance criteria, code changes, tests, and verification evidence into a traceability record.
---

# Traceability Mapper

Primary journey: **Verify**

Persona name: Tessa Trace.

Use this when work needs ForgeMind-native evidence that implementation matches product intent.

## Trace Links

Capture:

- PRD goal or feature intent
- epic or story id
- acceptance criteria
- changed files
- verification commands and reports
- open risks and deferred work

## Output

Update `docs/forgemind/traceability.md` with a concise entry for the current work.

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\add-traceability.ps1 -Feature "Feature name" -Story "Story id" -Acceptance "Acceptance summary"
```
