// =============================================================================
// COMPOSER SERVICE  — FFmpeg Media Compositing
//
// Branches on both `format` AND `model` to apply the correct composition path:
//
//   PATH A — Image  (all image models)
//     Input  : image URL (Pollinations, HF, OpenAI CDN, etc.)
//     Process: FFmpeg drawtext filter burns caption onto the image
//     Output : final JPEG with text baked in
//     Note   : No audio track for static images.
//
//     Model-specific notes inside PATH A:
//       pollinations  → URL loads lazily; FFmpeg will fetch it directly
//       hg-flux       → Blob was uploaded to storage; URL is a regular CDN link
//       nano-banana   → Same as hg-flux (Gradio returns a CDN URL)
//       dalle3        → OpenAI URLs expire in ~1h — must be re-uploaded to
//                       storage before reaching the composer (handled in image.ts)
//
//   PATH B — Video  (all video models)
//     Input 0: video URL  (mp4 from Fal.ai or HF SVD)
//     Input 1: audio URL  (mp3 from ElevenLabs)
//     Process: FFmpeg drawtext + audio replace + H.264/AAC re-encode
//     Output : final mp4 with voiceover and caption
//
//     Model-specific notes inside PATH B:
//       fal-kling     → Returns a standard CDN mp4; no special handling needed
//       hg-gradio-svd → Gradio returns a temporary URL; re-upload before here
//
// REAL IMPLEMENTATION:
//   npm install fluent-ffmpeg @types/fluent-ffmpeg
//   FFmpeg binary must be available on the server. Use Railway / Fly.io.
//   Vercel does NOT support FFmpeg binaries.
// =============================================================================

