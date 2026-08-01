---
name: runtime-discovery-test
description: Check whether ForgeMind is installed where Codex can discover it, whether the marketplace is registered, and whether expected skills exist.
---

# Runtime Discovery Test

Primary journey: **Release**

Persona name: Nora Runtime.

Use this after installing, packaging, renaming, or moving the plugin.

## Checks

Verify:

- plugin cache path exists
- marketplace file exists
- Codex config contains marketplace and enabled plugin entries
- plugin manifest parses
- expected skill count is present
- hooks reference existing skills

## Automation

Run:

```powershell
.\plugins\forgemind\scripts\runtime-discovery-test.ps1
```

The script writes `.codex-orchestrator\reports\runtime-discovery-latest.json`.
