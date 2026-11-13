---
name: dss-inspire
description: Collects visual references (AimKit inspiration images, curated galleries, optional MotionSites prompts) and distills them into concrete design notes in site.spec.md before the DNA is locked.
argument-hint: "[urls or keywords]"
---

# /dss-inspire: references, distilled

Input: $ARGUMENTS

1. Read `site.spec.md` (Voice, sites liked or hated) and `core/CATALOG.md > Archetypes`.
2. Gather 3-6 references: URLs given by the user, AimKit Inspiration captures in `.claude-context/` (aimkit MCP `list_contexts`),
   allow-listed galleries (awwwards, siteinspire, godly, land-book), or the MotionSites MCP if connected (one prompt, never stored raw).
3. For each reference keep one line: what to take (type contrast, grid, texture, motion moment, imagery) and what to leave.
4. Translate into DNA wishes: archetype candidates, mode, hue family, type mood, grid, texture, motion, 3D level, one signature moment.
5. Write `site.spec.md > Inspiration` (at most 12 lines). Never copy a layout one-to-one or reuse assets.
6. **Stop**: the DNA wishes in 2 lines.
