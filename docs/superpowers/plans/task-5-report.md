# Task 5: Xray journey surface report

Implemented the explicit-only `$forgemind-xray` Marketplace entry point.

- The skill uses the bundled Xray runner, applies read-only limits, and requires execution receipts.
- Local web GUI work is routed to the internal Browser; local native or emulator GUI work is routed to Computer Use.
- Unavailable applications or control surfaces are recorded as Xray gaps, never reported as coverage or a result.
- Compass, the hierarchy, and the README expose Xray as an independent QA journey.

Verification: `node --test tests/journey-surface.test.mjs` passed (4 tests).
