# Journey Status Summary Design

## Purpose

Give ForgeMind end users one continuously current, human-readable project summary after Leap, Venture, Ship, or Xray runs. It answers: what has been decided, what remains open, and what should happen next.

## Scope

Create a shared summary writer that automatically updates `docs/forgemind/status.md` after every Leap, Venture, Ship, and Xray run, including incomplete or gap-bearing outcomes. It reads the current project-local artifacts of the four journeys and produces derived Markdown only; it does not alter their detailed artifacts or execute new work.

## Markdown Structure

The file has exactly four sections:

1. **Current decision**: selected MVP/bet, Venture recommendation, Ship delivery status, and Xray quality outcome when available.
2. **Open items**: evidence gaps, Xray gaps, unsatisfied acceptance criteria, and explicit blockers.
3. **Next best action**: one deterministic, directly executable action selected from the freshest relevant journey result.
4. **Updated from**: update timestamp plus the journeys and artifact paths used.

The generated status document is concise, uses plain language, and links to project-local evidence paths rather than duplicating detail.

## Architecture and Data Flow

Add a focused summary module that loads the latest Leap, Venture, Ship, and Xray artifacts from the existing artifact store. Each supported journey calls the module after it persists its own result. The module normalizes only the fields it needs: status, generated timestamp, decision/recommendation, gaps/errors, next action, and artifact path.

The most recently generated successful journey result owns the next action unless it is blocked or invalid. In that case, the highest-priority open gap becomes the next action. Priority is: explicit blocker, failed or blocked Xray gap, Ship open acceptance/verification work, Venture evidence gap, then Leap next packet.

## Failure Handling

Missing journey artifacts render as “Not run yet.” Invalid or unreadable artifacts appear in Open items as an evidence gap and are never treated as successful. If status-document writing fails, the originating journey response stays valid and reports a non-fatal summary-write error; it does not claim the summary was updated.

## Testing

Tests cover one journey at a time and combined artifacts, including:

- automatic status-document creation after each of Leap, Venture, Ship, and Xray;
- all four Markdown sections and stable evidence links;
- prioritization for a blocker, Xray gap, Ship open work, Venture evidence gap, and Leap next packet;
- missing, invalid, and stale artifacts;
- the no-persistence artifact mode, which must not create a target-project status document.

## Non-goals

- No HTML dashboard changes.
- No remote status storage or external connector.
- No automatic execution of the recommended next action.
- No rewriting of existing journey artifacts.

