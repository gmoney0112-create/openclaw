# Skill Loader

Plugin marketplace service for OpenClaw skills.

## Features

- Discovers installed skills from `extensions/skills`
- Validates `skill.json` against schema
- Installs zip-packaged skills
- Executes skill tools through local runners

## Endpoints

- `GET /skills/catalog`
- `POST /skills/install`
- `POST /skills/run`
- `GET /skills/health`

## Environment

- `BROWSER_CLUSTER_URL`
- `LLM_ROUTER_URL`
- `WORKFLOW_ENGINE_URL`
