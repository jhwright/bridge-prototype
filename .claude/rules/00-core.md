# Core Principles

> Core principles, workflow, and execution requirements for Bridge Storage website development

**Priority:** Always

---

## System Overview

```mermaid
graph TB
    subgraph "Development Workflow"
        Plan[Plan: split into 2-3 phase PRs] --> WriteTest[Write Tests First]
        WriteTest --> Implement[Implement]
        Implement --> FullTest[Run FULL Test Suite]
        FullTest --> CPM[/cpm — merge PR]
        CPM --> NextPR{More phases?}
        NextPR -->|Yes| Plan
        NextPR -->|No| Done[Complete]
    end

    subgraph "Stop Conditions"
        Ambiguous[Ambiguous Design]
        Brand[Brand Identity Changes]
        API[API Contract Changes]
    end

    Plan -.->|"STOP if"| Ambiguous
    Plan -.->|"STOP if"| Brand
    Implement -.->|"STOP if"| API
```

## Test-Driven Development (TDD)

**CRITICAL**: All feature changes MUST follow TDD:

1. **Write tests first** — Playwright specs that define expected behavior
2. **Run tests, confirm they fail** — Validates the test is meaningful
3. **Implement the feature** — Write the minimum code to pass
4. **Run tests, confirm they pass** — Feature is complete when tests are green
5. **Use `/cpm`** — Commit, push, and merge all completed work

## AI Thrash Prevention

**CRITICAL**: Before making any changes, you MUST:

1. **Explicit Plan**: State what you're doing and why
2. **File List**: List all files you will touch (create/modify/delete)
3. **Todo List**: Create a todo list (using TaskCreate) for any task with 3+ steps
4. **Stop Conditions**: If ambiguity exists, STOP and ask for clarification
5. **Small Diffs**: Prefer incremental changes over large refactors
6. **Multi-PR plans**: Plans with 3+ phases MUST be split into multiple PRs (max 2-3 phases each). Ship and merge each PR before starting the next. See global CLAUDE.md for full rules.

## Pre-Push Verification

**CRITICAL**: Before every `git push`, you MUST:

1. **Run the full local test suite** — not just changed files. For this project: `npx playwright test --project=desktop`
2. **Grep for pattern duplication** — when fixing a bug, search all test files for the same anti-pattern before committing
3. **Zero failures locally** — never push hoping CI will pass if you haven't verified locally

## When to Stop and Ask

- Ambiguous design requirements or conflicting visual references
- Brand identity changes (colors, fonts, tagline, logo)
- Changes that affect the bridge-ai API contract
- Photo asset reorganization that would break references
- UX flow changes that contradict BUILDPLAN.md

## Commit Message Format

```
type(scope): subject

[detailed description]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`
Scopes: `homepage`, `storage`, `spaces`, `events`, `photos`, `planning`, `brand`, `assets`, `js`

## Plan File Conventions

**CRITICAL: NEVER use the built-in EnterPlanMode tool.** Instead:
- Create plan files manually in `.claude/plans/` using the Write tool
- Use descriptive filenames: `{feature-name}.md`
- Section headings include status: `## Phase 2: Title [IN PROGRESS]`
- Items use checkboxes: `- [x] Done` / `- [ ] Todo`
- First line after title: `Status: IN PROGRESS | Phase 2 of 4`

## Project Structure

```
bridgestorage-website/
├── index.html                  # Main site entry point
├── storage.html                # Unit browsing + filtering
├── spaces.html                 # Space browsing + booking
├── events.html                 # Events calendar + RSVP
├── js/
│   ├── config.js               # API base URL configuration
│   ├── bridge-units.js         # Unit filtering
│   ├── bridge-booking.js       # Space booking flow
│   └── bridge-events.js        # Events + RSVP
├── photos/                     # Optimized facility photos
├── bridge-mobile-design.html   # Design prototype (reference)
├── BUILDPLAN.md                # Implementation plan
├── bridge-ai-integration.md    # API architecture
├── bridge-marketing-plan.md    # Marketing strategy
└── .claude/                    # Claude Code configuration
```

## Completing Work

**Always use `/cpm` to commit, push, and merge completed work.** Do not manually run git commit/push/PR steps separately.

## Git Workflow

**NEVER commit directly to `main`. Always use feature branches.**

```bash
git checkout -b feature/website/<description>
# ... work (TDD: tests first, then implement) ...
# When done: use /cpm
```
