// =============================================================================
// PIPELINE ORCHESTRATOR
// Coordinates the three service calls (Luma → ElevenLabs → Composer) and
// exposes callbacks so the UI can react to each status transition.
//
// This runs entirely client-side for now (using mock services).
// TODO [PRODUCTION]: Move this to a server-side background job queue
//   (BullMQ / Inngest / Trigger.dev) so long-running tasks survive page reloads.
// =============================================================================

import { VideoProject, ProjectStatus } from "@/types";
import { lumaService } from "@/services/luma";
import { elevenLabsService } from "@/services/elevenlabs";
import { composerService } from "@/services/composer";
import { randomId, nowISO } from "@/services/_utils";

type StatusCallback = (update: Partial<VideoProject>) => void;

export async function runPipeline(
  project: VideoProject,
  onUpdate: StatusCallback
): Promise<VideoProject> {
  let current = { ...project };

  const update = (patch: Partial<VideoProject>): void => {
    current = { ...current, ...patch, updated_at: nowISO() };
    onUpdate(current);
  };

  // ── Stage 1: Kick off Luma & ElevenLabs in parallel ─────────────────────
  update({ status: "generating_media" });

  const [lumaResult, audioResult] = await Promise.all([
    (async () => {
      const req = await lumaService.requestVideo(current.luma_prompt);
      if (!req.ok) throw new Error(req.error);
      update({ luma_generation_id: req.data.generationId });

      // Poll until Luma completes (mock resolves in one round)
      const status = await lumaService.checkStatus(req.data.generationId);
      if (!status.ok || status.data.state !== "completed") {
        throw new Error(status.ok ? status.data.failure_reason : status.error);
      }
      return status.data.video_url!;
    })(),
    (async () => {
      const audio = await elevenLabsService.generateAudio(
        current.voiceover_script
      );
      if (!audio.ok) throw new Error(audio.error);
      return audio.data;
    })(),
  ]);

  update({ luma_video_url: lumaResult, elevenlabs_audio_url: audioResult });

  // ── Stage 2: Composite ───────────────────────────────────────────────────
  update({ status: "compositing" });

  const composed = await composerService.compositeMedia(
    lumaResult,
    audioResult,
    current.overlay_text
  );
  if (!composed.ok) throw new Error(composed.error);

  update({
    status: "ready",
    final_composed_video_url: composed.data,
  });

  return current;
}

/** Factory: create a brand-new VideoProject from user inputs */
export function createProject(
  lumaPrompt: string,
  voiceoverScript: string,
  overlayText: string
): VideoProject {
  const now = nowISO();
  return {
    id: randomId(),
    status: "draft",
    luma_prompt: lumaPrompt,
    voiceover_script: voiceoverScript,
    overlay_text: overlayText,
    created_at: now,
    updated_at: now,
  };
}
