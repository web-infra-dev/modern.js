import {
  defineServerConfig,
  type MiddlewareHandler,
} from '@modern-js/server-runtime';
const hostOrigin = `http://localhost:${JSON.parse(process.env.MF_LAB_PORTS || '{}').host || 4300}`;

export default defineServerConfig({
  middlewares: [
    ...(process.env.MF_LAB_SERVICE
      ? [
          {
            name: 'weather-service',
            order: 'pre' as const,
            handler: async (
              context: Parameters<MiddlewareHandler>[0],
              next: Parameters<MiddlewareHandler>[1],
            ) => {
              const request = context.req.raw;
              const isService = new URL(request.url).pathname.endsWith(
                '/_modern/mf/service/ServiceWeatherApplication',
              );
              if (isService) {
                if (
                  request.headers.get('x-weather-service-key') !==
                  'local-service-test-key'
                )
                  return new Response('Unauthorized', { status: 401 });
                if (process.env.MF_SERVICE_EVIDENCE)
                  console.info('SERVICE_AUTH_ACCEPTED');
                void request.body;
              }
              const fault =
                isService && request.method === 'POST'
                  ? new URL(
                      (await request.clone().json()).request.url,
                    ).searchParams.get('serviceFault')
                  : null;
              if (fault === 'early')
                return new Response('Weather producer unavailable', {
                  status: 503,
                });
              await next();
              const response = context.res;
              // Test-only transport failure after genuine producer readiness.
              // The real render remains pending, then its reader is cancelled.
              if (fault === 'late' && response?.ok && response.body) {
                const reader = response.body.getReader();
                let ended = false;
                let scheduled = false;
                const interrupt = new AbortController();
                const onAbort = () => interrupt.abort(request.signal.reason);
                request.signal.addEventListener('abort', onAbort, {
                  once: true,
                });
                const cleanup = () => {
                  request.signal.removeEventListener('abort', onAbort);
                  interrupt.abort();
                };
                context.res = new Response(
                  new ReadableStream({
                    async pull(controller) {
                      try {
                        const frame = await reader.read();
                        if (ended) return;
                        if (frame.done) {
                          ended = true;
                          cleanup();
                          controller.close();
                          return;
                        }
                        controller.enqueue(frame.value);
                        if (
                          !scheduled &&
                          new TextDecoder()
                            .decode(frame.value)
                            .includes('"type":"ready"')
                        ) {
                          scheduled = true;
                          // Keep forwarding HTML while the browser establishes
                          // actual interaction. The test releases this gate.
                          void fetch(
                            `http://localhost:${JSON.parse(process.env.MF_LAB_PORTS || '{}').api}/bridge-data?probe=service-transport-fault&hold=1`,
                            { signal: interrupt.signal },
                          )
                            .then(result => result.arrayBuffer())
                            .then(async () => {
                              if (ended) return;
                              ended = true;
                              cleanup();
                              controller.error(
                                Error('Weather transport failure after ready'),
                              );
                              await reader.cancel('weather transport failure');
                            })
                            .catch(error => {
                              if (!ended) {
                                ended = true;
                                cleanup();
                                controller.error(error);
                                void reader.cancel(error);
                              }
                            });
                        }
                      } catch (error) {
                        if (!ended) {
                          ended = true;
                          cleanup();
                          controller.error(error);
                        }
                      }
                    },
                    cancel: reason => {
                      ended = true;
                      cleanup();
                      return reader.cancel(reason);
                    },
                  }),
                  { status: response.status, headers: response.headers },
                );
                return context.res;
              }
              if (isService && response && process.env.MF_SERVICE_EVIDENCE)
                console.info(
                  'SERVICE_CACHE_RESPONSE',
                  response.headers.get('x-mf-bridge-cache'),
                );
              return response;
            },
          },
        ]
      : []),
    {
      name: 'weather-route-loader-cors',
      order: 'pre',
      handler: async (context, next) => {
        if (
          context.req.query('__loader') &&
          [
            hostOrigin,
            ...['serviceSSR', 'serviceCSR'].map(
              name =>
                `http://localhost:${JSON.parse(process.env.MF_LAB_PORTS || '{}')[name]}`,
            ),
          ].includes(context.req.header('Origin') || '')
        ) {
          context.header(
            'Access-Control-Allow-Origin',
            context.req.header('Origin')!,
          );
          context.header('Vary', 'Origin');
        }
        await next();
      },
    },
  ],
});
