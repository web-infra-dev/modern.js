import fs from 'node:fs/promises';
import path from 'node:path';
import { createMcpHandler, loadMcpAppsConfig } from './server';
/** Last-good compiled artifact is switched atomically between HTTP requests. */
export function createArtifactHandler(
  entry: string,
  options: {
    development: boolean;
    serverInfo?: { name: string; version: string };
  },
) {
  let active:
    | {
        revision: string;
        handle: ReturnType<typeof createMcpHandler>;
        abort: AbortController;
      }
    | undefined;
  let loading: Promise<void> | undefined;
  const contexts = new WeakMap<Request, unknown>();
  const refresh = async () => {
    const revision = options.development
      ? await fs.readFile(entry, 'utf8')
      : 'production';
    if (active?.revision === revision) return;
    const definition = await loadMcpAppsConfig(entry);
    const resourceHtml = definition.remotes.length
      ? await fs.readFile(
          path.join(path.dirname(entry), 'runtime.html'),
          'utf8',
        )
      : undefined;
    const handle = createMcpHandler(definition, {
      configPath: entry,
      serverInfo: options.serverInfo,
      resourceHtml,
      createContext: request => contexts.get(request),
    });
    active?.abort.abort();
    active = { revision, handle, abort: new AbortController() };
  };
  return {
    async handle(request: Request, context?: unknown) {
      loading ??= refresh().finally(() => {
        loading = undefined;
      });
      await loading;
      if (!active) throw new Error('MCP Apps handler is unavailable');
      const { handle, abort } = active;
      // Modern's Node adapter resumes its cloneable request stream in the body
      // getter. Request(request) can bypass that proxy and leave POSTs paused.
      const init: RequestInit & { duplex: 'half' } = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: AbortSignal.any([request.signal, abort.signal]),
        duplex: 'half',
      };
      const scoped = new Request(request.url, init);
      contexts.set(scoped, context);
      try {
        return await handle(scoped);
      } finally {
        contexts.delete(scoped);
      }
    },
    reset() {
      active?.abort.abort();
      active = undefined;
    },
  };
}
