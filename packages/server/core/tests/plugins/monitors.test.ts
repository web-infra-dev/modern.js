import {
  type Context,
  type ServerEnv,
  type ServerPlugin,
  createDefaultPlugins,
  createServerBase,
} from '../../src';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

type Timing = [name: string, dur: number, desc?: string];

async function createServer(
  timings: Timing[],
  headers: Record<string, string> = {},
) {
  const server = createServerBase({
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
    pwd: '',
  });
  const handlerPlugin: ServerPlugin = {
    name: 'emit-timings',
    setup(api) {
      api.onPrepare(() => {
        api.getServerContext().middlewares.push({
          name: 'emit-timings',
          handler: async (c: Context<ServerEnv>) => {
            const monitors = c.get('monitors');
            for (const [name, dur, desc] of timings) {
              monitors.timing(name, dur, desc);
            }
            return c.html('<html></html>', 200, headers);
          },
        });
      });
    },
  };
  server.addPlugins([
    ...createDefaultPlugins({ logger: false }),
    handlerPlugin,
  ]);
  await server.init();
  return { server };
}

describe('Server-Timing response headers', () => {
  const timings: Timing[] = [
    ['server-handle-request', 12.3],
    ['ssr-prefetch', 4, 'SSR'],
    ['ssr-render-shell', 2.5, 'SSR'],
    ['server-middleware', 0.8],
    ['ssr-render-html', 7, 'SSR'],
  ];

  const expectedHeader =
    'bd-modern-js-server-handle-request; dur=12.3, ' +
    'bd-modern-js-ssr-prefetch;decs="SSR"; dur=4, ' +
    'bd-modern-js-ssr-render-shell;decs="SSR"; dur=2.5, ' +
    'bd-modern-js-server-middleware; dur=0.8, ' +
    'bd-modern-js-ssr-render-html;decs="SSR"; dur=7';

  it('returns all timings in the response header', async () => {
    const { server } = await createServer(timings);

    const response = await server.request('/');

    expect(response.headers.get('Server-Timing')).toBe(expectedHeader);
    expect(await response.text()).toBe('<html></html>');
  });

  it('keeps an existing Server-Timing header', async () => {
    const existing = 'cache;desc="hit";dur=1';
    const { server } = await createServer(timings, {
      'Server-Timing': existing,
    });

    const response = await server.request('/');

    expect(response.headers.get('Server-Timing')).toBe(
      `${existing}, ${expectedHeader}`,
    );
  });

  it('does not touch the response without timings', async () => {
    const { server } = await createServer([]);

    const response = await server.request('/');

    expect(response.headers.has('Server-Timing')).toBe(false);
  });
});
