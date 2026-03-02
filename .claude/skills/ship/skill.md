---
name: ship
description: One-command commit, push, PR creation, and verification
user_invocable: true
---

# /ship — Ship Changes End-to-End

When invoked:

## Full Workflow

1. **Pre-flight checks**:
   - Verify not on `main`
   - Check for uncommitted changes
   - Review for secrets or large binaries

2. **Stage and commit**:
   ```bash
   git add <specific files>
   git commit -m "type(scope): message"
   ```

3. **Push**:
   ```bash
   git push -u origin <branch>
   ```

4. **Create PR**:
   ```bash
   gh pr create --title "type(scope): subject" --body "$(cat <<'EOF'
   ## Summary
   - bullet points

   ## Visual Changes
   [describe any visual/design changes]

   ## Checklist
   - [ ] Tested in browser
   - [ ] Mobile responsive
   - [ ] Accessibility verified

   Generated with Claude Code
   EOF
   )"
   ```

5. **Report**:
   - Print PR URL
   - Note any warnings (large files, etc.)

## Arguments

- `/ship` — Full workflow with PR
- `/ship --no-pr` — Commit and push only
- `/ship --draft` — Create draft PR
