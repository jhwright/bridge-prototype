# Bridge Website ↔ bridge-ai: API Integration Architecture

*Updated March 2026.*

---

## Architecture

This website is a standalone static frontend (HTML, Tailwind CSS, vanilla JS) that calls bridge-ai's public JSON endpoints for dynamic data. No server-side rendering, no Django templates — just fetch() calls against the API.

```
┌─────────────────────────────────────────────────────────┐
│  Visitor's phone / browser                              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  This Repo: Static HTML + Tailwind + Vanilla JS   │  │
│  │  - Homepage (static)                              │  │
│  │  - Storage listing (JS + API)                     │  │
│  │  - Space browsing + booking (JS + API)            │  │
│  │  - Events calendar + RSVP (JS + API)              │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │ fetch() / JSON                   │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │  bridge-ai: Public JSON API (no auth required)    │  │
│  │  - /public/units/available.json                   │  │
│  │  - /public/spaces/{id}/calendar.json              │  │
│  │  - /public/spaces/{id}/availability/{date}/       │  │
│  │  - /public/spaces/{id}/calculate-price/           │  │
│  │  - /public/spaces/{id}/apply/                     │  │
│  │  - /public/events/calendar.json                   │  │
│  │  - /public/events/{id}/signup/                    │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │  bridge-ai: Authenticated Flows (separate site)   │  │
│  │  - /portal/* (dashboard, billing, contracts)      │  │
│  │  - Stripe payments (ACH, card, Bitcoin)           │  │
│  │  - Kitchen/venue/woodshop onboarding              │  │
│  │  - /admin/* (staff console)                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints Available

### Already Built in bridge-ai (No Changes Needed)

| Endpoint | Method | Returns | Notes |
|----------|--------|---------|-------|
| `/public/spaces/{id}/calendar.json` | GET | Bookings for month | Already JSON |
| `/public/spaces/{id}/availability/{date}/` | GET | Available time slots | Already JSON |
| `/public/spaces/{id}/calculate-price/` | POST | Dynamic pricing | Already JSON |
| `/public/spaces/{id}/apply/` | POST | Creates RentalApplication | Accepts JSON |
| `/public/events/calendar.json` | GET | Event list | Already JSON |
| `/public/events/{id}/signup/` | POST | Creates PublicEventSignup | Form POST |

### Needs to Be Built in bridge-ai

| Endpoint | Method | Returns | Why |
|----------|--------|---------|-----|
| `/public/units/available.json` | GET | Filtered unit list | Prototype's filter chips need AJAX filtering |

This is one new view (~30 lines) in bridge-ai with an explicit field allowlist:
- `id`, `unit_number`, `size_label`, `square_feet`, `price`, `tags`, `website_description`, `image_url`, `can_rent`, `can_reserve`
- Return opaque short IDs, not raw UUIDs
- Filter params: `?tag=`, `?min_sqft=`, `?max_sqft=`, `?min_price=`, `?max_price=`

### Authenticated Flows (Stay in bridge-ai)

These are NOT called from this website. The user is redirected to bridge-ai for:

| Flow | bridge-ai URL | Trigger |
|------|---------------|---------|
| Portal login | `/portal/login/` | "Sign In" nav link |
| Stripe payment | `/portal/billing/invoices/{id}/pay/` | After application approval |
| Kitchen onboarding | `/public/kitchen/onboarding/` | "Apply" on kitchen card |
| Venue onboarding | `/public/venue/onboarding/` | "Apply" on venue card |
| Unit reservation | `/public/units/{id}/reserve/` | "Rent This Unit" button |
| Unit rental | `/public/units/{id}/rent/` | "Rent This Unit" button |

---

## CORS Configuration

bridge-ai must allow requests from this site's origin.

**Local dev:**
```python
# bridge-ai settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",  # this site
    "http://127.0.0.1:8080",
]
```

**Production:**
```python
CORS_ALLOWED_ORIGINS = [
    "https://bridgestorage.com",
    "https://www.bridgestorage.com",
]
```

---

## Customer Golden Paths

### Path 1: Storage Renter

```
[This Site]
Homepage → Storage page → Filter units (API) → Select unit
  → [Redirect to bridge-ai]
  → /public/units/{id}/reserve/ or /rent/
  → /portal/ (after activation)
  → /portal/billing/invoices/{id}/pay/ (Stripe)
```

### Path 2: Event Space Booker

```
[This Site]
Homepage → Spaces page → Select space → Calendar (API) → Time slots (API) → Price calc (API)
  → Submit application (API POST)
  → [Redirect to bridge-ai portal for payment after approval]
```

### Path 3: Kitchen / Woodshop / Art Studio Member

```
[This Site]
Homepage → Spaces page → Select space → "Apply"
  → [Redirect to bridge-ai]
  → /public/kitchen/onboarding/ (or venue/woodshop/art)
```

### Path 4: Event Attendee

```
[This Site]
Homepage → Events page → Browse events (API) → RSVP (API POST) → Confirmation
```

### Path 5: Returning Customer

```
[This Site]
Homepage → "Sign In" nav link
  → [Redirect to bridge-ai]
  → /portal/ (dashboard, billing, bookings, access, maintenance)
```

---

## Error Handling

The site must handle API failures gracefully:

| Scenario | Behavior |
|----------|----------|
| API unreachable | Show static content, hide interactive features, display "temporarily unavailable" message |
| API returns error | Show user-friendly error, log to console |
| Slow API response | Show loading spinner, timeout after 10s |
| CORS error | Log to console, show generic error to user |

---

## Deferred to Retell Integration

These features are NOT in scope for the initial website:

- **Public AI chat/FAQ** — Ships with Retell voice agent
- **SMS subscribe** — Ships with Retell (handles TCPA compliance)
- **Voice agent** — Retell provides voice + text channels

The existing "Text BRIDGE to 55888" UI and phone number input are placeholders only.

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| API data leakage | bridge-ai uses explicit field allowlist on public endpoints |
| CSRF on POST endpoints | bridge-ai handles CSRF; this site includes appropriate headers |
| Rate limiting | bridge-ai rate-limits public endpoints |
| No secrets on frontend | API keys, Stripe keys, auth tokens — all stay in bridge-ai |
| XSS | Sanitize any API response data before DOM insertion |

---

## File Map

```
bridgestorage-website/          ← This repo (frontend)
├── index.html                  Main entry point
├── storage.html                Unit browsing + filtering
├── spaces.html                 Space browsing + booking
├── events.html                 Events calendar + RSVP
├── js/
│   ├── config.js               API base URL configuration
│   ├── bridge-units.js         Unit filtering (fetch + render)
│   ├── bridge-booking.js       Space booking (calendar, slots, price)
│   └── bridge-events.js        Events listing + RSVP
├── photos/                     Optimized facility photos
└── bridge-mobile-design.html   Design prototype reference

bridge-ai/                      ← Separate repo (backend)
├── ui/public/
│   ├── views_units.py          + public_units_json (new, ~30 lines)
│   ├── views_event_space.py    Existing space/booking endpoints
│   ├── views_events.py         Existing events endpoints
│   └── urls.py                 + 1 new path for units JSON
├── ui/portal_ui/               Portal (auth'd, stays here)
└── static/                     bridge-ai's own static assets
```
