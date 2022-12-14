import type {
  SharedBuilderConfig,
  StartDevServerOptions,
  StartDevServerResult,
  BuilderContext,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from './types';
import type { ModernDevServerOptions, Server } from '@modern-js/server';
import { merge } from '@modern-js/utils/lodash';
import { logger, debug } from './logger';
import { DEFAULT_PORT } from './constants';
import { createAsyncHook } from './createHook';
import { Compiler } from 'webpack';

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

  const devConfig = applyOptionsChain(
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
      // merge devServerOptions from serverOptions
      ...serverOptions.dev,
    },
    builderConfig.tools?.devServer,
  );

  const defaultConfig: ModernDevServerOptions['config'] = {
    output: {
      path: builderConfig.output?.distPath?.root,
      assetPrefix: builderConfig.output?.assetPrefix,
      distPath: builderConfig.output?.distPath,
    },
    source: {
      alias: {},
      define: {},
      globalVars: {},
    },
    html: {},
    tools: {
      babel: {},
    },
    server: {},
    runtime: {},
    bff: {},
  };

  const config = serverOptions.config
    ? merge({}, defaultConfig, serverOptions.config)
    : defaultConfig;

  return { config, devConfig };
};

async function printDevServerURLs(urls: Array<{ url: string; type: string }>) {
  const { chalk } = await import('@modern-js/utils');
  let message = 'Dev server running at:\n\n';

  message += urls
    .map(
      ({ type, url }) =>
        `  ${`> ${type.padEnd(10)}`}${chalk.cyanBright(url)}\n`,
    )
    .join('');

  logger.info(message);
}

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
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
) {
  logger.info('Starting dev server...');

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const { getPort } = await import('@modern-js/utils');
  const builderConfig = options.context.config;

  const port = await getPort(builderConfig.dev?.port || DEFAULT_PORT, {
    strictPort,
  });

  options.context.devServer = {
    hostname: 'localhost',
    port,
  };

  const server = await createDevServer(options, port, serverOptions, compiler);

  await options.context.hooks.onBeforeStartDevServerHook.call();

  debug('listen dev server');
  await server.init();

  return new Promise<StartDevServerResult>(resolve => {
    server.listen(port, async (err: Error) => {
      if (err) {
        throw err;
      }

      debug('listen dev server done');

      const { getAddressUrls } = await import('@modern-js/utils');
      const protocol = builderConfig.dev?.https ? 'https' : 'http';
      const urls = getAddressUrls(protocol, port);

      if (printURLs) {
        await printDevServerURLs(urls);
      }

      await options.context.hooks.onAfterStartDevServerHook.call({ port });
      resolve({
        port,
        urls: urls.map(item => item.url),
        server,
      });
    });
  });
}

type ServerCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

type CompilerTapFn<CallBack extends (...args: any[]) => void> = {
  tap: (name: string, cb: CallBack) => void;
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
