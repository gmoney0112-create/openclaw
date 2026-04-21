# Agent Tools Suite

## Description
Complete suite of agent tools for content creation, publishing, and distribution. Includes Agent Mail (email automation), HereNow (web hosting), and Remotion (video creation).

## When to Use This Skill
- Automating client communication
- Creating and distributing marketing content
- Building client portals and documentation
- Producing professional videos
- Setting up complete content pipelines

## Tools Included

### 1. Agent Mail
**Purpose:** Programmatic email automation for AI agents
**Use Cases:**
- Customer support automation
- Email nurture sequences
- Bulk email campaigns
- Auto-responders

### 2. HereNow
**Purpose:** Instant web hosting for agent-created content
**Use Cases:**
- Client estimate portals
- Project documentation sites
- Emergency response reports
- Training material hosting

### 3. Remotion
**Purpose:** Programmatic video creation using React
**Use Cases:**
- Estimate presentation videos
- Training and safety videos
- Marketing content
- Emergency documentation videos

### 4. OpenManus
**Purpose:** Cloud task execution and offloaded multi-step analysis
**Use Cases:**
- Lead segmentation and labeling
- Persistent analysis tasks
- Async research or planning handoffs
- Manus-backed AI COO workflows

## Quick Start

### Installation
```bash
# Install all tools
openclaw tools install agent-mail herenow remotion

# Configure API keys
openclaw config set agentmail.api_key YOUR_KEY
openclaw config set herenow.api_key YOUR_KEY
openclaw config set remotion.project_path /path/to/project
```

### Basic Usage
```bash
# Test all tools
openclaw tools test --all

# Get tool status
openclaw tools status
```

## Integrated Workflows

### Workflow 1: Estimate Delivery Pipeline
```bash
# Complete estimate delivery
openclaw workflow estimate-delivery \
  --client "client_data.json" \
  --steps "remotion,herenow,agentmail"
```

**Steps:**
1. Create estimate video (Remotion)
2. Host on client portal (HereNow)
3. Email client with links (Agent Mail)

### Workflow 2: Emergency Documentation
```bash
# Document emergency response
openclaw workflow emergency-doc \
  --emergency-id "EMG-001" \
  --steps "herenow,agentmail,remotion"
```

**Steps:**
1. Create emergency report site (HereNow)
2. Notify stakeholders (Agent Mail)
3. Create timeline video (Remotion)

### Workflow 3: Marketing Campaign
```bash
# Create and distribute marketing
openclaw workflow marketing-campaign \
  --content "campaign_brief.json" \
  --steps "remotion,herenow,agentmail,social"
```

**Steps:**
1. Create promotional video (Remotion)
2. Host content gallery (HereNow)
3. Email campaign (Agent Mail)
4. Social media posts

## Common Commands

### Agent Mail Commands
```bash
# Send email
openclaw agentmail send --to "client@example.com" --subject "Hello"

# Check inbox
openclaw agentmail inbox list

# Setup auto-reply
openclaw agentmail auto-reply --inbox "support@" --template "response.md"
```

### HereNow Commands
```bash
# Publish content
openclaw herenow publish --file "document.md" --title "My Doc"

# Manage sites
openclaw herenow sites list

# Security settings
openclaw herenow protect --id SITE_ID --password "secure123"
```

### Remotion Commands
```bash
# Create video
openclaw remotion render --composition "WelcomeVideo" --output "video.mp4"

# Generate components
openclaw remotion component create --name "EstimateVideo" --template "explainer"

# Preview video
openclaw remotion preview --composition "TrainingVideo"
```

## Configuration

### Environment Setup
```bash
# Set all API keys
openclaw config set agentmail.api_key $AGENTMAIL_KEY
openclaw config set herenow.api_key $HERENOW_KEY
openclaw config set remotion.license_key $REMOTION_KEY

# Set default paths
openclaw config set remotion.project_path "./video-project"
openclaw config set herenow.output_dir "./published-sites"
openclaw config set agentmail.templates_dir "./templates/agentmail"
```

### Webhook Configuration
```bash
# Setup webhooks for all tools
openclaw webhooks setup \
  --tools "agentmail,herenow,remotion" \
  --url "https://your-server.com/webhooks" \
  --events "all"
```

## Templates Directory Structure
```
templates/
├── agentmail/
│   ├── estimate_confirmation.md
│   ├── emergency_followup.md
│   └── support_response.md
├── herenow/
│   ├── client_portal.html
│   ├── emergency_report.html
│   └── training_portal.html
└── remotion/
    ├── estimate_presentation.tsx
    ├── emergency_timeline.tsx
    └── training_video.tsx
```

## Use Cases for Heavenly Arbor

### 1. Client Onboarding
- Welcome video (Remotion)
- Client portal with resources (HereNow)
- Email sequence (Agent Mail)

### 2. Estimate Process
- Personalized estimate video (Remotion)
- Secure estimate portal (HereNow)
- Follow-up emails (Agent Mail)

### 3. Emergency Response
- Emergency report site (HereNow)
- Stakeholder notifications (Agent Mail)
- Timeline documentation video (Remotion)

### 4. Marketing & Growth
- Promotional videos (Remotion)
- Content galleries (HereNow)
- Email campaigns (Agent Mail)
- Social media distribution

## Troubleshooting

### Common Issues
```bash
# Test tool connections
openclaw tools test --verbose

# Check quotas and limits
openclaw tools quota

# View logs
openclaw tools logs --tail
```

### Debug Commands
```bash
# Test complete integration
openclaw integration test --full

# Check data flow
openclaw data-flow --source remotion --destination agentmail

# Monitor operations
openclaw monitor live --tools all
```

## Resources

### Documentation
- [Agent Mail Docs](https://docs.agentmail.to)
- [HereNow Docs](https://docs.here.now)
- [Remotion Docs](https://www.remotion.dev/docs)
- [OpenClaw Integration Guide](https://docs.openclaw.ai/integrations)

### Community
- [OpenClaw Discord](https://discord.gg/openclaw)
- [Agent Mail Community](https://community.agentmail.to)
- [Remotion Discord](https://remotion.dev/discord)

### Support
```bash
# Get help for specific tool
openclaw support --tool agentmail
openclaw support --tool herenow
openclaw support --tool remotion

# Submit bug report
openclaw bug report --tools all
```

## Next Steps

### Phase 1: Setup
1. Create accounts for each tool
2. Get API keys
3. Install CLI tools
4. Configure OpenClaw

### Phase 2: Testing
1. Test individual tools
2. Create basic templates
3. Test simple workflows
4. Verify integrations

### Phase 3: Production
1. Create production templates
2. Set up automated workflows
3. Configure monitoring
4. Train team members

### Phase 4: Optimization
1. Analyze performance
2. Optimize costs
3. Scale workflows
4. Add advanced features

## Ready to Start?
Begin with Phase 1 setup and test each tool individually before creating integrated workflows.
