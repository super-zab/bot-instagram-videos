// =============================================================================
// CORE DOMAIN TYPES
// All shared types for the automated media pipeline live here.
// =============================================================================

// -----------------------------------------------------------------------------
// TrendInput — represents a raw idea / trend captured from any source.
// -----------------------------------------------------------------------------
export interface TrendInput {
  id: string;
  source_url?: string;
  notes: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// IdeaSource — controls how Step 1 (Ideation) acquires the initial concept.
//
//   manual                — user types the idea directly into the editor
//   llm-only              — LLM generates a viral concept with no trend context
//   scraped-trends-plus-llm — server scrapes Google Trends, passes them to LLM
// -----------------------------------------------------------------------------
export type IdeaSource = "manual" | "llm-only" | "scraped-trends-plus-llm";

export interface IdeaSourceOption {
  value: IdeaSource;
  label: string;
  description: string;
}

export const IDEA_SOURCES: IdeaSourceOption[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Type your own idea directly into the editor.",
  },
  {
    value: "llm-only",
    label: "AI Brainstorm",
    description: "LLM generates a viral concept from scratch.",
  },
  {
    value: "scraped-trends-plus-llm",
    label: "Trending + AI",
    description: "Scrapes Google Trends, then LLM turns them into a post idea.",
  },
];

// -----------------------------------------------------------------------------
// GeneratedIdea — the structured output returned by the LLM and the API route.
// Fields map 1-to-1 to ProjectEditor's textarea fields for auto-fill.
// -----------------------------------------------------------------------------
export interface GeneratedIdea {
  /** Detailed visual description — populates the Visual Prompt textarea */
  visual_prompt: string;
  /** Short meme caption (≤60 chars) — populates the Overlay Text field */
  overlay_text: string;
  /** 15-30s narration script — populates the Voiceover Script textarea */
  voiceover_script: string;
  /** Raw trends string fed to the LLM (empty for llm-only mode) */
  trends_used?: string;
}

// =============================================================================
// GENERATOR REGISTRY
// Centralised list of every supported AI provider for each format.
// The UI dropdowns are built from these arrays — add a new entry here and it
// automatically appears in the editor without touching any other file.
// =============================================================================

/** Strongly-typed IDs for every supported video generator */
export type VideoGeneratorId = "fal-kling" | "hg-gradio-svd";

/** Strongly-typed IDs for every supported image generator */
export type ImageGeneratorId = "pollinations" | "hg-flux" | "nano-banana" | "dalle3";

/** Union of both — used for the `generator_model` field on MediaProject */
export type GeneratorId = VideoGeneratorId | ImageGeneratorId;

/** Metadata record for a single generator — drives the dropdown UI */
export interface GeneratorOption {
  /** Must match the corresponding VideoGeneratorId / ImageGeneratorId */
  id: GeneratorId;
  /** Human-readable name shown in the dropdown */
  label: string;
  /** Provider/company name (Fal.ai, Hugging Face, OpenAI…) */
  provider: string;
  /** Cost category — shown as a badge next to the label */
  tier: "free" | "freemium" | "paid";
  /** One-line description of the model */
  description: string;
}

// -----------------------------------------------------------------------------
// VIDEO_GENERATORS
// Each entry maps to a private method in services/video.ts
// -----------------------------------------------------------------------------
export const VIDEO_GENERATORS: GeneratorOption[] = [
  {
    id: "fal-kling",
    label: "Kling 1.6",
    provider: "Fal.ai",
    tier: "freemium",
    description: "High-quality text-to-video (5s, 9:16). Requires FAL_API_KEY.",
  },
  {
    id: "hg-gradio-svd",
    label: "Stable Video Diffusion",
    provider: "Hugging Face",
    tier: "free",
    description: "Open-source SVD via @gradio/client. No API key needed.",
  },
];

