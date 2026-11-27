import { storage } from '@modern-js/runtime-utils/node';
import { useLoaderData, useLocation } from '@modern-js/runtime-utils/router';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  InternalRuntimeContext,
  getInitialContext,
  setGlobalContext,
} from '../../src/core/context';
import { registerPlugin } from '../../src/core/plugin';
import { useMemoryRoute } from '../../src/router';
import { type RouterConfig, routerPlugin } from '../../src/router/internal';

describe('Modern.js memory router SSR (Node)', () => {
  it('renders SSR memory route at activePath and populates loaderData', async () => {
    let serverLoads = 0;

    function Page() {
      const location = useLocation();
      const memory = useMemoryRoute();
      const data = useLoaderData() as { item: string };
      return (
        <p data-testid="ssr-memory">
          {data.item}:{location.pathname}:{String(memory.enabled)}
        </p>
      );
    }

    const serverRoutes = [
      {
        id: 'detail',
        type: 'nested',
        isRoot: true,
        path: '/detail/:item',
        component: Page,
        loader: ({ params }: any) => {
          serverLoads++;
          return { item: `server-${params.item}` };
        },
      },
    ];

    const routerConfig: Partial<RouterConfig> = {
      memory: {
        initialEntries: ['/detail/first', '/detail/second'],
        initialIndex: 1,
      },
    };

    setGlobalContext({ routes: serverRoutes });
    const serverRuntime = registerPlugin([routerPlugin(routerConfig)], {
      router: routerConfig,
    });
    const serverContext = getInitialContext(false);
    serverContext.ssrContext = {
      mode: 'string',
      baseUrl: '/',
      request: {
        raw: new Request('http://localhost/host-page'),
      },
    } as any;
    serverRuntime.pluginAPI.updateRuntimeContext(serverContext);
    await storage.run(
      { headers: new Headers(), activeDeferreds: new Map() } as any,
      () => serverRuntime.hooks.onBeforeRender.call(serverContext),
    );
    const ServerRoot = serverRuntime.hooks.wrapRoot.call(undefined as any);
    const ssrHtml = renderToString(
      <InternalRuntimeContext.Provider value={serverContext}>
        <ServerRoot />
      </InternalRuntimeContext.Provider>,
    );

    expect(serverLoads).toBe(1);
    expect(ssrHtml).toContain('server-second');
    expect(ssrHtml).toContain('/detail/second');
    expect(ssrHtml).toContain('true');
    expect(serverContext.routerContext?.loaderData).toEqual({
      detail: { item: 'server-second' },
    });
  });

  it('preserves active entry location.state during SSR to match client memory hydration', async () => {
    function DetailStatePage() {
      const location = useLocation();
      const from = (location.state as { from?: string } | null)?.from ?? 'none';
      return (
        <div data-testid="ssr-state">
          {location.pathname}:{from}
        </div>
      );
    }

    const routes = [
      {
        id: 'detail',
        type: 'nested',
        isRoot: true,
        path: '/detail/:item',
        component: DetailStatePage,
      },
    ];
    const routerConfig: Partial<RouterConfig> = {
      memory: {
        initialEntries: [
          '/',
          { pathname: '/detail/alpha', state: { from: 'catalog' } },
        ],
        initialIndex: 1,
      },
    };

    setGlobalContext({ routes });
    const serverRuntime = registerPlugin([routerPlugin(routerConfig)], {
      router: routerConfig,
    });
    const serverContext = getInitialContext(false);
    serverContext.ssrContext = {
      mode: 'string',
      baseUrl: '/',
      request: {
        raw: new Request('http://localhost/host-page'),
      },
    } as any;
    serverRuntime.pluginAPI.updateRuntimeContext(serverContext);
    await serverRuntime.hooks.onBeforeRender.call(serverContext);
    const ServerRoot = serverRuntime.hooks.wrapRoot.call(undefined as any);
    const html = renderToString(
      <InternalRuntimeContext.Provider value={serverContext}>
        <ServerRoot />
      </InternalRuntimeContext.Provider>,
    );

    expect(html).toContain('/detail/alpha');
    expect(html).toContain('catalog');
  });
});
