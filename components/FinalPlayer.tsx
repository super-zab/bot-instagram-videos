"use client";

// =============================================================================
// FinalPlayer — Step 4 of the pipeline
// Previews the final composed media and lets the user publish it.
//
// Conditionally renders:
//   <img>   when project.format === "image"
//   <video> when project.format === "video"
// =============================================================================

import { MediaProject } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, ImageIcon, Share2, RotateCcw } from "lucide-react";

interface FinalPlayerProps {
  project: MediaProject | null;
  /** Called when the user hits Publish */
  onPublish: () => void;
  /** Called when the user wants to start a new project */
  onReset: () => void;
  isPublishing: boolean;
}

export default function FinalPlayer({
  project,
  onPublish,
  onReset,
  isPublishing,
}: FinalPlayerProps) {
  const isReady =
    project?.status === "ready" || project?.status === "published";
  const isPublished = project?.status === "published";
  const finalUrl = project?.final_media_url;
  const isImage = project?.format === "image";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isImage ? (
              <ImageIcon className="h-5 w-5 text-emerald-400" />
            ) : (
              <PlayCircle className="h-5 w-5 text-emerald-400" />
            )}
            Final Preview
          </CardTitle>
          {isPublished && <Badge variant="success">Published</Badge>}
        </div>
        <CardDescription>
          Preview your composed{" "}
          {project ? (isImage ? "image" : "video") : "media"} before publishing
          to Instagram / TikTok.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* ── Media Preview Area ─────────────────────────────────────────── */}
        <div className="rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 aspect-[9/16] max-h-[500px] mx-auto flex items-center justify-center relative">
          {finalUrl ? (
            isImage ? (
              /*
               * IMAGE FORMAT
               * The Pollinations URL resolves lazily on first fetch.
               * In mock mode this URL is fake, so the img will show a broken icon —
               * expected behaviour. A real Pollinations URL will load correctly.
               */
              <img
                key={finalUrl}
                src={finalUrl}
                alt={project?.overlay_text ?? "Generated image"}
                className="h-full w-full object-contain"
              />
            ) : (
              /*
               * VIDEO FORMAT
               * The mock URL is not a real mp4, so the <video> shows an error —
               * expected in mock mode. Replace with a real CDN URL to play.
               */
              <video
                key={finalUrl}
                src={finalUrl}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            )
          ) : (
            // Empty state — nothing generated yet
            <div className="flex flex-col items-center gap-3 text-zinc-600 select-none">
              {isImage ? (
                <ImageIcon className="h-16 w-16 opacity-30" />
              ) : (
                <PlayCircle className="h-16 w-16 opacity-30" />
              )}
              <p className="text-sm">
                {project
                  ? `${isImage ? "Image" : "Video"} will appear here once the pipeline completes`
                  : "No project started yet"}
              </p>
            </div>
          )}
        </div>

        {/* ── Asset URL debug panel ──────────────────────────────────────── */}
        {isReady && project && (
          <div className="mt-4 rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-xs font-mono space-y-1.5">
            <AssetRow
              label={isImage ? "Image (Pollinations)" : "Video (Fal.ai)"}
              url={project.media_url}
            />
            {/* Audio row only appears for video projects */}
            {!isImage && (
              <AssetRow
                label="Audio (ElevenLabs)"
                url={project.elevenlabs_audio_url}
              />
            )}
            <AssetRow
              label="Final composed"
              url={project.final_media_url}
              highlighted
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-3">
        {/* Publish button */}
        <Button
          className="flex-1"
          variant="success"
          onClick={onPublish}
          disabled={!isReady || isPublished || isPublishing}
          isLoading={isPublishing}
        >
          <Share2 className="h-4 w-4" />
          {isPublished ? "Published ✓" : "Publish to Instagram"}
        </Button>

        {/* Reset / new project */}
        <Button variant="outline" onClick={onReset} disabled={isPublishing}>
          <RotateCcw className="h-4 w-4" />
          New
        </Button>
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Small helper to render a labelled URL row in the debug panel
// ---------------------------------------------------------------------------
function AssetRow({
  label,
  url,
  highlighted = false,
}: {
  label: string;
  url?: string;
  highlighted?: boolean;
}) {
  if (!url) return null;
  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      <span
        className={
          highlighted
            ? "text-emerald-400 truncate"
            : "text-zinc-400 truncate"
        }
      >
        {url}
      </span>
    </div>
  );
}
