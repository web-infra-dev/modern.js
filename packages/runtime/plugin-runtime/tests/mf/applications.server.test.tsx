import React from 'react';
import { PassThrough, Readable } from 'node:stream';
import { renderToPipeableStream, renderToString } from 'react-dom/server';
import { Outlet, useLoaderData } from '@modern-js/runtime-utils/router';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { helpers, init } from '@module-federation/enhanced/runtime';
import {
  InternalRuntimeContext,
  RuntimeContext,
  setGlobalContext,
} from '../../src/core/context';
import {
  createRuntime,
  registerRuntimeDefinition,
} from '../../src/core/plugin';
import { createRequestHandler } from '../../src/core/server/server';
import { mfApplicationsPlugin, useApplications } from '../../src/mf.node';
import routerPlugin from '../../src/router/internal';

const APPLICATIONS_DATA_SCRIPT_ID = '__MODERN_APPLICATIONS_DATA__';

afterEach(() => {
  helpers.global.resetFederationGlobalInfo();
});

function createServerMFHost(modules: Record<string, Record<string, unknown>>) {
  return init({
    name: 'portal-ssr',
    remotes: [],
    plugins: [
      {
        name: 'test-ssr-remote-loader',
        beforeLoadRemote({ id }) {
          const mod = modules[id];
          if (!mod) return;
          return {
            factory: () => mod,
          };
        },
      },
    ],
  });
}

function wrapContext(element: React.ReactElement, runtimeContext: any) {
  return (
    <RuntimeContext.Provider value={runtimeContext}>
      <InternalRuntimeContext.Provider value={runtimeContext}>
        {element}
      </InternalRuntimeContext.Provider>
    </RuntimeContext.Provider>
  );
}

