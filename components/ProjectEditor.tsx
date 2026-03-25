"use client";

// =============================================================================
// ProjectEditor — Step 2 of the pipeline
//
// Controls:
//   1. Format toggle   — Video / Image
//   2. Generator select — dropdown populated by VIDEO_GENERATORS or IMAGE_GENERATORS
//   3. Visual Prompt   — always visible
//   4. Voiceover Script — video only
//   5. Overlay Text    — always visible
// =============================================================================

import { useState, useEffect } from "react";
import {
  MediaProject,
  MediaFormat,
  VideoGeneratorId,
  ImageGeneratorId,
  GeneratedIdea,
  VIDEO_GENERATORS,
  IMAGE_GENERATORS,
} from "@/types";
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
import { Select } from "@/components/ui/select";
import { Film, ImageIcon, Mic2, Type, Cpu } from "lucide-react";

interface ProjectEditorProps {
  initialValues?: Partial<Pick<MediaProject, "visual_prompt" | "voiceover_script" | "overlay_text">>;
  /**
   * When the Ideation Engine generates an idea it passes a GeneratedIdea here.
   * A useEffect watches this prop and auto-fills all textarea fields.
   * The user can still edit the fields afterwards before running the pipeline.
   */
  controlledValues?: GeneratedIdea | null;
  /** Called when the user submits — receives all values including format + model */
  onRunPipeline: (
    visualPrompt: string,
    voiceoverScript: string,
    overlayText: string,
    format: MediaFormat,
    model: VideoGeneratorId | ImageGeneratorId
  ) => void;
  isRunning: boolean;
}

// Tier badge colours for the generator description line
const TIER_STYLE: Record<string, string> = {
  free:      "text-emerald-400",
  freemium:  "text-amber-400",
  paid:      "text-rose-400",
};

