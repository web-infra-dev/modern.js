import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { UseAppOptions } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { type ComponentType, createElement, useState } from 'react';
export type { App } from '@modelcontextprotocol/ext-apps';

export {
  useApp,
  useDocumentTheme,
  useHostStyleVariables,
} from '@modelcontextprotocol/ext-apps/react';

/** Mount once per view. Handlers are registered before the host handshake. */
export function useMcpApp(options: Omit<UseAppOptions, 'onAppCreated'>) {
  const [input, setInput] = useState<Record<string, unknown>>();
  const [result, setResult] = useState<CallToolResult>();
  const [cancelled, setCancelled] = useState(false);
  const connection = useApp({
    ...options,
    onAppCreated(app) {
      app.ontoolinput = event => {
        setInput(event.arguments);
        setResult(undefined);
        setCancelled(false);
      };
      app.ontoolresult = event => {
        setResult(event);
        setCancelled(false);
      };
      app.ontoolcancelled = () => setCancelled(true);
    },
  });
  return { ...connection, input, result, cancelled };
}

/** Adapt a normal Modern.js entry component to the host's MCP lifecycle. */
export function createMcpView<P extends object>(
  View: ComponentType<P>,
  appInfo: { name: string; version: string },
) {
  return function McpView() {
    const { app, isConnected, error, input, result, cancelled } = useMcpApp({
      appInfo,
      capabilities: {},
    });
    if (error) return createElement('p', { role: 'alert' }, error.message);
    if (cancelled) return createElement('p', null, 'Tool cancelled');
    if (!app || !isConnected) return createElement('p', null, 'Connecting…');
    const output = result?.structuredContent;
    return createElement(View, {
      ...input,
      ...(output?.args as object),
      ...(output?.viewProps as object),
      mcpApp: app,
    } as P);
  };
}
