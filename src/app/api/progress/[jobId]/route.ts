import { jobManager } from "@/lib/jobs/job-manager";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = jobManager.subscribe(jobId, (state) => {
        try {
          const data = `data: ${JSON.stringify(state)}\n\n`;
          controller.enqueue(encoder.encode(data));

          if (state.status === "completed" || state.status === "failed") {
            setTimeout(() => {
              try {
                controller.close();
              } catch {
                // already closed
              }
            }, 100);
            unsubscribe();
          }
        } catch {
          // controller may be closed
          unsubscribe();
        }
      });

      req.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
