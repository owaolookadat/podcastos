"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, formatDuration, formatTimestamp } from "@/lib/time";
import { useJobProgress } from "@/hooks/use-job-progress";
import { TranscriptViewer } from "@/components/transcript/transcript-viewer";
import { AnalysisReport } from "@/components/analysis/analysis-report";
import { toast } from "sonner";
import type { LongformNotes } from "@/lib/types";

interface EpisodeDetail {
  id: string;
  title: string;
  description: string | null;
  originalFilename: string;
  status: string;
  errorMessage: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  createdAt: string;
  transcript: {
    fullText: string;
    segments: string;
    language: string | null;
    processingTimeMs: number | null;
  } | null;
  analysis: {
    summary: string | null;
    clipRecommendations: string;
    longformNotes: string;
    modelUsed: string | null;
    promptTokens: number | null;
    outputTokens: number | null;
    processingTimeMs: number | null;
  } | null;
  clips: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    transcript: string | null;
    hookScore: number | null;
    relatabilityScore: number | null;
    emotionScore: number | null;
    quotabilityScore: number | null;
    curiosityScore: number | null;
    overallScore: number | null;
    reasoning: string | null;
    suggestedCaption: string | null;
    status: string;
  }>;
}

const PIPELINE_STEPS = [
  {
    key: "uploaded",
    label: "Upload",
    activeLabel: "Uploading...",
    doneLabel: "Uploaded",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    key: "audio_ready",
    label: "Audio",
    activeLabel: "Extracting audio...",
    doneLabel: "Audio extracted",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.34A1.077 1.077 0 0017.923 1.3l3.654 1.055a1.077 1.077 0 01.764 1.03V7.5" />
      </svg>
    ),
  },
  {
    key: "transcribed",
    label: "Transcribe",
    activeLabel: "Transcribing with Whisper...",
    doneLabel: "Transcript ready",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    key: "analyzed",
    label: "AI Analysis",
    activeLabel: "Analyzing with Claude AI...",
    doneLabel: "Analysis complete",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
];

const STATUS_ORDER: Record<string, number> = {
  uploading: 0, uploaded: 1, extracting_audio: 1.5,
  audio_ready: 2, transcribing: 2.5, transcribed: 3,
  analyzing: 3.5, analyzed: 4, error: -1,
};

