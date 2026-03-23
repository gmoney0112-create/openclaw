# Research Engine

Autonomous research service for OpenClaw.

## Features

- Aggregates multiple search sources
- Scrapes and normalizes source content
- Extracts findings through an analyzer boundary
- Produces structured reports with citations

## Endpoints

- `POST /research/run`
- `GET /research/health`

## Environment

- `TAVILY_API_KEY`
- `FIRECRAWL_API_KEY`
- `SEARXNG_URL`
- `BROWSER_CLUSTER_URL`
- `LLM_ROUTER_URL`
