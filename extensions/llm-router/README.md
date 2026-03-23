# LLM Router

Upgrade 02 for the OpenClaw Super-Upgrade build. This extension exposes a standalone HTTP router for selecting the best LLM provider and model per task type, with config-driven routing and fallback support.

## Files

- `main.ts` starts the HTTP API on port `3101` by default.
- `config.json` stores routing rules and defaults.
- `src/task-classifier.ts` infers `task_type` when a request does not supply one.
- `src/model-selector.ts` resolves primary and fallback provider models from config.
- `src/provider-adapters.ts` wraps OpenAI, Anthropic, Groq, and DeepSeek behind a common interface.
- `src/fallback-chain.ts` retries on provider failure and logs attempts.

## Required environment variables

- `NODE_OPTIONS=--max-old-space-size=768`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `DEEPSEEK_API_KEY`
- `LLM_ROUTER_URL=http://localhost:3101`

## API

- `POST /llm/complete`
- `GET /llm/health`
- `GET /llm/routing`
- `POST /llm/routing/update`

## Run

```powershell
$env:NODE_OPTIONS="--max-old-space-size=768"
npm install
npm run build
npm run start
```

## Test

```powershell
npm run test
```
