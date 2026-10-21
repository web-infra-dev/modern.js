import { SERVER_TIMING } from '../../src/constants';
import {
  initMonitorsPlugin,
  injectServerTiming,
} from '../../src/plugins/monitors';
import { createServerBase } from '../../src/serverBase';
import type { Context, Next, ServerEnv, ServerPlugin } from '../../src/types';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

type Timing = [name: string, dur: number, desc?: string];

async function createServer(
  timings: Timing[],
  headers: Record<string, string> = {},
) {
  const setTimingHeader = rstest.fn();
  const server = createServerBase({
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
    pwd: '',
  });
  const spyPlugin: ServerPlugin = {
    name: 'spy-server-timing-header',
    setup(api) {
      api.onPrepare(() => {
        api.getServerContext().middlewares.push({
          name: 'spy-server-timing-header',
          handler: async (c: Context<ServerEnv>, next: Next) => {
            const { header } = c;
            c.header = (name, value, options) => {
              if (name === SERVER_TIMING) setTimingHeader(value);
              header(name, value, options);
            };
            return next();
          },
        });
      });
    },
  };
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
    initMonitorsPlugin(),
    spyPlugin,
    injectServerTiming(),
    handlerPlugin,
  ]);
  await server.init();
  return { server, setTimingHeader };
}

describe('inject server timing', () => {
  const timings: Timing[] = [
    ['server-handle-request', 12.3],
    ['ssr-prefetch', 4, 'SSR'],
    ['ssr-render-shell', 2.5, 'SSR'],
    ['server-middleware', 0.8],
    ['ssr-render-html', 7, 'SSR'],
  ];

  // Appends every timing on its own, like the plugin used to do.
  const appendOneByOne = (existing?: string) => {
    const headers = new Headers();
    if (existing) headers.append(SERVER_TIMING, existing);
    for (const [name, dur, desc] of timings) {
      headers.append(
        SERVER_TIMING,
        `bd-modern-js-${name};${desc ? `decs="${desc}";` : ''} dur=${dur}`,
      );
    }
    return headers.get(SERVER_TIMING);
  };

  it('sets all timings with a single header update', async () => {
    const { server, setTimingHeader } = await createServer(timings);

    const response = await server.request('/');

    expect(response.headers.get(SERVER_TIMING)).toBe(appendOneByOne());
    expect(response.headers.get(SERVER_TIMING)).toBe(
      'bd-modern-js-server-handle-request; dur=12.3, ' +
        'bd-modern-js-ssr-prefetch;decs="SSR"; dur=4, ' +
        'bd-modern-js-ssr-render-shell;decs="SSR"; dur=2.5, ' +
        'bd-modern-js-server-middleware; dur=0.8, ' +
        'bd-modern-js-ssr-render-html;decs="SSR"; dur=7',
    );
    expect(setTimingHeader).toHaveBeenCalledTimes(1);
    expect(await response.text()).toBe('<html></html>');
  });

  it('keeps an existing Server-Timing header', async () => {
    const existing = 'cache;desc="hit";dur=1';
    const { server } = await createServer(timings, {
      [SERVER_TIMING]: existing,
    });

    const response = await server.request('/');

    expect(response.headers.get(SERVER_TIMING)).toBe(appendOneByOne(existing));
    expect(response.headers.get(SERVER_TIMING)).toMatch(
      /^cache;desc="hit";dur=1, bd-modern-js-server-handle-request; dur=12.3, /,
    );
  });

  it('does not touch the response without timings', async () => {
    const { server, setTimingHeader } = await createServer([]);

    const response = await server.request('/');

    expect(response.headers.has(SERVER_TIMING)).toBe(false);
    expect(setTimingHeader).not.toHaveBeenCalled();
  });
});
