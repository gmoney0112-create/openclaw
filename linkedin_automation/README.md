# LinkedIn Outreach Helper (Manual-Only)

This folder intentionally **does not automate** LinkedIn actions (no auto-connect, no auto-messaging).

It helps you:

- Maintain a prospect list (`prospects.csv`)
- Generate consistent, personalized connection-note copy
- Log outcomes to `results/` for follow-ups

## Setup

```powershell
cd C:\Users\gmone\.openclaw\workspace\linkedin_automation
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
```

## Run

```powershell
.\.venv\Scripts\python run_manual.py
```

Output:

- `results/results_YYYYMMDD_HHMMSS.csv`
- (optional) `results/messages_YYYYMMDD_HHMMSS/` with per-prospect message text files

## Why manual-only?

Automating connection requests / messages can violate platform rules and can get accounts restricted.
This helper keeps the workflow structured while you perform the final actions yourself in the browser.

