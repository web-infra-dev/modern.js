import {
  debug,
  logger,
  StartDevServerOptions,
} from '@modern-js/builder-shared';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import { DEFAULT_PORT } from '../shared';
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
      client: {},
      liveReload: builderConfig.dev?.hmr ?? true,
      devMiddleware: {
        writeToDisk: (file: string) =>
          !file.includes('.hot-update.') && !file.endsWith('.map'),
      },
    },
    builderConfig.tools?.devServer,
  );

  const server = new Server({
    pwd: options.context.rootPath,
    dev: devServerOptions,
    port,
    compiler,
    config: {
      source: {},
      tools: {},
      server: {},
    } as any,
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

  const server = await createDevServer(options, port, compiler);

  await options.context.hooks.onBeforeStartDevServerHooks.call();

  debug('listen dev server');
  const app = await server.init();

  return new Promise<{ port: number; urls: string[] }>(resolve => {
    app.listen(port, async (err: Error) => {
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
      });
    });
  });
}
