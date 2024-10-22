import type { Server } from 'node:http';
import { applyPlugins } from '@modern-js/prod-server';
import {
  type ModernDevServerOptions,
  createDevServer,
} from '@modern-js/server';

let server: Server | null = null;

export const getServer = () => server;

export const setServer = (newServer: Server) => {
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
): Promise<Server> => {
  if (server) {
    server.close();
  }
  server = (await createDevServer(options, applyPlugins)).server;

  return server;
};
