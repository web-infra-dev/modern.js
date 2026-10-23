import type {
  App,
  McpUiAppCapabilities,
  McpUiHostContext,
} from '@modelcontextprotocol/ext-apps';
import { useMcpApp } from '../ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ErrorBoundary,
  RemoteComponentContainer,
  type ModuleFederationConfig,
} from './remote';
import './styles.css';

type Listener = (context: McpUiHostContext) => void;
interface HostContextSource {
  getHostContext(): McpUiHostContext | undefined;
  addEventListener(event: 'hostcontextchanged', listener: Listener): void;
  removeEventListener(event: 'hostcontextchanged', listener: Listener): void;
}

function canRequestDisplayMode(
  context: McpUiHostContext | undefined,
  mode: 'inline' | 'fullscreen',
) {
  return context?.availableDisplayModes?.includes(mode) ?? false;
}

function subscribeHostContext(app: HostContextSource, listener: Listener) {
  app.addEventListener('hostcontextchanged', listener);
  listener(app.getHostContext() ?? {});
  return () => app.removeEventListener('hostcontextchanged', listener);
}

const FullscreenIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.5 1.5H12.5V5.5" />
    <path d="M5.5 12.5H1.5V8.5" />
    <path d="M12.5 1.5L8 6" />
    <path d="M1.5 12.5L6 8" />
  </svg>
);

type ModuleFederationResource = {
  moduleFederation: ModuleFederationConfig;
};

function hasModuleFederationResource(
  resource: unknown,
): resource is ModuleFederationResource {
  if (
    !resource ||
    typeof resource !== 'object' ||
    !('moduleFederation' in resource)
  )
    return false;
  const config = resource.moduleFederation;
  return (
    !!config &&
    typeof config === 'object' &&
    ['remoteName', 'remoteEntry', 'module', 'exportName'].every(
      key => typeof (config as Record<string, unknown>)[key] === 'string',
    ) &&
    (!('renderMode' in config) ||
      config.renderMode === undefined ||
      config.renderMode === 'component' ||
      config.renderMode === 'mount')
  );
}

function ModuleFederationApp() {
  const [displayMode, setDisplayMode] = useState<'inline' | 'fullscreen'>(
    'inline',
  );

  const appRef = useRef<App | null>(null);
  const [availableDisplayModes, setAvailableDisplayModes] = useState<string[]>(
    [],
  );

  const displayRequestPending = useRef(false);
  const [isChangingDisplayMode, setIsChangingDisplayMode] = useState(false);
  const toggleFullscreen = useCallback(async () => {
    if (!appRef.current || displayRequestPending.current) {
      return;
    }
    const newMode = displayMode === 'fullscreen' ? 'inline' : 'fullscreen';
    if (!canRequestDisplayMode(appRef.current.getHostContext(), newMode))
      return;
    displayRequestPending.current = true;
    setIsChangingDisplayMode(true);
    if (newMode === 'fullscreen') {
      // Apply immediately so content fills the growing iframe as the host animates it
      setDisplayMode('fullscreen');
    }
    // For collapse: keep fullscreen class while iframe is animating — onhostcontextchanged
    // fires after animation and will remove it cleanly
    try {
      const result = await appRef.current.requestDisplayMode({ mode: newMode });
      if (result.mode === 'inline' || result.mode === 'fullscreen')
        setDisplayMode(result.mode);
    } catch (err) {
      if (newMode === 'fullscreen') {
        setDisplayMode('inline'); // revert optimistic expand
      }
      console.error('[MF App] requestDisplayMode failed:', err);
    } finally {
      displayRequestPending.current = false;
      setIsChangingDisplayMode(false);
    }
  }, [displayMode]);

  // Escape key exits fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && displayMode === 'fullscreen') {
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [displayMode, toggleFullscreen]);

  // Toggle body class in fullscreen to prevent scroll space artifacts
  useEffect(() => {
    if (displayMode === 'fullscreen') {
      document.body.classList.add('mf-fullscreen');
    } else {
      document.body.classList.remove('mf-fullscreen');
    }
    return () => document.body.classList.remove('mf-fullscreen');
  }, [displayMode]);

  const { app, error, isConnected, cancelled, resource, viewProps } = useMcpApp(
    {
      appInfo: {
        name: 'Module Federation',
        version: '1.0.0',
      },
      capabilities: {
        availableDisplayModes: ['inline', 'fullscreen'],
        ...(JSON.parse(
          document.getElementById('modern-mcp-capabilities')?.textContent ??
            '{}',
        ) as McpUiAppCapabilities),
      },
    },
    (app: App) => {
      appRef.current = app;
      app.onerror = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        // Suppress known protocol noise: stale bridge receives initialize
        // response after iframe reload — harmless, not a real error
        if (msg.includes('unknown message ID')) {
          return;
        }
        console.error('[MF App] Error:', err);
      };
    },
  );

  useEffect(() => {
    if (!app || !isConnected) return;
    const updateHostContext = (ctx: McpUiHostContext) => {
      setAvailableDisplayModes(ctx.availableDisplayModes ?? []);
      if (ctx.displayMode === 'inline' || ctx.displayMode === 'fullscreen') {
        setDisplayMode(ctx.displayMode);
      }
    };
    return subscribeHostContext(app, updateHostContext);
  }, [app, isConnected]);

  if (cancelled) return <p role="status">Tool cancelled</p>;

  if (error) {
    return (
      <div className="mf-error-container">
        <h1 className="mf-error-title">Connection Error</h1>
        <p className="mf-error-message">{error.message}</p>
      </div>
    );
  }

  if (!isConnected || !app) {
    return (
      <div className="mf-loading-container">
        <div>Connecting...</div>
      </div>
    );
  }

  return (
    <main
      className={`mf-main${displayMode === 'fullscreen' ? ' fullscreen' : ''}`}
    >
      {/* Fullscreen toggle button — visible on hover */}
      <div className="mf-toolbar">
        <button
          type="button"
          className={`mf-tool-btn${displayMode === 'fullscreen' ? ' is-fullscreen' : ''}`}
          disabled={
            isChangingDisplayMode ||
            !availableDisplayModes.includes(
              displayMode === 'fullscreen' ? 'inline' : 'fullscreen',
            )
          }
          onClick={toggleFullscreen}
          title={
            displayMode === 'fullscreen'
              ? 'Exit fullscreen (Esc)'
              : 'Enter fullscreen'
          }
        >
          <FullscreenIcon />
        </button>
      </div>
      {/* Render remote component when tool is available */}
      {hasModuleFederationResource(resource) && (
        <RemoteComponentContainer
          config={resource.moduleFederation}
          args={viewProps}
          mcpApp={app}
        />
      )}
    </main>
  );
}

createRoot(document.body).render(
  <ErrorBoundary>
    <ModuleFederationApp />
  </ErrorBoundary>,
);
