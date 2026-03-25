// =============================================================================
// COMPOSER SERVICE  (FFmpeg Media Compositing)
//
// Handles the final composition step for both media formats:
//
//   PATH A — Image format:
//     Input  : image URL (from Pollinations)
//     Process: FFmpeg drawtext filter burns the overlay caption onto the image
//     Output : final JPEG/PNG with text baked in
//     Note   : No audio track needed for static images.
//
//   PATH B — Video format:
//     Input 0: video URL  (mp4 from Fal.ai / Replicate)
//     Input 1: audio URL  (mp3 from ElevenLabs)
//     Process: FFmpeg drawtext + amerge filter graph
//     Output : final H.264/AAC mp4 with voiceover and caption
//
// REAL IMPLEMENTATION NOTES:
//   npm install fluent-ffmpeg @types/fluent-ffmpeg
//   Ensure the ffmpeg binary is available in your server environment.
//   On Vercel: use a Lambda layer or a self-hosted runner (Fly.io / Railway).
//   On Railway/Fly.io: ffmpeg is available by default in most base images.
// =============================================================================

import { MediaFormat, ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

// ---------------------------------------------------------------------------
// ComposerService
// ---------------------------------------------------------------------------
export class ComposerService {
  /**
   * compositeMedia
   * Branches on `format` to apply the correct composition pipeline.
   *
   * @param mediaUrl    - CDN URL of the raw generated media (video mp4 or image URL)
   * @param overlayText - Short caption to burn into the frame via drawtext
   * @param format      - "video" or "image" — determines which FFmpeg path to use
   * @param audioUrl    - CDN URL of the ElevenLabs mp3 (required only for "video")
   * @returns           - ServiceResult containing the URL of the final composed file
   */
  async compositeMedia(
    mediaUrl: string,
    overlayText: string,
    format: MediaFormat,
    audioUrl?: string
  ): Promise<ServiceResult<string>> {
    if (!mediaUrl) {
      return { ok: false, error: "mediaUrl is required for compositing." };
    }
    if (format === "video" && !audioUrl) {
      return { ok: false, error: "audioUrl is required for video compositing." };
    }

    if (format === "image") {
      return this._compositeImage(mediaUrl, overlayText);
    } else {
      return this._compositeVideo(mediaUrl, audioUrl!, overlayText);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATH A — Image composition (Pollinations image + drawtext overlay)
  // ─────────────────────────────────────────────────────────────────────────
  private async _compositeImage(
    imageUrl: string,
    overlayText: string
  ): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION (fluent-ffmpeg, image path) ───────────────────
    //
    // import ffmpeg from "fluent-ffmpeg";
    // import path from "path";
    // import os from "os";
    //
    // const outputPath = path.join(os.tmpdir(), `composed_image_${randomId()}.jpg`);
    //
    // await new Promise<void>((resolve, reject) => {
    //   ffmpeg()
    //     // Input: the raw Pollinations image (fetched remotely)
    //     .input(imageUrl)
    //     // Apply drawtext filter to burn the caption at bottom-centre
    //     .videoFilter(
    //       `drawtext=text='${escapeFFmpegText(overlayText)}':` +
    //       `fontcolor=white:fontsize=52:` +
    //       `box=1:boxcolor=black@0.55:boxborderw=10:` +
    //       `x=(w-text_w)/2:y=h-120`
    //     )
    //     // Output as a single JPEG frame (no video container needed)
    //     .frames(1)
    //     .output(outputPath)
    //     .on("end", resolve)
    //     .on("error", reject)
    //     .run();
    // });
    //
    // TODO [STORAGE]: Upload outputPath to your storage bucket:
    //   const finalUrl = await uploadToStorage(`final_${randomId()}.jpg`, fs.readFileSync(outputPath));
    //   return { ok: true, data: finalUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — simulates composition latency for an image (~1.5s, much faster than video)
    await fakDelay(1500);
    const finalUrl = `https://storage.example.com/final/composed_image_${randomId()}.jpg`;
    console.log(`[ComposerService] Mock image composition complete: ${finalUrl}`);
    return { ok: true, data: finalUrl };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATH B — Video composition (Fal.ai/Replicate mp4 + ElevenLabs mp3 + drawtext)
  // ─────────────────────────────────────────────────────────────────────────
  private async _compositeVideo(
    videoUrl: string,
    audioUrl: string,
    overlayText: string
  ): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION (fluent-ffmpeg, video path) ───────────────────
    //
    // import ffmpeg from "fluent-ffmpeg";
    // import path from "path";
    // import os from "os";
    //
    // const outputPath = path.join(os.tmpdir(), `composed_video_${randomId()}.mp4`);
    //
    // await new Promise<void>((resolve, reject) => {
    //   ffmpeg()
    //     // Input 0: Video track (Fal.ai / Replicate clip)
    //     .input(videoUrl)
    //     // Input 1: Audio track (ElevenLabs voiceover)
    //     .input(audioUrl)
    //     // Video filter: burn the overlay caption at bottom-centre
    //     //   drawtext filter reference: https://ffmpeg.org/ffmpeg-filters.html#drawtext
    //     .videoFilter(
    //       `drawtext=text='${escapeFFmpegText(overlayText)}':` +
    //       `fontcolor=white:fontsize=52:` +
    //       `box=1:boxcolor=black@0.55:boxborderw=10:` +
    //       `x=(w-text_w)/2:y=h-120`
    //     )
    //     // Re-encode video as H.264 for broad social platform compatibility
    //     .videoCodec("libx264")
    //     // Replace original audio track with the ElevenLabs voiceover (AAC)
    //     .audioCodec("aac")
    //     // Stop encoding when the shorter of the two streams ends
    //     .outputOptions(["-shortest", "-movflags faststart"])
    //     .output(outputPath)
    //     .on("end", resolve)
    //     .on("error", reject)
    //     .run();
    // });
    //
    // TODO [STORAGE]: Upload outputPath to your storage bucket:
    //   const finalUrl = await uploadToStorage(`final_${randomId()}.mp4`, fs.readFileSync(outputPath));
    //   return { ok: true, data: finalUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — simulates a slow FFmpeg video render (~3.5s)
    await fakDelay(3500);
    const finalUrl = `https://storage.example.com/final/composed_video_${randomId()}.mp4`;
    console.log(`[ComposerService] Mock video composition complete: ${finalUrl}`);
    return { ok: true, data: finalUrl };
  }
}

// ---------------------------------------------------------------------------
// Helper: escape special characters for the FFmpeg drawtext filter
// (used in real implementation above — uncomment when activating)
// ---------------------------------------------------------------------------
// function escapeFFmpegText(text: string): string {
//   // drawtext uses : and ' as delimiters — they must be escaped with backslash
//   return text
//     .replace(/\\/g, "\\\\")
//     .replace(/'/g, "\\'")
//     .replace(/:/g, "\\:");
// }

export const composerService = new ComposerService();
