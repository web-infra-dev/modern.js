import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export default async ({ request }: LoaderFunctionArgs) => {
  const id = new URL(request.url).searchParams.get('id');

  if (id) {
    await new Promise<void>(resolve => {
      const onAbort = () => {
        clearTimeout(timer);
        console.log(`loader-aborted:${id}:${request.signal.aborted}`);
        resolve();
      };
      // Bound the fixture's lifetime even when cancellation is broken.
      const timer = setTimeout(() => {
        request.signal.removeEventListener('abort', onAbort);
        resolve();
      }, 10_000);
      request.signal.addEventListener('abort', onAbort, { once: true });
      console.log(`loader-started:${id}:${request.signal.aborted}`);
    });
  }

  return {
    method: request.method,
    header: request.headers.get('x-loader-test'),
    aborted: request.signal.aborted,
  };
};
