import { builderPluginAdapterSSR } from '../../src/builder/shared/builderPlugins/adapterSSR';

/**
 * A minimal bundler-chain stub: real `entry` / `entryPoints` tracking, with every
 * other access a self-returning chainable so `applyRouterPlugin` and the html/async
 * plugins are inert no-ops. We only assert on entry survival.
 */
function createMockChain() {
  const entries: Record<string, { paths: string[] }> = {};
  const chainable: any = new Proxy(() => chainable, {
    // `then: undefined` so the proxy is not thenable (else `await`-ing a returned
    // chain would try to unwrap it forever).
    get: (_t, k) => (k === 'then' ? undefined : chainable),
    apply: () => chainable,
  });
  const base: any = {
    entry(name: string) {
      return {
        add(p: string) {
          (entries[name] ||= { paths: [] }).paths.push(p);
          return chainable;
        },
      };
    },
    entryPoints: {
      entries: () => entries,
      has: (name: string) => name in entries,
      delete: (name: string) => {
        delete entries[name];
      },
    },
  };
  return new Proxy(base, {
    get: (t, k) =>
      k in t ? (t as any)[k] : k === 'then' ? undefined : chainable,
  });
}

async function runAdapterChain(environmentName: string) {
  let chainCb: any;
  const api: any = {
    modifyRsbuildConfig: () => {},
    modifyBundlerChain: (cb: any) => {
      chainCb = cb;
    },
  };
  const options: any = {
    // non-SSR config: applyFilterEntriesBySSRConfig (if it runs) deletes the entry
    normalizedConfig: {
      server: {},
      output: {},
      html: {},
      source: {},
      tools: {},
      deploy: {},
      bff: {},
    },
    appContext: { entrypoints: [], internalDirectory: '/tmp/.modern-internal' },
    eagerRouteComponentFilesByEntry: {},
  };
  builderPluginAdapterSSR(options).setup(api);

  const chain = createMockChain();
  chain.entry('index').add('/custom/server-entry.js');
  await chainCb(chain, {
    target: 'node',
    isProd: true,
    HtmlPlugin: class {},
    isServer: true,
    // node env: html disabled (tools.htmlPlugin:false) so applyAsyncChunkHtmlPlugin
    // is skipped — we only exercise the entry-filter gate here.
    environment: {
      name: environmentName,
      config: { tools: { htmlPlugin: false } },
    },
  });
  return chain;
}

describe('builderPluginAdapterSSR — SSR entry filtering is gated to Modern server envs', () => {
  it('keeps a custom node env (e.g. piaServer) entry — applyFilterEntriesBySSRConfig is NOT applied', async () => {
    const chain = await runAdapterChain('piaServer');
    // The custom server bundle entry must survive. Gating on `target === 'node'`
    // alone wrongly filtered every custom node env, leaving it empty so rsbuild fell
    // back to its default `./src` entry.
    expect(chain.entryPoints.has('index')).toBe(true);
  });

  it('filters the Modern `server` env entry under a non-SSR config — proving the filter is active, just gated', async () => {
    const chain = await runAdapterChain('server');
    // The Modern `server` env DOES get SSR entry filtering; with no ssr config the
    // non-ssr entry is removed (the exact behavior the custom-env gate must avoid).
    expect(chain.entryPoints.has('index')).toBe(false);
  });
});
