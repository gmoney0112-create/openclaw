# Content Stack

Automated content pipeline that turns a topic into published videos in one command.

```
Topic → Research → Script → Assets → Edit → Distribute
```

**Tools wired together:**

| Tool | Role | Cost |
|---|---|---|
| Claude (Anthropic) | Orchestrator, scriptwriter, director | $20/mo |
| yt-dlp | Scrape reference footage from YouTube | $0 |
| Whisper (OpenAI) | Transcribe audio to text + captions | $0 |
| Apify | Google Trends + web research | $0 |
| ffmpeg | Concat clips, burn captions, thumbnails | $0 |
| Remotion | Animated title cards & lower-thirds | $0 |
| Hyperframes | HTML animations → MP4 | $0 |
| Higgsfield | AI b-roll + graphic generation | $15/mo |
| Vercel | Deploy lead-capture landing page | $0 |
| Resend | Email subscribers on publish | $0 |
| Notion | Log to content calendar | $0 |

**Total: ~$35/mo**

---

## Quick start

### 1. Prerequisites

```bash
brew install yt-dlp ffmpeg          # macOS
# or: apt-get install yt-dlp ffmpeg # Debian/Ubuntu
npm install -g tsx
```

### 2. Install

```bash
cd content-stack
npm install
cp .env.example .env
# Fill in .env — only ANTHROPIC_API_KEY is required to start
```

### 3. Set up Remotion (for animated overlays)

```bash
cd remotion
npm install
cd ..
```

### 4. Run

```bash
# Full pipeline (short + long form)
npx tsx src/index.ts run "AI productivity tools" --format both

# Just generate scripts (no video production)
npx tsx src/index.ts script "AI productivity tools"

# Research phase only
npx tsx src/index.ts research "AI productivity tools"

# Skip expensive phases while testing
npx tsx src/index.ts run "AI productivity" --skip-assets --skip-distribute
```

---

## API keys — where to get them

| Variable | Service | How |
|---|---|---|
| `ANTHROPIC_API_KEY` | claude.ai | Settings → API Keys |
| `OPENAI_API_KEY` | platform.openai.com | API Keys (Whisper only) |
| `APIFY_API_KEY` | console.apify.com | Settings → Integrations |
| `HIGGSFIELD_API_KEY` | higgsfield.ai | Dashboard → API |
| `RESEND_API_KEY` | resend.com | API Keys |
| `NOTION_API_KEY` | notion.so | Settings → Connections → New integration |
| `NOTION_CALENDAR_DATABASE_ID` | Notion database URL | 32-char ID in the URL |
| `VERCEL_TOKEN` | vercel.com | Settings → Tokens |
| `VERCEL_ORG_ID` | vercel.com | Settings → General |

---

## Pipeline phases

### Phase 1: Research
- Fetches Google Trends data (Apify)
- Finds top 3 YouTube videos on the topic (yt-dlp search)
- Downloads audio and transcribes with Whisper
- Claude synthesizes trends, keywords, target audience

### Phase 2: Script Generation
- Claude writes a hook-first script for each format
- Short-form: 60 sec / ~150 words with viral hook + CTA
- Long-form: 10 min / ~1500 words with narrative structure

### Phase 3: Asset Generation
- Claude generates cinematic b-roll prompts from the script
- Higgsfield renders AI video clips for each prompt
- Remotion renders animated title card + lower-thirds

### Phase 4: Edit
- ffmpeg concatenates all clips in order
- Whisper transcribes the final cut for accurate captions
- Captions burned in with ffmpeg subtitle filter
- Thumbnail extracted from frame 3

### Phase 5: Distribute
- Vercel deploys a lead-capture landing page
- Resend blasts subscriber list with new-video email
- Notion logs the entry to your content calendar

---

## Output structure

```
output/
└── <topic-slug>/
    ├── research/           # downloaded audio + raw transcripts
    ├── assets/
    │   ├── short/          # broll-0.mp4, broll-1.mp4, title-card.mp4
    │   └── long/
    ├── edit/
    │   ├── short/
    │   │   ├── raw.mp4
    │   │   ├── captioned.mp4
    │   │   ├── captions.srt
    │   │   └── thumbnail.jpg
    │   └── long/
    └── research.json       # (if --skip-research used next run)
```

---

## Adding Hyperframes (HTML → MP4)

Hyperframes converts HTML/CSS animations into video clips. Install Puppeteer to enable it:

```bash
npm install puppeteer
```

Then use it in your pipeline or scripts:

```ts
import { htmlToVideo } from './src/tools/hyperframes.js';

await htmlToVideo({
  html: '<div style="animation: spin 1s linear infinite">...</div>',
  outputPath: './output/my-animation.mp4',
  durationSeconds: 3,
});
```

---

## Extending

- **New b-roll style**: edit `src/pipeline/assets.ts` → `generateBrollPrompts()`
- **Custom Remotion composition**: add a file in `remotion/src/compositions/` and register it in `remotion/src/Root.tsx`
- **Different email template**: edit `src/tools/resend.ts` → `confirmationEmail()`
- **Extra Notion fields**: edit `src/tools/notion.ts` → `addEntry()`
