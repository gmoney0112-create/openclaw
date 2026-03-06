# OpenClaw → Railway Deployment Handoff

**Repo:** https://github.com/gmoney0112-create/openclaw  
**Cloud:** Railway (https://railway.com/dashboard)  

This document is for a browser-based AI assistant to finish deploying OpenClaw to Railway.

***

## 1. Where this file lives

- GitHub repository: `gmoney0112-create/openclaw`
- Path: `deployment/railway-handoff.md`
- The assistant should:
  - Open the repo in GitHub
  - Navigate to `deployment/railway-handoff.md`
  - Use this file as the deployment runbook

***

## 2. Current Railway state (context)

From prior work, the user has already interacted with Railway as follows:

- Railway dashboard has been opened: `https://railway.com/dashboard`
- A GitHub integration/installation flow was started for the Railway GitHub App:
  - `https://github.com/apps/railway-app/installations`
  - `https://github.com/apps/railway-app/installations/new/permissions?target_id=253743093`
- A “New Project from GitHub” flow was accessed:
  - `https://railway.com/new/github`
- Railway marketing/home page has been visited:
  - `https://railway.com`

Assumption for you (assistant):  
If a Railway project for `gmoney0112-create/openclaw` does not exist yet, you should create one using the GitHub deployment flow. If it already exists, proceed to configuration and deployment checks.

***

## 3. Objectives for this assistant

1. Ensure the OpenClaw repository is correctly connected to Railway via the GitHub App.
2. Create (or verify) a Railway project that deploys the OpenClaw app from `gmoney0112-create/openclaw`.
3. Configure required environment variables, secrets, and build/runtime settings.
4. Trigger a deploy and confirm it reaches a healthy state.
5. Capture and output:
   - Public URL of the deployed service
   - Any necessary environment variables for downstream systems (e.g., n8n, Telegram bot, Webhooks)
   - A brief “how to redeploy” note

***

## 4. Step-by-step tasks for the assistant

### 4.1. Verify GitHub → Railway connection

1. Open `https://railway.com/dashboard`.
2. Go to the account’s GitHub integration / services section.
3. Confirm:
   - The GitHub App “Railway” is installed on the `gmoney0112-create` GitHub account.
   - The `openclaw` repository is accessible to Railway.
4. If not installed:
   - Follow the existing authorization link:
     - `https://github.com/apps/railway-app/installations`
   - Install the app on the correct GitHub account and include the `openclaw` repo.

### 4.2. Create or locate the OpenClaw project

1. From Railway dashboard, open any existing project that clearly references `openclaw`.  
2. If none exists:
   - Click “New Project”.
   - Choose “Deploy from GitHub”.
   - Select `gmoney0112-create/openclaw`.
3. Name the project clearly, for example: `openclaw-ai-coo`.

Record in your response:
- Project name
- Railway project URL
- Service name(s) inside the project

***

## 5. Inspect repo and determine service type

Assistant actions inside GitHub:

1. Open `https://github.com/gmoney0112-create/openclaw`.
2. Inspect:
   - `Dockerfile` (if present)
   - `Procfile`, `railway.toml`, or similar deployment files (if present)
   - Package files such as:
     - `package.json` (Node)
     - `pyproject.toml` / `requirements.txt` (Python)
     - Any custom server entrypoints (e.g., `main.py`, `server.py`, `index.js`, etc.)

Based on what you find:

- If a Dockerfile exists:
  - Use “Deploy Dockerfile” or equivalent in Railway.
- If it’s a Node/Express/Fastify/Next/etc. app:
  - Use the default Node template, adjust start command according to `package.json`.
- If it’s a Python app:
  - Set Python runtime, install deps from `requirements.txt` or `pyproject.toml`, and set the correct start command.

Explicitly document in your output:
- Detected language and framework.
- Build command.
- Start command.
- Port environment variable (e.g., `PORT`) if required.

***

## 6. Configure environment variables and secrets

1. In the Railway project, open the “Variables” or “Environment” section.
2. Determine from the repo what variables are needed:
   - Look for `.env.example`, `env.sample`, or references like `os.getenv(...)`, `process.env.XYZ`, etc.
3. For each required variable:
   - If value is clearly defined in the repo (e.g. non-secret constants), set it directly.
   - If it is a secret (API keys, tokens, DB URLs), and not available:
     - Do NOT invent values.
     - Instead, list the missing variables in your final message, clearly indicating that the human needs to populate them in Railway before the app can fully function.

At minimum, identify and list:
- Required variables (names).
- Any variable you managed to set automatically from repo defaults.
- Any variables still missing and required user input.

***

## 7. Build and deploy

1. Trigger a deploy/build from the Railway project dashboard.
2. Monitor:
   - Build logs for errors (missing dependencies, wrong commands).
   - Deploy logs to ensure the service starts and listens on the correct port.
3. If build fails:
   - Capture last 20–30 lines of error log.
   - Suggest specific file or config changes in the repo to fix the issue (e.g., update start command, add `PORT` usage, adjust Dockerfile).

4. If deployment succeeds:
   - Confirm service is “Running” or equivalent healthy status.
   - Open the generated public URL.
   - Verify basic health:
     - Check root path `/`.
     - If a `/health` or similar endpoint is mentioned in the code, test that as well.

***

## 8. Outputs required from the assistant

In your final reply to the user, include:

1. **Railway Project Information**
   - Project name.
   - Project URL.
   - Service name(s) and status.

2. **Deployment Configuration**
   - Language/framework detected.
   - Build command used.
   - Start command used.
   - Any special Railway settings (e.g., port, Docker image).

3. **Environment Variables**
   - List of all required variables discovered.
   - Which ones are set (with values redacted or marked “set”).
   - Which ones require user input (no dummy values).

4. **Deployment Status**
   - Whether deploy succeeded or failed.
   - If succeeded: public URL(s) and which endpoint seems healthy.
   - If failed: brief root cause summary plus log snippet and recommended next fix.

5. **Next actions for the user**
   - Any secrets they must add in Railway.
   - Any repo changes recommended (e.g., update Dockerfile or start script).
   - How to redeploy after making changes:
     - “Push to `main` branch” or
     - “Click Deploy in Railway UI” (specify path).

***

## 9. Notes for other assistants

- Do not expose secrets or tokens in plain text in responses.
- If you encounter permission issues with GitHub or Railway:
  - Explain clearly which account and permission is missing.
  - Ask the user to log in as the correct owner and grant access.
- Keep all commands, URLs, and config values explicit in your answer so the user can manually reproduce the steps if needed.
