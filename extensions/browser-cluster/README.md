# Browser Cluster

Upgrade 01 for the OpenClaw Super-Upgrade build. This service exposes a standalone HTTP API for managing parallel Playwright browser sessions with optional proxy rotation and captcha solving.

## Files

- `main.ts` bootstraps the HTTP API on port `3100` by default.
- `src/browser-pool-manager.ts` manages session lifecycle and pool limits.
- `src/playwright-controller.ts` executes browser actions.
- `src/proxy-rotator.ts` assigns one proxy per session.
- `src/captcha-solver.ts` wraps optional 2captcha integration.

## Required environment variables

- `NODE_OPTIONS=--max-old-space-size=768`
- `CAPTCHA_API_KEY` for live captcha solving
- `BROWSER_CLUSTER_PORT` to override the default port
- `BROWSER_CLUSTER_CONFIG` to override the config path

## API

- `GET /browser/health`
- `POST /browser/open`
- `POST /browser/action`
- `POST /browser/scrape`
- `DELETE /browser/session/:id`

## Run

```powershell
$env:NODE_OPTIONS="--max-old-space-size=768"
npm install
npx playwright install chromium
npm run start
```

## Test

```powershell
$env:TEST_TARGET_URL="https://www.google.com"
npm run test
```
