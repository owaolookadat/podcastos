"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  clips: Clip[];
  longformNotes: LongformNotes;
  summary: string | null;
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const width = (value / 10) * 100;
  const color =
    value >= 8
      ? "bg-green-500"
      : value >= 6
        ? "bg-yellow-500"
        : value >= 4
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right">{value}</span>
    </div>
  );
}

export function AnalysisReport({
  clips,
  longformNotes,
  summary,
}: AnalysisReportProps) {
  const sortedClips = [...clips].sort(
    (a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Episode Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Clip Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Clip Recommendations ({sortedClips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {sortedClips.map((clip, index) => (
                <div
                  key={clip.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-sm">{clip.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(clip.startTime)} -{" "}
                          {formatTimestamp(clip.endTime)} (
                          {Math.round(clip.endTime - clip.startTime)}s)
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        (clip.overallScore ?? 0) >= 7 ? "default" : "secondary"
                      }
                    >
                      {clip.overallScore?.toFixed(1) ?? "N/A"}
                    </Badge>
                  </div>

                  {/* Scores */}
                  <div className="space-y-1 mb-3">
                    <ScoreBar label="Hook" value={clip.hookScore} />
                    <ScoreBar
                      label="Relatability"
                      value={clip.relatabilityScore}
                    />
                    <ScoreBar label="Emotion" value={clip.emotionScore} />
                    <ScoreBar
                      label="Quotability"
                      value={clip.quotabilityScore}
                    />
                    <ScoreBar label="Curiosity" value={clip.curiosityScore} />
                  </div>

                  {/* Transcript excerpt */}
                  {clip.transcript && (
                    <div className="bg-muted/50 rounded p-3 mb-2">
                      <p className="text-xs italic text-muted-foreground line-clamp-3">
                        &quot;{clip.transcript}&quot;
                      </p>
                    </div>
                  )}

                  {/* Reasoning */}
                  {clip.reasoning && (
                    <p className="text-xs text-muted-foreground">
                      {clip.reasoning}
                    </p>
                  )}

                  {/* Suggested caption */}
                  {clip.suggestedCaption && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <span className="text-xs font-medium">
                          Suggested caption:{" "}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {clip.suggestedCaption}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Longform Notes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chapters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Chapters ({longformNotes.chapters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {longformNotes.chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                    {formatTimestamp(ch.startTime)}
                  </span>
                  <span>{ch.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dead Air */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dead Air ({longformNotes.deadAirMarkers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {longformNotes.deadAirMarkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No dead air detected
                </p>
              ) : (
                longformNotes.deadAirMarkers.map((marker, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                      {formatTimestamp(marker.startTime)}
                    </span>
                    <span className="text-muted-foreground">
                      {marker.durationSeconds.toFixed(1)}s silence
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weak Segments */}
        {longformNotes.weakSegments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weak Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {longformNotes.weakSegments.map((seg, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(seg.startTime)} -{" "}
                      {formatTimestamp(seg.endTime)}
                    </span>
                    <p className="text-muted-foreground">{seg.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Suggestions */}
        {longformNotes.editSuggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm list-disc list-inside">
                {longformNotes.editSuggestions.map((s, i) => (
                  <li key={i} className="text-muted-foreground">
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Assessment */}
      {longformNotes.overallAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{longformNotes.overallAssessment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
