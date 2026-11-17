/** Test controls run before admission, so releasing a held update never queues behind it. */
export function updateLabPlugin() {
  let current;
  const identities = new WeakMap();
  let identity = 0;
  return {
    name: 'weather-update-observation',
    pre: ['@modern-js/module-federation/ssr-update-owner'],
    post: ['@modern-js/plugin-inject-resource'],
    setup(api) {
      api.onPrepare(() => {
        const context = api.getServerContext();
        const application = context.ssrApplication;
        if (!process.env.MF_LAB_UPDATES || !application) return;
        if (!context.dev)
          application.onInitialError = error => {
            console.dir(error, { depth: 5 });
            throw error;
          };
        const ports = JSON.parse(process.env.MF_LAB_PORTS || '{}');
        context.ssrUpdateParticipants.push({
          async invalidate() {
            if (!current?.release) return;
            current.held = true;
            await current.gate;
          },
        });
        const previous = application.beforeRequest;
        application.beforeRequest = async request => {
          const url = new URL(request.url);
          const prefix = '/_lab/update/lab/';
          if (!url.pathname.startsWith(prefix)) return previous?.(request);
          const action = url.pathname.slice(prefix.length);
          if (action.startsWith('producer/')) {
            if (!process.env.MF_LAB_SERVICE_NESTED)
              return new Response('Service dependency lab is not enabled', {
                status: 400,
              });
            const target = `http://localhost:${ports.provider}${prefix}${action.slice('producer/'.length)}`;
            return fetch(target, {
              method: request.method,
              headers: { 'Content-Type': 'application/json' },
              ...(request.method === 'POST'
                ? { body: await request.text() }
                : {}),
              signal: request.signal,
            });
          }
          const json = (value, status = 200) =>
            Response.json(value, {
              status,
              headers: { 'Cache-Control': 'no-store' },
            });
          const manager = api.getServerContext().ssrUpdateManager;
          if (action === 'policy' && request.method === 'POST') {
            const { policy } = await request.json();
            if (!['wait', 'csr', 'reject'].includes(policy))
              return json({ error: 'Unknown request policy' }, 400);
            globalThis[Symbol.for('weather-lab.request-policy')] = policy;
            return json({ policy });
          }
          if (action === 'status' && request.method === 'GET') {
            const owner = globalThis[
              Symbol.for('modern-js.mf.ssr.owners')
            ]?.owners.get(api.getServerContext().ssrUpdateOwnerId);
            return json({
              pid: process.pid,
              configuredScope: process.env.MF_LAB_SSR_SCOPE || 'application',
              serviceDependencies: Boolean(process.env.MF_LAB_SERVICE_NESTED),
              operation: current && {
                version: current.version,
                held: current.held,
                completed: current.completed,
                result: current.result,
                error: current.error,
              },
              status: manager?.status(),
              entries: [...(owner?.entries.values() || [])].map(record => {
                if (!identities.has(record.runtime))
                  identities.set(record.runtime, ++identity);
                return {
                  entry: record.entry,
                  runtime: identities.get(record.runtime),
                  modules: record.rootIds.map(id => {
                    const module = record.runtime.c[id];
                    if (!module) return null;
                    if (!identities.has(module))
                      identities.set(module, ++identity);
                    return identities.get(module);
                  }),
                };
              }),
            });
          }
          if (action === 'release' && request.method === 'POST') {
            current?.release?.();
            if (current) current.release = undefined;
            return json({ released: true });
          }
          if (action !== 'start' || request.method !== 'POST')
            return json({ error: 'Unknown control' }, 404);
          if (process.env.MF_LAB_MODE !== 'production')
            return json({ error: 'Build and serve is required' }, 405);
          if (current && !current.completed)
            return json({ error: 'An update is already pending' }, 409);
          const { version } = await request.json();
          if (version !== 'v1' && version !== 'v2')
            return json({ error: 'Unknown version' }, 400);
          const provider =
            context.ssrUpdateOwnerId && manager?.name !== 'lab_host';
          if (provider && !process.env.MF_LAB_SERVICE_NESTED)
            return json({ error: 'No internal dependency configured' }, 400);
          const port = provider
            ? ports[version === 'v2' ? 'libraryV2' : 'library']
            : ports[version === 'v2' ? 'providerV2' : 'provider'];
          const entry = `http://localhost:${port}/${provider ? '' : 'static/'}mf-manifest.json`;
          const target = {
            name: provider ? 'library' : 'provider',
            entry,
            client: { entry },
          };
          try {
            if (
              !(await manager.shouldUpdateRemote(target, { revalidate: true }))
            )
              return json(
                {
                  error: 'Select a version different from the current producer',
                },
                400,
              );
            const operation = { version, held: false, completed: false };
            operation.gate = new Promise(resolve => {
              operation.release = resolve;
            });
            current = operation;
            void manager.updateRemotes([target], { revalidate: true }).then(
              result => {
                operation.result = result;
                operation.completed = true;
              },
              error => {
                operation.error = error.message;
                operation.completed = true;
                operation.release?.();
              },
            );
            return json({ accepted: true }, 202);
          } catch (error) {
            return json({ error: String(error) }, 500);
          }
        };
        context.onServerClose ||= [];
        context.onServerClose.push(() => current?.release?.());
        context.onServerClose.push(() => {
          delete globalThis[Symbol.for('weather-lab.request-policy')];
        });
      });
    },
  };
}
