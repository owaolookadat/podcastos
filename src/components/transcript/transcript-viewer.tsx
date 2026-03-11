"use client";

import { useState } from "react";
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
    ? segments.filter((s) => s.text.toLowerCase().includes(search.toLowerCase()))
    : segments;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-50">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Transcript <span className="text-slate-400 font-normal">({segments.length} segments)</span>
        </h3>
        <div className="relative">
          <svg className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-9 h-8 text-sm bg-slate-50 border-slate-200 rounded-lg focus:ring-violet-200 focus:border-violet-300"
          />
        </div>
      </div>
      <ScrollArea className="h-[600px]">
        <div className="p-2">
          {filtered.map((segment) => (
            <div
              key={segment.id}
              className="flex gap-4 py-2 px-3 rounded-lg hover:bg-violet-50/50 transition-colors group"
            >
              <span className="text-[11px] text-violet-400 font-mono whitespace-nowrap pt-0.5 min-w-[60px]">
                {formatTimestamp(segment.start)}
              </span>
              <p className="text-sm leading-relaxed text-slate-600 flex-1">{segment.text}</p>
            </div>
          ))}
          {filtered.length === 0 && search && (
            <p className="text-sm text-slate-400 text-center py-8">No segments matching &quot;{search}&quot;</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
