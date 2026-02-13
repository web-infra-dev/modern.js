import { setServerCallback } from 'rsc-mf-react-server-dom-client-browser';

type CallServer = (id: string, args: unknown[]) => Promise<unknown>;

let hasRegisteredRemoteServerCallback = false;

export function registerRemoteServerCallback(callServer: CallServer) {
  if (hasRegisteredRemoteServerCallback) {
    return;
  }
  setServerCallback(callServer as any);
  hasRegisteredRemoteServerCallback = true;
}
