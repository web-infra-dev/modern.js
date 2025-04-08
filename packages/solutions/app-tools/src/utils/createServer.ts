import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { applyPlugins } from '@modern-js/prod-server';
import {
  type ModernDevServerOptions,
  createDevServer,
} from '@modern-js/server';

let server: Server | Http2SecureServer | null = null;

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
): Promise<Server | Http2SecureServer> => {
  if (server) {
    server.close();
  }
  server = (await createDevServer(options, applyPlugins)).server;

  return server;
};
