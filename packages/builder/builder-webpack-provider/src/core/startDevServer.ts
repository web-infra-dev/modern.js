<<<<<<< HEAD
import {
  debug,
  logger,
  DEFAULT_PORT,
  StartDevServerResult,
  StartDevServerOptions,
} from '@modern-js/builder-shared';
import type { ModernDevServerOptions } from '@modern-js/server';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Compiler, MultiCompiler } from 'webpack';

async function printDevServerURLs(urls: Array<{ url: string; type: string }>) {
  const { chalk } = await import('@modern-js/utils');
=======
import { debug, logger } from '@modern-js/builder-shared';
import { createCompiler } from './createCompiler';
<<<<<<<< HEAD:packages/builder/webpack-builder/src/core/startDevServer.ts
========
import { initConfigs, InitConfigsOptions } from './initConfigs';
import { DEFAULT_PORT } from '../shared';
>>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804)):packages/builder/builder-webpack-provider/src/core/startDevServer.ts
import type { BuilderConfig } from '../types';
import type { InitConfigsOptions } from './initConfigs';

async function printURLs(config: BuilderConfig, port: number) {
  const { chalk, getAddressUrls } = await import('@modern-js/utils');
  const protocol = config.dev?.https ? 'https' : 'http';
  const urls = getAddressUrls(protocol, port);

>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
  let message = 'Dev server running at:\n\n';

  message += urls
    .map(
      ({ type, url }) =>
        `  ${`> ${type.padEnd(10)}`}${chalk.cyanBright(url)}\n`,
    )
    .join('');

  logger.info(message);
}

<<<<<<< HEAD
export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: Partial<ModernDevServerOptions>,
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
=======
async function createDevServer(options: InitConfigsOptions, port: number) {
  const { Server } = await import('@modern-js/server');
  const { applyOptionsChain } = await import('@modern-js/utils');
  const compiler = await createCompiler(options);
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

  debug('create dev server');

  const builderConfig = options.context.config;
  const devServerOptions = applyOptionsChain(
    {
      hot: builderConfig.dev?.hmr ?? true,
      watch: true,
<<<<<<< HEAD
      client: {
        port: port.toString(),
      },
      port,
=======
      client: {},
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
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
<<<<<<< HEAD
=======
    port,
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
    compiler,
    config: {
      source: {},
      tools: {},
      server: {},
    } as any,
<<<<<<< HEAD
    ...serverOptions,
=======
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
  });

  debug('create dev server done');

  return server;
}

<<<<<<< HEAD
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
=======
<<<<<<<< HEAD:packages/builder/webpack-builder/src/core/startDevServer.ts
export async function startDevServer(options: InitConfigsOptions) {
  log();
  info('Starting dev server...');
========
export async function startDevServer(
  options: InitConfigsOptions,
  compiler?: Compiler | MultiCompiler,
) {
  logger.log();
  logger.info('Starting dev server...');
>>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804)):packages/builder/builder-webpack-provider/src/core/startDevServer.ts
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const { getPort } = await import('@modern-js/utils');
<<<<<<< HEAD
  const builderConfig = options.context.config;

  const port = await getPort(builderConfig.dev?.port || DEFAULT_PORT, {
    strictPort,
  });
=======
<<<<<<<< HEAD:packages/builder/webpack-builder/src/core/startDevServer.ts
  const port = await getPort(builderConfig.dev?.port || 8080);
  const server = await createDevServer(options, port);
========
  const builderConfig = options.context.config;
  const port = await getPort(builderConfig.dev?.port || DEFAULT_PORT);
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

  options.context.devServer = {
    hostname: 'localhost',
    port,
  };

<<<<<<< HEAD
  const server = await createDevServer(options, port, serverOptions, compiler);
=======
  const server = await createDevServer(options, port, compiler);
>>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804)):packages/builder/builder-webpack-provider/src/core/startDevServer.ts
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

  await options.context.hooks.onBeforeStartDevServerHooks.call();

  debug('listen dev server');
<<<<<<< HEAD
  await server.init();

  return new Promise<StartDevServerResult>(resolve => {
    server.listen(port, async (err: Error) => {
=======
  const app = await server.init();

  return new Promise<void>(resolve => {
    app.listen(port, async (err: Error) => {
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
      if (err) {
        throw err;
      }

      debug('listen dev server done');
<<<<<<< HEAD

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
=======
      await printURLs(builderConfig, port);
      await options.context.hooks.onAfterStartDevServerHooks.call({ port });
      resolve();
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
    });
  });
}
