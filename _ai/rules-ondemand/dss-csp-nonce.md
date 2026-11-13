# Nonce CSP

> Only when a third party requires strict-dynamic: it forces dynamic rendering of every page and is incompatible with cacheComponents.

- Set `security.nonce: true` in the manifest (withDss drops the static CSP header), then add `proxy.ts` generating a nonce,
  setting `Content-Security-Policy` and `x-nonce` on the request (see node_modules/next/dist/docs, content-security-policy guide).
- Prefer the static CSP + presets; consider `experimental.sri` before nonces.
