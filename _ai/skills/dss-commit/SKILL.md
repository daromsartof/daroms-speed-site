---
name: dss-commit
description: Commits the current work with a conventional message after a quick doctor check.
argument-hint: "[scope or summary]"
context: fork
background: false
model: haiku
---

# /dss-commit: commit

Hint: $ARGUMENTS

1. `pnpm dss doctor --quick`; stop and report if it fails.
2. `git status --short` and `git diff --stat`; never stage `.env*`, `.dev.vars`, `.claude-context/`, `.dss/`.
3. Message: `type(scope): summary` (feat, fix, content, style, seo, chore), English, under 72 characters; body only if needed.
4. `git add -A && git commit -m "..."`. **Stop**: the commit line.
