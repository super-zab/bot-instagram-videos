# MediaPipeline — Architecture & Roadmap

> AI-powered automated social media content pipeline built with Next.js 14, TypeScript, and Tailwind CSS.
> Supports both **video** (Fal.ai + ElevenLabs) and **image** (Pollinations.ai) output formats.

---

## Changelog

### v2 — 2026-03-25
- **Removed** Luma AI integration (`services/luma.ts` deleted)
- **Added** `services/video.ts` — Fal.ai / Replicate video generation (mock ready)
- **Added** `services/image.ts` — Pollinations.ai image generation (functional, no API key)
- **Added** `format: "video" | "image"` field to `MediaProject` (formerly `VideoProject`)
- **Renamed** `VideoProject` → `MediaProject` (alias kept for backwards compat)
- **Renamed** `luma_prompt` → `visual_prompt`
- **Renamed** `luma_generation_id` → `generation_id`
- **Renamed** `luma_video_url` → `media_url`
- **Renamed** `final_composed_video_url` → `final_media_url`
- **Updated** `composer.ts` — two paths: Path A (image overlay), Path B (video + audio merge)
- **Updated** `pipeline.ts` — branches on `format`, image path skips ElevenLabs
- **Updated** `ProjectEditor.tsx` — format toggle (Video / Image), voiceover hidden for image
- **Updated** `FinalPlayer.tsx` — renders `<img>` or `<video>` based on format
- **Updated** `PipelineTracker.tsx` — format-aware descriptions, renamed field refs
- **Updated** `next.config.js` — replaced lumalabs.ai with image.pollinations.ai

---

## Architecture Overview

### Video Pipeline (`format: "video"`)

```
Manual Idea Input
       │
       ▼
 TrendsService.createManualTrend()
       │
       ▼
  MediaProject { status: "draft", format: "video" }
       │
       ▼ user hits "Run Video Pipeline"
  pipeline.runPipeline()
       │
       ├──── VideoService.generateVideo(prompt)         [Fal.ai / Replicate]
       │                       → media_url (mp4)
       │
       ├──── ElevenLabsService.generateAudio(script)   [runs in parallel ↑]
       │                       → elevenlabs_audio_url (mp3)
       │
       ▼
  ComposerService.compositeMedia(mediaUrl, overlayText, "video", audioUrl)
       │    PATH B: FFmpeg drawtext + amerge + H.264/AAC encode
       │                       → final_media_url (mp4)
       │
       ▼
  status: "ready"  →  <video> preview  →  Publish
```

### Image Pipeline (`format: "image"`)

```
Manual Idea Input
       │
       ▼
  MediaProject { status: "draft", format: "image" }
       │
       ▼ user hits "Run Image Pipeline"
  pipeline.runPipeline()
       │
       ├──── ImageService.generateImage(prompt)         [Pollinations.ai — synchronous URL]
       │                       → media_url (Pollinations URL)
       │
       │     ← No ElevenLabs step for images →
       │
       ▼
  ComposerService.compositeMedia(mediaUrl, overlayText, "image")
       │    PATH A: FFmpeg drawtext overlay → single JPEG frame
       │                       → final_media_url (jpg)
       │
       ▼
  status: "ready"  →  <img> preview  →  Publish
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
│   ├── ProjectEditor.tsx   # Step 2 — Format toggle + visual prompt, voiceover, overlay
│   ├── PipelineTracker.tsx # Step 3 — Live visual pipeline status (format-aware)
│   ├── FinalPlayer.tsx     # Step 4 — <img> or <video> preview + Publish button
│   └── ui/
│       ├── button.tsx      # Shadcn-style Button (CVA variants)
│       ├── card.tsx        # Card / CardHeader / CardContent / CardFooter
│       ├── badge.tsx       # Status badge (success / warning / destructive)
│       ├── input.tsx       # Text input
│       └── textarea.tsx    # Multi-line textarea
│
├── services/
│   ├── _utils.ts           # randomId(), nowISO(), fakDelay()
│   ├── trends.ts           # TrendsService — manual input + future Apify scraping
│   ├── video.ts            # VideoService — generateVideo() via Fal.ai / Replicate
│   ├── image.ts            # ImageService — generateImage() via Pollinations.ai (free)
│   ├── elevenlabs.ts       # ElevenLabsService — generateAudio() (video format only)
│   ├── composer.ts         # ComposerService — Path A (image) / Path B (video) FFmpeg
│   └── pipeline.ts         # Orchestrator — branches on format, coordinates all services
│
├── types/
│   └── index.ts            # TrendInput, MediaProject, MediaFormat, ProjectStatus
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

### `VideoService` (`services/video.ts`) — replaces `luma.ts`
| Method | Status | Description |
|--------|--------|-------------|
| `generateVideo(prompt)` | 🟡 Mock | Fal.ai Kling or Replicate text-to-video |

Switch to real: set `FAL_API_KEY` or `REPLICATE_API_TOKEN` in `.env.local` and uncomment the fetch blocks.

### `ImageService` (`services/image.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `generateImage(prompt)` | ✅ Functional | Constructs Pollinations.ai URL (synchronous, free) |

