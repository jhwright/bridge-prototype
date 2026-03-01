# Bridge AI ↔ Prototype: Integration Architecture

*Updated March 2026. Based on actual bridge-ai codebase (Django 5.2, DRF 3.16, PostgreSQL + pgvector).*

---

## The Problem

The backend is ~89% complete. The prototype is a design comp with the "Make Room" brand identity. They need to meet in the middle: the prototype's UX fed by real backend data, exposing availability, FAQs, and every customer golden path.

**Key constraint discovered:** there is no public JSON API. The DRF endpoints require staff auth (`IsAuthenticatedBaseUser + IsStaff`). Public pages are template-rendered Django views. The MCP API uses API-key auth.

---

## Architecture Decision: Option C — Hybrid (Recommended)

Keep Django server-rendered for SEO and initial page loads. Add a thin public JSON layer for the interactive bits (filters, availability checks, price calculations). Don't rebuild what exists.

```
┌──────────────────────────────────────────────────────┐
│  Visitor's phone / browser                           │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  Django Templates (server-rendered)           │    │
│  │  - Homepage + identity cards                  │    │
│  │  - Unit listing (SEO-indexable)               │    │
│  │  - Space listing (SEO-indexable)              │    │
│  │  - Events calendar                            │    │
│  │  - Portal (auth'd)                            │    │
│  └───────────────┬──────────────────────────────┘    │
│                  │ AJAX / fetch()                     │
│  ┌───────────────▼──────────────────────────────┐    │
│  │  /api/public/* (NEW — thin JSON layer)        │    │
│  │  - /api/public/units/?tag=&min_sqft=&max_sqft │    │
│  │  - /api/public/units/{id}/availability/       │    │
│  │  - /api/public/spaces/{id}/calendar.json      │    │
│  │  - /api/public/spaces/{id}/calculate-price/   │    │
│  └───────────────┬──────────────────────────────┘    │
│                  │                                    │
│  ┌───────────────▼──────────────────────────────┐    │
│  │  Existing Services + Models (unchanged)       │    │
│  │  UnitService · BookingService · EventService  │    │
│  │  ContractService · PaymentService · AI Asst.  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## What Exists (No Changes Needed)

| Capability | Endpoint | Notes |
|---|---|---|
| Unit list (HTML) | `GET /public/units/?tag=&min_sqft=&max_sqft=&sort=price` | Already filters by tag, sqft, price. Max 10 units, 2 per size. |
| Unit detail (HTML) | `GET /public/units/{id}/` | Shows vacant + online-eligible units |
| Unit reserve/rent (POST) | `POST /public/units/{id}/reserve/` | Creates customer + reservation/application |
| Space list (HTML) | `GET /public/spaces/` | Active EventSpaceConfigurations |
| Space booking (HTML) | `GET /public/spaces/{id}/book/` | Calendar + form. Email-gated for direct booking. |
| Space calendar (JSON) | `GET /public/spaces/{id}/calendar.json` | **Already JSON** — existing bookings by month |
| Space availability (JSON) | `GET /public/spaces/{id}/availability/{date}/` | **Already JSON** — available time slots |
| Space pricing (JSON) | `GET /public/spaces/{id}/calculate-price/` | **Already JSON** — dynamic price calc |
| Space application (JSON) | `POST /public/spaces/{id}/apply/` | **Already JSON** — creates RentalApplication |
| Events calendar (HTML) | `GET /public/events/` | Template-rendered |
| Events data (JSON) | `GET /public/events/calendar.json` | **Already JSON** — event list |
| Event signup (POST) | `POST /public/events/{id}/signup/` | Creates PublicEventSignup |
| Kitchen onboarding | `GET /public/kitchen/onboarding/` | Email-gated checklist flow |
| Venue onboarding | `GET /public/venue/onboarding/` | Same pattern |
| Maintenance (QR) | `GET /public/maintenance/` | Public form |
| Portal | `/portal/*` | Full dashboard, billing, contracts, bookings |
| Admin | `/admin/*` | Full operational console |
| AI Assistant | `/api/ai-assistant/` | OpenAI + pgvector (staff-auth'd). Will become Retell knowledge backend post-launch. |
| Stripe payments | `/portal/billing/invoices/{id}/pay/` | ACH, card, Bitcoin |
| Twilio SMS | `/api/communications/` | Staff-auth'd |

**3 of the 5 "interactive" endpoints already return JSON.** Space calendar, availability, and pricing are already AJAX-ready. Events calendar is already JSON. Space applications accept JSON POST.

---

## What's Missing (Build These)

### Gap 1: Public Unit JSON Endpoint

**Why:** The prototype's filter chips (swing door, outside rollup, climate ground, climate 2nd, mailbox) need real-time filtering without page reload. The existing `unit_list` view renders HTML.

**Build:** One new view — `public_units_json` — that returns the same data as `unit_list` but as JSON.

```python
# ui/public/views_units.py — add this

@require_GET
def public_units_json(request):
    """JSON endpoint for unit filtering (no auth required)."""
    units_with_active_contracts = ContractService.get_active_contract_unit_ids()
    units = Unit.objects.filter(status=Unit.Status.VACANT).exclude(
        id__in=units_with_active_contracts
    )

    # Reuse existing filter logic
    tag = request.GET.get("tag", "")
    if tag:
        units = units.filter(tags__contains=[tag])

    min_sqft = request.GET.get("min_sqft")
    max_sqft = request.GET.get("max_sqft")
    if min_sqft:
        units = units.filter(square_feet__gte=Decimal(min_sqft))
    if max_sqft:
        units = units.filter(square_feet__lte=Decimal(max_sqft))

    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        units = units.filter(price__gte=Decimal(min_price))
    if max_price:
        units = units.filter(price__lte=Decimal(max_price))

    data = [{
        "id": str(u.id),
        "unit_number": u.unit_number,
        "size_label": u.size_label,
        "square_feet": float(u.square_feet) if u.square_feet else None,
        "price": float(u.price) if u.price else None,
        "tags": u.tags or [],
        "website_description": u.website_description,
        "image_url": u.image_url,
        "can_rent": u.online_rental_enabled,
        "can_reserve": u.online_reservation_enabled,
    } for u in units.order_by("price", "unit_number")[:20]]

    return JsonResponse({"units": data, "total": len(data)})
```

**URL:** `path("units/available.json", public_units_json, name="public_units_json")`

**Prototype maps to:** Storage screen filter → `fetch('/public/units/available.json?min_sqft=50&max_sqft=100&tag=climate_ground')` → render unit cards dynamically.

### Gap 2: ~~Public FAQ / AI Chat Proxy~~ → Deferred to Retell Integration

**Deferred.** Public-facing AI Q&A will ship as part of the Retell voice agent integration, not as a standalone text endpoint. Retell provides voice + text channels, abuse controls, and conversation analytics out of the box — building a bespoke FAQ proxy now would be throwaway work. See **Future: Retell Integration** section below.

### Gap 3: ~~SMS Subscribe Endpoint~~ → Deferred to Retell Integration

**Deferred.** SMS subscribe will ship alongside the Retell voice agent, which handles SMS as a native channel. Building a standalone subscribe endpoint + double opt-in flow now would be rework once Retell owns the SMS conversation layer. See **Future: Retell Integration** section below.

### Gap 4: Unit Display Names

**Why:** The prototype uses "The Nook", "The Room", etc. The Unit model has `unit_number` (A-101) and `size_label`. No marketing name field exists.

**Options (pick one):**
- **A) Use `size_label` as the marketing name.** Populate existing field with "The Nook", "The Room" etc. Zero schema change. Cheapest.
- **B) Use `website_description` first line.** Convention: first line of `website_description` is the display name. No migration.
- **C) Add `display_name` field.** Clean but requires migration. One CharField, nullable.

**Recommendation:** Option A. `size_label` is already exposed in the serializer and the public views. Just populate it with the marketing names instead of "5x5", "5x10" etc.

### Gap 5: Gallery Exhibition Application Type

**Why:** The prototype has "Gallery Exhibition Application" but the existing `RentalApplication.ApplicationType` only has `UNIT` and `RESOURCE`. Gallery needs a way to capture exhibition-specific metadata (event_type, portfolio link, bar service, furniture setup).

**Already solved:** Gallery applications can go through `/public/spaces/{id}/apply/` (the `event_space_submit_application` view) which accepts `event_type`, `event_description`, `expected_attendance`, and `selected_dates` as JSON. It stores everything in `RentalApplication.metadata`. The gallery form's extra fields (portfolio, bar_service, furniture_setup) can go into metadata too — the endpoint already accepts arbitrary JSON fields and stores them.

### Gap 6: Woodshop / Art Studio Onboarding

**Why:** Kitchen and venue have dedicated onboarding flows. Woodshop and art don't.

**Build:** Clone the kitchen onboarding pattern for two new contract types: `woodshop` and `art_studio`. This means:
- New OnboardingTemplate records (seeded via management command)
- New URL routes mirroring `/public/kitchen/onboarding/`
- Reuse the same views with different `CONTRACT_TYPE` constant

This is ~2 hours of work — the pattern is fully established.

---

## Customer Golden Paths (6 live + 1 deferred)

### Path 1: Storage Renter

```
/public/                                    GET  → Homepage (Make Room hero)
/public/units/                              GET  → Unit list (server-rendered, SEO)
/public/units/available.json?tag=&sqft=     GET  → Unit filter (NEW JSON, for AJAX)
/public/units/{id}/                         GET  → Unit detail
/public/units/{id}/reserve/                 POST → Reserve (creates customer + reservation)
/public/units/{id}/rent/                    POST → Rent (creates customer + contract)
─── after activation ───
/portal/                                    GET  → Dashboard
/portal/billing/invoices/{id}/pay/          POST → Pay via Stripe
```

Filter interaction: visitor taps "Climate · Ground" chip → JS calls `/public/units/available.json?tag=climate_ground` → re-renders unit cards without page reload.

### Path 2: Event Booker

```
/public/spaces/                             GET  → Space list (server-rendered)
/public/spaces/{id}/book/                   GET  → Booking page with calendar
/public/spaces/{id}/calendar.json           GET  → Bookings for month (JSON, EXISTS)
/public/spaces/{id}/availability/{date}/    GET  → Available slots (JSON, EXISTS)
/public/spaces/{id}/calculate-price/        POST → Price calc (JSON, EXISTS)
/public/spaces/{id}/apply/                  POST → Application (JSON, EXISTS)
/public/spaces/{id}/reserve/                POST → Direct booking (if pre-approved)
/public/spaces/confirmation/{booking_id}/   GET  → Confirmation page
```

**This path is 100% built.** The 3 JSON endpoints for calendar, availability, and pricing already work. The prototype's modal forms just need to POST to these.

### Path 3: Kitchen Member

```
/public/kitchen/                            GET  → Kitchen info page
/public/kitchen/onboarding/                 GET  → Onboarding (email-gated)
/public/kitchen/onboarding/register/        POST → Register customer
/public/kitchen/onboarding/request-access/  POST → Request kitchen access
/public/kitchen/onboarding/upload/          POST → Upload docs (permits, insurance)
```

**100% built.** The prototype's kitchen intake form maps to the register step. After submission, the onboarding checklist kicks in (business license, health permit, ServSafe cert, insurance, deposit, orientation, access credentials).

### Path 4: Gallery Exhibitor

```
/public/spaces/                             GET  → Space list (gallery card visible)
/public/spaces/{gallery_id}/book/           GET  → Gallery booking page
/public/spaces/{gallery_id}/apply/          POST → Submit application (JSON)
  └─ metadata: {event_type, portfolio_url, bar_service, furniture_setup, ...}
```

**Mostly built.** The `event_space_submit_application` endpoint stores exhibition-specific fields in `metadata`. The prototype's gallery form fields (portfolio link, bar service, furniture setup) just need to be included in the JSON body.

### Path 5: Event Attendee

```
/public/events/                             GET  → Events page (server-rendered)
/public/events/calendar.json                GET  → Events data (JSON, EXISTS)
/public/events/{id}/                        GET  → Event detail
/public/events/{id}/signup/                 POST → RSVP
/public/events/signups/{id}/confirmation/   GET  → Confirmation
```

**100% built.**

### Path 6: Returning Customer (Portal)

```
/portal/login/                              GET  → Login (magic link or password)
/portal/                                    GET  → Dashboard (units, balance, bookings)
/portal/billing/invoices/                   GET  → Invoice list
/portal/billing/invoices/{id}/pay/          POST → Stripe payment (ACH, card)
/portal/contracts/                          GET  → Active contracts
/portal/scheduling/resources/               GET  → Available resources
/portal/scheduling/bookings/                GET  → My bookings
/portal/scheduling/bookings/{id}/           GET  → Booking detail
/portal/scheduling/access/                  GET  → Access grants
```

**100% built.**

### Path 7: FAQ / Discovery → Deferred to Retell

Public-facing AI Q&A (text + voice) will ship with the Retell voice agent integration post-launch. The existing OpenAI + pgvector AI assistant becomes the knowledge backend; Retell handles the public channel, abuse controls, and conversation analytics. No standalone `/public/faq/` endpoint in this plan.

---

## Implementation Plan

### Phase 1: Template Reskin (3-5 days)

Rewrite these templates with prototype's brand identity:

| Template | Change |
|---|---|
| `website_base.html` | Gotham Medium font, #DF562A/#faf7f3/#2a2520 palette, mobile-first viewport |
| `pages/homepage.html` | Full-bleed photo hero, "Make Room." tagline, identity cards, mural gallery, tower reveal, e-truck, perks grid, SMS widget |
| `components/navbar.html` | "BRIDGE" wordmark, portal link, hamburger menu |
| `components/footer.html` | 23 Maine Avenue, @onlyatbridge, hours bar |

**Zero backend changes.** All template-only. Photos go to S3.

**Risk gates (must pass before merge):**
- `make reskin-audit` — diff CSRF tokens, form actions, data-attributes (additions only, no deletions)
- Manual form submission test for all 6 golden paths (reserve, book, apply, signup, kitchen register, portal pay)
- Stripe test-mode checkout end-to-end
- BrowserStack: iPhone SE, iPhone 15, Pixel 7, iPad — no layout breaks
- **No new JS in this phase** — CSS and template markup only

### Phase 2: Public Units JSON + Filter (3 days)

1. Add `public_units_json` view (~30 lines) — **explicit field allowlist, unit test asserting response keys**
2. Add URL route
3. Return opaque slugs or short IDs instead of raw UUIDs (prevent topology leakage)
4. Rewrite `units/list.html` with prototype's expandable cards + filter chips
5. Filter chips use `tags` as primary axis, size dropdown as secondary
6. Unit cards display `size_label` + tag badges (e.g. "The Room · Climate · Ground Floor")
7. Wire filter chips to AJAX calls
8. `make populate-size-labels` management command: ≤35sf→Nook, 36-75→Room, 76-150→Studio, 151+→Workshop. Dry-run mode.
9. CI gate: assert all VACANT + online_rental_enabled units have non-empty `size_label`

### Phase 3: Space & Booking Reskin (3-4 days)

1. Rewrite `event_space/space_list.html` with prototype's badge cards + sub-brand colors
2. Reskin `event_space/booking.html` — calendar and form already work, just visual upgrade
3. Bottom-sheet modals use **Flowbite `data-drawer-*` component** — no custom JS. If Flowbite doesn't cover a pattern, isolate in `bridge-mobile.js` with zero global state.
4. Gallery exhibition fields → metadata in existing `/apply/` endpoint
5. Add `validate_gallery_metadata()` in `views_event_space.py` (~15 lines): check required keys (`event_type`, `expected_attendance`), validate value types, return 400 on invalid input
6. Add `make ui-test-responsive` to CI
7. Touch testing: swipe-to-close modal, scroll-within-modal, pinch-zoom gallery images on real devices

### Phase 4: Onboarding Flows (3 days)

1. Seed OnboardingTemplate for `woodshop` and `art_studio`
2. Clone kitchen onboarding views for new contract types
3. Reskin kitchen onboarding with prototype's visual treatment
4. Add intake form fields from prototype to onboarding registration step

### Phase 5: Portal Reskin (2 days)

1. Apply brand identity to portal templates
2. The portal already has more features than the prototype shows — just visual alignment

**Total: ~12-14 working days. 3 new views, 0 new models, 0 migrations, 1 management command (`populate-size-labels`). FAQ + SMS deferred to Retell integration.**

---

## Red Team — Risks & Mitigations

| # | Risk | Severity | Mitigation | Phase |
|---|------|----------|------------|-------|
| 1 | **Public JSON endpoint leaks data.** `public_units_json` could expose `manager_notes`, `xero_gl_code`, internal pricing, or unit IDs that reveal facility layout. | HIGH | **Explicit allowlist.** The view uses a hardcoded field list: `id`, `unit_number`, `size_label`, `square_feet`, `price`, `tags`, `website_description`, `image_url`, `can_rent`, `can_reserve`. Nothing else leaves the server. Add a unit test asserting the response keys match this allowlist exactly — any new field requires a conscious decision. Additionally: return opaque short IDs (or slugs) instead of raw UUIDs so unit topology isn't exposed. | 2 |
| 2 | ~~**FAQ proxy gets abused.**~~ | — | **Deferred.** FAQ endpoint removed from this plan. Public AI Q&A ships with Retell integration, which provides its own abuse controls (rate limiting, conversation policies, token budgets). Risk transfers to Retell integration plan. | — |
| 3 | ~~**SMS subscribe gets spammed.**~~ | — | **Deferred.** SMS endpoint removed from this plan. Ships with Retell integration, which provides its own subscriber management and abuse controls. Risk transfers to Retell integration plan. | — |
| 4 | **Size filter doesn't match real inventory.** Prototype hardcodes 4 size buckets (25/50/100/200 sf). Real units have variable sizes and mixed amenities within the same square footage. | MEDIUM | **Data migration task in Phase 2:** (a) Run a one-time management command to populate `size_label` for all ~358 units based on actual `square_feet` + `tags`. Use ranges: ≤35sf → "The Nook", 36-75sf → "The Room", 76-150sf → "The Studio", 151+sf → "The Workshop". (b) Filter chips use `tags` (not size) as primary axis — "Climate · Ground" chip maps to `?tag=climate_ground`, not a sqft range. Size dropdown is secondary. (c) Add a `make populate-size-labels` management command with dry-run mode. (d) CI test: assert every VACANT unit with `online_rental_enabled=True` has a non-empty `size_label`. | 2 |
| 5 | **Template reskin breaks existing functionality.** Current templates have working CSRF tokens, Stripe checkout, form actions, onboarding flows, and `data-*` attributes that JS depends on. | HIGH | **Reskin test checklist (Phase 1 gate):** Before merging any template change, run: (a) `make ui-test-crawl` — every public + portal page loads without 500s; (b) manual form submission test for each golden path (reserve unit, book space, apply gallery, signup event, kitchen register, portal pay); (c) Stripe test-mode payment end-to-end; (d) `grep -r 'csrf_token\|action=\|data-modal\|data-stripe' templates/` before and after — diff must show additions only, never deletions. Add this as a CI step: `make reskin-audit`. | 1 |
| 6 | **Mobile responsiveness isn't just CSS.** Bottom-sheet modals, horizontal scroll galleries, and touch gestures need JS that could conflict with existing Flowbite/Tailwind JS. | MEDIUM | **Phased device testing:** (a) Phase 1 reskin is CSS/template only — no new JS. Verify on BrowserStack (iPhone SE, iPhone 15, Pixel 7, iPad) before merge. (b) Phase 3 adds modal JS — use Flowbite's existing `data-drawer-*` bottom drawer component instead of custom JS. If Flowbite doesn't cover a pattern, isolate new JS in `bridge-mobile.js` with no global state. (c) Add `make ui-test-responsive` to CI for Phase 3+. (d) Touch-specific testing: swipe-to-close, scroll-within-modal, pinch-zoom on gallery images. | 1, 3 |
| 7 | **Gallery metadata is unstructured.** `RentalApplication.metadata` (JSONField) stores portfolio_url, bar_service, furniture_setup without model-level validation. Bad data gets in silently. | LOW | **Two-stage approach:** (a) **Now (Phase 3):** Add a `validate_gallery_metadata()` function in `views_event_space.py` that checks required keys and value types before saving. Return 400 on invalid input. This is ~15 lines. (b) **Later (Phase 7, post-launch):** If gallery applications exceed ~50/month, promote `bar_service`, `furniture_setup`, and `portfolio_url` to real fields on a `GalleryApplication` model (subclass or related model). The metadata stays as overflow for truly ad-hoc fields. Track a ticket for this. | 3 |
| 8 | **Nook/Room/Studio/Workshop naming assumes homogeneous units per size.** A 50sf unit could be indoor rollup, outdoor swing door, or climate-controlled. Size-only identity is misleading. | MEDIUM | **Tags-first identity:** (a) The filter UI uses `tags` as the primary differentiator, not size. A "Room" that's climate-controlled shows under both "The Room" (size) AND "Climate · Ground" (amenity). (b) Unit cards display both: marketing name (from `size_label`) + amenity badges (from `tags`). Example: "The Room · Climate · Ground Floor". (c) The `size_label` management command (Risk 4) sets the name based on sqft only. Tags are independent and additive. (d) If two units are the same sqft but different amenities, they get the same `size_label` but different tag badges — the visitor sees the distinction. | 2 |

### Mitigations Folded into Phases

**Phase 1 additions** (from risks 5, 6):
- [ ] Create `make reskin-audit` CI step: grep for CSRF, form actions, data attributes before/after
- [ ] Post-reskin form submission test for all 6 golden paths
- [ ] Stripe test-mode payment verification
- [ ] BrowserStack device testing (4 devices minimum) before merge
- [ ] CSS-only constraint: no new JS in Phase 1

**Phase 2 additions** (from risks 1, 4, 8):
- [ ] `public_units_json` uses explicit field allowlist with unit test
- [ ] Return opaque IDs or slugs instead of raw UUIDs
- [ ] `make populate-size-labels` management command with dry-run
- [ ] CI assertion: all VACANT+online units have non-empty `size_label`
- [ ] Unit cards show `size_label` + tag badges (not size alone)

**Phase 3 additions** (from risks 6, 7):
- [ ] Use Flowbite `data-drawer-*` for bottom-sheet modals (no custom JS)
- [ ] `validate_gallery_metadata()` in event_space views (~15 lines)
- [ ] `make ui-test-responsive` added to CI
- [ ] Touch testing on real devices for modal interactions

---

## Future: Retell Voice Agent Integration

Public-facing AI Q&A (former Gap 2) and SMS subscribe (former Gap 3) are deferred to a system-wide Retell integration. This is the right call because:

- **Retell provides both voice and text channels** — one integration covers phone, web chat, and SMS Q&A instead of building three separate things.
- **Abuse controls are built-in** — token budgets, conversation policies, rate limiting, and analytics come from Retell's platform rather than hand-rolled `django-ratelimit` + hardened prompts.
- **The existing AI assistant (OpenAI + pgvector) becomes the knowledge backend** — Retell calls into it via API, so the investment in embeddings and retrieval isn't wasted.
- **SMS is a native Retell channel** — subscriber management, opt-in/opt-out, and compliance (TCPA) are handled by the platform rather than a hand-rolled `SMSSubscriber` model.
- **Scope:** Retell agent handles: FAQ ("Do you have climate controlled units?"), hours/directions, pricing questions, booking assistance, SMS subscribe/notify, and warm transfer to staff for complex inquiries.
- **Prerequisites:** The website reskin (Phases 1-3) and public JSON endpoints (Phase 2) should be live first so the Retell agent can reference accurate, up-to-date information.
- **Estimated effort:** ~5 working days once Retell account is provisioned (API integration, knowledge base sync, conversation flow design, testing).

---

## File Map

```
bridge-ai/
├── ui/public/
│   ├── views_units.py           + public_units_json (30 lines)
│   ├── urls.py                  + 1 new path() entry
│   └── templates/public/
│       ├── website_base.html    ← RESKIN: fonts, colors, mobile-first
│       ├── components/
│       │   ├── navbar.html      ← RESKIN: BRIDGE wordmark
│       │   ├── hero.html        ← RESKIN: full-bleed photo + Make Room
│       │   └── footer.html      ← RESKIN: brand footer
│       ├── pages/
│       │   └── homepage.html    ← REBUILD: identity cards, tower, murals, perks
│       ├── units/
│       │   ├── list.html        ← REBUILD: expandable cards + filter chips
│       │   └── detail.html      ← RESKIN
│       ├── event_space/
│       │   ├── space_list.html  ← REBUILD: badge cards, sub-brand colors
│       │   └── booking.html     ← RESKIN: bottom-sheet modal
│       └── events/
│           └── calendar.html    ← RESKIN
│
├── ui/portal_ui/templates/      ← RESKIN (Phase 6)
│
├── static/
│   ├── css/bridge-brand.css     ← NEW: prototype's CSS variables + components
│   └── images/facility/         ← NEW: facility photos (from S3)
│
bridgestorage-website/
├── bridge-mobile-design.html    ← Design reference (this prototype)
├── bridge-marketing-plan.md     ← Brand strategy reference
└── bridge-ai-integration.md     ← This document
```
