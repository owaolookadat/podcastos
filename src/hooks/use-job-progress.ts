"use client";

import { useState, useEffect } from "react";
import type { JobState } from "@/lib/types";

export function useJobProgress(jobId: string | null) {
  const [state, setState] = useState<JobState | null>(null);

  useEffect(() => {
    if (!jobId) {
      setState(null);
      return;
    }

    const eventSource = new EventSource(`/api/progress/${jobId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as JobState;
        setState(data);
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  return state;
}
