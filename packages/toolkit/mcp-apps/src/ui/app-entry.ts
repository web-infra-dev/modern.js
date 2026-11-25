import { App } from '@modelcontextprotocol/ext-apps';
import { getEntryMcpState, updateEntryMcpState } from './entry-state';

// Existing application entries render normally, including outside an MCP host.
// Keep the connection independent of React mounting and client-side routing.
if (
  typeof window !== 'undefined' &&
  window.parent !== window &&
  !getEntryMcpState().app
) {
  const app = new App(
    { name: document.title || 'MCP App', version: '1.0.0' },
    {
      availableDisplayModes: ['inline', 'fullscreen'],
    },
  );
  updateEntryMcpState({ app, status: 'connecting' });
  app.ontoolresult = result => {
    updateEntryMcpState({
      result,
      resultCount: getEntryMcpState().resultCount + 1,
    });
    window.dispatchEvent(
      new CustomEvent('mcp-app-tool-result', { detail: result }),
    );
  };
  app.onteardown = async () => {
    updateEntryMcpState({ status: 'closed', app: undefined });
    window.dispatchEvent(new Event('mcp-app-teardown'));
    return {};
  };
  void app
    .connect()
    .then(() => {
      updateEntryMcpState({ status: 'connected' });
      window.dispatchEvent(
        new CustomEvent('mcp-app-connected', { detail: app }),
      );
    })
    .catch(error => {
      updateEntryMcpState({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      window.dispatchEvent(new CustomEvent('mcp-app-error', { detail: error }));
    });
}
