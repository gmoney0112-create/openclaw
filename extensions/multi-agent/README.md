# Multi-Agent

Department-based orchestration service for OpenClaw.

## Features

- Routes commands to department agents
- Tracks async task state with retry metadata
- Exposes dispatch and status APIs
- Uses in-memory state locally and keeps Redis-friendly boundaries

## Endpoints

- `POST /agent/dispatch`
- `GET /agent/status/:taskId`
- `GET /agent/health`

## Environment

- `REDIS_URL`
- `WORKFLOW_ENGINE_URL`
- `BROWSER_CLUSTER_URL`
- `MEMORY_LAYER_URL`
- `LLM_ROUTER_URL`
