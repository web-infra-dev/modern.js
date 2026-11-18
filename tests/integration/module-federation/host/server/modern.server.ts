import { performance } from 'node:perf_hooks';
import { writeHeapSnapshot } from 'node:v8';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { defineServerConfig } from '@modern-js/server-runtime';
import {
  shouldUpdateRemote,
  updateRemotes,
} from '@modern-js/runtime/mf/update';

// These fixture endpoints are tracked requests too. Updates are scheduled after
// the response so the initiating request never waits for itself to drain.
const scenario = process.env.MF_LAB_UPDATES;
const mode = process.env.MF_LAB_MODE;
const ports = JSON.parse(process.env.MF_LAB_PORTS || '{}');
const versions = (mode === 'production' ? ['v1', 'v2'] : ['v1']).map(
  version => ({
    version,
    url: `http://localhost:${ports[version === 'v2' ? 'providerV2' : 'provider']}/static/mf-manifest.json`,
  }),
);
let selectedVersion = 'v1';
const state = (
  selectedScenario = scenario === 'all' ? 'ordinary' : scenario,
) => ({
  mode,
  scenario: selectedScenario,
  selectedVersion,
  versions,
});

export default defineServerConfig({
  plugins: process.env.MF_LAB_UPDATES
    ? [
        createRequire(path.join(process.cwd(), 'package.json'))(
          process.env.MF_LAB_UPDATE_PLUGIN ||
            `${process.cwd()}/../scripts/update-lab.mjs`,
        ).updateLabPlugin(),
      ]
    : [],
  middlewares: [
    {
      name: 'weather-update-controls',
      order: 'pre',
      handler: async (context, next) => {
        const request = context.req.raw;
        const url = new URL(request.url);
        // Force only the host shell to CSR. `?csr=1` would also bypass the
        // Service transport in bridge-react and invalidate this comparison.
        if (
          url.searchParams.has('bench') ||
          (url.searchParams.get('lab') === 'service' &&
            url.searchParams.get('tab') === 'load')
        ) {
          context.set('forceCSR', 'lab-click-comparison');
        }
        if (!scenario || !url.pathname.startsWith('/_lab/update/'))
          return next();
        const json = (body: unknown, status = 200) =>
          Response.json(body, {
            status,
            headers: { 'Cache-Control': 'no-store' },
          });
        if (request.method === 'GET' && url.pathname === '/_lab/update/state') {
          const version = url.searchParams.get('version');
          if (!version) {
            const selectedScenario =
              url.searchParams.get('scenario') ||
              (scenario === 'all' ? 'ordinary' : scenario);
            if (
              !['ordinary', 'bridge', 'service'].includes(
                selectedScenario || '',
              )
            )
              return json({ error: 'Unknown update scenario' }, 400);
            return json(state(selectedScenario));
          }
          const candidate = versions.find(item => item.version === version);
          if (!candidate)
            return json({ error: 'Unknown producer version' }, 400);
          const pending = await shouldUpdateRemote(
            { name: 'provider', entry: candidate.url },
            { application: 'lab_host', revalidate: true },
          );
          if (!pending) selectedVersion = candidate.version;
          return json({ ...state(), pending });
        }
        if (
          request.method === 'POST' &&
          url.pathname === '/_lab/update/apply'
        ) {
          if (mode !== 'production')
            return json(
              {
                error:
                  'Development updates follow producer rebuilds automatically',
              },
              405,
            );
          const { version } = await request.json();
          const candidate = versions.find(item => item.version === version);
          if (!candidate)
            return json({ error: 'Unknown producer version' }, 400);
          const target = {
            name: 'provider',
            entry: candidate.url,
            client: { entry: candidate.url },
          };
          const options = { application: 'lab_host', revalidate: true };
          try {
            const shouldUpdate = await shouldUpdateRemote(target, options);
            const result = shouldUpdate
              ? updateRemotes([target], { ...options, defer: 'after-response' })
              : { changed: false };
            if (!shouldUpdate) selectedVersion = candidate.version;
            return json({ ...state(), pending: shouldUpdate, ...result });
          } catch (error) {
            return json(
              { error: error instanceof Error ? error.message : String(error) },
              500,
            );
          }
        }
        if (
          request.method === 'POST' &&
          url.pathname === '/_lab/update/heap' &&
          process.env.MF_LAB_HEAP_DIR
        ) {
          const label = url.searchParams.get('label') || '';
          if (!/^[a-z0-9-]+$/.test(label))
            return json({ error: 'Invalid label' }, 400);
          mkdirSync(process.env.MF_LAB_HEAP_DIR, { recursive: true });
          const file = path.join(
            process.env.MF_LAB_HEAP_DIR,
            `${scenario}-${process.pid}-${label}.heapsnapshot`,
          );
          writeHeapSnapshot(file);
          return json({ file, pid: process.pid });
        }
        if (
          request.method === 'POST' &&
          url.pathname === '/_lab/update/clear-timings' &&
          process.env.MF_LAB_MEMORY_DIAGNOSTICS === '1'
        ) {
          const before = performance.getEntriesByType('resource').length;
          performance.clearResourceTimings();
          return json({
            before,
            after: performance.getEntriesByType('resource').length,
          });
        }
        if (
          request.method === 'GET' &&
          url.pathname === '/_lab/update/memory'
        ) {
          const gc = url.searchParams.get('gc') === '1';
          const producers =
            scenario === 'service' ||
            (url.searchParams.get('scenario') === 'service' &&
              process.env.MF_LAB_SERVICE)
              ? await Promise.all(
                  versions.map(async ({ version }) => {
                    const port =
                      ports[version === 'v2' ? 'providerV2' : 'provider'];
                    const response = await fetch(
                      `http://localhost:${port}/_lab/update/memory${gc ? '?gc=1' : ''}`,
                    );
                    if (!response.ok)
                      throw new Error(
                        `Producer ${version} memory probe failed: ${response.status}`,
                      );
                    return response.json();
                  }),
                )
              : [];
          if (gc) {
            if (!globalThis.gc)
              return json({ error: 'Host requires --expose-gc' }, 500);
            for (let attempt = 0; attempt < 3; attempt++) {
              globalThis.gc();
              await new Promise<void>(resolve => setImmediate(resolve));
            }
          }
          return json({
            samples: [
              {
                role: 'host',
                pid: process.pid,
                gcExposed: Boolean(globalThis.gc),
                diagnostics: {
                  moduleInfoKeys: Object.keys(
                    (globalThis as any).__FEDERATION__?.moduleInfo || {},
                  ),
                  manifestLoadingKeys: Object.keys(
                    (globalThis as any).__FEDERATION__?.__MANIFEST_LOADING__ ||
                      {},
                  ),
                  remoteEntryKeys: Object.keys(
                    (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__ || {},
                  ),
                  resourceTimings:
                    performance.getEntriesByType('resource').length,
                  instances: (
                    (globalThis as any).__FEDERATION__?.__INSTANCES__ || []
                  ).map((instance: any) => ({
                    name: instance.options?.name,
                    id: instance.options?.id,
                    modules: instance.moduleCache?.size,
                    manifests: instance.snapshotHandler?.manifestCache?.size,
                    retainedProviders: instance.retainedProviders?.size,
                  })),
                  shareScopeKeys: Object.keys(
                    (globalThis as any).__FEDERATION__?.__SHARE__ || {},
                  ),
                  nodeCache: (() => {
                    const cache = createRequire(
                      path.join(process.cwd(), 'package.json'),
                    ).cache;
                    return {
                      modules: Object.keys(cache).length,
                      childEdges: Object.values(cache).reduce(
                        (count, mod) => count + (mod?.children.length || 0),
                        0,
                      ),
                    };
                  })(),
                },
                ...process.memoryUsage(),
              },
              ...producers,
            ],
          });
        }
        return json({ error: 'Unknown update control' }, 404);
      },
    },
  ],
});