// -----------------------------------------------------------------------------
// IMAGE_GENERATORS
// Each entry maps to a private method in services/image.ts
// -----------------------------------------------------------------------------
export const IMAGE_GENERATORS: GeneratorOption[] = [
  {
    id: "pollinations",
    label: "Pollinations FLUX",
    provider: "Pollinations.ai",
    tier: "free",
    description: "URL-based generation, zero config, works instantly.",
  },
  {
    id: "hg-flux",
    label: "FLUX.1-dev",
    provider: "Hugging Face",
    tier: "free",
    description: "State-of-the-art image quality via HF Inference API free tier.",
  },
  {
    id: "nano-banana",
    label: "NanoBanana (SD)",
    provider: "Hugging Face",
    tier: "free",
    description: "Fast Stable Diffusion via @gradio/client. No API key needed.",
  },
  {
    id: "dalle3",
    label: "DALL·E 3",
    provider: "OpenAI",
    tier: "paid",
    description: "Premium image quality via OpenAI API. Requires OPENAI_API_KEY.",
  },
];

// =============================================================================
// PIPELINE TYPES
// =============================================================================

export type ProjectStatus =
  | "draft"             // User is still editing inputs
  | "generating_media"  // AI generation jobs are in-flight
  | "compositing"       // Compositor is merging assets
  | "ready"             // Final media is ready for review
  | "published";        // Pushed to Instagram / TikTok / YouTube Shorts

/** Controls which generation path the pipeline follows */
export type MediaFormat = "video" | "image";

// -----------------------------------------------------------------------------
// MediaProject — the central state object that travels through the pipeline.
// -----------------------------------------------------------------------------
export interface MediaProject {
  id: string;
  status: ProjectStatus;

  /**
   * Output format:
   *   "video" → VideoService + ElevenLabs + Composer Path B
   *   "image" → ImageService + Composer Path A
   */
  format: MediaFormat;

  /**
   * Human-readable provider name derived from the selected generator.
   * e.g. "Fal.ai", "Hugging Face", "OpenAI", "Pollinations.ai"
   * Stored for display in the tracker and debug panel.
   */
  provider: string;

  /**
   * The specific video model chosen by the user.
   * Only set when format === "video".
   * Passed through the pipeline to services/video.ts and services/composer.ts.
   */
  video_generator_model?: VideoGeneratorId;

  /**
   * The specific image model chosen by the user.
   * Only set when format === "image".
   * Passed through the pipeline to services/image.ts and services/composer.ts.
   */
  image_generator_model?: ImageGeneratorId;

  // ── Creative inputs ───────────────────────────────────────────────────────

  visual_prompt: string;

  /**
   * TTS script for ElevenLabs. Only relevant when format === "video".
   * Ignored and left blank for image projects.
   */
  voiceover_script: string;

  overlay_text: string;

  // ── Intermediate assets ───────────────────────────────────────────────────

  /** Async job ID returned by Fal.ai / HF (video only) */
  generation_id?: string;

  /**
   * URL of the raw generated media:
   *   video → mp4 CDN URL
   *   image → Pollinations URL, HF CDN URL, OpenAI CDN URL, etc.
   */
  media_url?: string;

  /** ElevenLabs mp3 URL — populated only for video projects */
  elevenlabs_audio_url?: string;

  // ── Final output ──────────────────────────────────────────────────────────

  /** URL of the composed output (overlay burned in, audio merged if video) */
  final_media_url?: string;

  created_at: string;
  updated_at: string;
}

// Backwards-compatible alias
export type VideoProject = MediaProject;

// -----------------------------------------------------------------------------
// Pipeline step metadata — drives the visual tracker component
// -----------------------------------------------------------------------------
export interface PipelineStep {
  key: ProjectStatus;
  label: string;
  description: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { key: "draft",            label: "Draft",            description: "Inputs are being edited" },
  { key: "generating_media", label: "Generating Media", description: "AI is generating your visual" },
  { key: "compositing",      label: "Compositing",      description: "FFmpeg is applying text overlay and merging assets" },
  { key: "ready",            label: "Ready",            description: "Final media is ready for review" },
  { key: "published",        label: "Published",        description: "Media has been posted to social platforms" },
];

// -----------------------------------------------------------------------------
// Service response wrapper
// -----------------------------------------------------------------------------
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
