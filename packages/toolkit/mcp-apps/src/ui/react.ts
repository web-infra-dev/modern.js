import {
  useApp,
  useHostStyles,
  type UseAppOptions,
} from '@modelcontextprotocol/ext-apps/react';
import type { App } from '@modelcontextprotocol/ext-apps';
import {
  createElement,
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ComponentType,
} from 'react';
export { useMcpOperation, createMcpOperationScope } from './operations';
export type { McpOperationScope } from './operations';
import { reduceViewState, resultProps } from './state';
import { observeViewSize } from './sizing';
export {
  useApp,
  useHostStyles,
  useHostFonts,
  useDocumentTheme,
  useHostStyleVariables,
} from '@modelcontextprotocol/ext-apps/react';
export type { App } from '@modelcontextprotocol/ext-apps';
export type McpCapabilities = NonNullable<UseAppOptions['capabilities']>;

export type McpViewProps<T extends object = Record<string, unknown>> = Omit<
  T,
  'mcpApp'
> & { mcpApp: App };

const McpViewContext = createContext<{
  app: App;
  props: Record<string, unknown>;
} | null>(null);
export const useMcpViewContext = () => useContext(McpViewContext);

export function useMcpApp(
  options: Omit<UseAppOptions, 'onAppCreated'>,
  viewOptions: McpViewOptions = {},
) {
  const [state, dispatch] = useReducer(reduceViewState, { cancelled: false });
  const [hostContext, setHostContext] =
    useState<ReturnType<App['getHostContext']>>();
  const connection = useApp({
    ...options,
    autoResize: false,
    onAppCreated(app) {
      app.ontoolinput = () =>
        dispatch({
          type: 'input',
          keepResult: viewOptions.bootstrap === 'connected',
        });
      app.ontoolinputpartial = () =>
        dispatch({
          type: 'input',
          keepResult: viewOptions.bootstrap === 'connected',
        });
      app.ontoolresult = result => dispatch({ type: 'result', result });
      app.ontoolcancelled = () => dispatch({ type: 'cancelled' });
      app.onteardown = async () => {
        dispatch({ type: 'teardown' });
        return {};
      };
    },
  });
  useEffect(() => {
    const app = connection.app;
    if (!app || !connection.isConnected || state.tornDown) return;
    const sync = () => setHostContext(app.getHostContext());
    app.addEventListener('hostcontextchanged', sync);
    sync();
    const stop = observeViewSize(app, options.autoResize);
    return () => {
      app.removeEventListener('hostcontextchanged', sync);
      stop();
    };
  }, [
    connection.app,
    connection.isConnected,
    options.autoResize,
    state.tornDown,
  ]);
  useHostStyles(connection.app, hostContext);
  return {
    ...connection,
    ...state,
    hostContext,
    viewProps: resultProps(state.result),
  };
}

export interface McpViewOptions {
  bootstrap?: 'tool-result' | 'connected';
}

export function createMcpView<P extends object>(
  View: ComponentType<P>,
  appInfo: { name: string; version: string },
  capabilities: McpCapabilities = {},
  options: McpViewOptions = {},
) {
  const appCapabilities: McpCapabilities = {
    availableDisplayModes: ['inline', 'fullscreen'],
    ...capabilities,
  };
  return function McpView() {
    const {
      app,
      isConnected,
      error,
      cancelled,
      tornDown,
      result,
      viewProps,
      hostContext,
    } = useMcpApp({ appInfo, capabilities: appCapabilities }, options);
    if (tornDown) return null;
    if (error) return createElement('p', { role: 'alert' }, error.message);
    if (cancelled)
      return createElement('p', { role: 'status' }, 'Tool cancelled');
    if (result?.isError)
      return createElement('p', { role: 'alert' }, 'Tool execution failed');
    if (!app || !isConnected || (!result && options.bootstrap !== 'connected'))
      return null;
    return createElement(
      McpViewContext.Provider,
      { value: { app, props: viewProps } },
      createElement(
        'div',
        {
          'data-mcp-display-mode': hostContext?.displayMode,
          style:
            hostContext?.displayMode === 'fullscreen'
              ? {
                  height:
                    hostContext.containerDimensions &&
                    'height' in hostContext.containerDimensions
                      ? hostContext.containerDimensions.height
                      : '100dvh',
                  overflow: 'auto',
                  display: 'flow-root',
                  boxSizing: 'border-box',
                }
              : { display: 'flow-root' },
        },
        createElement(View, { ...viewProps, mcpApp: app } as P),
      ),
    );
  };
}
