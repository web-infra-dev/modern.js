import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { UseAppOptions } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { useState } from 'react';
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
