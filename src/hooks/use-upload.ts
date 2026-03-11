"use client";

import { useState, useCallback } from "react";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
  });

  const upload = useCallback(async (episodeId: string, file: File) => {
    setState({ progress: 0, uploading: true, error: null });

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const res = await fetch(`/api/episodes/${episodeId}/upload`, {
          method: "POST",
          headers: {
            "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
            "X-Chunk-Index": String(i),
            "X-Total-Chunks": String(totalChunks),
            "X-Filename": file.name,
          },
          body: chunk,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        setState((s) => ({
          ...s,
          progress: (i + 1) / totalChunks,
        }));
      }

      setState((s) => ({ ...s, uploading: false }));
    } catch (error) {
      setState({
        progress: 0,
        uploading: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
      throw error;
    }
  }, []);

  return { ...state, upload };
}
