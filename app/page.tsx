"use client";

// =============================================================================
// Dashboard — Main Page  (app/page.tsx)
//
// Layout:
//   Left column  (2/5 width):
//     [1] IdeaIngestion  — capture the trend
//     [2] ProjectEditor  — craft the three creative inputs
//
//   Right column (3/5 width):
//     [3] PipelineTracker — live status of the pipeline
//     [4] FinalPlayer     — preview + publish
//
// State flows:
//   idle → (user confirms idea) → editing → (user runs pipeline) → running
//   → ready → (user publishes) → published
// =============================================================================

import { useState, useCallback } from "react";
import { VideoProject, TrendInput } from "@/types";
import { runPipeline, createProject } from "@/services/pipeline";
import IdeaIngestion from "@/components/IdeaIngestion";
import ProjectEditor from "@/components/ProjectEditor";
import PipelineTracker from "@/components/PipelineTracker";
import FinalPlayer from "@/components/FinalPlayer";
import { Zap } from "lucide-react";

// Dashboard UI states
type DashboardState = "idle" | "editing" | "running" | "ready" | "published";

export default function DashboardPage() {
  // ── App-level state ────────────────────────────────────────────────────────
  const [dashState, setDashState] = useState<DashboardState>("idle");
  const [activeTrend, setActiveTrend] = useState<TrendInput | null>(null);
  const [project, setProject] = useState<VideoProject | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Step 0: Idea confirmed → move to editing ───────────────────────────────
  const handleIdeaConfirmed = useCallback((trend: TrendInput) => {
    setActiveTrend(trend);
    setDashState("editing");
  }, []);

  // ── Step 1: User runs the pipeline ─────────────────────────────────────────
  const handleRunPipeline = useCallback(
    async (lumaPrompt: string, voiceoverScript: string, overlayText: string) => {
      const newProject = createProject(lumaPrompt, voiceoverScript, overlayText);
      setProject(newProject);
      setDashState("running");

      try {
        // runPipeline calls onUpdate on every status change so the tracker
        // re-renders in real-time as each stage completes.
        await runPipeline(newProject, (updated) => {
          setProject({ ...updated });
        });
        setDashState("ready");
      } catch (err) {
        console.error("[Pipeline Error]", err);
        // TODO: Show a toast / error UI
        setDashState("editing");
      }
    },
    []
  );

  // ── Step 2: Publish ─────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!project) return;
    setIsPublishing(true);

    // TODO [REAL]: Call your publish service here, e.g.:
    //   await instagramService.publish(project.final_composed_video_url!, caption);
    //   await tiktokService.publish(project.final_composed_video_url!, caption);

    // Mock: simulate upload latency
    await new Promise((r) => setTimeout(r, 1500));

    setProject((p) => p ? { ...p, status: "published" } : p);
    setDashState("published");
    setIsPublishing(false);
  }, [project]);

  // ── Reset to start a new project ───────────────────────────────────────────
  const handleReset = useCallback(() => {
    setProject(null);
    setActiveTrend(null);
    setDashState("idle");
    setIsPublishing(false);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Top Navigation Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-100 tracking-tight">
              VideoPipeline
            </span>
            <span className="hidden text-xs text-zinc-500 sm:block">
              AI Social Media Automation
            </span>
          </div>

          {/* Pipeline phase breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <PhaseCrumb label="Idea" active={dashState === "idle"} done={dashState !== "idle"} />
            <span>/</span>
            <PhaseCrumb label="Edit" active={dashState === "editing"} done={["running","ready","published"].includes(dashState)} />
            <span>/</span>
            <PhaseCrumb label="Run" active={dashState === "running"} done={["ready","published"].includes(dashState)} />
            <span>/</span>
            <PhaseCrumb label="Publish" active={dashState === "ready"} done={dashState === "published"} />
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Step 0 — Idea Ingestion */}
            <section>
              <StepLabel number={1} label="Capture Idea" />
              <IdeaIngestion onIdeaConfirmed={handleIdeaConfirmed} />
            </section>

            {/* Step 1 — Project Editor (visible only after idea confirmed) */}
            {(dashState === "editing" ||
              dashState === "running" ||
              dashState === "ready" ||
              dashState === "published") && (
              <section>
                <StepLabel number={2} label="Craft Creative Inputs" />
                <ProjectEditor
                  initialValues={{
                    // Pre-fill prompt with the trend notes as a starting point
                    luma_prompt: activeTrend?.notes ?? "",
                  }}
                  onRunPipeline={handleRunPipeline}
                  isRunning={dashState === "running"}
                />
              </section>
            )}
          </div>

          {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-3">

            {/* Step 2 — Pipeline Tracker */}
            <section>
              <StepLabel number={3} label="Pipeline Status" />
              <PipelineTracker project={project} />
            </section>

            {/* Step 3 — Final Player */}
            <section>
              <StepLabel number={4} label="Preview & Publish" />
              <FinalPlayer
                project={project}
                onPublish={handlePublish}
                onReset={handleReset}
                isPublishing={isPublishing}
              />
            </section>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-600">
        VideoPipeline — Luma AI · ElevenLabs · FFmpeg · Next.js 14
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        {number}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function PhaseCrumb({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={
        active
          ? "text-brand-400 font-semibold"
          : done
          ? "text-emerald-500"
          : "text-zinc-600"
      }
    >
      {label}
    </span>
  );
}
