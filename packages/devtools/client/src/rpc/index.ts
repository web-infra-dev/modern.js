import { ClientFunctions, ServerFunctions } from '@modern-js/devtools-kit';
import { createBirpc } from 'birpc';

export const setupServerConnection = async (url: string) => {
  const ws = new window.WebSocket(url);

  const server = createBirpc<ServerFunctions, ClientFunctions>(
    {
      refresh: () => location.reload(),
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
