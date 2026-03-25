"use client";

// =============================================================================
// ProjectEditor — Step 2 of the pipeline
// Lets the user craft the creative inputs and choose the output format.
//
// Format toggle controls which fields are shown:
//   "video" → Visual Prompt + Voiceover Script + Overlay Text
//   "image" → Visual Prompt + Overlay Text only  (no audio needed)
// =============================================================================

import { useState } from "react";
import { MediaProject, MediaFormat } from "@/types";
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
import { Film, ImageIcon, Mic2, Type } from "lucide-react";

interface ProjectEditorProps {
  /** Pre-filled values (e.g. trend notes auto-mapped to the visual prompt) */
  initialValues?: Partial<Pick<MediaProject, "visual_prompt" | "voiceover_script" | "overlay_text">>;
  /** Called when the user saves and wants to run the pipeline */
  onRunPipeline: (
    visualPrompt: string,
    voiceoverScript: string,
    overlayText: string,
    format: MediaFormat
  ) => void;
  /** Whether the pipeline is currently running */
  isRunning: boolean;
}

export default function ProjectEditor({
  initialValues,
  onRunPipeline,
  isRunning,
}: ProjectEditorProps) {
  // ── Format toggle ─────────────────────────────────────────────────────────
  const [format, setFormat] = useState<MediaFormat>("video");

  // ── Field state ───────────────────────────────────────────────────────────
  const [visualPrompt, setVisualPrompt] = useState(
    initialValues?.visual_prompt ?? ""
  );
  const [voiceoverScript, setVoiceoverScript] = useState(
    initialValues?.voiceover_script ?? ""
  );
  const [overlayText, setOverlayText] = useState(
    initialValues?.overlay_text ?? ""
  );

  // Voiceover is only required for the video format
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
      format
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {format === "video" ? (
            <Film className="h-5 w-5 text-brand-500" />
          ) : (
            <ImageIcon className="h-5 w-5 text-brand-500" />
          )}
          Project Editor
        </CardTitle>
        <CardDescription>
          Choose a format, then define the creative layers of your post.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Format Toggle ────────────────────────────────────────────── */}
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
            <p className="text-xs text-zinc-500">
              {format === "video"
                ? "Generates a short video clip via Fal.ai + ElevenLabs voiceover."
                : "Generates a static image via Pollinations.ai — no voiceover needed."}
            </p>
          </div>

          {/* ── Field 1: Visual Prompt (always visible) ──────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              {format === "video" ? (
                <Film className="h-4 w-4 text-brand-400" />
              ) : (
                <ImageIcon className="h-4 w-4 text-brand-400" />
              )}
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
              {format === "video"
                ? "Sent to Fal.ai/Replicate. Be specific about mood, camera movement, and aspect ratio (9:16 for Reels)."
                : "Sent to Pollinations.ai. Be descriptive — style, lighting, mood, and composition matter."}
            </p>
          </div>

          {/* ── Field 2: Voiceover Script (video only) ───────────────────── */}
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
                ElevenLabs will synthesise this with the Rachel voice (configurable).
                Aim for 15–30 seconds of speech.
              </p>
            </div>
          )}

          {/* ── Field 3: Overlay / Meme Caption (always visible) ─────────── */}
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
              <code className="text-zinc-400">drawtext</code> filter. Keep it short
              (under 60 chars).
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
          {isRunning ? "Pipeline Running…" : `Run ${format === "video" ? "Video" : "Image"} Pipeline →`}
        </Button>
      </CardFooter>
    </Card>
  );
}
