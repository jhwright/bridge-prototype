# Bridge Storage Website - Claude Code Instructions

## Project Overview

Public-facing marketing website for Bridge Storage Arts & Events. This is a standalone static site (HTML, Tailwind CSS, vanilla JS) that connects to the bridge-ai Django backend via its public API endpoints. No Django, no server-side rendering — just a fast, mobile-first frontend.

## Repository Contents

| Path | Purpose |
|------|---------|
| `bridge-mobile-design.html` | Original design prototype (base64 photos, starting point) |
| `index.html` | Main site entry point |
| `BUILDPLAN.md` | Implementation plan for building out the production site |
| `bridge-ai-integration.md` | API integration architecture with bridge-ai backend |
| `bridge-marketing-plan.md` | Marketing strategy and brand guidelines |
| `IMG_*.jpeg`, `IMG_*.JPG` | Raw facility photos |
| `instagram_photos/` | Downloaded Instagram content |
| `photos/` | Organized photo assets |

## Brand Identity

| Element | Value |
|---------|-------|
| Tagline | "Make Room." |
| Primary Orange | `#DF562A` |
| Background | `#faf7f3` |
| Dark Text | `#2a2520` |
| Font | Inter (substitute for Gotham Medium — licensing) |
| Framework | Tailwind CSS + Flowbite components |

## Relationship to bridge-ai

This repo is the **frontend**. The bridge-ai Django app at `~/code/bridge-ai` is the **backend API**. The website calls bridge-ai's public JSON endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /public/units/available.json` | Unit listing with filters |
| `GET /public/spaces/{id}/calendar.json` | Space booking calendar |
| `GET /public/spaces/{id}/availability/{date}/` | Available time slots |
| `POST /public/spaces/{id}/calculate-price/` | Dynamic pricing |
| `POST /public/spaces/{id}/apply/` | Rental application |
| `GET /public/events/calendar.json` | Event listings |
| `POST /public/events/{id}/signup/` | Event RSVP |

Portal and payment flows remain in bridge-ai (server-rendered Django). This site handles the public marketing pages and discovery flows, then hands off to bridge-ai for authenticated actions.

## Working with This Repo

```bash
# Serve locally
python -m http.server 8080

# Or use any static file server
npx serve .
```

## IMPORTANT

1. This repo is a **standalone frontend** — no Django, no Python dependencies, no server-side rendering.
2. All backend data comes from bridge-ai API endpoints. Never hardcode data that should come from the API.
3. Keep photos and design assets organized — they become the site's static assets.
4. The prototype uses base64-encoded images; production pages must use proper image file URLs.
5. Font: Use Inter, NOT Gotham (licensing constraint). See `bridge-marketing-plan.md`.
6. Gallery and dance floor are the SAME physical room — UI must handle this.
7. SMS "Text BRIDGE to 55888" is a placeholder — actual SMS integration TBD (Retell).
8. Stripe payment flows happen in the bridge-ai portal, not inline on this site.
9. Never speculate about code you have not opened. Read files before answering.
10. For non-code tasks, ask one focused clarifying question before starting.

## Git Workflow

**NEVER commit directly to `main`. Always use feature branches.**

```bash
git checkout -b feature/website/<short-description>
# ... work ...
git push -u origin feature/website/<short-description>
gh pr create --title "..." --body "..."
```

Branch naming: `feature/website/<desc>`, `fix/website/<desc>`, `chore/<scope>/<desc>`

## Stop Conditions

Always stop and ask when encountering:
- Ambiguous requirements or conflicting design decisions
- Changes that affect the bridge-ai API contract
- Brand identity changes (colors, fonts, tagline)
- Photo asset organization that would break existing references
