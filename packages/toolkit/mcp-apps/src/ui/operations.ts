import type { App } from '@modelcontextprotocol/ext-apps';
import { useEffect, useMemo } from 'react';

export interface McpOperationScope {
  run<T>(
    action: (options: {
      signal: AbortSignal;
      assertCurrent(): void;
    }) => Promise<T>,
  ): Promise<T>;
  cancel(): void;
  listen(): () => void;
}
/** Local cancellation and stale-result protection. Does not roll back remote writes. */
export function createMcpOperationScope(
  app: App,
  getKey: () => unknown = () => app,
): McpOperationScope {
  let generation = 0;
  let disposed = false;
  const pending = new Set<AbortController>();
  const cancel = () => {
    generation++;
    for (const controller of pending)
      controller.abort(new Error('MCP operation scope changed'));
    pending.clear();
  };
  return {
    cancel,
    listen() {
      disposed = false;
      let key = getKey();
      const changed = () => {
        const next = getKey();
        if (!Object.is(next, key)) {
          key = next;
          cancel();
        }
      };
      app.addEventListener('hostcontextchanged', changed);
      return () => {
        disposed = true;
        app.removeEventListener('hostcontextchanged', changed);
        cancel();
      };
    },
    async run(action) {
      if (disposed) throw new Error('MCP operation scope is disposed');
      const controller = new AbortController();
      const started = generation;
      const key = getKey();
      const assertCurrent = () => {
        if (
          disposed ||
          controller.signal.aborted ||
          generation !== started ||
          !Object.is(key, getKey())
        )
          throw new Error(
            'MCP operation belongs to an expired scope; execution may have completed remotely',
          );
      };
      pending.add(controller);
      try {
        const result = await action({
          signal: controller.signal,
          assertCurrent,
        });
        assertCurrent();
        return result;
      } finally {
        pending.delete(controller);
      }
    },
  };
}
export function useMcpOperation(app: App, getKey?: () => unknown) {
  const scope = useMemo(
    () => createMcpOperationScope(app, getKey),
    [app, getKey],
  );
  useEffect(() => scope.listen(), [scope]);
  return scope;
}
