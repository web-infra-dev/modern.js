import createDeferPromise from 'p-defer';
import { createBirpc } from 'birpc';
import { activate, createBridge } from 'react-devtools-inline/backend';
import {
  CLIENT_CONNECT_EVENT,
  ClientFunctions,
  MountPointFunctions,
} from '@/types/rpc';
import { ReactDevtoolsWallAgent } from '@/utils/react-devtools';

export interface SetupOptions {
  port: MessagePort;
}

export const setupClientConnection = async (options: SetupOptions) => {
  const { port } = options;
  const wallAgent = new ReactDevtoolsWallAgent();
  const client = createBirpc<ClientFunctions, MountPointFunctions>(
    {
      async sendReactDevtoolsData(e) {
        wallAgent.emit(e);
      },
      async activateReactDevtools() {
        const bridge = createBridge(window, wallAgent);
        activate(window, { bridge });
      },
    },
    {
      post: data => port.postMessage(data),
      on: cb => (port.onmessage = cb),
      deserialize: e => e.data,
      timeout: 500,
    },
  );

  wallAgent.sender = e => client.sendReactDevtoolsData(e);

  return { client, wall: wallAgent };
};

export const waitClientConnection = async () => {
  const connectTask =
    createDeferPromise<Awaited<ReturnType<typeof setupClientConnection>>>();
  const handleMessage = async (e: MessageEvent) => {
    if (!e.data) return;
    if (typeof e.data !== 'object') return;
    if (e.data.type !== CLIENT_CONNECT_EVENT) return;
    const port = e.ports[0];
    if (!port) throw new Error('Missing message channel port from devtools.');
    window.removeEventListener('message', handleMessage);
    const conn = await setupClientConnection({ port });
    await conn.client.onMountPointConnect();
    connectTask.resolve(conn);
  };
  window.addEventListener('message', handleMessage);

  return connectTask.promise;
};
