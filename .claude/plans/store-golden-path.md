# Store Tab: Rent Storage Golden Path

Status: COMPLETE | All 4 phases implemented

## Context

The Store tab currently has 4 hardcoded unit cards with client-side filtering. The backend endpoint `GET /public/units/available.json` is merged (PR #324) and returns live unit data with filters metadata. The rental modal has a 4-step flow (select → info → payment → confirmation) but payment happens inline with fake Stripe fields — per the integration spec, Stripe payment must happen in bridge-ai portal.

The golden path: **Browse → Filter → "Grab It!" → Redirect to bridge-ai for contract + payment**

## What Changes

1. Unit cards render from API data (with static fallback)
2. Filter chips come from API `filters` metadata (dynamic tags/sizes)
3. "Rent" button becomes inline "Grab It!" micro-form (name, email, phone)
4. Submit POSTs to `/public/units/{id}/reserve/` on bridge-ai
5. Confirmation redirects to bridge-ai portal for contract + Stripe payment
6. Current 4-step rental modal gets replaced

---

## Phase 1: API Fetch + Dynamic Unit Cards [PENDING]

Replace hardcoded unit cards with API-driven rendering, keeping static cards as fallback.

- [ ] Add `API_BASE` config at top of `<script>` section (default `http://localhost:8000`)
- [ ] Create `fetchUnits(params)` function — calls `GET {API_BASE}/public/units/available.json` with query params
- [ ] Create `renderUnits(data)` function — generates unit card HTML from API response
  - Each card uses: `unit_number`, `size_label`, `square_feet`, `price`, `tags`, `website_description`, `image_url`, `can_rent`
  - Cards get `data-unit-id` attribute (unit_number) for the Grab It form
  - If `image_url` is empty, use a default storage photo
- [ ] Wrap existing 4 static unit cards in `<div id="units-static">` (fallback)
- [ ] Add `<div id="units-dynamic" style="display:none;"></div>` container
- [ ] On Store tab show: call `fetchUnits()`, on success hide static/show dynamic, on failure keep static visible
- [ ] Add loading spinner while fetching
- [ ] Add error banner: "Live availability unavailable — showing sample units" (dismissible)

**API response shape (from PR #324):**
```json
{
  "units": [{ "id": "A-101", "unit_number": "A-101", "size_label": "10x10", "square_feet": 100, "price": 150.00, "tags": ["indoor","climate"], "website_description": "...", "image_url": "...", "can_rent": true, "can_reserve": false }],
  "filters": { "available_sizes": ["5x5","5x10","10x10","10x20"], "available_tags": ["indoor","climate","drive_up"] }
}
```

---

## Phase 2: Dynamic Filters [PENDING]

Replace hardcoded filter chips/size dropdown with API-driven filters.

- [ ] On `fetchUnits()` success, read `data.filters.available_sizes` and `data.filters.available_tags`
- [ ] Rebuild size `<select>` options from `available_sizes`
- [ ] Rebuild filter chips from `available_tags` (format: replace underscores with spaces, title case)
- [ ] `filterUnits()` now calls `fetchUnits({ tag, min_sqft, max_sqft })` with selected filter values
- [ ] Debounce filter calls (300ms) to avoid hammering API on rapid chip toggling
- [ ] Keep client-side filtering as immediate visual feedback, then reconcile with API response

---

## Phase 3: "Grab It!" Inline Form [PENDING]

Replace the 4-step rental modal with an inline micro-commitment form on each unit card.

- [ ] Add inline form template inside each unit card's details section:
  ```html
  <div class="grab-form" style="display:none;">
    <h4>Grab This Unit</h4>
    <input type="text" placeholder="Your name" required>
    <input type="email" placeholder="Email" required>
    <input type="tel" placeholder="Phone" required>
    <button class="btn-primary">Grab It!</button>
    <p class="grab-error" style="display:none;"></p>
  </div>
  ```
- [ ] "Rent The ___" button becomes "Grab It!" and toggles the inline form (no modal)
- [ ] On submit: POST to `{API_BASE}/public/units/{unit_id}/reserve/` with form data
  - Fields: `first_name`, `last_name` (split from name), `email`, `phone`, `password` (auto-generate temporary)
  - Content-Type: `application/x-www-form-urlencoded` (bridge-ai expects form POST)
- [ ] On success: show inline confirmation with redirect link to bridge-ai portal
  - "It's yours! Check your email to finish setup." + "Go to Portal" button linking to `{API_BASE}/portal/`
- [ ] On error (unit taken, validation): show inline error, re-enable form
- [ ] Delete `modal-storage-rental` (lines 1062-1146) — no longer needed
- [ ] Delete `showRentalStep()`, `selectSize()`, `selectPayment()` functions
- [ ] Update Golden Paths `PATHS` object — storage path steps reference new flow

---

## Phase 4: Polish + Edge Cases [PENDING]

- [ ] Units with `can_rent: false, can_reserve: true` show "Reserve" instead of "Grab It!"
- [ ] Units with both false show "Call for Availability" with phone number
- [ ] Mobile UX: form fields stack, button full-width (already Tailwind responsive)
- [ ] Add `source: "website-grab-it"` field to POST for conversion tracking
- [ ] XSS: sanitize all API response strings before DOM insertion (textContent, not innerHTML for user data)
- [ ] Test with bridge-ai running: `cd ~/code/bridge-ai && poetry run python manage.py runserver --settings=config.settings_v2`
- [ ] Test without bridge-ai: verify static fallback cards display correctly
- [ ] Verify CORS works (no console errors)

---

## Files Modified

| File | Change |
|------|--------|
| `index_clean.html` | Store tab HTML (unit containers, inline form template), JS (fetchUnits, renderUnits, grabUnit, filter rewire), delete rental modal + related JS |

## Open Questions

1. **Password**: The bridge-ai `unit_reserve_or_rent` view requires a password field to create a BaseUser account. Options:
   - Auto-generate a random password, email a reset link (best UX — user doesn't set password on marketing site)
   - Add a password field to the Grab It form (worse UX but simpler)
   - **Recommendation**: Auto-generate + email reset link. Need to confirm bridge-ai supports this flow.

2. **CSRF**: bridge-ai POST endpoints require CSRF tokens. The current `unit_reserve_or_rent` is a Django form view, not a JSON API. May need a new lightweight JSON endpoint (`POST /public/units/{id}/apply/`) that creates a `RentalApplication` without requiring CSRF/auth. The integration spec lists this endpoint — need to check if it exists.
