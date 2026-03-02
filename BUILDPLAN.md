# Bridge Website Build Plan

> Standalone public website (HTML/Tailwind/JS) that connects to bridge-ai via API. The prototype at `bridge-mobile-design.html` is the design reference. This plan turns it into a production static site.

**Status: NOT STARTED**

---

## Context

The bridge-ai Django app handles the backend: models, services, admin, portal, payments, scheduling, lien process. What's missing is the **public-facing marketing website** — the pages visitors see before they become customers.

This repo contains that website. It's a standalone frontend that calls bridge-ai's public JSON endpoints for dynamic data (unit availability, space calendars, pricing, event listings). Static pages (homepage, about, contact) are pure HTML. Interactive features (filtering, booking) use vanilla JS + fetch() against the API.

### What bridge-ai Provides (API Endpoints)

**Public JSON endpoints (no auth required):**

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/public/units/available.json` | GET | Filtered unit list (tag, sqft, price) |
| `/public/spaces/{id}/calendar.json` | GET | Bookings for month |
| `/public/spaces/{id}/availability/{date}/` | GET | Available time slots |
| `/public/spaces/{id}/calculate-price/` | POST | Dynamic pricing |
| `/public/spaces/{id}/apply/` | POST | Rental application (accepts JSON) |
| `/public/events/calendar.json` | GET | Event list |
| `/public/events/{id}/signup/` | POST | Event RSVP |

**Authenticated flows (remain in bridge-ai, not this site):**
- Portal dashboard, billing, contracts, bookings
- Stripe payments (ACH, card, Bitcoin) at `/portal/billing/invoices/{id}/pay/`
- Kitchen/venue/woodshop onboarding (email-gated flows)
- Admin console
- AI assistant

### What the Prototype Adds

- **Brand identity:** "Make Room." tagline, #DF562A orange, #faf7f3 background, #2a2520 dark
- **Homepage:** Full-bleed hero photo, mural scroll gallery, identity cards (Storage/Events/Kitchen/Gallery/Studios), mosaic feature, tower reveal, e-truck banner, perks grid, SMS opt-in
- **Storage browsing:** Filterable unit cards with AJAX filtering via API
- **Space browsing:** Calendar picker, time slots, price calculator via API
- **Events:** Event calendar with RSVP via API
- **Golden paths navigator:** Stakeholder demo tool (hidden behind demo flag)

---

## Pre-Work: Photo Assets

Before template work, optimize facility photos for web delivery. The prototype uses 33 base64-encoded photos that need to become proper image files.

```
photos/
├── hero-outdoor.jpg
├── storage-green-mural-aisle.jpg
├── storage-red-mural-aisle.jpg
├── mural-*.jpg (7 mural photos)
├── tower-*.jpg (3 tower photos)
├── courtyard.jpg
├── kitchen-*.jpg (2 kitchen photos)
├── mosaic.jpg
├── artist-studios.jpg
├── gallery.jpg
├── dancefloor.jpg
├── dj-booth.jpg
├── etruck.jpg
├── lounge.jpg
├── entrance.jpg
├── sculpture-*.jpg (2 photos)
├── sign-bridge.jpg
└── ganesh.jpg
```

Source photos are in the repo root (IMG_*.jpeg files) and `photos/` directory.

**Task:** Map photo filenames to prototype names, resize to web-optimized (max 1200px wide, 80% quality JPEG).

---

## Phase 1: Site Scaffold + Brand Identity (2 days)

**Goal:** Base HTML structure with brand identity. All pages inherit the look.

### Files to create/modify:

1. **`index.html`** — Homepage shell with brand setup:
   - Inter font import (Google Fonts)
   - Tailwind CSS CDN with custom config (brand colors, font)
   - Flowbite JS
   - Mobile-first viewport meta

2. **Shared HTML partials** (or inline components):
   - Navbar: "BRIDGE" wordmark left, "Log In" link (→ bridge-ai portal), hamburger menu
   - Footer: 23 Maine Avenue, Richmond CA 94804, (510) 233-3348, @onlyatbridge, hours
   - Mobile bottom tab bar: Home / Spaces / Events / Storage

### Verification:
- [ ] Page loads in browser with correct brand colors and font
- [ ] Mobile viewport (375px) renders correctly
- [ ] Navbar and footer match prototype
- [ ] Flowbite components initialize (dropdowns, modals)

---

## Phase 2: Homepage Build (2-3 days)

**Goal:** Homepage matches prototype: hero → murals → identity cards → mosaic → tower → e-truck → perks → SMS.

### Sections:

1. **Hero:** Full-bleed photo, "Make Room." tagline, two CTAs ("Find Space", "What's On")
2. **Hours bar** below hero
3. **Mural gallery:** Horizontal scroll with CSS scroll-snap
4. **Identity cards:** Storage, Events, Kitchen, Gallery, Studios — each with photo, badge, title, description, link
5. **Mosaic:** Full-width photo with overlay text
6. **Tower section:** Photo + "Know Your Rights" description
7. **E-truck banner:** Photo + "Free E-Truck" description
8. **Perks grid:** Gated, Cameras, E-Truck, Pay Online, Solar, Murals
9. **SMS section:** "Stay in the loop" + phone input (placeholder only)

### Verification:
- [ ] All sections render correctly
- [ ] Mural gallery scrolls horizontally with snap
- [ ] Identity card links go to correct pages
- [ ] Mobile scroll is smooth
- [ ] Page loads in <3s on throttled 3G

---

## Phase 3: Storage Page + Unit Filtering (2-3 days)

**Goal:** Storage browsing page with filterable unit cards, powered by bridge-ai API.

### Build:

1. **`storage.html`** (or `units.html`)
   - Page header: "Rent Storage" + sub "Units with murals on the doors. Free e-truck included."
   - Size dropdown filter (All / Nook / Room / Studio / Workshop)
   - Filter chips for tags (Swing Door, Outside Rollup, Climate Ground, Climate 2nd, Mailbox)
   - Results count ("Showing X of Y unit types")
   - Unit cards: photo, size label + tag badges, sqft, price, expandable details
   - "Rent This Unit" button → links to bridge-ai portal for payment

2. **`js/bridge-units.js`** (~50 lines)
   - Filter chip click → `fetch('${API_BASE}/public/units/available.json?tag=X&min_sqft=Y')` → re-render cards
   - No global state, no framework, vanilla JS

### Verification:
- [ ] Units load from API
- [ ] Filter chips update results without page reload
- [ ] Unit detail expand/collapse works
- [ ] Works on mobile (375px)

---

## Phase 4: Spaces + Booking (3 days)

**Goal:** Space browsing and booking flow, with live calendar data from bridge-ai API.

### Build:

1. **`spaces.html`**
   - Badge cards for each space: Dance Floor, Courtyard, Kitchen, Gallery, Studios, Woodshop, Lounge
   - Each card: photo, badge, title, description, key specs (capacity, equipment)
   - "Book" / "Apply" CTA per card

2. **Booking flow** (modal or separate page)
   - Calendar (from `calendar.json` API)
   - Time slots (from `availability/{date}/` API)
   - Price calculator (from `calculate-price/` API)
   - Application submit (POST to `apply/` API)
   - For payment: redirect to bridge-ai portal

3. **`js/bridge-booking.js`** (~100 lines)
   - Fetch calendar → render grid
   - Date select → fetch time slots
   - Time select → POST price calculation
   - Submit → POST application
   - Use Flowbite `data-drawer-*` for bottom-sheet modals where possible

### Verification:
- [ ] Calendar loads real data from API
- [ ] Time slots populate from availability endpoint
- [ ] Price calculator returns correct amounts
- [ ] Application submission works
- [ ] Modals work on mobile (375px)

---

## Phase 5: Events Page + RSVP (1-2 days)

**Goal:** Events calendar with working RSVP, powered by bridge-ai API.

### Build:

1. **`events.html`**
   - Event cards with date, title, description, time, price
   - "Sign Up" / "RSVP" button per event
   - SMS section at bottom: "Never miss an event" + placeholder input

2. **`js/bridge-events.js`** (~30 lines)
   - Fetch `events/calendar.json` → render event cards
   - RSVP button → POST to `events/{id}/signup/`
   - Show confirmation after signup

### Verification:
- [ ] Events load from API
- [ ] RSVP POST works
- [ ] Confirmation displays after signup

---

## Phase 6: Polish + QA (2 days)

### Tasks:

1. **SEO:** Meta titles, descriptions, Open Graph tags. Homepage title: "Bridge Storage Arts & Events | Make Room. | Richmond CA"
2. **Performance:** Lazy-load below-fold images, verify <3s load on 3G
3. **Accessibility:** Color contrast WCAG AA, form labels, ARIA, keyboard navigation
4. **Responsive:** Test at 375px, 768px, 1280px, 1920px
5. **Cross-browser:** Safari iOS, Chrome Android, Chrome Desktop, Firefox
6. **API error handling:** Graceful degradation when bridge-ai API is unreachable
7. **End-to-end golden path test:**
   - [ ] Storage: browse → filter → select → redirect to portal
   - [ ] Event booking: browse spaces → calendar → select time → apply
   - [ ] Events: browse → RSVP → confirmation
   - [ ] Discovery: homepage → identity cards → each section page

---

## Dependency Order

```
Phase 1 (scaffold + brand)
  ↓
