# Security Rules

> Security considerations for the prototype and planning repository

**Priority:** Always

---

## Secrets Management

**CRITICAL**:
- Never commit API keys, tokens, or passwords
- The `download_instagram.py` script may contain credentials — verify before committing
- Use `.env` files for any script credentials (gitignored)
- Never embed real customer data in prototype HTML

## Content Security

- No real customer PII in the prototype
- Use placeholder names/emails/phones in mockups
- Facility address is public information (OK to include)
- Staff contact info: use generic emails (info@bridgestorage.com)

## Photo Assets

- Facility photos are proprietary — do not upload to public CDNs without authorization
- Instagram photos may have copyright considerations
- Base64-encoded photos in HTML make the repo very large — consider `.gitignore` for large assets

## .gitignore Recommendations

```
.env
*.pyc
__pycache__/
.DS_Store
node_modules/
```

## Integration Security

When the BUILDPLAN.md is implemented in bridge-ai:
- All public JSON endpoints must be rate-limited
- No auth tokens exposed in client-side code
- Stripe payments go through server-side portal (never client-side)
- SMS opt-in must comply with TCPA regulations