describe('MF applications SSR integration', () => {
  it('runs async discovery with request headers before SSR routing, injects loader context, and serializes sanitized hydration state', async () => {
    createServerMFHost({
      'shop/App': {
        default: function ShopSSR({ tag }: { tag?: string }) {
          const apps = useApplications();
          return (
            <div>{`SSR-Shop:${tag}:${apps.getRoutesForMount('root').length}`}</div>
          );
        },
      },
    });

    const seenHeaders: string[] = [];
    const load = rs.fn(async (ctx: any) => {
      seenHeaders.push(ctx.request?.headers.get('x-tenant') || '');
      return {
        routes: [
          {
            route: 'shop/*',
            moduleName: 'shop',
            expose: './App',
            versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
            discoverChildren: false,
            props: { tag: 'prod' },
          },
        ],
      };
    });

    let loaderSawApplications = false;

    function RootLayout() {
      const data = useLoaderData() as { ready: boolean };
      return (
        <div>
          <span>{`Layout:${String(data.ready)}`}</span>
          <Outlet />
        </div>
      );
    }

    setGlobalContext({
      entryName: 'index',
      basename: '/',
      routes: [
        {
          id: 'root_layout',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: RootLayout,
          loader: ({ context }: any) => {
            loaderSawApplications =
              typeof context?.applications?.discoverApplications === 'function';
            return { ready: loaderSawApplications };
          },
        },
      ],
    });
    registerRuntimeDefinition((context, instancePlugins) =>
      createRuntime(
        [mfApplicationsPlugin({ hooks: { default: load } }), routerPlugin({})],
        undefined,
        context,
        instancePlugins,
      ),
    );

    const handler = await createRequestHandler(
      async (_request, Root, options) => {
        const body = await new Promise<string>((resolve, reject) => {
          const out = new PassThrough();
          const stream = Readable.toWeb(out) as ReadableStream<Uint8Array>;
          const { pipe } = renderToPipeableStream(
            wrapContext(<Root />, options.runtimeContext),
            {
              onAllReady() {
                pipe(out);
                void new Response(stream).text().then(resolve, reject);
              },
              onError: reject,
            },
          );
        });
        let html = `<html><head></head><body>${body}</body></html>`;
        for (const mod of options.runtimeContext.ssrContext?.htmlModifiers ||
          []) {
          html = mod(html);
        }
        return new Response(html, {
          headers: { 'content-type': 'text/html' },
        });
      },
    );

    const request = new Request('http://portal.test/shop/detail', {
      headers: {
        'x-tenant': 'acme',
        cookie: 'session=top-secret',
      },
    });
    const response = await handler(request, {
      resource: {
        entryName: 'index',
        route: { entryName: 'index', urlPath: '/', isSSR: true },
        routeManifest: {},
        loadableStats: {},
        htmlTemplate:
          '<html><head></head><body><!--<?- html ?>--></body></html>',
      },
      config: { ssr: { mode: 'string' } },
      params: {},
      loaderContext: new Map(),
      monitors: {
        error: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
        push: () => {},
        timing: () => {},
        counter: () => {},
      },
      onError: () => {},
      onTiming: () => {},
    } as any);

    const html = await response.text();
    expect(seenHeaders).toEqual(['acme']);
    expect(loaderSawApplications).toBe(true);
    expect(html).toContain('Layout:true');
    expect(html).toContain('SSR-Shop:prod:1');
    expect(html).toContain(`id="${APPLICATIONS_DATA_SCRIPT_ID}"`);
    expect(html).toContain('"moduleName":"shop"');
    expect(html).not.toContain('top-secret');
  });

  it('isolates concurrent SSR discovery stores across requests', async () => {
    createServerMFHost({});

    setGlobalContext({
      entryName: 'index',
      basename: '/',
      routes: [
        {
          id: 'root_layout',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: () => {
            const apps = useApplications();
            const routes = apps.getRoutesForMount('root');
            return (
              <div>{`Routes:${routes.map(r => r.moduleName).join(',')}`}</div>
            );
          },
        },
      ],
    });
    registerRuntimeDefinition((context, instancePlugins) =>
      createRuntime(
        [
          mfApplicationsPlugin({
            hooks: {
              default: async ctx => {
                const delay = ctx.pathname === '/alpha' ? 30 : 5;
                await new Promise(resolve => setTimeout(resolve, delay));
                const mod =
                  ctx.pathname === '/alpha' ? 'alpha_mod' : 'beta_mod';
                return {
                  routes: [
                    {
                      route: `${ctx.pathname.slice(1)}/*`,
                      moduleName: mod,
                      expose: './App',
                      versionOrUrl: `https://cdn.example.com/${mod}/remoteEntry.js`,
                      discoverChildren: false,
                    },
                  ],
                };
              },
            },
          }),
          routerPlugin({}),
        ],
        undefined,
        context,
        instancePlugins,
      ),
    );

    const handler = await createRequestHandler(
      async (_request, Root, options) =>
        new Response(
          renderToString(wrapContext(<Root />, options.runtimeContext)),
        ),
    );

    const opts = {
      resource: {
        entryName: 'index',
        route: { entryName: 'index', urlPath: '/', isSSR: true },
        routeManifest: {},
        loadableStats: {},
        htmlTemplate: '<html><head></head><body></body></html>',
      },
      config: { ssr: { mode: 'string' } },
      params: {},
      loaderContext: new Map(),
      monitors: {
        error: () => {},
        warn: () => {},
        info: () => {},
        debug: () => {},
        trace: () => {},
        push: () => {},
        timing: () => {},
        counter: () => {},
      },
      onError: () => {},
      onTiming: () => {},
    } as any;

    const [r1, r2] = await Promise.all([
      handler(new Request('http://portal.test/alpha'), opts).then(r =>
        r.text(),
      ),
      handler(new Request('http://portal.test/beta'), opts).then(r => r.text()),
    ]);

    expect(r1).toContain('Routes:alpha_mod');
    expect(r1).not.toContain('beta_mod');
    expect(r2).toContain('Routes:beta_mod');
    expect(r2).not.toContain('alpha_mod');
  });
});
