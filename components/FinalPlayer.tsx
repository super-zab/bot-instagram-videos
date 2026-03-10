"use client";

// =============================================================================
// FinalPlayer — Step 4 of the pipeline
// Previews the final composed video and lets the user publish it.
// =============================================================================

import { VideoProject } from "@/types";
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
import { PlayCircle, Share2, RotateCcw } from "lucide-react";

interface FinalPlayerProps {
  project: VideoProject | null;
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
  const videoUrl = project?.final_composed_video_url;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-emerald-400" />
            Final Player
          </CardTitle>
          {isPublished && (
            <Badge variant="success">Published</Badge>
          )}
        </div>
        <CardDescription>
          Preview your composed video before publishing to Instagram / TikTok.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Video preview area */}
        <div className="rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 aspect-[9/16] max-h-[500px] mx-auto flex items-center justify-center relative">
          {videoUrl ? (
            /*
             * NOTE: The mock URL is not a real video file, so the <video>
             * element will show an error — this is expected in mock mode.
             * Replace with a real URL and it will play correctly.
             */
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-zinc-600 select-none">
              <PlayCircle className="h-16 w-16 opacity-30" />
              <p className="text-sm">
                {project
                  ? "Video will appear here once the pipeline completes"
                  : "No project started yet"}
              </p>
            </div>
          )}
        </div>

        {/* Asset URL list for debugging */}
        {isReady && project && (
          <div className="mt-4 rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-xs font-mono space-y-1.5">
            <AssetRow label="Video (Luma)" url={project.luma_video_url} />
            <AssetRow label="Audio (ElevenLabs)" url={project.elevenlabs_audio_url} />
            <AssetRow label="Final composed" url={project.final_composed_video_url} highlighted />
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

// Small helper to render a labelled URL row
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
      <span className={highlighted ? "text-emerald-400 truncate" : "text-zinc-400 truncate"}>
        {url}
      </span>
    </div>
  );
}
