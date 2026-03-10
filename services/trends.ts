// =============================================================================
// TRENDS SERVICE
// Responsible for sourcing raw ideas/trends that feed the pipeline.
//
// CURRENT IMPLEMENTATION: manual input only — the UI passes notes directly.
//
// FUTURE INTEGRATIONS (see TODO comments):
//   • Apify — scrape TikTok / Instagram / Twitter trending content
//   • Perplexity / You.com API — AI-powered trend research
//   • RSS feeds from niche subreddits or newsletters
// =============================================================================

import { TrendInput, ServiceResult } from "@/types";
import { randomId, nowISO } from "@/services/_utils";

// -----------------------------------------------------------------------------
// TODO [APIFY]: Import the Apify client here once you have an API key.
//
//   import { ApifyClient } from "apify-client";
//   const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
//
// Then replace the manual path with a call to the appropriate Actor, e.g.:
//   const run = await apifyClient.actor("apify/tiktok-scraper").call({ ... });
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// TrendsService
// -----------------------------------------------------------------------------
export class TrendsService {
  /**
   * createManualTrend
   * Wraps a user-typed note into a TrendInput object.
   * This is the only active data path until automated scraping is wired up.
   *
   * @param notes  - Free-form text describing the idea
   * @param sourceUrl - Optional URL the user pasted alongside their idea
   */
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

    // TODO [PERSISTENCE]: Save trend to your DB (Supabase / PlanetScale / etc.)
    //   await db.trends.create({ data: trend });

    return { ok: true, data: trend };
  }

  // ---------------------------------------------------------------------------
  // TODO [APIFY] fetchTrendingTikToks
  // ---------------------------------------------------------------------------
  // async fetchTrendingTikToks(hashtag: string): Promise<ServiceResult<TrendInput[]>> {
  //   const run = await apifyClient.actor("clockworks/free-tiktok-scraper").call({
  //     hashtags: [hashtag],
  //     resultsPerPage: 10,
  //   });
  //   const dataset = await run.dataset().getData();
  //   const trends = dataset.items.map((item: any) => ({
  //     id: randomId(),
  //     source_url: item.webVideoUrl,
  //     notes: item.text,
  //     created_at: nowISO(),
  //   }));
  //   return { ok: true, data: trends };
  // }

  // ---------------------------------------------------------------------------
  // TODO [APIFY] fetchTrendingInstagramReels
  // ---------------------------------------------------------------------------
  // async fetchTrendingInstagramReels(tag: string): Promise<ServiceResult<TrendInput[]>> {
  //   // Use "apify/instagram-hashtag-scraper" actor
  //   // ...
  // }
}

// Singleton export so the rest of the app imports one instance
export const trendsService = new TrendsService();
