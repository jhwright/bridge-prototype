---
name: push
description: Commit changes, push to remote, and optionally create a PR
user_invocable: true
---

# /push — Commit and Push Workflow

When invoked:

## Steps

1. **Check branch**: Verify NOT on `main`. If on main, create a feature branch first.

2. **Stage changes**:
   ```bash
   git status
   git diff --stat
   ```

3. **Draft commit message**: Analyze changes and write a concise commit message:
   ```
   type(scope): subject
   ```
   Types: `feat`, `fix`, `docs`, `style`, `chore`
   Scopes: `prototype`, `photos`, `planning`, `brand`, `assets`

4. **Commit**:
   ```bash
   git add <specific files>
   git commit -m "type(scope): message"
   ```

5. **Push**:
   ```bash
   git push -u origin <branch>
   ```

6. **Optionally create PR**: If user says "with PR" or branch is ready:
   ```bash
   gh pr create --title "..." --body "## Summary\n..."
   ```

## Safety Checks

- Never push to `main` directly
- Never use `--force` without explicit user request
- Review staged files for secrets (.env, credentials, API keys)
- Warn if committing large binary files (photos > 5MB)