import { MediaFormat, VideoGeneratorId, ImageGeneratorId, ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

export class ComposerService {
  /**
   * compositeMedia
   * Main entry point — validates inputs and branches to the correct path.
   *
   * @param mediaUrl    - Raw generated media URL (video mp4 or image)
   * @param overlayText - Caption text to burn into the frame (drawtext)
   * @param format      - "video" | "image" — selects the composition path
   * @param model       - The generator that produced mediaUrl (for logging + future model-specific tuning)
   * @param audioUrl    - ElevenLabs mp3 URL (required only when format === "video")
   */
  async compositeMedia(
    mediaUrl: string,
    overlayText: string,
    format: MediaFormat,
    model: VideoGeneratorId | ImageGeneratorId,
    audioUrl?: string
  ): Promise<ServiceResult<string>> {
    if (!mediaUrl) {
      return { ok: false, error: "mediaUrl is required for compositing." };
    }
    if (format === "video" && !audioUrl) {
      return { ok: false, error: "audioUrl is required for video compositing." };
    }

    return format === "image"
      ? this._compositeImage(mediaUrl, overlayText, model as ImageGeneratorId)
      : this._compositeVideo(mediaUrl, audioUrl!, overlayText, model as VideoGeneratorId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PATH A — Image composition
  // ──────────────────────────────────────────────────────────────────────────
  private async _compositeImage(
    imageUrl: string,
    overlayText: string,
    model: ImageGeneratorId
  ): Promise<ServiceResult<string>> {
    // Model-specific pre-processing notes:
    //
    //   pollinations  → imageUrl is a live Pollinations request URL.
    //                   FFmpeg will resolve it on-the-fly with -i <url>.
    //                   No pre-download needed.
    //
    //   hg-flux       → imageUrl is already a persistent storage URL
    //                   (blob was uploaded in _hgFlux before returning here).
    //
    //   nano-banana   → Same as hg-flux.
    //
    //   dalle3        → imageUrl must be a persistent storage URL.
    //                   OpenAI CDN URLs expire after ~1h — the _dalle3
    //                   method must re-upload before returning its URL.
    //                   If you skip that step, FFmpeg will get a 403 here.
    //
    console.log(`[ComposerService:image] model=${model}, url=${imageUrl}`);

    // ── REAL IMPLEMENTATION (fluent-ffmpeg, single-frame image) ──────────
    //
    // import ffmpeg from "fluent-ffmpeg";
    // import path from "path";
    // import os from "os";
    //
    // const outputPath = path.join(os.tmpdir(), `composed_${randomId()}.jpg`);
    //
    // await new Promise<void>((resolve, reject) => {
    //   ffmpeg()
    //     .input(imageUrl)
    //     .videoFilter(
    //       `drawtext=text='${escapeFFmpegText(overlayText)}':` +
    //       `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    //       `fontcolor=white:fontsize=52:` +
    //       `box=1:boxcolor=black@0.55:boxborderw=10:` +
    //       `x=(w-text_w)/2:y=h-120`
    //     )
    //     .frames(1)          // output a single still frame
    //     .output(outputPath)
    //     .on("end", resolve)
    //     .on("error", reject)
    //     .run();
    // });
    //
    // TODO [STORAGE]:
    //   const finalUrl = await uploadToStorage(`final_${randomId()}.jpg`, fs.readFileSync(outputPath));
    //   return { ok: true, data: finalUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — image composition is fast (~1.5s)
    await fakDelay(1500);
    const finalUrl = `https://storage.example.com/final/image_${model}_${randomId()}.jpg`;
    console.log(`[ComposerService:image] Mock complete: ${finalUrl}`);
    return { ok: true, data: finalUrl };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PATH B — Video composition
  // ──────────────────────────────────────────────────────────────────────────
  private async _compositeVideo(
    videoUrl: string,
    audioUrl: string,
    overlayText: string,
    model: VideoGeneratorId
  ): Promise<ServiceResult<string>> {
    // Model-specific notes:
    //
    //   fal-kling     → Standard mp4 CDN URL; no special handling needed.
    //                   `-shortest` flag handles duration mismatch between
    //                   the 5s clip and the ElevenLabs audio.
    //
    //   hg-gradio-svd → Gradio returns a temporary signed URL.
    //                   The _hgGradioSVD method must re-upload to storage
    //                   before returning, otherwise FFmpeg gets a 403 here.
    //
    console.log(`[ComposerService:video] model=${model}, videoUrl=${videoUrl}`);

    // ── REAL IMPLEMENTATION (fluent-ffmpeg, video + audio) ────────────────
    //
    // import ffmpeg from "fluent-ffmpeg";
    // import path from "path";
    // import os from "os";
    //
    // const outputPath = path.join(os.tmpdir(), `composed_${randomId()}.mp4`);
    //
    // await new Promise<void>((resolve, reject) => {
    //   ffmpeg()
    //     .input(videoUrl)   // Input 0: AI-generated video clip
    //     .input(audioUrl)   // Input 1: ElevenLabs voiceover mp3
    //     .videoFilter(
    //       `drawtext=text='${escapeFFmpegText(overlayText)}':` +
    //       `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    //       `fontcolor=white:fontsize=52:` +
    //       `box=1:boxcolor=black@0.55:boxborderw=10:` +
    //       `x=(w-text_w)/2:y=h-120`
    //     )
    //     .videoCodec("libx264")
    //     .audioCodec("aac")
    //     // -shortest: stop when the shorter stream ends
    //     // -movflags faststart: put moov atom at front for web streaming
    //     .outputOptions(["-shortest", "-movflags faststart"])
    //     .output(outputPath)
    //     .on("end", resolve)
    //     .on("error", reject)
    //     .run();
    // });
    //
    // TODO [STORAGE]:
    //   const finalUrl = await uploadToStorage(`final_${randomId()}.mp4`, fs.readFileSync(outputPath));
    //   return { ok: true, data: finalUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — video render is slower (~3.5s)
    await fakDelay(3500);
    const finalUrl = `https://storage.example.com/final/video_${model}_${randomId()}.mp4`;
    console.log(`[ComposerService:video] Mock complete: ${finalUrl}`);
    return { ok: true, data: finalUrl };
  }
}

// ---------------------------------------------------------------------------
// Helper: escape special characters for the FFmpeg drawtext filter
// ---------------------------------------------------------------------------
// function escapeFFmpegText(text: string): string {
//   return text
//     .replace(/\\/g, "\\\\")
//     .replace(/'/g, "\\'")
//     .replace(/:/g, "\\:");
// }

export const composerService = new ComposerService();
