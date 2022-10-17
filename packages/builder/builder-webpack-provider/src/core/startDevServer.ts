import {
  debug,
  logger,
  DEFAULT_PORT,
  StartDevServerResult,
  StartDevServerOptions,
} from '@modern-js/builder-shared';
import { merge } from '@modern-js/utils/lodash';
import type { ModernDevServerOptions } from '@modern-js/server';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Compiler, MultiCompiler } from 'webpack';

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

export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: Exclude<StartDevServerOptions['serverOptions'], undefined>,
  customCompiler?: Compiler | MultiCompiler,
) {
  const { Server } = await import('@modern-js/server');
  const { applyOptionsChain } = await import('@modern-js/utils');

  let compiler: Compiler | MultiCompiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { webpackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      webpackConfigs,
    });
  }

  debug('create dev server');

  const builderConfig = options.context.config;
  const devServerOptions = applyOptionsChain(
    {
      hot: builderConfig.dev?.hmr ?? true,
      watch: true,
      client: {
        port: port.toString(),
      },
      port,
      liveReload: builderConfig.dev?.hmr ?? true,
      devMiddleware: {
        writeToDisk: (file: string) =>
          !file.includes('.hot-update.') && !file.endsWith('.map'),
      },
    },
    builderConfig.tools?.devServer,
  );

  const defaultConfig: ModernDevServerOptions['config'] = {
    output: {
      path: builderConfig.output?.distPath?.root,
      assetPrefix: builderConfig.output?.assetPrefix,
    },
    source: {
      alias: {},
    },
    tools: {
      babel: {},
    },
    server: {},
    runtime: {},
    bff: {},
    plugins: [],
  };

  const server = new Server({
    pwd: options.context.rootPath,
    dev: devServerOptions,
    compiler,
    ...serverOptions,
    config: serverOptions.config
      ? merge({}, defaultConfig, serverOptions.config)
      : defaultConfig,
  });

  debug('create dev server done');

  return server;
}

export async function startDevServer(
  options: InitConfigsOptions,
  {
    compiler,
    printURLs = true,
    strictPort = false,
    serverOptions = {},
  }: StartDevServerOptions = {},
) {
  logger.log();
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

  await options.context.hooks.onBeforeStartDevServerHooks.call();

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

      await options.context.hooks.onAfterStartDevServerHooks.call({ port });
      resolve({
        port,
        urls: urls.map(item => item.url),
        server,
      });
    });
  });
}