No API key required. The returned URL resolves to a 1080×1920 image when fetched.

### `ElevenLabsService` (`services/elevenlabs.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `generateAudio(script, voiceId?)` | 🟡 Mock | POST `/v1/text-to-speech/:voice_id` |
| `listVoices()` | 📌 TODO | GET `/v1/voices` — for voice picker UI |

Only called for the **video** format. Skipped automatically in the image pipeline.

### `ComposerService` (`services/composer.ts`)
| Method | Status | Description |
|--------|--------|-------------|
| `compositeMedia(mediaUrl, overlayText, format, audioUrl?)` | 🟡 Mock | Branches on format |

**Path A — Image FFmpeg pipeline:**
```
Input:  image URL (Pollinations)
Filter: [0:v] drawtext=text='OVERLAY':fontcolor=white:fontsize=52:
               box=1:boxcolor=black@0.55:x=(w-text_w)/2:y=h-120
Output: -frames:v 1  final.jpg
```

**Path B — Video FFmpeg pipeline:**
```
Input 0: media_url (mp4 from Fal.ai)
Input 1: elevenlabs_audio_url (mp3)
Filter:  [0:v] drawtext + [0:v][1:a] -shortest -c:v libx264 -c:a aac
Output:  final.mp4
```

---

## Roadmap

### Phase 0 — Foundation ✅ (complete)
- [x] Types & interfaces (`MediaProject`, `MediaFormat`, `TrendInput`)
- [x] Service layer with mock implementations
- [x] Dashboard UI (all 4 panels)
- [x] Pipeline orchestrator with real-time status updates
- [x] Format toggle (video / image) with conditional UI fields
- [x] Pollinations.ai image generation (functional, zero cost)

### Phase 1 — Real API Integrations
- [ ] Wire up `VideoService` with Fal.ai API key (`FAL_API_KEY`)
  - Model: `fal-ai/kling-video/v1.6/standard/text-to-video`
  - Alternative: Replicate `minimax/video-01-live`
- [ ] Wire up `ElevenLabsService` with real API key (`ELEVENLABS_API_KEY`)
- [ ] Set up file storage (Supabase Storage or AWS S3) for audio/video blobs
- [ ] Wire up `ComposerService` with `fluent-ffmpeg` on a self-hosted runner
  - Vercel does **not** support FFmpeg — use **Railway**, **Fly.io**, or **Render**
  - Image composition is lighter — can run in a Vercel Edge Function with a WASM FFmpeg build

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
  - Retry logic for video generation polling timeouts
- [ ] Database persistence (Supabase / PlanetScale) for `MediaProject` state
- [ ] User authentication (NextAuth / Clerk)
- [ ] Multi-account Instagram support
- [ ] Analytics dashboard (views, engagement, best-performing prompts)

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Pollinations.ai for images | Completely free, no API key, functional on day 1 — zero cost to validate the image pipeline |
| Fal.ai / Replicate over Luma | More models available, better pricing, no vendor lock-in |
| `format` field on `MediaProject` | Single type models both pipelines — the format drives branching in `pipeline.ts` and conditional rendering in the UI |
| Voiceover hidden for image format | Images don't have a timeline, so audio would be unused; simpler UX |
| `<img>` vs `<video>` in FinalPlayer | Native browser elements — no extra library needed |
| Mock-first services | Lets the entire UI be developed and tested before any paid API is needed |
| `runPipeline` in client | Simplest for the prototype; move to server-side jobs in Phase 4 |
| 9:16 aspect ratio default | Vertical format is dominant on Instagram Reels, TikTok, and YouTube Shorts |
| FFmpeg `drawtext` for overlay | Avoids canvas/WebGL dependency; runs server-side at scale |
| `ServiceResult<T>` union type | Forces callers to handle errors explicitly — no uncaught exceptions |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.local.example .env.local
# Fill in at least one video API key (FAL_API_KEY or REPLICATE_API_TOKEN)
# for the video pipeline. Image pipeline works with zero config.

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The full UI works immediately with mock services — no API keys required.
The **Image** format uses real Pollinations.ai URLs — switch to Image mode to get a genuinely generated image in the preview.
