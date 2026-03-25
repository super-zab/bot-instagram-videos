// =============================================================================
// VIDEO SERVICE  (Fal.ai / Replicate)
// Replaces the former luma.ts service.
//
// Responsible for generating short video clips from a text prompt.
// Currently returns a mock URL so the full UI flow can be tested immediately.
//
// REAL IMPLEMENTATION — choose one provider:
//
//   Option A: Fal.ai (Kling, Runway, etc.)
//     npm install @fal-ai/serverless-client
//     Set FAL_API_KEY in .env.local
//
//   Option B: Replicate
//     npm install replicate
//     Set REPLICATE_API_TOKEN in .env.local
// =============================================================================

import { ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

// ---------------------------------------------------------------------------
// VideoService
// ---------------------------------------------------------------------------
export class VideoService {
  /**
   * generateVideo
   * Submits a text-to-video job and resolves with the final video URL.
   * The real implementation will poll until the job completes.
   *
   * @param prompt - Text prompt describing the desired video clip
   * @returns      - ServiceResult containing the CDN URL of the generated mp4
   */
  async generateVideo(prompt: string): Promise<ServiceResult<string>> {
    if (!prompt.trim()) {
      return { ok: false, error: "Visual prompt cannot be empty." };
    }

    // ── REAL IMPLEMENTATION — Fal.ai ─────────────────────────────────────
    // TODO: Insert Fal.ai/Replicate fetch logic here
    //
    // import * as fal from "@fal-ai/serverless-client";
    //
    // fal.config({ credentials: process.env.FAL_API_KEY });
    //
    // // Using Kling 1.6 standard (text-to-video, 9:16 portrait for Reels)
    // const result = await fal.subscribe(
    //   "fal-ai/kling-video/v1.6/standard/text-to-video",
    //   {
    //     input: {
    //       prompt,
    //       duration: "5",        // seconds
    //       aspect_ratio: "9:16", // portrait for Instagram Reels / TikTok
    //     },
    //     pollInterval: 3000,     // poll every 3s until done
    //     logs: true,
    //   }
    // );
    //
    // return { ok: true, data: result.video.url };
    //
    // ── REAL IMPLEMENTATION — Replicate ──────────────────────────────────
    // TODO: Insert Replicate fetch logic here
    //
    // import Replicate from "replicate";
    //
    // const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    //
    // const output = await replicate.run(
    //   "minimax/video-01-live",    // or another video model
    //   { input: { prompt, duration: 5, resolution: "1080x1920" } }
    // );
    //
    // return { ok: true, data: String(output) };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — simulates video generation latency (~3s)
    await fakDelay(3000);
    const mockUrl = `https://storage.example.com/mock/video_${randomId()}.mp4`;
    console.log(`[VideoService] Mock video generated: ${mockUrl}`);
    return { ok: true, data: mockUrl };
  }
}

export const videoService = new VideoService();
