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
const frameUrl =
  scenario === 'service'
    ? '/service/forecast/today'
    : scenario === 'bridge'
      ? '/bridge-ssr/forecast/today'
      : '/weather?render=ssr&data=local&updates=1';
let selectedVersion = 'v1';
const state = () => ({ mode, scenario, selectedVersion, versions, frameUrl });

export default defineServerConfig({
  middlewares: [
    {
      name: 'weather-update-controls',
      order: 'pre',
      handler: async (context, next) => {
        const request = context.req.raw;
        const url = new URL(request.url);
        if (!scenario || !url.pathname.startsWith('/_lab/update/'))
          return next();
        const json = (body: unknown, status = 200) =>
          Response.json(body, {
            status,
            headers: { 'Cache-Control': 'no-store' },
          });
        if (request.method === 'GET' && url.pathname === '/_lab/update/state') {
          const version = url.searchParams.get('version');
          if (!version) return json(state());
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
          request.method === 'GET' &&
          url.pathname === '/_lab/update/memory'
        ) {
          const gc = url.searchParams.get('gc') === '1';
          const producers =
            scenario === 'service'
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
