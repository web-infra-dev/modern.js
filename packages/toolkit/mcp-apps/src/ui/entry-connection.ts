import { App } from '@modelcontextprotocol/ext-apps';
import { getEntryMcpState, updateEntryMcpState } from './entry-state';

/** Start the entry handshake explicitly, or reuse the current connection. */
export function connectEntryMcpApp(): App | undefined {
  if (typeof window === 'undefined' || window.parent === window)
    return undefined;
  const current = getEntryMcpState().app;
  if (current) return current;
  const app = new App(
    { name: document.title || 'MCP App', version: '1.0.0' },
    {
      availableDisplayModes: ['inline', 'fullscreen'],
    },
  );
  updateEntryMcpState({ app, status: 'connecting', error: undefined });
  let closed = false;
  const isCurrent = () => !closed && getEntryMcpState().app === app;
  app.ontoolresult = result => {
    if (!isCurrent()) return;
    updateEntryMcpState({
      result,
      resultCount: getEntryMcpState().resultCount + 1,
    });
    window.dispatchEvent(
      new CustomEvent('mcp-app-tool-result', { detail: result }),
    );
  };
  app.onteardown = async () => {
    if (!isCurrent()) return {};
    closed = true;
    updateEntryMcpState({ status: 'closed', app: undefined });
    window.dispatchEvent(new Event('mcp-app-teardown'));
    return {};
  };
  void app
    .connect()
    .then(() => {
      if (!isCurrent()) return;
      updateEntryMcpState({ status: 'connected' });
      window.dispatchEvent(
        new CustomEvent('mcp-app-connected', { detail: app }),
      );
    })
    .catch(error => {
      if (!isCurrent()) return;
      closed = true;
      updateEntryMcpState({
        app: undefined,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      window.dispatchEvent(new CustomEvent('mcp-app-error', { detail: error }));
    });
  return app;
}
