import type { CallToolResult } from '@modelcontextprotocol/client';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import type { UseAppOptions } from '@modelcontextprotocol/ext-apps/react';
import { type ComponentType, createElement, useReducer } from 'react';
import { mergeMcpViewProps, reduceMcpToolState } from './view-result';
export type { App } from '@modelcontextprotocol/ext-apps';

export {
  useApp,
  useDocumentTheme,
  useHostStyleVariables,
  useHostStyles,
  useHostFonts,
} from '@modelcontextprotocol/ext-apps/react';

/** Mount once per view. Handlers are registered before the host handshake. */
export function useMcpApp(
  options: Omit<UseAppOptions, 'onAppCreated'>,
  onAppCreated?: UseAppOptions['onAppCreated'],
) {
  const [state, dispatch] = useReducer(reduceMcpToolState, {
    cancelled: false,
  });
  const connection = useApp({
    ...options,
    onAppCreated(app) {
      app.ontoolinputpartial = event =>
        dispatch({ type: 'partial', arguments: event.arguments });
      app.ontoolinput = event =>
        dispatch({ type: 'input', arguments: event.arguments });
      app.ontoolresult = event => dispatch({ type: 'result', result: event });
      app.ontoolcancelled = () => dispatch({ type: 'cancelled' });
      app.onteardown = async () => {
        dispatch({ type: 'teardown' });
        return {};
      };
      onAppCreated?.(app);
    },
  });
  useHostStyles(connection.app, connection.app?.getHostContext());
  return {
    ...connection,
    ...state,
    result: state.result as CallToolResult | undefined,
    viewProps: mergeMcpViewProps(state.input, state.partialInput, state.result),
  };
}

/** Adapt a normal Modern.js entry component to the host's MCP lifecycle. */
export function createMcpView<P extends object>(
  View: ComponentType<P>,
  appInfo: { name: string; version: string },
  capabilities: UseAppOptions['capabilities'] = {},
) {
  return function McpView() {
    const { app, isConnected, error, viewProps, cancelled } = useMcpApp({
      appInfo,
      capabilities: {
        availableDisplayModes: ['inline', 'fullscreen'],
        ...capabilities,
      },
    });
    if (error) return createElement('p', { role: 'alert' }, error.message);
    if (cancelled) return createElement('p', null, 'Tool cancelled');
    if (!app || !isConnected) return createElement('p', null, 'Connecting…');
    return createElement(View, {
      ...viewProps,
      mcpApp: app,
    } as P);
  };
}
