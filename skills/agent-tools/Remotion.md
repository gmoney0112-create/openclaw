# Remotion Skill

## Description
Create videos programmatically using React components. Generate professional videos without manual editing.

## When to Use This Skill
- Creating estimate presentation videos
- Making training and safety videos
- Producing marketing content
- Documenting emergency responses
- Creating client welcome videos

## Prerequisites
1. Remotion installed (`npm install -g remotion`)
2. Node.js 16+ installed
3. Video project directory setup
4. OpenClaw configured with remotion.project_path

## Quick Start

### Create Video
```bash
# Render basic video
openclaw remotion render \
  --composition "WelcomeVideo" \
  --output "welcome.mp4" \
  --width 1920 \
  --height 1080 \
  --fps 30
```

### Generate Components
```bash
# Create new video component
openclaw remotion component create \
  --name "EstimatePresentation" \
  --template "explainer"
```

### Preview Video
```bash
# Preview in browser
openclaw remotion preview --composition "TrainingVideo"
```

## Common Use Cases

### 1. Estimate Presentation Videos
```bash
# Create personalized estimate video
openclaw remotion estimate-video \
  --client "client_data.json" \
  --photos "tree_photos/" \
  --scope "scope_of_work.md" \
  --output "{{client_name}}_estimate.mp4"
```

### 2. Emergency Documentation
```bash
# Create emergency timeline video
openclaw remotion emergency-timeline \
  --emergency-id "EMG-2026-001" \
  --photos "before_after/" \
  --notes "timeline.json" \
  --output "emergency_response.mp4"
```

### 3. Training Videos
```bash
# Generate safety training video
openclaw remotion training-video \
  --topic "Chainsaw Safety" \
  --steps "safety_steps.json" \
  --duration 300 \
  --output "safety_training.mp4"
```

## Integration Examples

### With HereNow
```bash
# Create and host video
openclaw remotion render --composition "MarketingVideo" | \
openclaw herenow publish --title "Marketing Video" --type video
```

### With Agent Mail
```bash
# Send video via email
openclaw remotion render --composition "WelcomeVideo" | \
openclaw agentmail send --attach "video.mp4" --subject "Welcome!"
```

### Combined Workflow
```bash
# Complete estimate delivery
openclaw workflow estimate-delivery \
  --client "client.json" \
  --steps "remotion,herenow,agentmail"
```

## Templates Directory
Store video templates in `~/templates/remotion/`:
- `estimate_presentation.tsx`
- `emergency_timeline.tsx`
- `training_video.tsx`
- `marketing_promo.tsx`

## Configuration
```bash
# Set project path
openclaw config set remotion.project_path "/path/to/video-project"

# Set output directory
openclaw config set remotion.output_dir "./rendered_videos"

# Configure default settings
openclaw config set remotion.default_fps 30
openclaw config set remotion.default_width 1920
openclaw config set remotion.default_height 1080
```

## Advanced Features

### Dynamic Data
```bash
# Render with dynamic data
openclaw remotion render-dynamic \
  --template "estimate_template.tsx" \
  --data "client_data.json" \
  --output "personalized.mp4"
```

### Batch Processing
```bash
# Render multiple videos
openclaw remotion batch-render \
  --template "welcome_video.tsx" \
  --clients "clients.csv" \
  --output-dir "./client_videos"
```

### Performance Optimization
```bash
# Use GPU acceleration
openclaw remotion render \
  --composition "ComplexVideo" \
  --gpu true \
  --concurrency 4
```

## Template Examples

### Basic Estimate Template
```javascript
// estimate_template.tsx
import { AbsoluteFill, Sequence, Img } from "remotion";

export const EstimatePresentation = ({ clientName, photos, total }) => (
  <AbsoluteFill style={{ backgroundColor: "#2c5e3e", color: "white" }}>
    <Sequence from={0} durationInFrames={90}>
      <h1>Estimate for {clientName}</h1>
    </Sequence>
    <Sequence from={90} durationInFrames={120}>
      {photos.map((photo, i) => (
        <Img key={i} src={photo} style={{ width: 400, height: 300 }} />
      ))}
    </Sequence>
    <Sequence from={210} durationInFrames={90}>
      <h2>Total: ${total}</h2>
    </Sequence>
  </AbsoluteFill>
);
```

## Troubleshooting
```bash
# Test installation
openclaw remotion test

# Check system requirements
openclaw remotion system-check

# View render logs
openclaw remotion logs --tail
```

## Resources
- [Documentation](https://www.remotion.dev/docs)
- [OpenClaw Examples](https://github.com/remotion-dev/openclaw-examples)
- [Video Templates](https://remotion.dev/templates)
- [Community Discord](https://remotion.dev/discord)