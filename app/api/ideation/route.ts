// =============================================================================
// POST /api/ideation
//
// Server-side route that orchestrates the Ideation Engine:
//   1. (Optional) Fetch current trending topics via TrendsService
//   2. Call the LLM to generate a structured content idea
//   3. Return a GeneratedIdea JSON object to the client
//
// WHY A SERVER ROUTE?
//   The GEMINI_API_KEY (and any future APIFY_API_TOKEN / OPENAI_API_KEY)
//   must never be exposed to the browser. This route keeps all secrets
//   server-side while letting the client UI trigger ideation safely.
//
// REQUEST BODY
//   { "source": "manual" | "llm-only" | "scraped-trends-plus-llm" }
//
// RESPONSE (200)
//   GeneratedIdea — see types/index.ts
//
// ERROR RESPONSES
//   400 — missing or invalid `source`
//   500 — LLM or trends call failed (with error message)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { trendsService } from "@/services/trends";
import { generateContentIdea } from "@/services/llm";
import { IdeaSource } from "@/types";

const VALID_SOURCES: IdeaSource[] = [
  "manual",
  "llm-only",
  "scraped-trends-plus-llm",
];

export async function POST(req: NextRequest) {
  // ── Parse & validate request body ─────────────────────────────────────────
  let source: IdeaSource;

  try {
    const body = await req.json();
    source = body?.source as IdeaSource;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  // "manual" source should never hit this route — the client handles it locally
  if (source === "manual") {
    return NextResponse.json(
      { error: "Manual source does not use the ideation API." },
      { status: 400 }
    );
  }

  // ── Step 1: Fetch trends (only for scraped-trends-plus-llm) ───────────────
  let trendsData: string | undefined;

  if (source === "scraped-trends-plus-llm") {
    try {
      trendsData = await trendsService.fetchCurrentTrends();
      console.log(`[POST /api/ideation] Trends fetched: "${trendsData}"`);
    } catch (err) {
      console.error("[POST /api/ideation] Trend fetch failed:", err);
      // Non-fatal — LLM will proceed without trend context
    }
  }

  // ── Step 2: Generate idea with LLM ────────────────────────────────────────
  try {
    const idea = await generateContentIdea(source, trendsData);
    return NextResponse.json(idea);
  } catch (err) {
    console.error("[POST /api/ideation] LLM generation failed:", err);
    return NextResponse.json(
      { error: "Content idea generation failed. Check server logs." },
      { status: 500 }
    );
  }
}
