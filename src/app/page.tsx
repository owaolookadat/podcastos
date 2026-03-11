"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatDuration } from "@/lib/time";
import { NewEpisodeDialog } from "@/components/episodes/new-episode-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface Episode {
  id: string;
  title: string;
  description: string | null;
  originalFilename: string;
  status: string;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; progress: number }> = {
  uploading: { label: "Uploading", color: "bg-blue-50 text-blue-600 ring-blue-200", progress: 10 },
  uploaded: { label: "Uploaded", color: "bg-slate-50 text-slate-500 ring-slate-200", progress: 15 },
  extracting_audio: { label: "Extracting Audio", color: "bg-amber-50 text-amber-600 ring-amber-200", progress: 25 },
  audio_ready: { label: "Audio Ready", color: "bg-slate-50 text-slate-500 ring-slate-200", progress: 30 },
  transcribing: { label: "Transcribing", color: "bg-violet-50 text-violet-600 ring-violet-200", progress: 50 },
  transcribed: { label: "Transcribed", color: "bg-slate-50 text-slate-500 ring-slate-200", progress: 65 },
  analyzing: { label: "AI Analyzing", color: "bg-violet-50 text-violet-600 ring-violet-200", progress: 80 },
  analyzed: { label: "✓ Ready", color: "bg-emerald-50 text-emerald-600 ring-emerald-200", progress: 100 },
  error: { label: "Error", color: "bg-red-50 text-red-600 ring-red-200", progress: 0 },
};

const WORKFLOW_STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: "Upload",
    desc: "Drop your raw podcast video or audio file",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "AI Processing",
    desc: "Auto-transcribe & find the best clips",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: "Export",
    desc: "Download EDL + SRT files for Premiere Pro",
  },
];

export default function DashboardPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    try {
      const res = await fetch("/api/episodes");
      const data = await res.json();
      setEpisodes(data);
    } catch (err) {
      console.error("Failed to fetch episodes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEpisodes();
    const interval = setInterval(fetchEpisodes, 5000);
    return () => clearInterval(interval);
  }, [fetchEpisodes]);

  const deleteEpisode = async (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this episode and all its data?")) return;

    try {
      const res = await fetch(`/api/episodes/${episodeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Episode deleted");
      fetchEpisodes();
    } catch {
      toast.error("Failed to delete episode");
    }
  };

  const isProcessing = (status: string) =>
    ["uploading", "extracting_audio", "transcribing", "analyzing"].includes(status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-200">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">PodcastOS</h1>
              <p className="text-[11px] text-slate-400 -mt-0.5">AI post-production</p>
            </div>
          </div>
          {episodes.length > 0 && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 rounded-lg text-sm h-9 px-4"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Episode
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-violet-100 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          </div>
        ) : episodes.length === 0 ? (
          /* ─── Empty State: Welcome + How It Works ─── */
          <div className="flex flex-col items-center pt-12">
            {/* Hero */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-200">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
              Podcast Post-Production, Automated
            </h2>
            <p className="text-base text-slate-500 mb-10 max-w-md text-center leading-relaxed">
              Upload your raw episode and get AI-analyzed clip recommendations, subtitles, and edit-ready files for Premiere Pro — automatically.
            </p>

            {/* Workflow Steps */}
            <div className="w-full max-w-2xl mb-10">
              <div className="grid grid-cols-3 gap-4">
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={i} className="relative">
                    <div className="bg-white rounded-xl border border-slate-100 p-5 text-center shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-200">
                      <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3 text-violet-500">
                        {step.icon}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold text-violet-400 bg-violet-50 px-1.5 py-0.5 rounded">STEP {i + 1}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">{step.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-2.5 -translate-y-1/2 z-10">
                        <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* What You Get */}
            <div className="w-full max-w-2xl bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-2xl border border-slate-100 p-6 mb-10">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What you get
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-violet-600">EDL</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Longform Edit</p>
                    <p className="text-xs text-slate-400">Dead air & weak segments auto-removed</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-violet-600">EDL</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Shortform Clips</p>
                    <p className="text-xs text-slate-400">AI-ranked viral clip cut points</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-emerald-600">SRT</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Subtitles</p>
                    <p className="text-xs text-slate-400">Full episode + per-clip SRT files</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-600">TXT</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Chapter Markers</p>
                    <p className="text-xs text-slate-400">YouTube-ready timestamps</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => setDialogOpen(true)}
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 rounded-xl text-base px-8 h-12"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Your First Episode
            </Button>
            <p className="text-xs text-slate-400 mt-3">Supports MP4, MOV, MKV, MP3, WAV — up to 5GB</p>
          </div>
        ) : (
          /* ─── Episode List ─── */
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Your Episodes</h2>
                <p className="text-sm text-slate-400">{episodes.length} episode{episodes.length !== 1 ? "s" : ""} · Click to view details & exports</p>
              </div>
            </div>

            <div className="space-y-2">
              {episodes.map((episode) => {
                const statusInfo = STATUS_CONFIG[episode.status] || {
                  label: episode.status,
                  color: "bg-slate-50 text-slate-500 ring-slate-200",
                  progress: 0,
                };
                const processing = isProcessing(episode.status);
                const isReady = episode.status === "analyzed";

                return (
                  <Link href={`/episodes/${episode.id}`} key={episode.id}>
                    <div className={`group bg-white rounded-xl border transition-all duration-200 px-5 py-4 ${
                      isReady
                        ? "border-emerald-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50"
                        : "border-slate-150 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2.5 mb-1">
                            <h3 className="font-medium text-[15px] text-slate-800 truncate">
                              {episode.title}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset whitespace-nowrap shrink-0 ${statusInfo.color}`}>
                              {processing && (
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-50" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                                </span>
                              )}
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="truncate max-w-[250px]">{episode.originalFilename}</span>
                            {episode.fileSizeBytes && (
                              <>
                                <span className="text-slate-200">&middot;</span>
                                <span>{formatFileSize(episode.fileSizeBytes)}</span>
                              </>
                            )}
                            {episode.durationSeconds && (
                              <>
                                <span className="text-slate-200">&middot;</span>
                                <span>{formatDuration(episode.durationSeconds)}</span>
                              </>
                            )}
                            <span className="text-slate-200">&middot;</span>
                            <span>{new Date(episode.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Mini progress bar for processing episodes */}
                          {processing && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1">
                                <div
                                  className="h-1 rounded-full bg-violet-400 transition-all duration-1000"
                                  style={{ width: `${statusInfo.progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 tabular-nums">{statusInfo.progress}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isReady && (
                            <span className="text-xs text-emerald-500 font-medium mr-2 hidden sm:block">
                              Exports ready →
                            </span>
                          )}
                          <button
                            onClick={(e) => deleteEpisode(e, episode.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"
                            title="Delete episode"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                          <svg className="w-4 h-4 text-slate-200 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <NewEpisodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          setDialogOpen(false);
          fetchEpisodes();
        }}
      />
    </div>
  );
}
