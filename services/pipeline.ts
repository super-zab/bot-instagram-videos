// =============================================================================
// PIPELINE ORCHESTRATOR
// Coordinates the service calls based on the project format:
//
//   Video pipeline: VideoService → ElevenLabs → Composer (Path B)
//   Image pipeline: ImageService → Composer (Path A)          ← no audio step
//
// Exposes an onUpdate callback so the UI tracker reacts to each status change.
//
// This runs entirely client-side for now (using mock services).
// TODO [PRODUCTION]: Move this to a server-side background job queue
//   (BullMQ / Inngest / Trigger.dev) so long-running tasks survive page reloads.
// =============================================================================

import { MediaProject, MediaFormat, ProjectStatus } from "@/types";
import { videoService } from "@/services/video";
import { imageService } from "@/services/image";
import { elevenLabsService } from "@/services/elevenlabs";
import { composerService } from "@/services/composer";
import { randomId, nowISO } from "@/services/_utils";

type StatusCallback = (update: MediaProject) => void;

// ---------------------------------------------------------------------------
// runPipeline — main entry point
// ---------------------------------------------------------------------------
export async function runPipeline(
  project: MediaProject,
  onUpdate: StatusCallback
): Promise<MediaProject> {
  let current = { ...project };

  /** Apply a partial update, stamp updated_at, and notify the UI */
  const update = (patch: Partial<MediaProject>): void => {
    current = { ...current, ...patch, updated_at: nowISO() };
    onUpdate(current);
  };

  // ── Stage 1: Generate media ──────────────────────────────────────────────
  update({ status: "generating_media" });

  if (project.format === "image") {
    // ── IMAGE PATH ────────────────────────────────────────────────────────
    // Pollinations is synchronous — the URL is the request, no async job needed.
    const imageResult = imageService.generateImage(current.visual_prompt);
    if (!imageResult.ok) throw new Error(imageResult.error);

    update({ media_url: imageResult.data });

    // ── Stage 2: Composite (image + overlay text only, no audio) ─────────
    update({ status: "compositing" });

    const composed = await composerService.compositeMedia(
      imageResult.data,
      current.overlay_text,
      "image"
    );
    if (!composed.ok) throw new Error(composed.error);

    update({ status: "ready", final_media_url: composed.data });

  } else {
    // ── VIDEO PATH ────────────────────────────────────────────────────────
    // Run video generation and ElevenLabs TTS in parallel for speed.
    const [videoResult, audioResult] = await Promise.all([
      videoService.generateVideo(current.visual_prompt),
      elevenLabsService.generateAudio(current.voiceover_script),
    ]);

    if (!videoResult.ok) throw new Error(videoResult.error);
    if (!audioResult.ok) throw new Error(audioResult.error);

    update({
      media_url: videoResult.data,
      elevenlabs_audio_url: audioResult.data,
    });

    // ── Stage 2: Composite (video + audio + overlay text) ─────────────────
    update({ status: "compositing" });

    const composed = await composerService.compositeMedia(
      videoResult.data,
      current.overlay_text,
      "video",
      audioResult.data
    );
    if (!composed.ok) throw new Error(composed.error);

    update({ status: "ready", final_media_url: composed.data });
  }

  return current;
}

// ---------------------------------------------------------------------------
// createProject — factory to bootstrap a new MediaProject from user inputs
// ---------------------------------------------------------------------------
export function createProject(
  visualPrompt: string,
  voiceoverScript: string,
  overlayText: string,
  format: MediaFormat = "video"
): MediaProject {
  const now = nowISO();
  return {
    id: randomId(),
    status: "draft",
    format,
    visual_prompt: visualPrompt,
    voiceover_script: voiceoverScript,
    overlay_text: overlayText,
    created_at: now,
    updated_at: now,
  };
}
