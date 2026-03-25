// =============================================================================
// TRENDS SERVICE
// Two responsibilities:
//
//   1. createManualTrend() — wraps a user-typed idea into a TrendInput object
//                            (existing, unchanged)
//
//   2. fetchCurrentTrends() — scrapes real-time trending topics for the LLM
//                             context window. Currently uses the Google Trends
//                             Daily RSS feed (free, no API key required).
//                             Falls back to Apify if the RSS is unavailable.
//
// =============================================================================

import { TrendInput, ServiceResult } from "@/types";
import { randomId, nowISO } from "@/services/_utils";

// -----------------------------------------------------------------------------
// TODO [APIFY]: Uncomment once you have an Apify token.
//
//   import { ApifyClient } from "apify-client";
//   const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
// -----------------------------------------------------------------------------

export class TrendsService {
  // ---------------------------------------------------------------------------
  // createManualTrend — unchanged; wraps user notes into a TrendInput
  // ---------------------------------------------------------------------------
  async createManualTrend(
    notes: string,
    sourceUrl?: string
  ): Promise<ServiceResult<TrendInput>> {
    if (!notes.trim()) {
      return { ok: false, error: "Notes cannot be empty." };
    }
    const trend: TrendInput = {
      id: randomId(),
      notes: notes.trim(),
      source_url: sourceUrl?.trim() || undefined,
      created_at: nowISO(),
    };
    // TODO [PERSISTENCE]: await db.trends.create({ data: trend });
    return { ok: true, data: trend };
  }

  // ---------------------------------------------------------------------------
  // fetchCurrentTrends
  //
  // PRIMARY PATH — Google Trends Daily RSS (free, no key, ~1h cached)
  //   URL: https://trends.google.com/trending/rss?geo=US&hours=24
  //   Returns an RSS 2.0 feed of today's top trending searches in the US.
  //   We extract the top 5 <title> values from <item> elements.
  //
  // FALLBACK PATH — Apify (better data, requires token)
  //   Uncomment the Apify block below and set APIFY_API_TOKEN in .env.local.
  //
  // Returns a comma-separated string of trending keywords, e.g.:
  //   "Super Bowl, ChatGPT, Taylor Swift, NBA All-Star, Wordle"
  // ---------------------------------------------------------------------------
  async fetchCurrentTrends(): Promise<string> {
    // ── PRIMARY: Google Trends RSS ───────────────────────────────────────────
    try {
      const res = await fetch(
        "https://trends.google.com/trending/rss?geo=US&hours=24",
        {
          // Next.js fetch cache: revalidate every hour to avoid hammering Google
          next: { revalidate: 3600 },
        }
      );

      if (!res.ok) throw new Error(`Google Trends RSS returned ${res.status}`);

      const xml = await res.text();

      // Extract <title> text from <item> blocks using exec() loop (ES5-safe).
      // Google Trends wraps values in CDATA: <title><![CDATA[Topic]]></title>
      const itemPattern = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g;
      const cdataPattern = /<!\[CDATA\[([\s\S]*?)\]\]>/;
      const topics: string[] = [];
      let match: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((match = itemPattern.exec(xml)) !== null && topics.length < 5) {
        const raw = match[1];
        const cdata = cdataPattern.exec(raw);
        const text = (cdata ? cdata[1] : raw).trim();
        if (text) topics.push(text);
      }

      if (topics.length > 0) {
        console.log(`[TrendsService] Google Trends topics: ${topics.join(", ")}`);
        return topics.join(", ");
      }
    } catch (err) {
      console.warn("[TrendsService] Google Trends RSS failed:", err);
    }

    // ── SECONDARY: Apify TikTok Trending Actor ───────────────────────────────
    // TODO [APIFY]: Uncomment to use Apify as a higher-quality fallback.
    //
    // try {
    //   const run = await apifyClient
    //     .actor("clockworks/free-tiktok-scraper")
    //     .call({ hashtags: ["trending", "viral", "fyp"], resultsPerPage: 5 });
    //
    //   const { items } = await run.dataset().getData();
    //   const topics = items
    //     .map((item: { text?: string }) => item.text?.split(" ")[0])
    //     .filter(Boolean)
    //     .slice(0, 5);
    //
    //   if (topics.length > 0) return topics.join(", ");
    // } catch (err) {
    //   console.warn("[TrendsService] Apify fallback failed:", err);
    // }

    // ── FINAL FALLBACK: static seed topics ──────────────────────────────────
    // Used when both network calls fail (offline dev, rate limited, etc.)
    const fallback = "AI tools, productivity hacks, programming memes, pop culture, viral challenges";
    console.log(`[TrendsService] Using static fallback topics: ${fallback}`);
    return fallback;
  }

  // ---------------------------------------------------------------------------
  // TODO: fetchTrendingTikToks / fetchTrendingInstagramReels (Apify)
  // ---------------------------------------------------------------------------
  // async fetchTrendingTikToks(hashtag: string): Promise<ServiceResult<TrendInput[]>> { ... }
  // async fetchTrendingInstagramReels(tag: string): Promise<ServiceResult<TrendInput[]>> { ... }
}

export const trendsService = new TrendsService();
