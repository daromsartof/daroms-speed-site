# Security policy

## Supported versions

Security fixes land on the latest minor release. Sites pin `core/` to a tag: run `pnpm dss upgrade` to receive them.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub:
[Report a vulnerability](https://github.com/daromsartof/daroms-speed-site/security/advisories/new).
Do not open a public issue.

Include the affected version, the component (CLI, a core package, the site template, the AI hooks, AimKit), steps to
reproduce and the impact. You will get an acknowledgement within 5 working days and a fix or a plan within 30 days.

## Scope

In scope: the `dss` CLI, `@dss/*` packages, the site template and its defaults (CSP, headers, `safeAction`, env
handling), the Claude Code hooks and settings shipped in `_ai/`, and the vendored AimKit bridge.

Out of scope: vulnerabilities in a generated site's own code after it was modified, and issues in third-party
dependencies already reported upstream.
