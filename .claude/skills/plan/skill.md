---
name: plan
description: Resume work on an existing implementation plan across sessions
user_invocable: true
---

# /plan — Resume Implementation Plan

When invoked:

1. **Find existing plans**: Search `.claude/plans/` for any `.md` files
2. **If multiple plans exist**: List them with their Status line and ask which to resume
3. **If one plan exists**: Read it and resume from the current phase
4. **If no plans exist**: Ask what to plan

## Reading a Plan

1. Read the plan file completely
2. Find the current phase (look for `[IN PROGRESS]` or first unchecked `- [ ]` item)
3. Summarize progress so far
4. State what's next
5. Ask: "Ready to continue with [next item]?"

## Plan File Format

```markdown
# Plan Title

Status: IN PROGRESS | Phase N of M

## Phase 1: Title [DONE]
- [x] Completed item
- [x] Completed item

## Phase 2: Title [IN PROGRESS]
- [x] Done item
- [ ] Next item
- [ ] Future item

## Phase 3: Title [NOT STARTED]
- [ ] Future item
```
