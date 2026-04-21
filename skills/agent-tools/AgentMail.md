# Agent Mail Skill

## Description
Programmatic email automation for AI agents. Send, receive, and process emails autonomously with API-first email platform.

## When to Use This Skill
- Automating customer support emails
- Sending bulk email campaigns
- Handling email verification flows
- Creating email nurture sequences
- Processing inbound email inquiries

## Prerequisites
1. Agent Mail account (https://agentmail.to)
2. API key from Agent Mail dashboard
3. OpenClaw configured with agentmail.api_key

## Quick Start

### Basic Email Send
```bash
openclaw agentmail send \
  --to "client@example.com" \
  --subject "Your Tree Service Estimate" \
  --body "Hi {{name}}, here's your estimate..." \
  --from "estimates@heavenlyarborcare.com"
```

### Check Inbox
```bash
openclaw agentmail inbox list
openclaw agentmail messages --unread
```

### Auto-Reply Setup
```bash
openclaw agentmail auto-reply \
  --inbox "support@heavenlyarborcare.com" \
  --template "support_response.md" \
  --keywords "help,urgent,problem"
```

## Common Use Cases

### 1. Estimate Request Confirmation
```bash
# Auto-confirm estimate requests
openclaw agentmail estimate-confirm \
  --trigger "form-submitted" \
  --template "estimate_confirmation.md" \
  --data "client_data.json"
```

### 2. Emergency Follow-up
```bash
# Send post-emergency survey
openclaw agentmail emergency-followup \
  --client "emergency_client.json" \
  --delay "24h" \
  --template "post_emergency_survey.md"
```

### 3. Nurture Sequence
```bash
# Setup 30-day email sequence
openclaw agentmail sequence create \
  --name "tree-service-nurture" \
  --emails "day0.md,day3.md,day7.md,day14.md,day30.md" \
  --trigger "new-lead"
```

## Integration Examples

### With HereNow
```bash
# Publish content and email link
openclaw herenow publish --file "report.md" | \
openclaw agentmail send --subject "New Report" --body "View: {{url}}"
```

### With Remotion
```bash
# Send video via email
openclaw remotion render --composition "WelcomeVideo" | \
openclaw agentmail send --attach "video.mp4" --subject "Welcome Video"
```

## Templates Directory
Store email templates in `~/templates/agentmail/`:
- `estimate_confirmation.md`
- `emergency_followup.md`
- `support_response.md`
- `newsletter_template.md`

## Configuration
```bash
# Set API key
openclaw config set agentmail.api_key YOUR_KEY

# Set default inbox
openclaw config set agentmail.default_inbox YOUR_INBOX_ID

# Configure webhooks
openclaw config set agentmail.webhook_url YOUR_WEBHOOK
```

## Troubleshooting
```bash
# Test connection
openclaw agentmail test

# Check quota
openclaw agentmail quota

# View logs
openclaw agentmail logs --tail
```

## Resources
- [Documentation](https://docs.agentmail.to)
- [OpenClaw Integration](https://docs.agentmail.to/integrations/openclaw)
- [API Reference](https://docs.agentmail.to/api)