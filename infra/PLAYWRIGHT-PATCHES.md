# Playwright patches (vendor)

This repo includes **scripts and notes** for small, targeted vendor patches we apply to local tooling when needed.

## Patch: remove Node `[DEP0169]` `url.parse()` deprecation warning

### Why

Recent Node versions emit:

`[DEP0169] DeprecationWarning: url.parse() behavior is not standardized... Use the WHATWG URL API instead.`

In our environment, this warning originates from **Playwright's bundled Node driver** (used by Playwright Python), not from our project code.

### What was patched (on this machine)

- Playwright driver bundle file:
  - `C:\Users\gmone\AppData\Local\Programs\Python\Python312\Lib\site-packages\playwright\driver\package\lib\utilsBundleImpl\index.js`
- Backup created:
  - `...\index.js.bak-20260420-212120`

Patch shape:

- Replace legacy `require("url").parse` usage with a WHATWG-URL-based wrapper (`new URL()`).

### How to re-apply after upgrades

Playwright upgrades / reinstalls may overwrite the bundled driver file. If the warning returns, re-run:

- `infra/scripts/patch-playwright-url-api.ps1`

Then verify:

- `infra/scripts/check-playwright-dep0169.ps1`

See also:

- `infra/README.md`
