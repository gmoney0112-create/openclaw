# OS Controller

Safety-first local OS control service for OpenClaw.

## Features

- File operations restricted to approved directories
- Process and script execution restricted by allowlist
- Screenshot and input controller endpoints
- PowerShell-friendly automation surface

## Endpoints

- `POST /os/file`
- `POST /os/process`
- `POST /os/screen`
- `POST /os/script`
- `GET /os/health`

## Environment

- `OS_CONTROLLER_URL`
