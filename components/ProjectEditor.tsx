"use client";

// =============================================================================
// ProjectEditor — Step 1 of the pipeline
// Lets the user craft the three core creative inputs:
//   1. Luma Prompt       → drives the AI video visual
//   2. Voiceover Script  → drives the ElevenLabs TTS audio
//   3. Overlay Text      → the meme/caption burned into the frame
// =============================================================================

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Film, Mic2, Type } from "lucide-react";

interface ProjectEditorProps {
  /** Pre-filled values (e.g. trend notes auto-mapped to the prompt) */
  initialValues?: Partial<Pick<VideoProject, "luma_prompt" | "voiceover_script" | "overlay_text">>;
  /** Called when the user saves the project and wants to run the pipeline */
  onRunPipeline: (
    lumaPrompt: string,
    voiceoverScript: string,
    overlayText: string
  ) => void;
  /** Whether the pipeline is currently running */
  isRunning: boolean;
}

export default function ProjectEditor({
  initialValues,
  onRunPipeline,
  isRunning,
}: ProjectEditorProps) {
  const [lumaPrompt, setLumaPrompt] = useState(
    initialValues?.luma_prompt ?? ""
  );
  const [voiceoverScript, setVoiceoverScript] = useState(
    initialValues?.voiceover_script ?? ""
  );
  const [overlayText, setOverlayText] = useState(
    initialValues?.overlay_text ?? ""
  );

  const canRun =
    lumaPrompt.trim().length > 0 &&
    voiceoverScript.trim().length > 0 &&
    overlayText.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRun) return;
    onRunPipeline(lumaPrompt.trim(), voiceoverScript.trim(), overlayText.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-brand-500" />
          Project Editor
        </CardTitle>
        <CardDescription>
          Define the three creative layers of your video.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Field 1: Luma Visual Prompt ─────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Film className="h-4 w-4 text-brand-400" />
              Luma Prompt
              <span className="text-xs font-normal text-zinc-500 ml-1">— Visuals</span>
            </label>
            <Textarea
              placeholder="A cinematic slow-motion shot of a developer staring at a screen, neon blue light, lofi aesthetic, vertical 9:16"
              rows={3}
              value={lumaPrompt}
              onChange={(e) => setLumaPrompt(e.target.value)}
              disabled={isRunning}
              required
            />
            <p className="text-xs text-zinc-500">
              This prompt is sent verbatim to Luma Dream Machine. Be specific
              about mood, camera movement, and aspect ratio (9:16 for Reels).
            </p>
          </div>

          {/* ── Field 2: Voiceover Script ───────────────────────────────── */}
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

          {/* ── Field 3: Overlay / Meme Caption ────────────────────────── */}
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
          {isRunning ? "Pipeline Running…" : "Run Pipeline →"}
        </Button>
      </CardFooter>
    </Card>
  );
}
