// =============================================================================
// LUMA AI SERVICE  (Dream Machine API)
// Handles video generation requests and status polling.
//
// DOCS: https://docs.lumalabs.ai/reference/creategeneration
//
// REAL IMPLEMENTATION NOTES:
//   1. Set LUMA_API_KEY in .env.local
//   2. POST  /dream-machine/v1/generations   → get back { id }
//   3. GET   /dream-machine/v1/generations/:id  → poll until state === "completed"
//   4. The completed response contains assets.video — that is luma_video_url
//
// The mock below simulates the two-phase async pattern so the UI works today.
// =============================================================================

import { ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

// ---------------------------------------------------------------------------
// Types mirroring the Luma API contract
// ---------------------------------------------------------------------------
export interface LumaGenerationRequest {
  prompt: string;
  /** Optional aspect ratio — defaults to 9:16 for Reels/Shorts */
  aspect_ratio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | "9:21";
  /** Optional — attach a keyframe image URL for style reference */
  keyframes?: { frame0?: { type: "image"; url: string } };
}

export interface LumaGenerationStatus {
  id: string;
  state: "queued" | "dreaming" | "completed" | "failed";
  /** CDN URL of the generated .mp4 — only present when state === "completed" */
  video_url?: string;
  failure_reason?: string;
}

// ---------------------------------------------------------------------------
// LumaService
// ---------------------------------------------------------------------------
export class LumaService {
  // TODO [REAL]: private readonly baseUrl = "https://api.lumalabs.ai/dream-machine/v1";
  // TODO [REAL]: private readonly apiKey = process.env.LUMA_API_KEY!;

  /**
   * requestVideo
   * Submits a text-to-video generation job to Luma AI.
   * Returns the generation ID that you then pass to `checkStatus` for polling.
   *
   * @param prompt       - Natural language description of the video clip
   * @param aspectRatio  - Target aspect ratio (default 9:16 for vertical video)
   */
  async requestVideo(
    prompt: string,
    aspectRatio: LumaGenerationRequest["aspect_ratio"] = "9:16"
  ): Promise<ServiceResult<{ generationId: string }>> {
    if (!prompt.trim()) {
      return { ok: false, error: "Prompt cannot be empty." };
    }

    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // const response = await fetch(`${this.baseUrl}/generations`, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${this.apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     prompt,
    //     aspect_ratio: aspectRatio,
    //   } satisfies LumaGenerationRequest),
    // });
    // if (!response.ok) {
    //   const err = await response.json();
    //   return { ok: false, error: err.message ?? "Luma request failed" };
    // }
    // const data = await response.json();
    // return { ok: true, data: { generationId: data.id } };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — simulates network round-trip
    await fakDelay(800);
    const generationId = `luma_mock_${randomId()}`;
    console.log(`[LumaService] Mock generation started: ${generationId}`);
    return { ok: true, data: { generationId } };
  }

  /**
   * checkStatus
   * Polls Luma for the current state of a generation job.
   * Call this on a 3–5 second interval until state === "completed" or "failed".
   *
   * @param generationId - The ID returned by requestVideo
   */
  async checkStatus(
    generationId: string
  ): Promise<ServiceResult<LumaGenerationStatus>> {
    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
    //   headers: { Authorization: `Bearer ${this.apiKey}` },
    // });
    // if (!response.ok) {
    //   return { ok: false, error: "Failed to fetch Luma generation status" };
    // }
    // const data: LumaGenerationStatus = await response.json();
    // return { ok: true, data };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — always returns "completed" with a fake video URL
    await fakDelay(2500);
    const status: LumaGenerationStatus = {
      id: generationId,
      state: "completed",
      video_url: "https://storage.lumalabs.ai/mock/sample-clip.mp4",
    };
    console.log(`[LumaService] Mock status resolved for: ${generationId}`);
    return { ok: true, data: status };
  }
}

export const lumaService = new LumaService();
