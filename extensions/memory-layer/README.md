# Memory Layer

Persistent vector memory service for OpenClaw.

## Features

- Stores memories with embeddings and tags
- Retrieves semantically similar memories
- Uses Supabase pgvector when configured
- Falls back to a local in-memory store for development and tests

## Endpoints

- `POST /memory/store`
- `POST /memory/retrieve`
- `GET /memory/list`
- `DELETE /memory/:id`
- `GET /memory/health`

## Environment

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `CHROMA_URL`
- `MEMORY_LAYER_URL`
