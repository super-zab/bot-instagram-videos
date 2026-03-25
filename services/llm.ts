// =============================================================================
// LLM SERVICE — Content Idea Generator
//
// Uses the Google Gemini API to generate structured content ideas.
// Model: gemini-2.0-flash (fast, generous free tier as of 2025)
//        → Get key at: https://aistudio.google.com/app/apikey
//
// ALTERNATIVE PROVIDERS (swap out the _callGemini method):
//   OpenAI GPT-4o-mini  → npm install openai, set OPENAI_API_KEY
//   Anthropic Claude    → npm install @anthropic-ai/sdk, set ANTHROPIC_API_KEY
//
// This module runs SERVER-SIDE ONLY (called from app/api/ideation/route.ts).
// The API key is never sent to the browser.
//
// OUTPUT CONTRACT
// The LLM is instructed to return ONLY valid JSON matching GeneratedIdea:
//   {
//     "visual_prompt":    "<detailed image/video prompt>",
//     "overlay_text":     "<meme caption ≤60 chars>",
//     "voiceover_script": "<15-30s narration>"
//   }
// =============================================================================

import { IdeaSource, GeneratedIdea } from "@/types";

// ---------------------------------------------------------------------------
// Prompt templates
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are a viral social media content strategist specialising in
TikTok and Instagram Reels. You understand trending formats, hook psychology,
and what makes content shareable. Always respond with ONLY valid JSON — no
markdown fences, no extra text.`;

function buildPrompt(source: IdeaSource, trendsData?: string): string {
  const jsonSchema = `{
  "visual_prompt": "A richly detailed prompt for an AI image or video generator. Include style, mood, lighting, camera angle, and note that the format is 9:16 portrait. Be cinematic and specific (2-4 sentences).",
  "overlay_text": "A punchy meme caption of at most 60 characters.",
  "voiceover_script": "A natural, engaging 15-30 second narration that complements the visual. Conversational tone, hook in the first 3 words."
}`;

  if (source === "scraped-trends-plus-llm" && trendsData) {
    return (
      `Current trending topics right now: ${trendsData}\n\n` +
      `Pick ONE of these trends and create a funny, relatable, highly shareable ` +
      `TikTok/Instagram Reels concept based on it. The concept should feel native ` +
      `to the platform — not like an ad.\n\n` +
      `Return ONLY this JSON:\n${jsonSchema}`
    );
  }

  return (
    `Generate ONE original, funny, and highly viral TikTok/Instagram Reels concept. ` +
    `It should tap into relatable human experiences — productivity, tech humour, ` +
    `pop culture, or everyday absurdity. The hook must hit in the first 2 seconds.\n\n` +
    `Return ONLY this JSON:\n${jsonSchema}`
  );
}

// ---------------------------------------------------------------------------
// generateContentIdea — public entry point
// Called by: app/api/ideation/route.ts (server-side only)
// ---------------------------------------------------------------------------
export async function generateContentIdea(
  source: IdeaSource,
  trendsData?: string
): Promise<GeneratedIdea> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[LLM] GEMINI_API_KEY not set — returning mock idea.");
    return _mockIdea(source, trendsData);
  }

  try {
    return await _callGemini(apiKey, source, trendsData);
  } catch (err) {
    console.error("[LLM] Gemini call failed, falling back to mock:", err);
    return _mockIdea(source, trendsData);
  }
}

// ---------------------------------------------------------------------------
// _callGemini — sends the prompt to Gemini and parses the JSON response
// ---------------------------------------------------------------------------
async function _callGemini(
  apiKey: string,
  source: IdeaSource,
  trendsData?: string
): Promise<GeneratedIdea> {
  const prompt = buildPrompt(source, trendsData);

  // Gemini REST API — no SDK needed
  // Docs: https://ai.google.dev/api/generate-content
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // Force JSON output — Gemini will refuse non-JSON when this is set
          response_mime_type: "application/json",
          temperature: 1.0,   // higher = more creative
          maxOutputTokens: 512,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body}`);
  }

  const json = await res.json();

  // Navigate the Gemini response envelope
  const rawText: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) throw new Error("Gemini returned an empty response.");

  // Parse the JSON the model returned
  const idea = JSON.parse(rawText) as GeneratedIdea;

  // Validate required fields
  if (!idea.visual_prompt || !idea.overlay_text || !idea.voiceover_script) {
    throw new Error("Gemini response missing required fields.");
  }

  console.log("[LLM] Gemini idea generated successfully.");
  return { ...idea, trends_used: trendsData };
}

// ---------------------------------------------------------------------------
// _mockIdea — deterministic fallback used when GEMINI_API_KEY is not set
// or when the API call fails. Lets the full UI flow work in dev without keys.
// ---------------------------------------------------------------------------
function _mockIdea(source: IdeaSource, trendsData?: string): GeneratedIdea {
  const isTrending = source === "scraped-trends-plus-llm" && trendsData;

  return {
    visual_prompt: isTrending
      ? `A cinematic close-up of a developer's face lit by monitor glow, wide-eyed and caffeinated, surrounded by floating trend keywords: "${trendsData?.split(",")[0]?.trim() ?? "AI"}". Dark moody background, neon accents, 9:16 portrait, photorealistic.`
      : "A dramatic slow-motion shot of a developer staring at a screen as their code compiles, neon blue light, lofi aesthetic, particles floating in the air, 9:16 portrait, cinematic.",
    overlay_text: isTrending ? "when the trends write the code for you 💀" : "me at 3am waiting for the build 💀",
    voiceover_script: isTrending
      ? `So I let the internet decide what to post today. ${trendsData?.split(",")[0]?.trim() ?? "AI"} is everywhere. And honestly? Same. Here's what happened when I just leaned into the chaos.`
      : "You ever stare at a loading bar so long you forget what you were building? No? Just me? Cool. Cool cool cool.",
    trends_used: trendsData,
  };
}

// ---------------------------------------------------------------------------
// ALTERNATIVE: OpenAI GPT-4o-mini implementation
// Swap _callGemini for this if you prefer OpenAI.
// ---------------------------------------------------------------------------
// async function _callOpenAI(
//   source: IdeaSource,
//   trendsData?: string
// ): Promise<GeneratedIdea> {
//   import OpenAI from "openai"; // npm install openai
//   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//
//   const prompt = buildPrompt(source, trendsData);
//
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     response_format: { type: "json_object" },
//     messages: [
//       { role: "system", content: SYSTEM_INSTRUCTION },
//       { role: "user",   content: prompt },
//     ],
//     max_tokens: 512,
//     temperature: 1.0,
//   });
//
//   const raw = completion.choices[0].message.content ?? "";
//   return { ...JSON.parse(raw) as GeneratedIdea, trends_used: trendsData };
// }
