# Revenue Executor

Revenue orchestration service that wires OpenClaw automation actions to local extension APIs.

## Flow

1. Retrieves prior context from memory-layer (`/memory/retrieve`)
2. Dispatches the requested action to one of the service modules
3. Stores a compact execution summary to memory-layer (`/memory/store`)

## Endpoints

- `POST /revenue/execute`
- `GET /revenue/actions`
- `GET /revenue/health`

## Supported Actions

- `llm_complete`
- `workflow_trigger`
- `agent_dispatch`
- `skills_run`
- `research_run`
- `browser_action`
- `os_process`
- `voice_transcribe`
- `autocoder_analyze`

## Environment

- `LLM_ROUTER_URL` (default: `http://localhost:3101`)
- `MEMORY_LAYER_URL` (default: `http://localhost:3102`)
- `WORKFLOW_ENGINE_URL` (default: `http://localhost:3103`)
- `MULTI_AGENT_URL` (default: `http://localhost:3104`)
- `SKILL_LOADER_URL` (default: `http://localhost:3105`)
- `RESEARCH_ENGINE_URL` (default: `http://localhost:3106`)
- `OS_CONTROLLER_URL` (default: `http://localhost:3107`)
- `VOICE_OPERATOR_URL` (default: `http://localhost:3108`)
- `AUTO_CODER_URL` (default: `http://localhost:3109`)
- `BROWSER_CLUSTER_URL` (default: `http://localhost:3100`)