Phase 2 (homepage) ←── requires Phase 1
  ↓
Phase 3 (storage) ←── requires Phase 1 + API access
Phase 4 (spaces) ←── requires Phase 1 + API access
Phase 5 (events) ←── requires Phase 1 + API access
  ↓ (all above done)
Phase 6 (polish) ←── requires all above
```

Phases 3, 4, 5 can run in parallel after Phase 1+2 are complete.

**Total estimate: 10-14 working days.**

---

## Branch Strategy

```
main (protected — never commit directly)
  ├── feature/website/scaffold         ← Phase 1
  ├── feature/website/homepage         ← Phase 2
  ├── feature/website/storage          ← Phase 3
  ├── feature/website/spaces-booking   ← Phase 4
  ├── feature/website/events           ← Phase 5
  └── feature/website/polish-qa        ← Phase 6
```

Each phase = 1 PR. Merge sequentially.

---

## API Configuration

The site needs a configurable API base URL for bridge-ai:

```javascript
// js/config.js
const BRIDGE_API = {
  base: window.BRIDGE_API_BASE || 'https://bridgestorage.com',
  units: '/public/units/available.json',
  spaceCalendar: (id) => `/public/spaces/${id}/calendar.json`,
  spaceAvailability: (id, date) => `/public/spaces/${id}/availability/${date}/`,
  spacePrice: (id) => `/public/spaces/${id}/calculate-price/`,
  spaceApply: (id) => `/public/spaces/${id}/apply/`,
  eventsCalendar: '/public/events/calendar.json',
  eventSignup: (id) => `/public/events/${id}/signup/`,
};
```

For local dev, set `BRIDGE_API_BASE` to the local bridge-ai server (e.g., `http://localhost:8000`). In production, the API is on the same domain or a configured subdomain.

