# Testing & Validation

> Visual verification, accessibility, and responsive testing for the Bridge Storage website

**Priority:** Always

---

## TDD Workflow

**All feature changes require test-driven development:**

1. Write Playwright test specs first (define expected behavior)
2. Run tests, confirm they fail (red)
3. Implement the feature
4. Run tests, confirm they pass (green)
5. Use `/cpm` to commit, push, and merge

## OCR in UI Testing

**All UI tests MUST include OCR verification.** Use Tesseract OCR (via `tesseract.js` or system `tesseract`) to validate that rendered text content matches expectations. This catches:

- Text truncation or overflow issues
- Font rendering failures
- Dynamic content not loading
- Z-index / overlay problems hiding text

Example Playwright OCR pattern:
```javascript
// Screenshot the element, then OCR to verify visible text
const screenshot = await page.locator('.hero-section').screenshot();
// Use tesseract to extract text from screenshot
// Assert extracted text contains expected strings
```

## Testing Approach

This is a static frontend site with API integration. Testing focuses on:

1. **Visual verification** — Does the site render correctly?
2. **OCR verification** — Does rendered text match expected content?
3. **Accessibility** — Does it meet WCAG AA standards?
4. **Responsive** — Does it work on mobile, tablet, and desktop?
5. **API integration** — Do fetch() calls to bridge-ai work correctly?
6. **Error handling** — Does the site degrade gracefully when the API is unavailable?

## Manual Verification Checklist

Before committing changes:

- [ ] Open in browser, check all sections render
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1280px)
- [ ] Verify all images load (proper file paths, not base64)
- [ ] Check color contrast meets WCAG AA
- [ ] Verify all interactive elements are keyboard-accessible
- [ ] Test Flowbite components initialize (dropdowns, modals, etc.)
- [ ] Verify API calls succeed (check browser console for errors)
- [ ] Test with API unavailable (should show graceful error states)

## Chrome Automation Workflow

For iterative visual development with Claude Code:

1. **Serve locally**: `python -m http.server 8080`
2. **Start bridge-ai** (for API): `cd ~/code/bridge-ai && poetry run python manage.py runserver --settings=config.settings_v2`
3. **Use Claude-in-Chrome tools**: Navigate to `localhost:8080`, take screenshot
4. **Describe changes**: "Make the hero section taller on mobile"
5. **Implement**: Edit HTML/CSS/JS
6. **Validate**: Screenshot again, compare
7. **Repeat**: Refine until matching design intent

## Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | 375px | iPhone SE (primary) |
| Tablet | 768px | iPad portrait |
| Desktop | 1280px | Standard laptop |
| Wide | 1920px | External monitor |

## Accessibility Checks

| Check | Requirement |
|-------|-------------|
| Color contrast | 4.5:1 minimum for text |
| Touch targets | 44x44px minimum |
| Alt text | All meaningful images |
| Heading hierarchy | Sequential h1-h6 |
| Focus indicators | Visible on all interactive elements |
| Semantic HTML | nav, main, section, article |
| ARIA labels | Icon-only buttons |

## API Integration Testing

| Test | How |
|------|-----|
| Units load | Open storage page, verify unit cards appear |
| Filtering works | Click filter chips, verify results update |
| Calendar loads | Open spaces page, select a space, verify calendar |
| Time slots load | Select a date, verify available slots appear |
| Price calculates | Select a time slot, verify price displays |
| RSVP works | Open events page, click RSVP on an event |
| Error handling | Stop bridge-ai server, verify graceful degradation |
| CORS | Verify no CORS errors in browser console |
