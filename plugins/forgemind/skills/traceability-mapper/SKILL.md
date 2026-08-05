---
name: traceability-mapper
description: ForgeMind traceability mapper workflow. Use when the user explicitly asks for traceability mapper.
---

# Traceability Mapper

Primary journey: **Verify**

Persona name: Traceability.

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
