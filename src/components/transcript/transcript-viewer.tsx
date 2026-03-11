"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/lib/time";
import type { WhisperSegment } from "@/lib/types";

interface TranscriptViewerProps {
  segments: WhisperSegment[];
}

export function TranscriptViewer({ segments }: TranscriptViewerProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? segments.filter((s) =>
        s.text.toLowerCase().includes(search.toLowerCase())
      )
    : segments;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Transcript ({segments.length} segments)
          </CardTitle>
          <Input
            placeholder="Search transcript..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-1">
            {filtered.map((segment) => (
              <div
                key={segment.id}
                className="flex gap-4 py-2 px-3 rounded hover:bg-accent/50 transition-colors group"
              >
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap pt-0.5 min-w-[80px]">
                  {formatTimestamp(segment.start)}
                </span>
                <p className="text-sm leading-relaxed flex-1">{segment.text}</p>
              </div>
            ))}
            {filtered.length === 0 && search && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No segments matching &quot;{search}&quot;
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
