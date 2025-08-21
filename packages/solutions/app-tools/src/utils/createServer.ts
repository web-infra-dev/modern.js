import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { applyPlugins } from '@modern-js/prod-server';
import {
  type ApplyPlugins,
  type ModernDevServerOptions,
  createDevServer,
} from '@modern-js/server';

let server: Server | Http2SecureServer | null = null;
export let reloadServer: (() => Promise<void>) | null = null;

export const getServer = () => server;

export const setServer = (newServer: Server | Http2SecureServer) => {
  server = newServer;
};

export const closeServer = async () => {
  if (server) {
    server.close();
    server = null;
  }
};

export const createServer = async (
  options: ModernDevServerOptions,
  applyPluginsFn?: ApplyPlugins,
): Promise<{
  server: Server | Http2SecureServer;
  afterListen: () => Promise<void>;
}> => {
  if (server) {
    server.close();
  }
  const {
    server: newServer,
    afterListen,
    reload: reloadDevServer,
  } = await createDevServer(options, applyPluginsFn || applyPlugins);

  reloadServer = reloadDevServer;
  setServer(newServer);
  return { server: newServer, afterListen };
};
