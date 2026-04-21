---
name: ghl-health
description: Check GoHighLevel integration status for OpenClaw and return connected/not-connected.
user-invocable: true
disable-model-invocation: true
---

# GHL Health Command

Use this skill when the user asks whether GoHighLevel is connected or integrated with OpenClaw.

## Required checks

1. Run this command from `C:\Users\gmone\.openclaw\workspace\integrations\gohighlevel`:

```powershell
$env:GHL_LOGGING='off'; node scripts/health-check.js
```

2. Parse the JSON output and report:
- `contacts.ok`
- `pipelines.ok`
- `opportunities.ok`
- counts/totals when present

3. Return one of these outcomes:
- `CONNECTED`: all three `ok` fields are `true`
- `PARTIAL`: auth works but one or more endpoint checks fail
- `NOT CONNECTED`: auth fails or command fails

## Output format

Return exactly this structure:

```text
GHL_STATUS: <CONNECTED|PARTIAL|NOT CONNECTED>
AUTH: <OK|FAILED|UNKNOWN>
CONTACTS: <OK|FAILED> (count=<n or NA>)
PIPELINES: <OK|FAILED> (count=<n or NA>)
OPPORTUNITIES: <OK|FAILED> (count=<n or NA>, total=<n or NA>)
TIMESTAMP: <ISO8601 from report or current time>
```

If the command errors, include the concise error reason on one extra line:

`ERROR: <message>`
