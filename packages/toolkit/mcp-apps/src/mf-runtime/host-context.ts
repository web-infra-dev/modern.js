import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';

type Listener = (context: McpUiHostContext) => void;
interface HostContextSource {
  getHostContext(): McpUiHostContext | undefined;
  addEventListener(event: 'hostcontextchanged', listener: Listener): void;
  removeEventListener(event: 'hostcontextchanged', listener: Listener): void;
}

export function canRequestDisplayMode(
  context: McpUiHostContext | undefined,
  mode: 'inline' | 'fullscreen',
) {
  return context?.availableDisplayModes?.includes(mode) ?? false;
}

export function subscribeHostContext(
  app: HostContextSource,
  listener: Listener,
) {
  app.addEventListener('hostcontextchanged', listener);
  listener(app.getHostContext() ?? {});
  return () => app.removeEventListener('hostcontextchanged', listener);
}
