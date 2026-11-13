---
name: dss-section
description: Creates or reshapes one section - registry variant when one fits, otherwise a bespoke component - typed props from content, DNA tokens only.
argument-hint: "<name or registry id> [--page /route] [instruction]"
context: fork
background: false
model: sonnet
effort: medium
---

# /dss-section: one section

Target: $ARGUMENTS

1. Read `core/CATALOG.md > Registry sections` and `site.spec.md > Design`.
2. Registry fits: `pnpm dss add section <id>/<variant> --page <route>`. Otherwise `pnpm dss g section <name> --page <route>`.
3. Write the component: exported `XProps` + `X`, server component, @dss/ui primitives, DNA token classes, layout from the DNA grid.
   Interactivity in a small client child. Keep the `@catalog` line true (one sentence + props).
4. Put the copy in the page's content file under the section key (placeholders if facts are missing).
5. `pnpm dss doctor`. **Stop**: file path and one line on the layout idea.