---

## Known Gotchas

1. **Font:** Use Inter, not Gotham (paid Hoefler font). Inter is free, visually close, and already common in Tailwind projects. One-line swap if Gotham is purchased later.

2. **CORS:** bridge-ai needs to allow requests from wherever this site is hosted. During local dev, both should run on localhost (different ports). In production, configure `CORS_ALLOWED_ORIGINS` in bridge-ai.

3. **Stripe:** Do NOT embed Stripe payment forms on this site. Booking/rental flows create applications via API, then the customer pays through the bridge-ai portal. The prototype shows inline payment for demo purposes — production payment goes through the portal.

4. **SMS is a placeholder.** The phone input and "Text BRIDGE to 55888" are UI-only. No backend. SMS ships with Retell voice agent integration later.

5. **Gallery / dance floor are the SAME physical room.** One space, two use types. The UI should present them as related but distinct experiences of the same space.

6. **API availability:** The site should degrade gracefully if bridge-ai is unreachable. Show cached/static content where possible, and clear error messages for interactive features.

---

## What NOT to Build

- **No server-side rendering.** This is a static site.
- **No customer portal.** Portal stays in bridge-ai.
- **No payment processing.** Stripe stays in bridge-ai portal.
- **No auth/login.** Auth stays in bridge-ai.
- **No native app.** Mobile-optimized site. PWA later if needed.
- **No SMS backend.** Deferred to Retell integration.
- **No AI chat.** Deferred to Retell integration.

---

## Reference Files

| Document | Location | Purpose |
|----------|----------|---------|
| Design prototype | `bridge-mobile-design.html` | Visual reference for all screens |
| Marketing plan | `bridge-marketing-plan.md` | Brand messaging, segments, channels |
| API integration | `bridge-ai-integration.md` | Backend API mapping and architecture |
| Photo map | `photos/PHOTO-MAP.md` | Photo variable names → filenames |
