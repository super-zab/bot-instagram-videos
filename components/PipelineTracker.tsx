"use client";

// =============================================================================
// PipelineTracker — visual status timeline
// Shows which stage the current MediaProject is in.
// Each step lights up as the pipeline progresses.
//
// The "Generating Media" step description adapts to the project format:
//   video → "Fal.ai is rendering clip · ElevenLabs is synthesising audio"
//   image → "Pollinations.ai is generating image"
// =============================================================================

import { MediaProject, PIPELINE_STEPS, ProjectStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineTrackerProps {
  project: MediaProject | null;
}

// Map each status to a Badge variant so colours are semantic
const STATUS_BADGE: Record<ProjectStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  draft: "secondary",
  generating_media: "warning",
  compositing: "warning",
  ready: "success",
  published: "default",
};

// Ordered list used to determine "how far along" we are
const ORDERED_STATUSES: ProjectStatus[] = [
  "draft",
  "generating_media",
  "compositing",
  "ready",
  "published",
];

export default function PipelineTracker({ project }: PipelineTrackerProps) {
  const currentStatus = project?.status ?? "draft";
  const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);
  const isImage = project?.format === "image";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-100">Pipeline Tracker</h2>
        {project && (
          <div className="flex items-center gap-2">
            {/* Format badge */}
            <Badge variant="outline" className="text-xs capitalize">
              {project.format}
            </Badge>
            <Badge variant={STATUS_BADGE[currentStatus]}>
              {currentStatus.replace("_", " ")}
            </Badge>
          </div>
        )}
      </div>

      {/* Step list */}
      <ol className="relative flex flex-col gap-0">
        {PIPELINE_STEPS.map((step, i) => {
          const stepIndex = ORDERED_STATUSES.indexOf(step.key);
          const isDone = stepIndex < currentIndex;
          const isActive = stepIndex === currentIndex;
          const isPending = stepIndex > currentIndex;

          // Override the "Generating Media" description based on format
          const description =
            step.key === "generating_media" && project
              ? isImage
                ? "Pollinations.ai is generating your image"
                : "Fal.ai is rendering video · ElevenLabs is synthesising audio"
              : step.description;

          return (
            <li key={step.key} className="flex items-start gap-4">
              {/* Connector line + icon column */}
              <div className="flex flex-col items-center">
                {/* Step icon circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isDone && "border-emerald-500 bg-emerald-500 text-white",
                    isActive && "border-brand-500 bg-brand-500/20 text-brand-400",
                    isPending && "border-zinc-700 bg-zinc-800 text-zinc-600"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>

                {/* Vertical connector — hide for last item */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 my-1 min-h-[24px]",
                      isDone ? "bg-emerald-600" : "bg-zinc-700"
                    )}
                  />
                )}
              </div>

              {/* Step text */}
              <div className="pb-6">
                <p
                  className={cn(
                    "text-sm font-semibold leading-none mb-1",
                    isDone && "text-emerald-400",
                    isActive && "text-brand-300",
                    isPending && "text-zinc-500"
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    isActive ? "text-zinc-300" : "text-zinc-600"
                  )}
                >
                  {description}
                </p>

                {/* Show intermediate asset URLs while generating */}
                {isActive && project && step.key === "generating_media" && (
                  <AssetStatus
                    generationId={project.generation_id}
                    mediaUrl={project.media_url}
                    audioUrl={project.elevenlabs_audio_url}
                    isImage={isImage}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shows asset URLs as they resolve during the generation stage
// ---------------------------------------------------------------------------
function AssetStatus({
  generationId,
  mediaUrl,
  audioUrl,
  isImage,
}: {
  generationId?: string;
  mediaUrl?: string;
  audioUrl?: string;
  isImage: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1 text-xs font-mono text-zinc-500">
      {/* Show job ID while video is still rendering */}
      {generationId && !mediaUrl && (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-brand-400" />
          Job: {generationId}
        </span>
      )}
      {mediaUrl && (
        <span className="text-emerald-500">
          ✓ {isImage ? "Image" : "Video"} ready
        </span>
      )}
      {/* Audio status is only relevant for the video path */}
      {!isImage && audioUrl && (
        <span className="text-emerald-500">✓ Audio ready</span>
      )}
    </div>
  );
}
