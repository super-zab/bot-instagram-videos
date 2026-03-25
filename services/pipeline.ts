// =============================================================================
// PIPELINE ORCHESTRATOR
// Coordinates service calls based on project.format and the selected model.
//
//   Image pipeline: ImageService.generateImage(prompt, model) → Composer Path A
//   Video pipeline: VideoService.generateVideo(prompt, model)
//                   + ElevenLabs.generateAudio (parallel)    → Composer Path B
//
// TODO [PRODUCTION]: Move to a server-side job queue (Inngest / BullMQ)
//   so long-running tasks survive page reloads and support retries.
// =============================================================================

import {
  MediaProject,
  MediaFormat,
  VideoGeneratorId,
  ImageGeneratorId,
  VIDEO_GENERATORS,
  IMAGE_GENERATORS,
} from "@/types";
import { videoService } from "@/services/video";
import { imageService } from "@/services/image";
import { elevenLabsService } from "@/services/elevenlabs";
import { composerService } from "@/services/composer";
import { randomId, nowISO } from "@/services/_utils";

type StatusCallback = (update: MediaProject) => void;

// ---------------------------------------------------------------------------
// runPipeline
// ---------------------------------------------------------------------------
export async function runPipeline(
  project: MediaProject,
  onUpdate: StatusCallback
): Promise<MediaProject> {
  let current = { ...project };

  const update = (patch: Partial<MediaProject>): void => {
    current = { ...current, ...patch, updated_at: nowISO() };
    onUpdate(current);
  };

  update({ status: "generating_media" });

  // ── IMAGE PATH ────────────────────────────────────────────────────────────
  if (project.format === "image") {
    const model = project.image_generator_model!;

    const imageResult = await imageService.generateImage(current.visual_prompt, model);
    if (!imageResult.ok) throw new Error(imageResult.error);
    update({ media_url: imageResult.data });

    update({ status: "compositing" });

    const composed = await composerService.compositeMedia(
      imageResult.data,
      current.overlay_text,
      "image",
      model
    );
    if (!composed.ok) throw new Error(composed.error);

    update({ status: "ready", final_media_url: composed.data });

  // ── VIDEO PATH ────────────────────────────────────────────────────────────
  } else {
    const model = project.video_generator_model!;

    // Video generation and TTS run in parallel
    const [videoResult, audioResult] = await Promise.all([
      videoService.generateVideo(current.visual_prompt, model),
      elevenLabsService.generateAudio(current.voiceover_script),
    ]);

    if (!videoResult.ok) throw new Error(videoResult.error);
    if (!audioResult.ok) throw new Error(audioResult.error);

    update({
      media_url: videoResult.data,
      elevenlabs_audio_url: audioResult.data,
    });

    update({ status: "compositing" });

    const composed = await composerService.compositeMedia(
      videoResult.data,
      current.overlay_text,
      "video",
      model,
      audioResult.data
    );
    if (!composed.ok) throw new Error(composed.error);

    update({ status: "ready", final_media_url: composed.data });
  }

  return current;
}

// ---------------------------------------------------------------------------
// createProject — factory function
// ---------------------------------------------------------------------------
export function createProject(
  visualPrompt: string,
  voiceoverScript: string,
  overlayText: string,
  format: MediaFormat,
  model: VideoGeneratorId | ImageGeneratorId
): MediaProject {
  const now = nowISO();

  // Resolve the human-readable provider name from the generator registry
  const allGenerators = [...VIDEO_GENERATORS, ...IMAGE_GENERATORS];
  const generator = allGenerators.find((g) => g.id === model);
  const provider = generator?.provider ?? "Unknown";

  return {
    id: randomId(),
    status: "draft",
    format,
    provider,
    video_generator_model: format === "video" ? (model as VideoGeneratorId) : undefined,
    image_generator_model: format === "image" ? (model as ImageGeneratorId) : undefined,
    visual_prompt: visualPrompt,
    voiceover_script: voiceoverScript,
    overlay_text: overlayText,
    created_at: now,
    updated_at: now,
  };
}
