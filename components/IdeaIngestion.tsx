"use client";

// =============================================================================
// IdeaIngestion — Step 1: Ideation Engine
//
// Three modes controlled by the "Idea Source" dropdown:
//
//   manual                → user types a concept → clicks "Confirm Idea"
//   llm-only              → clicks "Generate Idea" → LLM returns a full idea
//   scraped-trends-plus-llm → server fetches Google Trends + LLM → full idea
//
// On confirmation the component calls:
//   onIdeaConfirmed(trend, generatedIdea?)
//
// The optional `generatedIdea` is forwarded to ProjectEditor to auto-fill
// the Visual Prompt, Overlay Text, and Voiceover Script fields.
// =============================================================================

import { useState } from "react";
import {
  TrendInput,
  GeneratedIdea,
  IdeaSource,
  IDEA_SOURCES,
} from "@/types";
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
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Film,
  Type,
  Mic2,
} from "lucide-react";

interface IdeaIngestionProps {
  onIdeaConfirmed: (trend: TrendInput, generatedIdea?: GeneratedIdea) => void;
}

// Status of the generation flow
type GenStatus = "idle" | "fetching-trends" | "generating" | "done" | "error";

export default function IdeaIngestion({ onIdeaConfirmed }: IdeaIngestionProps) {
  // ── Source selector ───────────────────────────────────────────────────────
  const [source, setSource] = useState<IdeaSource>("manual");

  // ── Manual mode state ─────────────────────────────────────────────────────
  const [manualNotes, setManualNotes] = useState("");

  // ── Generation state ──────────────────────────────────────────────────────
  const [genStatus, setGenStatus] = useState<GenStatus>("idle");
  const [generatedIdea, setGeneratedIdea] = useState<GeneratedIdea | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const isGenerating =
    genStatus === "fetching-trends" || genStatus === "generating";

  // ── Generate idea via /api/ideation ──────────────────────────────────────
  const handleGenerate = async () => {
    setGenError(null);
    setGeneratedIdea(null);

    if (source === "scraped-trends-plus-llm") {
      setGenStatus("fetching-trends");
    } else {
      setGenStatus("generating");
    }

    try {
      const res = await fetch("/api/ideation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Unknown server error.");
      }

      const idea = (await res.json()) as GeneratedIdea;
      setGeneratedIdea(idea);
      setGenStatus("done");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed.");
      setGenStatus("error");
    }
  };

  // ── Confirm manual idea ───────────────────────────────────────────────────
  const handleConfirmManual = async () => {
    const result = await trendsService.createManualTrend(manualNotes);
    if (!result.ok) {
      setGenError(result.error);
      return;
    }
    onIdeaConfirmed(result.data);
  };

  // ── Use generated idea → move to editor ──────────────────────────────────
  const handleUseIdea = async () => {
    if (!generatedIdea) return;
    const result = await trendsService.createManualTrend(
      generatedIdea.visual_prompt,
      undefined
    );
    if (!result.ok) return;
    onIdeaConfirmed(result.data, generatedIdea);
  };

  // ── Source option metadata ────────────────────────────────────────────────
  const sourceOption = IDEA_SOURCES.find((s) => s.value === source)!;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Ideation Engine
        </CardTitle>
        <CardDescription>
          Generate or type a viral content concept to kick off the pipeline.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* ── Idea Source Selector ─────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-200">
            Idea Source
          </label>
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as IdeaSource);
              setGeneratedIdea(null);
              setGenStatus("idle");
              setGenError(null);
            }}
            disabled={isGenerating}
            options={IDEA_SOURCES.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
          <p className="text-xs text-zinc-500">{sourceOption.description}</p>
        </div>

        {/* ── MANUAL mode ─────────────────────────────────────────────── */}
        {source === "manual" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Your Idea / Trend Notes
            </label>
            <Textarea
              placeholder="e.g. 'POV: you finally understand recursion' — debugging humour trending on TikTok CS side."
              rows={4}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
            />
            {genError && <ErrorBanner message={genError} />}
          </div>
        )}

        {/* ── AI / TRENDING modes: loading states ─────────────────────── */}
        {source !== "manual" && genStatus === "fetching-trends" && (
          <StatusBanner
            icon={<TrendingUp className="h-4 w-4 animate-pulse text-brand-400" />}
            message="Fetching today's trending topics from Google Trends…"
          />
        )}

        {source !== "manual" && genStatus === "generating" && (
          <StatusBanner
            icon={<Sparkles className="h-4 w-4 animate-spin text-brand-400" />}
            message="LLM is crafting your viral concept…"
          />
        )}

        {/* ── Generated idea preview card ──────────────────────────────── */}
        {genStatus === "done" && generatedIdea && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Idea Generated
              </div>
              {generatedIdea.trends_used && (
                <Badge variant="outline" className="text-xs truncate max-w-[160px]">
                  Trend: {generatedIdea.trends_used.split(",")[0]?.trim()}
                </Badge>
              )}
            </div>

            {/* Visual Prompt preview */}
            <IdeaField
              icon={<Film className="h-3.5 w-3.5 text-brand-400" />}
              label="Visual Prompt"
              value={generatedIdea.visual_prompt}
            />

            {/* Overlay Text preview */}
            <IdeaField
              icon={<Type className="h-3.5 w-3.5 text-amber-400" />}
              label="Overlay Text"
              value={generatedIdea.overlay_text}
            />

            {/* Voiceover Script preview */}
            <IdeaField
              icon={<Mic2 className="h-3.5 w-3.5 text-emerald-400" />}
              label="Voiceover Script"
              value={generatedIdea.voiceover_script}
            />

            <p className="text-xs text-zinc-500 mt-1">
              Click <span className="text-zinc-300 font-medium">"Use This Idea"</span> to
              auto-fill the editor below, or{" "}
              <span className="text-zinc-300 font-medium">"Regenerate"</span> for another.
            </p>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────── */}
        {genStatus === "error" && genError && (
          <ErrorBanner message={genError} />
        )}
      </CardContent>

      {/* ── Footer actions ───────────────────────────────────────────────── */}
      <CardFooter className="flex flex-col gap-2">
        {/* Manual mode */}
        {source === "manual" && (
          <Button
            className="w-full"
            onClick={handleConfirmManual}
            disabled={!manualNotes.trim()}
          >
            Confirm Idea & Build Project →
          </Button>
        )}

        {/* AI modes — pre-generation */}
        {source !== "manual" && genStatus !== "done" && (
          <Button
            className="w-full"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={isGenerating}
          >
            {source === "scraped-trends-plus-llm" ? (
              <>
                <TrendingUp className="h-4 w-4" />
                {isGenerating ? "Generating…" : "Fetch Trends & Generate Idea"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating…" : "Generate Idea with AI"}
              </>
            )}
          </Button>
        )}

        {/* AI modes — post-generation */}
        {source !== "manual" && genStatus === "done" && (
          <div className="flex w-full gap-2">
            <Button
              className="flex-1"
              variant="success"
              onClick={handleUseIdea}
            >
              <CheckCircle2 className="h-4 w-4" />
              Use This Idea →
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------

function IdeaField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
        {icon}
        {label}
      </span>
      <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">{value}</p>
    </div>
  );
}

function StatusBanner({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
      {icon}
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-400 rounded-md bg-red-950/40 border border-red-800 px-3 py-2">
      {message}
    </p>
  );
}
