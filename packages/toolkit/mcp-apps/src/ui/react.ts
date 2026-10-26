import {
  useApp,
  useHostStyles,
  type UseAppOptions,
} from '@modelcontextprotocol/ext-apps/react';
import type { App } from '@modelcontextprotocol/ext-apps';
import { createElement, useReducer, type ComponentType } from 'react';
import { reduceViewState, resultProps } from './state';
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

export function useMcpApp(options: Omit<UseAppOptions, 'onAppCreated'>) {
  const [state, dispatch] = useReducer(reduceViewState, { cancelled: false });
  const connection = useApp({
    ...options,
    onAppCreated(app) {
      app.ontoolinput = () => dispatch({ type: 'input' });
      app.ontoolinputpartial = () => dispatch({ type: 'input' });
      app.ontoolresult = result => dispatch({ type: 'result', result });
      app.ontoolcancelled = () => dispatch({ type: 'cancelled' });
      app.onteardown = async () => {
        dispatch({ type: 'teardown' });
        return {};
      };
    },
  });
  useHostStyles(connection.app, connection.app?.getHostContext());
  return { ...connection, ...state, viewProps: resultProps(state.result) };
}

export function createMcpView<P extends object>(
  View: ComponentType<P>,
  appInfo: { name: string; version: string },
  capabilities: McpCapabilities = {},
) {
  const appCapabilities: McpCapabilities = {
    availableDisplayModes: ['inline', 'fullscreen'],
    ...capabilities,
  };
  return function McpView() {
    const { app, isConnected, error, cancelled, result, viewProps } = useMcpApp(
      { appInfo, capabilities: appCapabilities },
    );
    if (error) return createElement('p', { role: 'alert' }, error.message);
    if (cancelled)
      return createElement('p', { role: 'status' }, 'Tool cancelled');
    if (result?.isError)
      return createElement('p', { role: 'alert' }, 'Tool execution failed');
    if (!app || !isConnected || !result)
      return createElement('p', { role: 'status' }, 'Loading…');
    return createElement(View, { ...viewProps, mcpApp: app } as P);
  };
}
