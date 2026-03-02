---
name: execute-plan
description: Execute plan phases step-by-step with visual verification gates
user_invocable: true
---

# /execute-plan — Step-by-Step Plan Execution

When invoked:

1. **Find the active plan**: Read `.claude/plans/*.md`, find the one with `Status: IN PROGRESS`
2. **Locate current item**: Find first unchecked `- [ ]` item in the current phase
3. **Execute the item**: Do the work described
4. **Verify**: Run the appropriate verification for the change type
5. **Mark complete**: Update the checkbox to `- [x]`
6. **Continue or pause**: Move to next item, or pause if phase boundary reached

## Verification Gates

After each item, run the appropriate check:

| Change Type | Verification |
|-------------|-------------|
| HTML edit | Open in browser, screenshot if Chrome tools available |
| Photo/asset | Verify file exists and is accessible |
| Planning doc | Read back and confirm accuracy |
| CSS change | Visual check at mobile + desktop viewpoints |

## Phase Boundary

When completing the last item in a phase:

1. Update phase status to `[DONE]`
2. Update next phase to `[IN PROGRESS]`
3. Update the `Status:` line
4. Summarize what was accomplished
5. Ask: "Phase N complete. Ready to start Phase N+1?"

## Error Handling

If an item cannot be completed:
1. Add a note: `- [ ] Item description **BLOCKED: reason**`
2. Skip to next item if independent
3. Stop and ask if blocking
