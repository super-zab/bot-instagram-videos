// =============================================================================
// CORE DOMAIN TYPES
// All shared types for the automated video pipeline live here.
// =============================================================================

// -----------------------------------------------------------------------------
// TrendInput — represents a raw idea / trend captured from any source.
// The source_url field is optional because ideas can come from manual entry,
// an Apify scrape, or a future AI ideation step.
// -----------------------------------------------------------------------------
export interface TrendInput {
  /** Unique identifier (uuid or nanoid) */
  id: string;

  /** Original URL of the trend (tweet, reel, article, etc.) — optional for manual entry */
  source_url?: string;

  /** Free-form notes describing the idea or trend */
  notes: string;

  /** ISO timestamp of when the idea was captured */
  created_at: string;
}

// -----------------------------------------------------------------------------
// VideoProject — the central state object that travels through the pipeline.
// Each status value maps to a pipeline stage in the UI tracker.
// -----------------------------------------------------------------------------
export type ProjectStatus =
  | "draft"             // User is still editing inputs
  | "generating_media"  // Luma & ElevenLabs jobs are in-flight
  | "compositing"       // FFmpeg compositor is merging assets
  | "ready"             // Final video is ready for review
  | "published";        // Pushed to Instagram / TikTok / YouTube Shorts

export interface VideoProject {
  /** Unique identifier */
  id: string;

  /** Current position in the pipeline */
  status: ProjectStatus;

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Text prompt sent to Luma AI to generate the visual clip */
  luma_prompt: string;

  /** Narration script sent to ElevenLabs for text-to-speech */
  voiceover_script: string;

  /** Short caption or meme text burned into the video via FFmpeg drawtext */
  overlay_text: string;

  // ── Intermediate Assets ───────────────────────────────────────────────────

  /**
   * Luma generation job ID — used to poll Luma's /generations/:id endpoint
   * until the video clip is ready.
   */
  luma_generation_id?: string;

  /** Signed CDN URL for the raw AI-generated video clip from Luma */
  luma_video_url?: string;

  /** Signed CDN URL for the AI-generated voiceover MP3 from ElevenLabs */
  elevenlabs_audio_url?: string;

  // ── Final Output ──────────────────────────────────────────────────────────

  /**
   * URL of the final composed video (video + audio + text overlay).
   * This is the file that gets published to social platforms.
   */
  final_composed_video_url?: string;

  /** ISO timestamps for audit / debugging */
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Pipeline step metadata — drives the visual tracker component
// -----------------------------------------------------------------------------
export interface PipelineStep {
  key: ProjectStatus;
  label: string;
  description: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    key: "draft",
    label: "Draft",
    description: "Inputs are being edited",
  },
  {
    key: "generating_media",
    label: "Generating Media",
    description: "Luma is rendering video · ElevenLabs is synthesising audio",
  },
  {
    key: "compositing",
    label: "Compositing",
    description: "FFmpeg is merging video, audio & text overlay",
  },
  {
    key: "ready",
    label: "Ready",
    description: "Final video is ready for review",
  },
  {
    key: "published",
    label: "Published",
    description: "Video has been posted to social platforms",
  },
];

// -----------------------------------------------------------------------------
// Service response wrappers — generic OK / Error envelope
// -----------------------------------------------------------------------------
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
