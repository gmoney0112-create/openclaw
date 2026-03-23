# Auto Coder

Safety-gated self-improvement service for OpenClaw.

## Features

- Parses error logs to find file and line targets
- Generates simple corrective patches
- Applies and verifies fixture-safe patches
- Runs tests and tracks history
- Blocks deploy unless approval and `AUTO_DEPLOY=true`

## Endpoints

- `POST /autocoder/analyze`
- `POST /autocoder/patch`
- `POST /autocoder/deploy`
- `GET /autocoder/history`
- `GET /autocoder/health`

## Environment

- `AUTO_DEPLOY`
- `LLM_ROUTER_URL`
- `GITHUB_TOKEN`
