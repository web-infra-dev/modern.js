import {
  StartDevServerOptions as RsbuildStartDevServerOptions,
  getAddressUrls,
  debug,
  StartServerResult,
  RsbuildInstance,
  deepmerge,
  mergeChainedOptions,
} from '@rsbuild/shared';
import type {
  ModernDevServerOptionsNew,
  CreateProdServer,
} from '@modern-js/server';
import type { Server } from 'node:http';
import { type ModernServerOptions } from '@modern-js/prod-server';
import { UniBuilderConfig } from '../types';

type ServerOptions = Partial<Omit<ModernDevServerOptionsNew, 'config'>> & {
  config?: Partial<ModernDevServerOptionsNew['config']>;
};

const getServerOptions = (
  builderConfig: UniBuilderConfig,
): ModernServerOptions['config'] => {
  return {
    output: {
      path: builderConfig.output?.distPath?.root,
      assetPrefix: builderConfig.output?.assetPrefix,
      distPath: builderConfig.output?.distPath,
    },
    source: {
      alias: {},
    },
    html: {},
    tools: {
      babel: {},
    },
    server: {},
    runtime: {},
    bff: {},
  };
};

const getDevServerOptions = async ({
  builderConfig,
  serverOptions,
  port,
}: {
  builderConfig: UniBuilderConfig;
  serverOptions: ServerOptions;
  port: number;
}): Promise<{
  config: ModernDevServerOptionsNew['config'];
  devConfig: ModernDevServerOptionsNew['dev'];
}> => {
  const defaultDevConfig = deepmerge(
    {
      watch: true,
      port,
      https: builderConfig.dev?.https,
    },
    // merge devServerOptions from serverOptions
    serverOptions.dev || {},
  );

  const devConfig = mergeChainedOptions({
    defaults: defaultDevConfig,
    options: builderConfig.tools?.devServer,
    mergeFn: deepmerge,
  });

  const defaultConfig = getServerOptions(builderConfig);
  const config = serverOptions.config
    ? deepmerge(defaultConfig, serverOptions.config)
    : defaultConfig;

  return { config, devConfig };
};

export type StartDevServerOptions = Omit<
  RsbuildStartDevServerOptions,
  // printURLs is not used in modern.js
  'printURLs'
> & {
  apiOnly?: boolean;
  defaultPort?: number;
  serverOptions?: ServerOptions;
  createProdServer?: CreateProdServer<RsbuildStartDevServerOptions>;
};

export type UniBuilderStartServerResult = Omit<StartServerResult, 'server'> & {
  server: Server;
};

export async function startDevServer(
  rsbuild: RsbuildInstance,
  options: StartDevServerOptions = {},
  builderConfig: UniBuilderConfig,
) {
  debug('create dev server');

  if (!options.createProdServer) {
    throw new Error('Must pass function: createProdServer');
  }

  const { createDevServer } = await import('@modern-js/server');

  const rsbuildServer = await rsbuild.getServerAPIs(options);

  const { serverOptions = {} } = options;

  const { config, devConfig } = await getDevServerOptions({
    builderConfig,
    serverOptions,
    port: rsbuildServer.config.port,
  });

  const compileMiddlewareAPI = options.apiOnly
    ? undefined
    : await rsbuildServer.startCompile();

  const server = await createDevServer(
    {
      pwd: rsbuild.context.rootPath,
      ...serverOptions,
      rsbuild,
      getMiddlewares: config =>
        rsbuildServer.getMiddlewares({
          compileMiddlewareAPI,
          overrides: config,
        }),
      dev: devConfig,
      config,
      // FIXME: type error
    } as ModernDevServerOptionsNew,
    options.createProdServer,
  );

  const {
    config: { port, host },
  } = rsbuildServer;

  debug('create dev server done');

  await rsbuildServer.beforeStart();

  const protocol = devConfig.https ? 'https' : 'http';
  const urls = getAddressUrls({ protocol, port, host });

  debug('listen dev server');

  return new Promise<UniBuilderStartServerResult>(resolve => {
    server.listen(
      {
        host,
        port,
      },
      async (err?: Error) => {
        if (err) {
          throw err;
        }

        debug('listen dev server done');

        await rsbuildServer.afterStart({
          port,
          routes: [
            {
              pathname: '/',
              entryName: 'index',
            },
          ],
        });

        resolve({
          port,
          urls: urls.map(item => item.url),
          server,
        });
      },
    );
  });
}
