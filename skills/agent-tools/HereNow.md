# HereNow Skill

## Description
Instant web hosting for AI agents. Publish content, documents, and tools with instant URLs.

## When to Use This Skill
- Creating client portals for estimates
- Publishing project documentation
- Hosting emergency response reports
- Sharing training materials
- Creating marketing landing pages

## Prerequisites
1. HereNow account (https://here.now)
2. API key from HereNow dashboard
3. OpenClaw configured with herenow.api_key

## Quick Start

### Publish Content
```bash
# Publish markdown file
openclaw herenow publish \
  --file "estimate.md" \
  --title "Tree Service Estimate" \
  --visibility private

# Publish HTML content
openclaw herenow publish \
  --html "<h1>Welcome</h1><p>Content here</p>" \
  --title "Client Portal"
```

### Manage Sites
```bash
# List all sites
openclaw herenow sites list

# Get site details
openclaw herenow sites get --id SITE_ID

# Delete site
openclaw herenow sites delete --id SITE_ID
```

### Security Features
```bash
# Password protect
openclaw herenow protect --id SITE_ID --password "client123"

# Enable payment
openclaw herenow monetize --id SITE_ID --price "0.001 ETH"
```

## Common Use Cases

### 1. Client Estimate Portals
```bash
# Create secure client portal
openclaw herenow client-portal \
  --client "john_smith.json" \
  --estimate "estimate_123.md" \
  --photos "tree_photos/" \
  --password "john123" \
  --title "Your Tree Service Estimate"
```

### 2. Emergency Documentation
```bash
# Document emergency response
openclaw herenow emergency-doc \
  --emergency-id "EMG-2026-001" \
  --photos "before_after/" \
  --notes "response_notes.md" \
  --title "Emergency Response Report"
```

### 3. Training Materials
```bash
# Publish crew training
openclaw herenow training \
  --modules "safety.md,equipment.md" \
  --videos "training_videos/" \
  --title "Crew Training Portal"
```

## Integration Examples

### With Agent Mail
```bash
# Publish and email link
openclaw herenow publish --file "report.md" | \
openclaw agentmail send --subject "Report Published" --body "View: {{url}}"
```

### With Remotion
```bash
# Host video content
openclaw remotion render --composition "TrainingVideo" | \
openclaw herenow publish --title "Training Video" --type video
```

## Templates Directory
Store site templates in `~/templates/herenow/`:
- `client_portal.html`
- `emergency_report.html`
- `training_portal.html`
- `estimate_presentation.html`

## Configuration
```bash
# Set API key
openclaw config set herenow.api_key YOUR_KEY

# Set default visibility
openclaw config set herenow.default_visibility private

# Configure output directory
openclaw config set herenow.output_dir "./published_sites"
```

## Advanced Features

### Custom Domains
```bash
# Use custom domain
openclaw herenow domain setup \
  --domain "estimates.heavenlyarborcare.com" \
  --site-id SITE_ID
```

### Analytics
```bash
# Get site analytics
openclaw herenow analytics \
  --id SITE_ID \
  --period "7d" \
  --metrics "views,visitors"
```

### Bulk Operations
```bash
# Publish multiple sites
openclaw herenow bulk publish \
  --directory "client_portals/" \
  --template "portal_template.html"
```

## Troubleshooting
```bash
# Test connection
openclaw herenow test

# Check API status
openclaw herenow status

# View publishing logs
openclaw herenow logs --site SITE_ID
```

## Resources
- [Documentation](https://docs.here.now)
- [OpenClaw Integration](https://docs.here.now/integrations/openclaw)
- [API Reference](https://docs.here.now/api)