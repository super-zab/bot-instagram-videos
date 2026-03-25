// =============================================================================
// VIDEO SERVICE  — Multi-provider router
//
// Acts as a dispatcher: receives a model ID and routes to the correct
// private implementation method. Add a new provider by:
//   1. Adding its ID to VideoGeneratorId in types/index.ts
//   2. Adding a case to the switch in generateVideo()
//   3. Implementing the private _providerName() method below
//
// PROVIDERS
//   fal-kling     → Fal.ai SDK  (@fal-ai/serverless-client)     [freemium]
//   hg-gradio-svd → Hugging Face Gradio Client (@gradio/client) [free]
// =============================================================================

import { VideoGeneratorId, ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

export class VideoService {
  /**
   * generateVideo
   * Routes to the correct generator based on the `model` argument.
   *
   * @param prompt - Text prompt describing the desired video clip
   * @param model  - Generator ID selected by the user in the editor
   */
  async generateVideo(
    prompt: string,
    model: VideoGeneratorId
  ): Promise<ServiceResult<string>> {
    if (!prompt.trim()) {
      return { ok: false, error: "Visual prompt cannot be empty." };
    }

    switch (model) {
      case "fal-kling":
        return this._falKling(prompt);
      case "hg-gradio-svd":
        return this._hgGradioSVD(prompt);
      default:
        // TypeScript's exhaustiveness check: this branch should never be hit
        return { ok: false, error: `Unknown video generator: ${model}` };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROVIDER A — Fal.ai / Kling 1.6
  // ──────────────────────────────────────────────────────────────────────────
  private async _falKling(prompt: string): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // npm install @fal-ai/serverless-client
    // Set FAL_API_KEY in .env.local
    //
    // import * as fal from "@fal-ai/serverless-client";
    // fal.config({ credentials: process.env.FAL_API_KEY });
    //
    // const result = await fal.subscribe(
    //   "fal-ai/kling-video/v1.6/standard/text-to-video",
    //   {
    //     input: {
    //       prompt,
    //       duration: "5",        // seconds (5 or 10)
    //       aspect_ratio: "9:16", // portrait for Reels / TikTok
    //     },
    //     pollInterval: 3000,
    //     logs: true,
    //   }
    // );
    // return { ok: true, data: result.video.url };
    // ── END REAL ──────────────────────────────────────────────────────────

    await fakDelay(3000);
    const url = `https://storage.example.com/mock/fal-kling_${randomId()}.mp4`;
    console.log(`[VideoService:fal-kling] Mock: ${url}`);
    return { ok: true, data: url };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROVIDER B — Hugging Face / Stable Video Diffusion (via Gradio)
  // ──────────────────────────────────────────────────────────────────────────
  private async _hgGradioSVD(prompt: string): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // npm install @gradio/client
    // No API key required for public HF Spaces (rate-limited).
    // For higher limits: set HF_API_TOKEN in .env.local
    //
    // import { Client } from "@gradio/client";
    //
    // // Connect to the public SVD Space on Hugging Face
    // const client = await Client.connect("stabilityai/stable-video-diffusion");
    //
    // // SVD takes an image as input and animates it — pass prompt as a description
    // // for an img2vid flow you will first generate an image, then animate it.
    // // For a text2vid approximation you can use a t2i space first:
    // const result = await client.predict("/run", {
    //   prompt,
    //   num_frames: 25,
    //   fps: 7,
    // });
    //
    // // result.data is an array; the video is the first item (a file URL)
    // const videoUrl: string = (result.data as [{ url: string }])[0].url;
    // return { ok: true, data: videoUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    await fakDelay(4000); // SVD is typically slower than Kling
    const url = `https://storage.example.com/mock/hg-svd_${randomId()}.mp4`;
    console.log(`[VideoService:hg-gradio-svd] Mock: ${url}`);
    return { ok: true, data: url };
  }
}

export const videoService = new VideoService();
