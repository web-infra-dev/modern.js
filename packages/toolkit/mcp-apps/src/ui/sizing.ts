import type { App } from '@modelcontextprotocol/ext-apps';

// Fullscreen dimensions belong to the Host. Content measurements only drive inline cards.
export function observeViewSize(app: App, autoResize?: boolean) {
  let stop: (() => void) | undefined;
  const sync = () => {
    const enabled =
      autoResize ?? app.getHostContext()?.displayMode === 'inline';
    if (enabled && !stop) stop = app.setupSizeChangedNotifications();
    else if (!enabled && stop) {
      stop();
      stop = undefined;
    }
  };
  app.addEventListener('hostcontextchanged', sync);
  sync();
  return () => {
    app.removeEventListener('hostcontextchanged', sync);
    stop?.();
  };
}
