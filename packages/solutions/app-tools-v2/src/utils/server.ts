import type { Server } from 'node:http';
import { ModernDevServerOptions, createDevServer } from '@modern-js/server';
import { initProdMiddlewares } from '@modern-js/prod-server';
import { AppTools, PluginAPI } from '../types';

export async function getServerInternalPlugins(
  api: PluginAPI<AppTools<'shared'>>,
) {
  const hookRunners = api.useHookRunners();
  const { plugins: serverPlugins } = await hookRunners.collectServerPlugins({
    plugins: [],
  });

  const serverInternalPlugins = serverPlugins.reduce(
    (result, plugin) => Object.assign(result, plugin),
    {},
  );
  api.setAppContext({
    ...api.useAppContext(),
    serverInternalPlugins,
  });
  return serverInternalPlugins;
}

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
  server = await createDevServer(options, initProdMiddlewares);

  return server;
};