export default function ProjectEditor({
  initialValues,
  controlledValues,
  onRunPipeline,
  isRunning,
}: ProjectEditorProps) {
  // ── Format toggle ─────────────────────────────────────────────────────────
  const [format, setFormat] = useState<MediaFormat>("video");

  // ── Generator model ───────────────────────────────────────────────────────
  // Defaults to the first option for the current format.
  const generators = format === "video" ? VIDEO_GENERATORS : IMAGE_GENERATORS;
  const [model, setModel] = useState<VideoGeneratorId | ImageGeneratorId>(
    generators[0].id
  );

  // When the format changes, reset model to the first option of the new list
  useEffect(() => {
    const list = format === "video" ? VIDEO_GENERATORS : IMAGE_GENERATORS;
    setModel(list[0].id);
  }, [format]);

  // Metadata for the currently selected generator (for the description blurb)
  const selectedGenerator = generators.find((g) => g.id === model) ?? generators[0];

  // ── Field state ───────────────────────────────────────────────────────────
  const [visualPrompt, setVisualPrompt]       = useState(initialValues?.visual_prompt    ?? "");
  const [voiceoverScript, setVoiceoverScript] = useState(initialValues?.voiceover_script ?? "");
  const [overlayText, setOverlayText]         = useState(initialValues?.overlay_text     ?? "");

  // When the Ideation Engine emits a GeneratedIdea, auto-fill all fields.
  // The user can still edit any field before hitting "Run Pipeline".
  useEffect(() => {
    if (!controlledValues) return;
    setVisualPrompt(controlledValues.visual_prompt);
    setOverlayText(controlledValues.overlay_text);
    setVoiceoverScript(controlledValues.voiceover_script);
  }, [controlledValues]);

  // Voiceover only required for video
  const canRun =
    visualPrompt.trim().length > 0 &&
    (format === "image" || voiceoverScript.trim().length > 0) &&
    overlayText.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRun) return;
    onRunPipeline(
      visualPrompt.trim(),
      voiceoverScript.trim(),
      overlayText.trim(),
      format,
      model
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {format === "video"
            ? <Film className="h-5 w-5 text-brand-500" />
            : <ImageIcon className="h-5 w-5 text-brand-500" />
          }
          Project Editor
        </CardTitle>
        <CardDescription>
          Choose a format and AI generator, then define the creative layers.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── 1. Format Toggle ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-200">Format</label>
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setFormat("video")}
                disabled={isRunning}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  format === "video"
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                Video
              </button>
              <button
                type="button"
                onClick={() => setFormat("image")}
                disabled={isRunning}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  format === "image"
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </button>
            </div>
          </div>

          {/* ── 2. AI Generator Select ───────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-brand-400" />
              Select AI Generator
            </label>
            <Select
              value={model}
              onChange={(e) => setModel(e.target.value as VideoGeneratorId | ImageGeneratorId)}
              disabled={isRunning}
              options={generators.map((g) => ({
                value: g.id,
                label: `${g.label} — ${g.provider}`,
                badge: g.tier,
              }))}
            />
            {/* Description blurb for the selected generator */}
            <p className="text-xs text-zinc-500">
              {selectedGenerator.description}{" "}
              <span className={`font-semibold ${TIER_STYLE[selectedGenerator.tier] ?? "text-zinc-400"}`}>
                [{selectedGenerator.tier}]
              </span>
            </p>
          </div>

          {/* ── 3. Visual Prompt (always visible) ───────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              {format === "video"
                ? <Film className="h-4 w-4 text-brand-400" />
                : <ImageIcon className="h-4 w-4 text-brand-400" />
              }
              Visual Prompt
              <span className="text-xs font-normal text-zinc-500 ml-1">— Visuals</span>
            </label>
            <Textarea
              placeholder={
                format === "video"
                  ? "A cinematic slow-motion shot of a developer staring at a screen, neon blue light, lofi aesthetic, vertical 9:16"
                  : "A dramatic close-up of a developer's hands on a keyboard, neon lighting, dark background, meme aesthetic"
              }
              rows={3}
              value={visualPrompt}
              onChange={(e) => setVisualPrompt(e.target.value)}
              disabled={isRunning}
              required
            />
            <p className="text-xs text-zinc-500">
              Sent to <span className="text-zinc-300">{selectedGenerator.provider}</span>.{" "}
              {format === "video"
                ? "Include mood, camera movement, and aspect ratio (9:16 for Reels)."
                : "Be descriptive — style, lighting, mood, and composition all matter."}
            </p>
          </div>

          {/* ── 4. Voiceover Script (video only) ────────────────────────── */}
          {format === "video" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-emerald-400" />
                Voiceover Script
                <span className="text-xs font-normal text-zinc-500 ml-1">— Audio</span>
              </label>
              <Textarea
                placeholder="You think you understand recursion. Then you actually try to implement it. This... is that moment."
                rows={4}
                value={voiceoverScript}
                onChange={(e) => setVoiceoverScript(e.target.value)}
                disabled={isRunning}
                required
              />
              <p className="text-xs text-zinc-500">
                ElevenLabs will synthesise this with the Rachel voice. Aim for 15–30 seconds.
              </p>
            </div>
          )}

          {/* ── 5. Overlay Text (always visible) ────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Type className="h-4 w-4 text-amber-400" />
              Overlay Text
              <span className="text-xs font-normal text-zinc-500 ml-1">— Meme Caption</span>
            </label>
            <Input
              placeholder="me debugging at 3am 💀"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              disabled={isRunning}
              required
            />
            <p className="text-xs text-zinc-500">
              Burned into the bottom of the frame via FFmpeg{" "}
              <code className="text-zinc-400">drawtext</code> filter. Under 60 chars.
            </p>
          </div>

        </form>
      </CardContent>

      <CardFooter>
        <Button
          form="project-form"
          type="submit"
          isLoading={isRunning}
          disabled={!canRun || isRunning}
          size="lg"
          className="w-full"
        >
          {isRunning
            ? "Pipeline Running…"
            : `Run ${format === "video" ? "Video" : "Image"} Pipeline →`
          }
        </Button>
      </CardFooter>
    </Card>
  );
}
