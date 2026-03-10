// =============================================================================
// COMPOSER SERVICE  (FFmpeg Media Compositing)
// Merges the Luma video clip, ElevenLabs audio track, and text overlay
// into a single publishable MP4 file.
//
// REAL IMPLEMENTATION — uses `fluent-ffmpeg` (Node.js FFmpeg wrapper)
// Install:  npm install fluent-ffmpeg @types/fluent-ffmpeg
//           Also ensure ffmpeg binary is available in your server environment.
//           On Vercel: use a Lambda layer or a self-hosted runner (Fly.io / Railway).
//
// FFMPEG PIPELINE OVERVIEW:
//   Input 0 : luma_video_url  (remote .mp4 — the visual)
//   Input 1 : audio_url       (remote .mp3 — the ElevenLabs voiceover)
//
//   Filter graph:
//     [0:v] drawtext=text='OVERLAY_TEXT':fontcolor=white:fontsize=48:
//              box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=h-100 [captioned]
//     [captioned][1:a] — amerge / shortest=1 — [out]
//
//   Output: final_output.mp4  (H.264 + AAC, re-encoded at target bitrate)
// =============================================================================

import { ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

// ---------------------------------------------------------------------------
// ComposerService
// ---------------------------------------------------------------------------
export class ComposerService {
  /**
   * compositeMedia
   * Combines the video, audio and text overlay into the final MP4.
   *
   * @param videoUrl    - CDN URL of the raw Luma video clip
   * @param audioUrl    - CDN URL of the ElevenLabs MP3 voiceover
   * @param overlayText - Short caption to burn into the bottom of the frame
   * @returns           - ServiceResult containing the final video URL
   */
  async compositeMedia(
    videoUrl: string,
    audioUrl: string,
    overlayText: string
  ): Promise<ServiceResult<string>> {
    if (!videoUrl || !audioUrl) {
      return {
        ok: false,
        error: "Both videoUrl and audioUrl are required for compositing.",
      };
    }

    // ── REAL IMPLEMENTATION (fluent-ffmpeg) ──────────────────────────────
    //
    // import ffmpeg from "fluent-ffmpeg";
    // import path from "path";
    // import os from "os";
    //
    // const outputPath = path.join(os.tmpdir(), `composed_${randomId()}.mp4`);
    //
    // await new Promise<void>((resolve, reject) => {
    //   ffmpeg()
    //     // Input 0: Video track (Luma clip)
    //     .input(videoUrl)
    //     // Input 1: Audio track (ElevenLabs voiceover)
    //     .input(audioUrl)
    //     // Video filter: burn in the overlay text at the bottom-centre
    //     //   - drawtext filter reference: https://ffmpeg.org/ffmpeg-filters.html#drawtext
    //     //   - We escape special chars in overlayText before interpolation
    //     .videoFilter(
    //       `drawtext=text='${escapeFFmpegText(overlayText)}':` +
    //       `fontcolor=white:fontsize=52:` +
    //       `box=1:boxcolor=black@0.55:boxborderw=10:` +
    //       `x=(w-text_w)/2:y=h-120`
    //     )
    //     // Audio: replace the original Luma audio (if any) with the voiceover
    //     .audioCodec("aac")
    //     // Video: re-encode to H.264 for broad compatibility
    //     .videoCodec("libx264")
    //     // Stop when the shorter stream ends (video clip may be shorter than audio)
    //     .outputOptions(["-shortest", "-movflags faststart"])
    //     .output(outputPath)
    //     .on("end", resolve)
    //     .on("error", reject)
    //     .run();
    // });
    //
    // TODO [STORAGE]: Upload the composed file at outputPath to your storage bucket:
    //   const finalUrl = await uploadToStorage(`final_${randomId()}.mp4`, fs.readFileSync(outputPath));
    //   return { ok: true, data: finalUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — simulates a slow FFmpeg render
    await fakDelay(3500);
    const finalUrl = `https://storage.example.com/final/composed_${randomId()}.mp4`;
    console.log(`[ComposerService] Mock composition complete: ${finalUrl}`);
    return { ok: true, data: finalUrl };
  }
}

// ---------------------------------------------------------------------------
// Helper: escape special characters for the FFmpeg drawtext filter
// ---------------------------------------------------------------------------
// function escapeFFmpegText(text: string): string {
//   // drawtext uses : and ' as delimiters — they must be escaped
//   return text
//     .replace(/\\/g, "\\\\")
//     .replace(/'/g, "\\'")
//     .replace(/:/g, "\\:");
// }

export const composerService = new ComposerService();
