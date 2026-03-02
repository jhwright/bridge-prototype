# Security Rules

> Security considerations for the Bridge Storage public website

**Priority:** Always

---

## Secrets Management

**CRITICAL**:
- Never commit API keys, tokens, or passwords
- The `download_instagram.py` script may contain credentials — verify before committing
- Use `.env` files for any script credentials (gitignored)
- Never embed real customer data in HTML pages
- No auth tokens, session keys, or Stripe keys in frontend code

## Frontend Security

| Risk | Mitigation |
|------|-----------|
| XSS | No `innerHTML` with user data; sanitize API responses before rendering |
| API keys in source | No secrets in JS — all auth happens in bridge-ai |
| Sensitive data exposure | Never store PII in localStorage or sessionStorage |
| CORS misconfiguration | bridge-ai must whitelist only this site's origin |
| Mixed content | All API calls and assets over HTTPS in production |

## Content Security

- No real customer PII in HTML pages
- Use placeholder names/emails/phones in mockups
- Facility address is public information (OK to include)
- Staff contact info: use generic emails (info@bridgestorage.com)

## Photo Assets

- Facility photos are proprietary — do not upload to public CDNs without authorization
- Instagram photos may have copyright considerations
- Base64-encoded photos in the prototype make the repo very large — production pages use file URLs from `photos/`

## .gitignore Recommendations

```
.env
.DS_Store
node_modules/
```

## API Integration Security

This site calls bridge-ai public JSON endpoints via `fetch()`. Security boundaries:

| Concern | Owner |
|---------|-------|
| Rate limiting public endpoints | bridge-ai |
| CORS allowed origins | bridge-ai |
| Input validation on POST data | bridge-ai (server-side) |
| Stripe payment processing | bridge-ai portal (never this site) |
| Auth tokens and sessions | bridge-ai portal (never this site) |
| SMS opt-in TCPA compliance | bridge-ai |
| Graceful error handling for API failures | This site |
| No secrets in frontend JS | This site |
