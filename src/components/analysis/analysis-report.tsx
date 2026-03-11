"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/lib/time";
import type { LongformNotes } from "@/lib/types";

interface Clip {
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
}

interface AnalysisReportProps {
  episodeId: string;
  clips: Clip[];
  longformNotes: LongformNotes;
  summary: string | null;
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const width = (value / 10) * 100;
  const color =
    value >= 8
      ? "bg-violet-500"
      : value >= 6
        ? "bg-violet-400"
        : value >= 4
          ? "bg-amber-400"
          : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-400 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-[11px] font-mono text-slate-500 w-5 text-right">{value}</span>
    </div>
  );
}

export function AnalysisReport({ episodeId, clips, longformNotes, summary }: AnalysisReportProps) {
  const sortedClips = [...clips].sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  return (
    <div className="space-y-5">
      {/* Summary */}
      {summary && (
        <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 rounded-xl border border-violet-100/50 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Episode Summary</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Clip Recommendations */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Clip Recommendations ({sortedClips.length})</h3>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {sortedClips.map((clip, index) => (
              <div key={clip.id} className="rounded-lg border border-slate-100 hover:border-violet-100 transition-colors p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg font-bold text-violet-300 leading-none mt-0.5">#{index + 1}</span>
                    <div>
                      <h4 className="font-medium text-sm text-slate-800">{clip.title}</h4>
                      <span className="text-[11px] text-slate-400">
                        {formatTimestamp(clip.startTime)} - {formatTimestamp(clip.endTime)} ({Math.round(clip.endTime - clip.startTime)}s)
                      </span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-sm font-semibold ${
                    (clip.overallScore ?? 0) >= 8 ? "bg-violet-50 text-violet-600" :
                    (clip.overallScore ?? 0) >= 7 ? "bg-emerald-50 text-emerald-600" :
                    "bg-slate-50 text-slate-500"
                  }`}>
                    {clip.overallScore?.toFixed(1) ?? "N/A"}
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <ScoreBar label="Hook" value={clip.hookScore} />
                  <ScoreBar label="Relatability" value={clip.relatabilityScore} />
                  <ScoreBar label="Emotion" value={clip.emotionScore} />
                  <ScoreBar label="Quotability" value={clip.quotabilityScore} />
                  <ScoreBar label="Curiosity" value={clip.curiosityScore} />
                </div>

                {clip.transcript && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <p className="text-xs italic text-slate-500 line-clamp-3">&quot;{clip.transcript}&quot;</p>
                  </div>
                )}

                {clip.reasoning && (
                  <p className="text-xs text-slate-400 mb-2">{clip.reasoning}</p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {clip.suggestedCaption ? (
                    <div className="flex-1 mr-3">
                      <span className="text-[11px] font-medium text-slate-500">Caption: </span>
                      <span className="text-[11px] text-slate-400">{clip.suggestedCaption}</span>
                    </div>
                  ) : <div />}
                  <a
                    href={`/api/episodes/${episodeId}/export?format=clip-srt&clipId=${clip.id}`}
                    download
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    SRT
                  </a>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Longform Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chapters */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Chapters ({longformNotes.chapters.length})</h3>
          </div>
          <div className="p-4 space-y-2">
            {longformNotes.chapters.map((ch, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-[11px] text-violet-400 font-mono min-w-[50px]">{formatTimestamp(ch.startTime)}</span>
                <span className="text-slate-600">{ch.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dead Air */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Dead Air ({longformNotes.deadAirMarkers.length})</h3>
          </div>
          <div className="p-4 space-y-2">
            {longformNotes.deadAirMarkers.length === 0 ? (
              <p className="text-sm text-slate-400">No dead air detected</p>
            ) : (
              longformNotes.deadAirMarkers.map((marker, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[11px] text-amber-500 font-mono min-w-[50px]">{formatTimestamp(marker.startTime)}</span>
                  <span className="text-slate-400">{marker.durationSeconds.toFixed(1)}s silence</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weak Segments */}
        {longformNotes.weakSegments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Weak Segments</h3>
            </div>
            <div className="p-4 space-y-3">
              {longformNotes.weakSegments.map((seg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-[11px] text-red-400 font-mono">
                    {formatTimestamp(seg.startTime)} - {formatTimestamp(seg.endTime)}
                  </span>
                  <p className="text-slate-500 mt-0.5">{seg.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Suggestions */}
        {longformNotes.editSuggestions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Edit Suggestions</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2 text-sm">
                {longformNotes.editSuggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-slate-500">
                    <span className="text-violet-400 shrink-0">&#8226;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Overall Assessment */}
      {longformNotes.overallAssessment && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Overall Assessment</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{longformNotes.overallAssessment}</p>
        </div>
      )}
    </div>
  );
}
