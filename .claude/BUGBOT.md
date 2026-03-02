# BUGBOT — PR Review Instructions

When reviewing PRs for this repository, check:

## 1. Design Fidelity

- Does the change match the prototype (`bridge-mobile-design.html`)?
- Are brand colors used correctly (#DF562A, #faf7f3, #2a2520)?
- Is Inter font used (not Gotham or system fonts for display text)?
- Are Flowbite components used for interactive elements?

## 2. Code Quality

- No inline `style=""` attributes
- No Bootstrap or non-Tailwind classes
- Proper semantic HTML (nav, main, section, etc.)
- Alt text on all images
- Responsive classes present (sm:, md:, lg:)
- Vanilla JS only — no frameworks, no build step
- API calls use the config.js base URL, not hardcoded URLs

## 3. Accessibility

- Color contrast meets WCAG AA
- All interactive elements keyboard-accessible
- Proper heading hierarchy
- ARIA labels on icon-only buttons

## 4. Assets

- No secrets or credentials committed
- No unnecessarily large files (base64 images should be in prototype only)
- Photos have descriptive filenames
- `.gitignore` respected

## 5. API Integration

- All bridge-ai API calls go through the configured base URL
- POST requests include appropriate headers (Content-Type, CSRF)
- Error handling for API failures (timeout, unreachable, error responses)
- No hardcoded data that should come from the API
- No auth tokens or secrets in frontend code

## 6. Planning Docs

- BUILDPLAN.md changes are consistent with bridge-ai-integration.md
- Architecture decisions documented
- Known gotchas noted (font licensing, gallery/dance floor same room, etc.)

## 7. PR Hygiene

- Clear, descriptive title
- Summary explains what and why
- Feature branch (not main)
- Small, focused changes preferred
