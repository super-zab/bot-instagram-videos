// =============================================================================
// CORE DOMAIN TYPES
// All shared types for the automated media pipeline live here.
// =============================================================================

// -----------------------------------------------------------------------------
// TrendInput — represents a raw idea / trend captured from any source.
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
// MediaProject — the central state object that travels through the pipeline.
// Replaces the former `VideoProject` to support both video and image formats.
// Each status value maps to a pipeline stage in the UI tracker.
// -----------------------------------------------------------------------------
export type ProjectStatus =
  | "draft"             // User is still editing inputs
  | "generating_media"  // AI generation jobs are in-flight
  | "compositing"       // Compositor is merging assets
  | "ready"             // Final media is ready for review
  | "published";        // Pushed to Instagram / TikTok / YouTube Shorts

/** Controls which generation path the pipeline follows */
export type MediaFormat = "video" | "image";

export interface MediaProject {
  /** Unique identifier */
  id: string;

  /** Current position in the pipeline */
  status: ProjectStatus;

  /**
   * Format determines the generation path:
   *   "video" → Fal.ai/Replicate + ElevenLabs + FFmpeg (video composite)
   *   "image" → Pollinations.ai + FFmpeg drawtext (image composite)
   */
  format: MediaFormat;

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Text prompt sent to the video or image generation service */
  visual_prompt: string;

  /**
   * Narration script sent to ElevenLabs for text-to-speech.
   * Only relevant when format === "video". Ignored for images.
   */
  voiceover_script: string;

  /** Short caption or meme text burned into the media via FFmpeg drawtext */
  overlay_text: string;

  // ── Intermediate Assets ───────────────────────────────────────────────────

  /**
   * Generation job ID — used to poll the video API (Fal.ai / Replicate)
   * until the clip is ready. Not used for image format (Pollinations is sync).
   */
  generation_id?: string;

  /**
   * URL of the raw AI-generated media:
   *   - For "video": the generated video clip (mp4)
   *   - For "image": the Pollinations.ai URL (resolves to a PNG/JPEG)
   */
  media_url?: string;

  /**
   * Signed CDN URL for the AI-generated voiceover MP3 from ElevenLabs.
   * Only populated when format === "video".
   */
  elevenlabs_audio_url?: string;

  // ── Final Output ──────────────────────────────────────────────────────────

  /**
   * URL of the final composed media (text overlay applied, audio merged if video).
   * This is the file that gets published to social platforms.
   */
  final_media_url?: string;

  /** ISO timestamps for audit / debugging */
  created_at: string;
  updated_at: string;
}

// Backwards-compatible alias — remove once all consumers use MediaProject
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
  {
    key: "draft",
    label: "Draft",
    description: "Inputs are being edited",
  },
  {
    key: "generating_media",
    label: "Generating Media",
    // Description is format-aware at runtime — see PipelineTracker component
    description: "AI is generating your visual · ElevenLabs is synthesising audio",
  },
  {
    key: "compositing",
    label: "Compositing",
    description: "FFmpeg is applying text overlay and merging assets",
  },
  {
    key: "ready",
    label: "Ready",
    description: "Final media is ready for review",
  },
  {
    key: "published",
    label: "Published",
    description: "Media has been posted to social platforms",
  },
];

// -----------------------------------------------------------------------------
// Service response wrappers — generic OK / Error envelope
// -----------------------------------------------------------------------------
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
