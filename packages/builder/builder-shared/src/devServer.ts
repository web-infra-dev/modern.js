import type {
  SharedBuilderConfig,
  StartDevServerOptions,
  StartServerResult,
  BuilderContext,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  CompilerTapFn,
} from './types';
import type { ModernDevServerOptions, Server } from '@modern-js/server';
import { merge } from '@modern-js/utils/lodash';
import { logger as defaultLogger, debug } from './logger';
import { DEFAULT_PORT } from './constants';
import { createAsyncHook } from './createHook';
import { getServerOptions, printServerURLs } from './prodServer';
import type { Compiler } from 'webpack';

type ServerOptions = Exclude<StartDevServerOptions['serverOptions'], undefined>;

export const getDevServerOptions = async ({
  builderConfig,
  serverOptions,
  port,
}: {
  builderConfig: SharedBuilderConfig;
  serverOptions: ServerOptions;
  port: number;
}): Promise<{
  config: ModernDevServerOptions['config'];
  devConfig: ModernDevServerOptions['dev'];
}> => {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const { merge: deepMerge } = await import('@modern-js/utils/lodash');

  const defaultDevConfig = deepMerge(
    {
      hot: builderConfig.dev?.hmr ?? true,
      watch: true,
      client: {
        port: port.toString(),
      },
      port,
      liveReload: builderConfig.dev?.hmr ?? true,
      devMiddleware: {
        writeToDisk: (file: string) => !file.includes('.hot-update.'),
      },
      https: builderConfig.dev?.https,
    },
    // merge devServerOptions from serverOptions
    serverOptions.dev as Exclude<typeof serverOptions.dev, boolean>,
  );

  const devConfig = applyOptionsChain(
    defaultDevConfig,
    builderConfig.tools?.devServer,
    {},
    deepMerge,
  );

  const defaultConfig = getServerOptions(builderConfig);
  const config = serverOptions.config
    ? merge({}, defaultConfig, serverOptions.config)
    : defaultConfig;

  return { config, devConfig };
};

/** The context used by startDevServer. */
export type Context = BuilderContext & {
  hooks: {
    onBeforeStartDevServerHook: ReturnType<
      typeof createAsyncHook<OnBeforeStartDevServerFn>
    >;
    onAfterStartDevServerHook: ReturnType<
      typeof createAsyncHook<OnAfterStartDevServerFn>
    >;
  };
  config: Readonly<SharedBuilderConfig>;
};

export async function startDevServer<
  Options extends {
    context: Context;
  },
>(
  options: Options,
  createDevServer: (
    options: Options,
    port: number,
    serverOptions: ServerOptions,
    compiler: StartDevServerOptions['compiler'],
  ) => Promise<Server>,
  {
    compiler,
    printURLs = true,
    strictPort = false,
    serverOptions = {},
    logger: customLogger,
    getPortSilently,
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
) {
  const logger = customLogger ?? defaultLogger;

  logger.info('Starting dev server...');

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const { getPort, isFunction, DEFAULT_DEV_HOST } = await import(
    '@modern-js/utils'
  );
  const builderConfig = options.context.config;

  const port = await getPort(builderConfig.dev?.port || DEFAULT_PORT, {
    strictPort,
    slient: getPortSilently,
  });

  const host =
    typeof serverOptions?.dev === 'object' && serverOptions?.dev?.host
      ? serverOptions?.dev?.host
      : DEFAULT_DEV_HOST;

  const https =
    typeof serverOptions?.dev === 'object' && serverOptions?.dev?.https
      ? Boolean(serverOptions?.dev?.https)
      : false;

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  const server = await createDevServer(options, port, serverOptions, compiler);

  await options.context.hooks.onBeforeStartDevServerHook.call();

  debug('listen dev server');
  await server.init();

  return new Promise<StartServerResult>(resolve => {
    server.listen(
      {
        host,
        port,
      },
      async (err: Error) => {
        if (err) {
          throw err;
        }

        debug('listen dev server done');

        const { getAddressUrls } = await import('@modern-js/utils');
        const protocol = https ? 'https' : 'http';
        let urls = getAddressUrls(protocol, port, builderConfig.dev?.host);

        if (printURLs) {
          if (isFunction(printURLs)) {
            urls = printURLs(urls);

            if (!Array.isArray(urls)) {
              throw new Error(
                'Please return an array in the `printURLs` function.',
              );
            }
          }

          await printServerURLs(urls, 'Dev server', logger);
        }

        await options.context.hooks.onAfterStartDevServerHook.call({ port });
        resolve({
          port,
          urls: urls.map(item => item.url),
          server,
        });
      },
    );
  });
}

type ServerCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export const setupServerHooks = (
  compiler: {
    name?: Compiler['name'];
    hooks: {
      compile: CompilerTapFn<ServerCallbacks['onInvalid']>;
      invalid: CompilerTapFn<ServerCallbacks['onInvalid']>;
      done: CompilerTapFn<ServerCallbacks['onDone']>;
    };
  },
  hookCallbacks: ServerCallbacks,
) => {
  if (compiler.name === 'server') {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('modern-dev-server', hookCallbacks.onInvalid);
  invalid.tap('modern-dev-server', hookCallbacks.onInvalid);
  done.tap('modern-dev-server', hookCallbacks.onDone);
};

export const isClientCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
  name?: Compiler['name'];
}) => {
  const { target } = compiler.options;

  // if target not contains `node` or `webworker`, it's a client compiler
  if (target) {
    if (Array.isArray(target)) {
      return !target.includes('node') && !target.includes('webworker');
    }
    return target !== 'node' && target !== 'webworker';
  }

  return compiler.name === 'client';
};
