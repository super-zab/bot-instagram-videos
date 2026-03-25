// =============================================================================
// IMAGE SERVICE  (Pollinations.ai — free, no API key required)
//
// Pollinations.ai generates images entirely via a URL — no async job, no
// polling, no account needed. The URL IS the image request.
//
// How it works:
//   GET https://image.pollinations.ai/prompt/{encoded_prompt}?{params}
//   → Returns a PNG/JPEG image stream directly
//
// Dimensions are fixed at 1080×1920 (9:16 portrait) to match Instagram
// Reels and TikTok Story aspect ratios.
//
// For production, consider switching to:
//   - Stability AI (SDXL, SD3) — more control, paid tiers available
//   - Together AI (FLUX.1-dev) — fast, high quality
//   - Replicate (any diffusion model)
// =============================================================================

import { ServiceResult } from "@/types";

// ---------------------------------------------------------------------------
// ImageService
// ---------------------------------------------------------------------------
export class ImageService {
  /**
   * generateImage
   * Constructs and returns a Pollinations.ai image URL for the given prompt.
   *
   * This function is synchronous — Pollinations resolves the image lazily when
   * the URL is first fetched (e.g. by an <img> tag or a download call).
   * No API key, no rate limit for reasonable usage.
   *
   * @param prompt - Text prompt describing the desired image
   * @returns      - ServiceResult containing the ready-to-use image URL
   */
  generateImage(prompt: string): ServiceResult<string> {
    if (!prompt.trim()) {
      return { ok: false, error: "Visual prompt cannot be empty." };
    }

    // Build the Pollinations URL.
    // Params:
    //   width=1080  / height=1920 → 9:16 portrait (Reels / TikTok Story)
    //   nologo=true               → removes the Pollinations watermark
    //   model=flux                → best quality model (default as of 2025)
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}` +
      `?width=1080&height=1920&nologo=true&model=flux`;

    console.log(`[ImageService] Pollinations URL constructed: ${url}`);
    return { ok: true, data: url };
  }
}

export const imageService = new ImageService();
