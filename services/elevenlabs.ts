// =============================================================================
// ELEVENLABS SERVICE  (Text-to-Speech)
// Converts the voiceover script into a synthesised MP3.
//
// DOCS: https://elevenlabs.io/docs/api-reference/text-to-speech
//
// REAL IMPLEMENTATION NOTES:
//   1. Set ELEVENLABS_API_KEY in .env.local
//   2. POST /v1/text-to-speech/:voice_id
//   3. Body: { text, model_id, voice_settings }
//   4. Response is an audio/mpeg binary — upload to your own storage
//      (S3, Supabase Storage, Cloudflare R2) and return the public URL.
//
// DEFAULT VOICE: "Rachel" — voice ID: 21m00Tcm4TlvDq8ikWAM
// Browse voices at https://elevenlabs.io/voice-library
// =============================================================================

import { ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

// Default voice: Rachel (warm, clear, suited for narration)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// ---------------------------------------------------------------------------
// ElevenLabsService
// ---------------------------------------------------------------------------
export class ElevenLabsService {
  // TODO [REAL]: private readonly baseUrl = "https://api.elevenlabs.io";
  // TODO [REAL]: private readonly apiKey = process.env.ELEVENLABS_API_KEY!;

  /**
   * generateAudio
   * Sends `script` to ElevenLabs and returns a URL to the resulting MP3.
   *
   * @param script   - The narration text to synthesise
   * @param voiceId  - ElevenLabs voice ID (defaults to Rachel)
   * @returns        - Promise resolving to the public MP3 URL
   */
  async generateAudio(
    script: string,
    voiceId: string = DEFAULT_VOICE_ID
  ): Promise<ServiceResult<string>> {
    if (!script.trim()) {
      return { ok: false, error: "Voiceover script cannot be empty." };
    }

    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // Step 1: Call ElevenLabs TTS endpoint
    // const ttsResponse = await fetch(
    //   `${this.baseUrl}/v1/text-to-speech/${voiceId}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "xi-api-key": this.apiKey,
    //       "Content-Type": "application/json",
    //       Accept: "audio/mpeg",
    //     },
    //     body: JSON.stringify({
    //       text: script,
    //       model_id: "eleven_multilingual_v2",
    //       voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    //     }),
    //   }
    // );
    //
    // if (!ttsResponse.ok) {
    //   return { ok: false, error: "ElevenLabs TTS request failed." };
    // }
    //
    // Step 2: Get audio binary and upload to storage
    // const audioBuffer = await ttsResponse.arrayBuffer();
    // const fileName = `voiceover_${randomId()}.mp3`;
    //
    // TODO [STORAGE]: Upload audioBuffer to S3 / Supabase / R2:
    //   const audioUrl = await uploadToStorage(fileName, audioBuffer);
    //
    // return { ok: true, data: audioUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    // MOCK — simulates TTS synthesis latency
    await fakDelay(2000);
    const mockAudioUrl = `https://storage.example.com/audio/voiceover_${randomId()}.mp3`;
    console.log(`[ElevenLabsService] Mock audio generated: ${mockAudioUrl}`);
    return { ok: true, data: mockAudioUrl };
  }

  /**
   * listVoices
   * Fetches all available voices from ElevenLabs.
   * Useful for a voice-picker UI dropdown.
   *
   * TODO [REAL]: Implement this for the voice selector feature.
   */
  // async listVoices(): Promise<ServiceResult<{ voice_id: string; name: string }[]>> {
  //   const response = await fetch(`${this.baseUrl}/v1/voices`, {
  //     headers: { "xi-api-key": this.apiKey },
  //   });
  //   const data = await response.json();
  //   return { ok: true, data: data.voices };
  // }
}

export const elevenLabsService = new ElevenLabsService();
