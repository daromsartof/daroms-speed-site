---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---
# Accessibility

> WCAG 2.2 AA: semantic HTML, visible focus, labelled controls, real alt text, contrast guaranteed by DNA tokens.

- Landmarks: header, nav (aria-label), main#main, footer. Headings in order, one h1.
- Buttons for actions, links for navigation; icon-only controls get aria-label; no div onClick.
- Forms: label per field, errors linked with aria-describedby, status announced (aria-live="polite").
- Keep `text-ink-muted` on surface/surface-2 only (contrast tested); text on images needs an overlay token.
- Touch targets >= 44px; no information by color alone.
