# Deploy: Docker / self-host

> `deploy.target: 'docker'` builds standalone output; `pnpm docker:build` then run behind a TLS proxy (Coolify, Dokploy, Caddy).

- The image runs as a non-root user on port 3000 with a healthcheck. Pass env at runtime, never bake secrets in the image.
- Set `DSS_ENV=preview` for staging builds so robots and metadata stay noindex.
