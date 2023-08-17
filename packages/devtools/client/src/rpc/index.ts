import { ClientFunctions, ServerFunctions } from '@modern-js/devtools-kit';
import { createBirpc } from 'birpc';
import { StoreContextValue } from '@/types';

export interface SetupOptions {
  url: string;
  $store: StoreContextValue;
}

export const setupServerConnection = async (options: SetupOptions) => {
  const { url, $store } = options;
  const ws = new window.WebSocket(url);

  const server = createBirpc<ServerFunctions, ClientFunctions>(
    {
      refresh: () => location.reload(),
      updateFileSystemRoutes({ entrypoint, routes }) {
        $store.framework.fileSystemRoutes[entrypoint.entryName] = routes;
      },
    },
    {
      post: data => ws.send(data),
      on: cb => (ws.onmessage = cb),
      serialize: v => JSON.stringify(v),
      deserialize: v => JSON.parse(v.data.toString()),
    },
  );

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () =>
      reject(new Error(`Failed connect to WebSocket server: ${url}`));
  });

  return { server };
};
