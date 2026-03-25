// =============================================================================
// IMAGE SERVICE  — Multi-provider router
//
// Acts as a dispatcher: receives a model ID and routes to the correct
// private implementation method. Add a new provider by:
//   1. Adding its ID to ImageGeneratorId in types/index.ts
//   2. Adding a case to the switch in generateImage()
//   3. Implementing the private _providerName() method below
//
// PROVIDERS
//   pollinations  → URL construction (Pollinations.ai)           [free, sync]
//   hg-flux       → Hugging Face Inference API (FLUX.1-dev)      [free tier]
//   nano-banana   → Hugging Face Gradio Client (@gradio/client)  [free]
//   dalle3        → OpenAI Images API (DALL·E 3)                 [paid]
// =============================================================================

import { ImageGeneratorId, ServiceResult } from "@/types";
import { fakDelay, randomId } from "@/services/_utils";

export class ImageService {
  /**
   * generateImage
   * Routes to the correct generator based on the `model` argument.
   * All paths are async even if synchronous internally, for a uniform API.
   *
   * @param prompt - Text prompt describing the desired image
   * @param model  - Generator ID selected by the user in the editor
   */
  async generateImage(
    prompt: string,
    model: ImageGeneratorId
  ): Promise<ServiceResult<string>> {
    if (!prompt.trim()) {
      return { ok: false, error: "Visual prompt cannot be empty." };
    }

    switch (model) {
      case "pollinations":
        return this._pollinations(prompt);
      case "hg-flux":
        return this._hgFlux(prompt);
      case "nano-banana":
        return this._nanoBanana(prompt);
      case "dalle3":
        return this._dalle3(prompt);
      default:
        return { ok: false, error: `Unknown image generator: ${model}` };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROVIDER A — Pollinations.ai  (free, synchronous URL, no key needed)
  // ──────────────────────────────────────────────────────────────────────────
  private async _pollinations(prompt: string): Promise<ServiceResult<string>> {
    // Pollinations constructs the image on-the-fly from the URL.
    // No API key, no async job — the <img> src IS the API call.
    // Docs: https://pollinations.ai
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}` +
      `?width=1080&height=1920&nologo=true&model=flux`;

    console.log(`[ImageService:pollinations] URL: ${url}`);
    return { ok: true, data: url };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROVIDER B — Hugging Face Inference API / FLUX.1-dev  (free tier)
  // ──────────────────────────────────────────────────────────────────────────
  private async _hgFlux(prompt: string): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // No extra package needed — uses the standard HF Inference API over fetch.
    // Set HF_API_TOKEN in .env.local (free account gives ~1000 req/day).
    //
    // const response = await fetch(
    //   "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       inputs: prompt,
    //       parameters: { width: 1080, height: 1920 },
    //     }),
    //   }
    // );
    //
    // if (!response.ok) {
    //   return { ok: false, error: `HF API error: ${response.statusText}` };
    // }
    //
    // // Response is a raw image blob — upload it to storage and return the URL
    // const blob = await response.blob();
    // const buffer = Buffer.from(await blob.arrayBuffer());
    // TODO [STORAGE]: const imageUrl = await uploadToStorage(`hf-flux_${randomId()}.jpg`, buffer);
    // return { ok: true, data: imageUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    await fakDelay(2500);
    const url = `https://storage.example.com/mock/hg-flux_${randomId()}.jpg`;
    console.log(`[ImageService:hg-flux] Mock: ${url}`);
    return { ok: true, data: url };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROVIDER C — Hugging Face Gradio / NanoBanana  (free, @gradio/client)
  // ──────────────────────────────────────────────────────────────────────────
  private async _nanoBanana(prompt: string): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // npm install @gradio/client
    // No API key required for public HF Spaces.
    //
    // import { Client } from "@gradio/client";
    //
    // // "stabilityai/stable-diffusion" is a well-known free public Space
    // // Replace with the exact Space slug for NanoBanana if different
    // const client = await Client.connect("hysts/stable-diffusion-xl");
    //
    // const result = await client.predict("/run", {
    //   prompt,
    //   negative_prompt: "blurry, low quality",
    //   width: 1080,
    //   height: 1920,
    //   num_inference_steps: 25,
    //   guidance_scale: 7.5,
    // });
    //
    // // result.data[0] is typically a { url, path } object for image outputs
    // const imageUrl: string = (result.data as [{ url: string }])[0].url;
    // return { ok: true, data: imageUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    await fakDelay(2000);
    const url = `https://storage.example.com/mock/nano-banana_${randomId()}.jpg`;
    console.log(`[ImageService:nano-banana] Mock: ${url}`);
    return { ok: true, data: url };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROVIDER D — OpenAI / DALL·E 3  (paid, best quality)
  // ──────────────────────────────────────────────────────────────────────────
  private async _dalle3(prompt: string): Promise<ServiceResult<string>> {
    // ── REAL IMPLEMENTATION ───────────────────────────────────────────────
    // npm install openai
    // Set OPENAI_API_KEY in .env.local
    //
    // import OpenAI from "openai";
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    //
    // const response = await openai.images.generate({
    //   model: "dall-e-3",
    //   prompt,
    //   n: 1,
    //   size: "1024x1792", // closest to 9:16 that DALL·E 3 supports
    //   quality: "hd",     // "standard" is cheaper; "hd" is sharper
    //   style: "vivid",    // "vivid" or "natural"
    // });
    //
    // const imageUrl = response.data[0].url;
    // if (!imageUrl) return { ok: false, error: "OpenAI returned no image URL." };
    //
    // // NOTE: OpenAI URLs expire after ~1 hour — download and re-upload to storage:
    // TODO [STORAGE]: download imageUrl blob → uploadToStorage(`dalle3_${randomId()}.jpg`, buffer)
    // return { ok: true, data: persistentUrl };
    // ── END REAL ──────────────────────────────────────────────────────────

    await fakDelay(3000); // DALL·E 3 is typically 2-4s
    const url = `https://storage.example.com/mock/dalle3_${randomId()}.jpg`;
    console.log(`[ImageService:dalle3] Mock: ${url}`);
    return { ok: true, data: url };
  }
}

export const imageService = new ImageService();
