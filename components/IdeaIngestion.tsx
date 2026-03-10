"use client";

// =============================================================================
// IdeaIngestion — Step 0 of the pipeline
// Lets the user manually enter a trend/idea and optionally paste a source URL.
// The form calls the TrendsService which today just wraps the input;
// later it will also surface scraped trends from Apify.
// =============================================================================

import { useState } from "react";
import { TrendInput } from "@/types";
import { trendsService } from "@/services/trends";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Lightbulb, Link2 } from "lucide-react";

interface IdeaIngestionProps {
  /** Called when a TrendInput has been created and the user wants to move on */
  onIdeaConfirmed: (trend: TrendInput) => void;
}

export default function IdeaIngestion({ onIdeaConfirmed }: IdeaIngestionProps) {
  const [notes, setNotes] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await trendsService.createManualTrend(notes, sourceUrl);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Pass the confirmed trend up to the parent (app/page.tsx)
    onIdeaConfirmed(result.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Idea Ingestion
        </CardTitle>
        <CardDescription>
          Paste your trend, concept, or viral idea below.{" "}
          <span className="text-amber-400 font-medium">
            (Automated API scraping coming soon)
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="idea-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Main idea / notes field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Idea / Trend Notes
            </label>
            <Textarea
              placeholder="e.g. 'POV: you finally understand recursion' — people love debugging humour. Trending on TikTok CS side."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          {/* Optional source URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Source URL{" "}
              <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <Input
              type="url"
              placeholder="https://www.tiktok.com/@user/video/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>

          {/* Validation error */}
          {error && (
            <p className="text-sm text-red-400 rounded-md bg-red-950/40 border border-red-800 px-3 py-2">
              {error}
            </p>
          )}
        </form>
      </CardContent>

      <CardFooter>
        <Button form="idea-form" type="submit" isLoading={loading} className="w-full">
          Confirm Idea & Build Project →
        </Button>
      </CardFooter>
    </Card>
  );
}
