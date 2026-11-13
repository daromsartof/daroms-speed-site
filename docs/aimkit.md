# Visual edits with AimKit

> Pick an element in the browser, type the change, and Claude Code opens the exact file and line.

AimKit (vendored in `core/packages/aimkit`) is a Chrome extension plus a local bridge. Clicking an element writes a
compact `context.md` into `.claude-context/`: abridged HTML, the CSS rules that win with `file:line`, the source
`file:line` of the component, and an optional screenshot.

## Setup, once per machine

```bash
pnpm dss aimkit setup    # copies the extension to ~/AimKit/extension
```

Load it in `chrome://extensions` (Developer mode, Load unpacked), then open the pairing link printed by
`pnpm dss aimkit token`.

## Daily use

`pnpm dss dev` starts Next.js and the bridge together. In the page, press Alt+Shift+E, click an element, type the
request. Then in Claude Code paste the `@.claude-context/...` line or run `/dss-edit`: the aimkit MCP server returns the
latest context (text first, screenshot only when it matters).

Contexts are always written in English for the agent; the extension interface keeps its own language. Page content is
treated as data, never as instructions.
