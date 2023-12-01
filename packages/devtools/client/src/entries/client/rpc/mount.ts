import { BirpcReturn, createBirpc } from 'birpc';
import createDeferPromise from 'p-defer';
import { ReactDevtoolsWallAgent } from '@/utils/react-devtools';
import {
  ClientFunctions,
  MountPointFunctions,
  CLIENT_CONNECT_EVENT,
} from '@/types/rpc';

export interface MountPointConnection {
  mountPoint: BirpcReturn<MountPointFunctions, ClientFunctions>;
  wall: ReactDevtoolsWallAgent;
}

export const setupMountPointConnection = async () => {
  const wallAgent = new ReactDevtoolsWallAgent();
  const mountPointWindow = window.parent;
  if (!mountPointWindow || mountPointWindow === window) {
    throw new Error("Can't resolve the parent window.");
  }
  const channel = new MessageChannel();
  const port = channel.port1;
  const mountPointPort = channel.port2;

  const connectTask = createDeferPromise<MountPointConnection>();

  const mountPoint = createBirpc<MountPointFunctions, ClientFunctions>(
    {
      async sendReactDevtoolsData(e) {
        wallAgent.emit(e);
      },
      async onMountPointConnect() {
        connectTask.resolve({ mountPoint, wall: wallAgent });
      },
    },
    {
      post: data => port.postMessage(data),
      on: cb => (port.onmessage = cb),
      deserialize: e => e.data,
      timeout: 500,
    },
  );

  wallAgent.sender = e => mountPoint.sendReactDevtoolsData(e);

  mountPointWindow.postMessage({ type: CLIENT_CONNECT_EVENT }, '*', [
    mountPointPort,
  ]);

  return connectTask.promise;
};
