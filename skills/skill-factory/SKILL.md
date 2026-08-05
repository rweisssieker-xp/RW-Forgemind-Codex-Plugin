---
name: skill-factory
description: Create a validated workspace-local skill scaffold with UI metadata. Use when the user needs a reusable, project-specific workflow without changing the installed ForgeMind plugin.
---

# Skill Factory

Primary journey: **Learn**

Run `forgemind factory --name <hyphen-name> --description "<trigger and outcome>" --journey <journey> --json`.

Review the generated skill under `.codex-orchestrator/generated-skills/` before copying it into a maintained skill collection. Keep trigger wording precise and set implicit invocation only after an explicit cost review.
