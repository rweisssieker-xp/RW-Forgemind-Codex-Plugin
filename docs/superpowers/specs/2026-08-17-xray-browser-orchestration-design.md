# Xray browser orchestration design

## Goal

Make ForgeMind Xray autonomously test every discoverable, reachable local web-GUI area through the Codex internal Browser. Xray must produce evidence-backed GUI receipts, findings, a 0–100 score, coverage gaps, and prioritized improvement proposals.

## Scope and safety

Xray may start and interact with an application only when its target is unambiguously local or a designated test environment. It may create and submit test data in that environment.

Xray must not interact with production targets, delete data, perform payment actions, deploy, publish, alter credentials, or use administration actions. When the target or action cannot be classified as safe, Xray records an explicit gap and does not perform it.

## Browser execution

When a web GUI is detected, the Xray entry skill must:

1. Start or reuse the local application using a safe local command.
2. Use the Codex internal Browser rather than treating an already-open browser tab as test evidence.
3. Inspect reachable navigation, links, buttons, dialogs, forms, validation messages, and visible states.
4. Build a coverage map of reachable views and controls, then exercise every discovered area with at least one positive flow.
5. Exercise plausible validation or error paths for forms and user input.
6. Capture a surface-specific receipt for each flow and pass those receipts to `xray run --gui-receipts`.

The browser orchestration belongs to the entry-skill workflow because the bundled Node CLI has no direct access to Codex Browser controls. The CLI remains the canonical receipt validator, scorer, report generator, and artifact writer.

## Receipt contract

Every browser flow must supply a receipt with:

- `surfaceId: "web-gui"` and `control: "browser"`;
- a pass, fail, blocked, or skipped status;
- component identifiers appropriate to the evidence (`gui-usability` and, only when actually checked, `accessibility-visual`);
- non-empty evidence references, including screenshots when available;
- the visited URL, exercised control, action, expected outcome, actual outcome, and a reproducible flow description.

Xray must not turn a discovery result, an open tab, or a generic command result into a GUI pass. Missing browser control, an unavailable local server, an unsafe action, or incomplete evidence remains a visible gap.

## Reporting and recommendations

The report must distinguish executed GUI flows from untested coverage. It includes:

- the reachable-area coverage map;
- receipts and evidence references for each flow;
- detailed, reproducible findings for failed behavior;
- explicit gaps for unavailable, unsafe, or untested areas;
- the informative 0–100 quality score; and
- prioritized improvement proposals derived only from verified findings or recorded gaps.

Each proposal names the affected area, evidence or gap, recommended change, expected user or quality benefit, priority, and the verification flow to rerun. Xray does not modify the application.

## Error handling

If startup fails, Browser is unavailable, a view cannot be reached, or an interaction cannot be safely completed, Xray records the condition as a gap with the attempted flow and next action. It does not claim coverage, a pass, a failure in the product, or a score contribution without a valid receipt.

## Verification

Automated tests must prove that the entry skill requires Browser orchestration, requires complete flow receipts before reporting GUI coverage, rejects production or unsafe write actions, and renders verified recommendations in the report. Existing non-GUI command tests must remain unchanged.
