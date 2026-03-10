# VideoPipeline — Architecture & Roadmap

> AI-powered automated social media video pipeline built with Next.js 14, TypeScript, and Tailwind CSS.

---

## Architecture Overview

```
Manual Idea Input
       │
       ▼
 TrendsService.createManualTrend()
       │
       ▼
  VideoProject { status: "draft" }
       │
       ▼ user hits "Run Pipeline"
  pipeline.runPipeline()
       │
       ├──── LumaService.requestVideo(prompt)
       │          └── LumaService.checkStatus(id)  [poll until complete]
       │                       → luma_video_url
       │
       ├──── ElevenLabsService.generateAudio(script)
       │                       → elevenlabs_audio_url
       │          (runs in parallel with Luma ↑)
       │
       ▼
  ComposerService.compositeMedia(videoUrl, audioUrl, overlayText)
       │         [FFmpeg: drawtext + amerge + H.264 encode]
       │                       → final_composed_video_url
       │
       ▼
  status: "ready"  →  user previews  →  user clicks Publish
       │
       ▼
  InstagramService.publish()  [TODO]
  TikTokService.publish()     [TODO]
```

---

## Directory Structure

```
Bot Instagram/
├── app/
│   ├── layout.tsx          # Root layout (Inter font, dark mode, metadata)
│   ├── page.tsx            # Main dashboard — orchestrates all four UI panels
│   └── globals.css         # Tailwind base + body dark styles
│
├── components/
│   ├── IdeaIngestion.tsx   # Step 1 — Manual idea / trend form
│   ├── ProjectEditor.tsx   # Step 2 — Luma prompt, voiceover script, overlay text
│   ├── PipelineTracker.tsx # Step 3 — Live visual pipeline status
│   ├── FinalPlayer.tsx     # Step 4 — Video preview + Publish button
│   └── ui/
│       ├── button.tsx      # Shadcn-style Button (CVA variants)
│       ├── card.tsx        # Card / CardHeader / CardContent / CardFooter
│       ├── badge.tsx       # Status badge (success / warning / destructive)
│       ├── input.tsx       # Text input
│       └── textarea.tsx    # Multi-line textarea
│
├── services/
│   ├── _utils.ts           # randomId(), nowISO(), fakeDelay()
│   ├── trends.ts           # TrendsService — manual input + future Apify scraping
│   ├── luma.ts             # LumaService — requestVideo() + checkStatus()
│   ├── elevenlabs.ts       # ElevenLabsService — generateAudio()
│   ├── composer.ts         # ComposerService — compositeMedia() via FFmpeg
│   └── pipeline.ts         # Orchestrator — coordinates all services + state updates
│
├── types/
│   └── index.ts            # TrendInput, VideoProject, ProjectStatus, PipelineStep
│
├── lib/
│   └── utils.ts            # cn() — Tailwind class merger (clsx + tailwind-merge)
│
├── code.md                 # This file
├── .env.local.example      # Environment variable template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

---

## Service Layer

### `TrendsService` (`services/trends.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `createManualTrend(notes, sourceUrl?)` | ✅ Active | Wraps user input into a `TrendInput` |
| `fetchTrendingTikToks(hashtag)` | 📌 TODO | Apify `clockworks/free-tiktok-scraper` |
| `fetchTrendingInstagramReels(tag)` | 📌 TODO | Apify `apify/instagram-hashtag-scraper` |

### `LumaService` (`services/luma.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `requestVideo(prompt, aspectRatio?)` | 🟡 Mock | POST `/dream-machine/v1/generations` |
| `checkStatus(generationId)` | 🟡 Mock | GET `/dream-machine/v1/generations/:id` |

Switch to real: set `LUMA_API_KEY` in `.env.local` and uncomment the fetch blocks.

### `ElevenLabsService` (`services/elevenlabs.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `generateAudio(script, voiceId?)` | 🟡 Mock | POST `/v1/text-to-speech/:voice_id` |
| `listVoices()` | 📌 TODO | GET `/v1/voices` — for voice picker UI |

### `ComposerService` (`services/composer.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `compositeMedia(videoUrl, audioUrl, overlayText)` | 🟡 Mock | `fluent-ffmpeg` pipeline |

**Real FFmpeg pipeline:**
```
Input 0: luma_video_url
Input 1: elevenlabs_audio_url

Filter:
  [0:v] drawtext=text='OVERLAY':fontcolor=white:fontsize=52:
         box=1:boxcolor=black@0.55:x=(w-text_w)/2:y=h-120
  [0:v][1:a] -shortest -c:v libx264 -c:a aac
```

---

## Roadmap

### Phase 0 — Foundation (current)
- [x] Types & interfaces (`VideoProject`, `TrendInput`)
- [x] Service layer with mock implementations
- [x] Dashboard UI (all 4 panels)
- [x] Pipeline orchestrator with real-time status updates

### Phase 1 — Real API Integrations
- [ ] Wire up `LumaService` with real API key
- [ ] Wire up `ElevenLabsService` with real API key
- [ ] Set up file storage (Supabase Storage or AWS S3) for audio/video blobs
- [ ] Wire up `ComposerService` with `fluent-ffmpeg` on a self-hosted runner
  - Vercel does not support FFmpeg — use **Railway**, **Fly.io**, or **Render**
  - Alternatively: run FFmpeg in a Next.js API Route on a Docker container

### Phase 2 — Publishing
- [ ] Instagram Graph API integration
  - POST `/me/media` (upload container) → POST `/me/media_publish`
- [ ] TikTok Creator API integration
- [ ] YouTube Shorts (Data API v3)
- [ ] Scheduled publishing (cron via Vercel Cron or Inngest)

### Phase 3 — Automated Trend Sourcing
- [ ] Apify TikTok hashtag scraper (trending sounds / hooks)
- [ ] Apify Instagram Reels scraper
- [ ] AI ideation layer: feed trends into Claude / GPT to generate optimised prompts
- [ ] Niche RSS feed parser (subreddits, newsletters)

### Phase 4 — Production Hardening
- [ ] Move pipeline orchestration to a job queue (Inngest / BullMQ / Trigger.dev)
  - Jobs survive page reloads and server restarts
  - Retry logic for Luma polling timeouts
- [ ] Database persistence (Supabase / PlanetScale) for `VideoProject` state
- [ ] User authentication (NextAuth / Clerk)
- [ ] Multi-account Instagram support
- [ ] Analytics dashboard (views, engagement, best-performing prompts)

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Mock-first services | Lets the entire UI be developed and tested before any paid API is needed |
| `runPipeline` in client | Simplest for the prototype; move to server-side jobs in Phase 4 |
| 9:16 aspect ratio default | Vertical video is dominant on Instagram Reels, TikTok, and YouTube Shorts |
| FFmpeg `drawtext` for overlay | Avoids adding a canvas/WebGL dependency; runs server-side at scale |
| `ServiceResult<T>` union type | Forces callers to handle errors explicitly — no uncaught exceptions |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The full UI works immediately with mock services — no API keys required.
