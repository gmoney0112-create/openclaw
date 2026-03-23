# Workflow Engine

HTTP service for triggering and polling n8n workflows from OpenClaw.

## Features

- Loads workflow definitions from config
- Validates required payload fields before trigger
- Triggers n8n webhooks
- Polls execution status through the n8n API
- Normalizes execution results for callers

## Endpoints

- `POST /workflow/trigger`
- `POST /workflow/trigger-and-wait`
- `GET /workflow/status/:executionId`
- `GET /workflow/list`
- `GET /workflow/health`

## Environment

- `N8N_API_KEY`
- `N8N_WEBHOOK_BASE_URL`
- `WORKFLOW_ENGINE_URL`
- `WORKFLOW_WEBHOOK_CREATE_GHL_CONTACT`
- `WORKFLOW_WEBHOOK_CREATE_GHL_OPPORTUNITY`
- `WORKFLOW_WEBHOOK_GENERATE_STRIPE_PAYMENT_LINK`
- `WORKFLOW_WEBHOOK_SEND_ONBOARDING_EMAIL_SEQUENCE`
- `WORKFLOW_WEBHOOK_LAUNCH_MARKETING_CAMPAIGN`
- `WORKFLOW_WEBHOOK_UPDATE_CRM_STAGE`
