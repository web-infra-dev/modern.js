import fs from 'node:fs/promises';
import { createMcpHandler, loadMcpAppsConfig } from './server';
/** Optional file adapter for application-built configs; Modern.js BFF imports definitions directly. */
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
    const handle = createMcpHandler(definition, {
      configPath: entry,
      development: options.development,
      serverInfo: options.serverInfo,
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
