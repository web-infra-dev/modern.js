import { useHonoContext } from '@modern-js/server-runtime';

export default async () => {
  const c = useHonoContext();
  const encoder = new TextEncoder();

  let id = 0;
  let timer: ReturnType<typeof setInterval> | undefined;

  const body = new ReadableStream({
    start(controller) {
      const send = () => {
        const message = `It is ${new Date().toISOString()}`;
        controller.enqueue(
          encoder.encode(
            `id: ${id++}\nevent: time-update\ndata: ${message}\n\n`,
          ),
        );
      };

      send();
      timer = setInterval(send, 1000);

      c.req.raw.signal.addEventListener('abort', () => {
        if (timer) {
          clearInterval(timer);
        }
        controller.close();
      });
    },
    cancel() {
      if (timer) {
        clearInterval(timer);
      }
    },
  });

  return new Response(body, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  });
};

export const post = async () => ({
  message: 'Hello Modern.js',
});
