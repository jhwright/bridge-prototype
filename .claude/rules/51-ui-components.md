# UI Component Registry

> Machine-readable registry of required UI patterns for the Bridge Storage website

**Priority:** Always

---

## Component Registry

| Component | Pattern | Usage |
|-----------|---------|-------|
| Hero section | Full-bleed photo + overlay + CTA | Homepage top |
| Identity cards | Photo + title + description + link | Service offerings |
| Mural gallery | Horizontal scroll gallery | Homepage mural section |
| Pricing card | Unit size + price + features + CTA | Storage listing |
| Calendar picker | Flowbite datepicker | Space booking |
| Time slot grid | Button grid with availability | Space booking |
| Price calculator | Dynamic API-powered pricing | Space booking |
| SMS opt-in | Phone input + submit | Homepage footer area |
| Perks grid | Icon + title + description grid | Homepage section |
| Tower reveal | Scroll-triggered image reveal | Homepage section |
| Mosaic | Photo grid layout | Homepage section |
| Navigation | Fixed top bar + mobile hamburger | All pages |
| Footer | 3-column dark footer | All pages |
| Modal | Flowbite modal | Various interactions |
| Loading spinner | Animated spinner for API calls | Interactive pages |
| Error message | User-friendly API error display | Interactive pages |

## Validation Rules

Pages MUST NOT contain:

| Violation | Check |
|-----------|-------|
| `style=""` attributes | No inline styles |
| Bootstrap classes | No `btn-primary`, `container-fluid`, etc. |
| Non-Inter fonts | Must use Inter font family |
| Non-brand primary colors | Primary actions must use `#DF562A` |
| Missing alt text | All `<img>` must have `alt` attribute |
| Missing viewport meta | Must include responsive viewport |
| Hardcoded API URLs | Must use js/config.js |
| Framework imports | No React, Vue, jQuery, etc. |

## Reference

- Prototype: `bridge-mobile-design.html` (design source of truth)
- Brand: See root `CLAUDE.md` for color/font values
- API: See `bridge-ai-integration.md` for endpoint details
- Flowbite docs: https://flowbite.com/docs/