const PROCESSING_MESSAGES: Record<string, string> = {
  extracting_audio: "Extracting audio from your video file...",
  transcribing: "Transcribing with OpenAI Whisper — this takes a few minutes for long episodes...",
  analyzing: "Claude AI is finding the best clips, chapters, and edit points...",
};

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const jobState = useJobProgress(activeJobId);

  const fetchEpisode = useCallback(async () => {
    try {
      const res = await fetch(`/api/episodes/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setEpisode(data);
    } catch (err) {
      console.error("Failed to fetch episode:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEpisode();
    const interval = setInterval(fetchEpisode, 3000);
    return () => clearInterval(interval);
  }, [fetchEpisode]);

  useEffect(() => {
    if (jobState?.status === "completed" || jobState?.status === "failed") {
      fetchEpisode();
      if (jobState.status === "completed") {
        toast.success(`${jobState.type} completed!`);
      } else {
        toast.error(`${jobState.type} failed: ${jobState.error}`);
      }
      setTimeout(() => setActiveJobId(null), 2000);
    }
  }, [jobState?.status, jobState?.type, jobState?.error, fetchEpisode]);

  const startTranscription = async () => {
    try {
      const res = await fetch(`/api/episodes/${id}/transcribe`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveJobId(data.jobId);
      toast.info("Transcription started...");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start transcription");
    }
  };

  const startAnalysis = async () => {
    try {
      const res = await fetch(`/api/episodes/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveJobId(data.jobId);
      toast.info("AI analysis started...");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start analysis");
    }
  };

  const deleteEpisode = async () => {
    if (!confirm("Delete this episode and all its data?")) return;
    try {
      const res = await fetch(`/api/episodes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Episode deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete episode");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-center">
        <p className="text-slate-400">Episode not found</p>
      </div>
    );
  }

  const statusOrder = STATUS_ORDER[episode.status] ?? 0;
  const isProcessing = ["extracting_audio", "transcribing", "analyzing"].includes(episode.status);
  const isReady = episode.status === "analyzed";
  const longformNotes: LongformNotes | null = episode.analysis
    ? JSON.parse(episode.analysis.longformNotes)
    : null;
  const clipsCount = episode.clips.length;
  const topClips = [...episode.clips]
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-violet-600 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </Link>
              <div className="w-px h-5 bg-slate-200" />
              <h1 className="text-base font-semibold text-slate-800 truncate">{episode.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
                  </span>
                  Processing
                </span>
              )}
              {isReady && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                  ✓ Ready
                </span>
              )}
              {episode.status === "error" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">Error</span>
              )}
              <button onClick={deleteEpisode} className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors" title="Delete episode">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* ─── Pipeline Progress ─── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-1">
            {PIPELINE_STEPS.map((step, i) => {
              const stepOrder = STATUS_ORDER[step.key] ?? 0;
              const isDone = statusOrder >= stepOrder;
              const isCurrent =
                (step.key === "uploaded" && episode.status === "extracting_audio") ||
                (step.key === "audio_ready" && episode.status === "transcribing") ||
                (step.key === "transcribed" && episode.status === "analyzing");

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isDone ? "bg-violet-600 text-white shadow-sm shadow-violet-200" : isCurrent ? "bg-violet-100 text-violet-600 animate-pulse" : "bg-slate-50 text-slate-300"
                    }`}>
                      {isDone ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className={`text-[11px] mt-1.5 font-medium ${isDone ? "text-violet-600" : isCurrent ? "text-violet-500" : "text-slate-300"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-1 transition-colors duration-300 ${statusOrder > stepOrder ? "bg-violet-300" : "bg-slate-100"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Processing message */}
          {isProcessing && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-violet-100 border-t-violet-500 rounded-full animate-spin shrink-0" />
                <p className="text-sm text-slate-500">{PROCESSING_MESSAGES[episode.status] || "Processing..."}</p>
              </div>
              {jobState && jobState.status === "running" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{jobState.message}</span>
                    <span className="text-violet-600 font-medium">{Math.round(jobState.progress * 100)}%</span>
                  </div>
                  <Progress value={jobState.progress * 100} className="h-1.5" />
                </div>
              )}
            </div>
          )}

          {episode.status === "error" && episode.errorMessage && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Something went wrong</p>
                  <p className="text-sm text-red-500">{episode.errorMessage}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startTranscription}
                      className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Retry Transcription
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startAnalysis}
                      className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Retry Analysis
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Export Hub (Hero section when ready) ─── */}
        {isReady && (
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-violet-50/50 rounded-2xl border border-emerald-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Your exports are ready</h2>
                <p className="text-sm text-slate-500">Download these files and import them into Premiere Pro or DaVinci Resolve</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Longform EDL */}
              <a
                href={`/api/episodes/${id}/export?format=longform-edl`}
                download
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                  <span className="text-xs font-bold text-violet-600">EDL</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">Longform Edit</p>
                  <p className="text-xs text-slate-400">Auto-removes dead air & weak segments from your full episode</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>

              {/* Clips EDL */}
              <a
                href={`/api/episodes/${id}/export?format=clips-edl`}
                download
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                  <span className="text-xs font-bold text-violet-600">EDL</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">Shortform Clips ({clipsCount})</p>
                  <p className="text-xs text-slate-400">AI-ranked clip cut points for social media content</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>

              {/* Full SRT */}
              {episode.transcript && (
                <a
                  href={`/api/episodes/${id}/export?format=srt`}
                  download
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                    <span className="text-xs font-bold text-emerald-600">SRT</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">Full Subtitles</p>
                    <p className="text-xs text-slate-400">Complete episode SRT — import alongside your raw video</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </a>
              )}

              {/* Chapters */}
              <a
                href={`/api/episodes/${id}/export?format=chapters`}
                download
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md hover:shadow-amber-50 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                  <span className="text-xs font-bold text-amber-600">TXT</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">Chapter Markers</p>
                  <p className="text-xs text-slate-400">YouTube description timestamps — paste directly</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>
            </div>

            {/* Premiere Pro Tips */}
            <div className="mt-4 pt-4 border-t border-emerald-100/50">
              <details className="group">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-violet-600 transition-colors flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  How to use in Premiere Pro
                </summary>
                <div className="mt-3 pl-5 space-y-2 text-xs text-slate-400 leading-relaxed">
                  <p className="text-slate-500 font-medium mb-1">For longform episode:</p>
                  <p><span className="text-slate-600 font-medium">1.</span> Import your raw video + <span className="text-emerald-600 font-medium">Full SRT</span> into Premiere Pro</p>
                  <p><span className="text-slate-600 font-medium">2.</span> Import the <span className="text-violet-600 font-medium">Longform EDL</span> — it creates a timeline that cuts both video &amp; subtitles together, with dead air removed</p>
                  <p><span className="text-slate-600 font-medium">3.</span> Color grade, style captions, and export</p>
                  <p className="text-slate-500 font-medium mb-1 mt-3">For shortform clips:</p>
                  <p><span className="text-slate-600 font-medium">1.</span> Import raw video + <span className="text-violet-600 font-medium">Clips EDL</span> — each clip becomes a separate timeline event</p>
                  <p><span className="text-slate-600 font-medium">2.</span> Each clip has its own <span className="text-emerald-600 font-medium">per-clip SRT</span> with timestamps starting from 0:00</p>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* ─── Episode Summary ─── */}
        {episode.analysis?.summary && (
          <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 rounded-xl border border-violet-100/50 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Summary
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{episode.analysis.summary}</p>
          </div>
        )}

        {/* ─── Top Clips Preview ─── */}
        {topClips.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Top Clip Picks</h3>
                <p className="text-xs text-slate-400 mt-0.5">AI&apos;s highest-rated moments from your episode</p>
              </div>
              {clipsCount > 3 && (
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                >
                  View all {clipsCount} clips →
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {topClips.map((clip, index) => (
                <div key={clip.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                    index === 0 ? "bg-violet-100 text-violet-600" :
                    index === 1 ? "bg-violet-50 text-violet-400" :
                    "bg-slate-50 text-slate-400"
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium text-slate-800 truncate">{clip.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        (clip.overallScore ?? 0) >= 8 ? "bg-violet-50 text-violet-600" :
                        (clip.overallScore ?? 0) >= 7 ? "bg-emerald-50 text-emerald-600" :
                        "bg-slate-50 text-slate-500"
                      }`}>
                        {clip.overallScore?.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatTimestamp(clip.startTime)} - {formatTimestamp(clip.endTime)} · {Math.round(clip.endTime - clip.startTime)}s
                    </p>
                    {clip.transcript && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">&quot;{clip.transcript}&quot;</p>
                    )}
                  </div>
                  <a
                    href={`/api/episodes/${id}/export?format=clip-srt&clipId=${clip.id}`}
                    download
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                    title="Download SRT for this clip"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    SRT
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Episode Info ─── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Episode Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block mb-1">File</span>
              <span className="text-slate-700 text-sm truncate block">{episode.originalFilename}</span>
            </div>
            {episode.fileSizeBytes && (
              <div>
                <span className="text-xs text-slate-400 block mb-1">Size</span>
                <span className="text-slate-700">{formatFileSize(episode.fileSizeBytes)}</span>
              </div>
            )}
            {episode.durationSeconds && (
              <div>
                <span className="text-xs text-slate-400 block mb-1">Duration</span>
                <span className="text-slate-700">{formatDuration(episode.durationSeconds)}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-slate-400 block mb-1">Uploaded</span>
              <span className="text-slate-700">{new Date(episode.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* ─── Manual Actions (for re-runs or stuck episodes) ─── */}
        {(episode.transcript || episode.status === "audio_ready" || episode.status === "transcribed") && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Manual Actions</h3>
            <p className="text-xs text-slate-400 mb-4">Usually everything runs automatically. Use these only if you need to re-process.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 rounded-lg text-xs"
                onClick={startTranscription}
                disabled={statusOrder < 2 || episode.status === "transcribing" || !!activeJobId}
              >
                {episode.status === "transcribing" ? "Transcribing..." : episode.transcript ? "Re-transcribe" : "Transcribe"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 rounded-lg text-xs"
                onClick={startAnalysis}
                disabled={!episode.transcript || episode.status === "analyzing" || !!activeJobId}
              >
                {episode.status === "analyzing" ? "Analyzing..." : episode.analysis ? "Re-analyze" : "Analyze"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Expandable Sections ─── */}
        {/* Transcript */}
        {episode.transcript && (
          <div>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50 hover:border-violet-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Full Transcript</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{JSON.parse(episode.transcript.segments).length} segments · Click to {showTranscript ? "collapse" : "expand"}</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${showTranscript ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showTranscript && (
              <div className="mt-2">
                <TranscriptViewer segments={JSON.parse(episode.transcript.segments)} />
              </div>
            )}
          </div>
        )}

        {/* Full Analysis */}
        {episode.analysis && (
          <div>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="w-full bg-white rounded-xl border border-slate-100 p-5 shadow-sm shadow-slate-50 hover:border-violet-100 transition-colors text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Full AI Analysis</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{clipsCount} clips · Scores, chapters, dead air, edit suggestions · Click to {showAnalysis ? "collapse" : "expand"}</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${showAnalysis ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showAnalysis && longformNotes && (
              <div className="mt-2">
                <AnalysisReport
                  episodeId={id}
                  clips={episode.clips}
                  longformNotes={longformNotes}
                  summary={null}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
