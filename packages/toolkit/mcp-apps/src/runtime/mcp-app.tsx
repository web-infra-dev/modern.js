import type { App, McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/error-boundary';
import { RemoteComponentContainer } from './components/remote-component-container';
import { MFProvider } from './context/MFProvider';
import type { ModuleFederationConfig } from './loaders/mf-loader';
import { injectGlobalStyles } from './styles/styles';
import type { ToolData } from './utils/types';

// Inject global styles
injectGlobalStyles();

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

type ToolOutputPayload = {
  tool?: string;
  resource?: unknown;
  config?: {
    resource?: unknown;
  };
  args?: Record<string, unknown>;
  viewProps?: Record<string, unknown>;
};

type OpenAiFallback = {
  openai?: {
    toolOutput?: ToolOutputPayload;
  };
};

type ToolInputPayload = {
  arguments?: Record<string, unknown>;
};

type ToolResultPayload = {
  structuredContent?: ToolOutputPayload;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type ModuleFederationResource = {
  moduleFederation: ModuleFederationConfig;
};

function hasModuleFederationResource(
  resource: unknown,
): resource is ModuleFederationResource {
  return (
    resource !== null &&
    typeof resource === 'object' &&
    'moduleFederation' in resource
  );
}

function getContainerHeight(context: McpUiHostContext): number | undefined {
  const dimensions = context.containerDimensions;
  return dimensions && 'height' in dimensions ? dimensions.height : undefined;
}

/**
 * Workaround for ChatGPT page-refresh bug (ext-apps#522).
 *
 * After a ChatGPT page refresh the MCP Apps protocol notifications
 * (`ontoolresult`, `ontoolinput`, `oninitialized`) do NOT re-fire, so the
 * widget stays blank. However, ChatGPT still exposes the original tool
 * data on `window.openai.toolOutput` and `window.openai.toolInput`.
 *
 * This helper reads `window.openai.toolOutput` as a fallback data source.
 *
 * @see https://github.com/modelcontextprotocol/ext-apps/issues/522
 */
function getOpenAIToolOutput(): {
  tool: string;
  resource: unknown;
  args: Record<string, unknown>;
} | null {
  try {
    const openai = (window as Window & OpenAiFallback).openai;
    if (!openai?.toolOutput?.tool) {
      return null;
    }
    return {
      tool: openai.toolOutput.tool,
      resource: openai.toolOutput.resource,
      args: openai.toolOutput.args ?? {},
    };
  } catch {
    return null;
  }
}

function ModuleFederationApp() {
  const [currentTool, setCurrentTool] = useState<ToolData | null>(null);
  const [showMFComponent, setShowMFComponent] = useState(false);
  const [displayMode, setDisplayMode] = useState<'inline' | 'fullscreen'>(
    'inline',
  );
  const [_containerHeight, setContainerHeight] = useState<number | null>(null);

  // Tracks whether `ontoolresult` has delivered data through the standard
  // MCP Apps protocol path. Used to decide whether the window.openai
  // fallback should activate.
  const toolResultReceivedRef = useRef(false);

  const appRef = useRef<App | null>(null);

  /**
   * Shared handler: applies a parsed tool-output object to component state.
   * Accepts the `{ tool, resource, args }` shape produced by both the
   * standard `ontoolresult` parsing path and `window.openai.toolOutput`.
   */
  const applyToolOutput = useCallback((parsed: ToolOutputPayload) => {
    // Handle tool with resource
    let resource: unknown = null;
    if (parsed.tool && parsed.resource) {
      resource = parsed.resource;
      setCurrentTool({
        tool: parsed.tool,
        args: { ...(parsed.args ?? {}), ...(parsed.viewProps ?? {}) },
        config: { resource },
      });
    } else if (parsed.tool && parsed.config?.resource) {
      resource = parsed.config.resource;
      setCurrentTool({
        tool: parsed.tool,
        args: { ...(parsed.args ?? {}), ...(parsed.viewProps ?? {}) },
        config: { resource },
      });
    } else {
      return;
    }

    console.log('[mcp-app] ✅ tool result applied for', parsed.tool);
    setShowMFComponent(true);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!appRef.current) {
      return;
    }
    const newMode = displayMode === 'fullscreen' ? 'inline' : 'fullscreen';
    if (newMode === 'fullscreen') {
      // Apply immediately so content fills the growing iframe as the host animates it
      setDisplayMode('fullscreen');
    }
    // For collapse: keep fullscreen class while iframe is animating — onhostcontextchanged
    // fires after animation and will remove it cleanly
    try {
      const result = await appRef.current.requestDisplayMode({ mode: newMode });
      setDisplayMode(result.mode as 'inline' | 'fullscreen');
    } catch (err) {
      if (newMode === 'fullscreen') {
        setDisplayMode('inline'); // revert optimistic expand
      }
      console.error('[MF App] requestDisplayMode failed:', err);
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

  /**
   * ChatGPT page-refresh fallback (ext-apps#522).
   *
   * After mount, wait 500ms for the normal `ontoolresult` protocol path to
   * deliver data. If it hasn't, read from `window.openai.toolOutput` instead.
   * This covers the case where ChatGPT re-creates the widget iframe on page
   * refresh but never re-sends the tool-result / tool-input notifications.
   *
   * @see https://github.com/modelcontextprotocol/ext-apps/issues/522
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (toolResultReceivedRef.current) {
        return;
      }
      const output = getOpenAIToolOutput();
      if (!output) {
        return;
      }
      console.log(
        '[mcp-app] ⚠️ ontoolresult not received — recovering from window.openai (ext-apps#522)',
      );
      applyToolOutput(output);
    }, 500);
    return () => clearTimeout(timer);
  }, [applyToolOutput]);

  const { app, error, isConnected } = useApp({
    appInfo: {
      name: 'Module Federation',
      version: '1.0.0',
    },
    capabilities: {},
    onAppCreated: (app: App) => {
      appRef.current = app;
      toolResultReceivedRef.current = false;

      // Capture initial container dimensions from host context
      const initCtx = app.getHostContext() ?? {};
      const initialHeight = getContainerHeight(initCtx);
      if (initialHeight) {
        setContainerHeight(initialHeight);
      }

      // Handle host context changes (display mode toggles, container resize)
      app.onhostcontextchanged = (ctx: McpUiHostContext) => {
        const height = getContainerHeight(ctx);
        if (height) {
          setContainerHeight(height);
        }
        if (ctx.displayMode) {
          setDisplayMode(ctx.displayMode as 'inline' | 'fullscreen');
        }
      };

      // Handle live tool input updates from the host without
      // reloading the iframe or the remote Module Federation container.
      app.ontoolinput = async (
        input: ToolInputPayload | Record<string, unknown>,
      ) => {
        const args = (input?.arguments ?? input ?? {}) as Record<
          string,
          unknown
        >;
        setCurrentTool(prev => (prev ? { ...prev, args } : prev));
      };

      // Handle tool result — standard MCP Apps protocol path.
      // MCP Apps payloads put render metadata in structuredContent
      // so handlers can keep content[] human-readable. Older static payloads
      // wrapped the same data as JSON in content[0].text; keep that fallback.
      app.ontoolresult = (result: ToolResultPayload) => {
        toolResultReceivedRef.current = true;
        if (
          result?.structuredContent?.tool &&
          result?.structuredContent?.resource
        ) {
          applyToolOutput(result.structuredContent);
          return;
        }
        if (!result.content || !Array.isArray(result.content)) {
          return;
        }
        const textContent = result.content.find(c => c.type === 'text');
        if (!textContent?.text) {
          return;
        }
        let parsed: ToolOutputPayload;
        try {
          parsed = JSON.parse(textContent.text) as ToolOutputPayload;
        } catch {
          return;
        }
        applyToolOutput(parsed);
      };

      app.onteardown = async () => ({});
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
  });

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
      {showMFComponent &&
        hasModuleFederationResource(currentTool?.config?.resource) && (
          <RemoteComponentContainer
            config={currentTool.config.resource.moduleFederation}
            args={currentTool.args}
            mcpApp={app}
          />
        )}
    </main>
  );
}

createRoot(document.body).render(
  <ErrorBoundary>
    <MFProvider>
      <ModuleFederationApp />
    </MFProvider>
  </ErrorBoundary>,
);
