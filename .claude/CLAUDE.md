# Bridge Storage Website - Claude Config

> See `CLAUDE.md` in project root for main project instructions.

## Additional Context

This directory contains:
- `rules/` - Development rules and standards
- `skills/` - Workflow automation skills
- `agents/` - Specialized subagents
- `hooks/` - Event hooks (prompt logging)
- `BUGBOT.md` - PR review instructions

## Quick Reference

- Brand colors: `#DF562A` (orange), `#faf7f3` (bg), `#2a2520` (dark)
- Font: Inter (not Gotham)
- Framework: Tailwind CSS (CDN) + Flowbite components
- Backend API: bridge-ai public JSON endpoints (see `bridge-ai-integration.md`)
- No Django, no server-side rendering — this is a static frontend
- See `rules/10-html-css.md` for HTML/CSS conventions
- See `rules/50-ui.md` for Flowbite component patterns
