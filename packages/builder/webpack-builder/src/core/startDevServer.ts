import { log, info } from '../shared';
import { createCompiler } from './createCompiler';
import type { BuilderConfig } from '../types';
import type { InitConfigsOptions } from './initConfigs';

async function printURLs(config: BuilderConfig, port: number) {
  const { chalk, getAddressUrls } = await import('@modern-js/utils');
  const protocol = config.dev?.https ? 'https' : 'http';
  const urls = getAddressUrls(protocol, port);

  let message = 'Dev server running at:\n\n';

  message += urls
    .map(
      ({ type, url }) =>
        `  ${`> ${type.padEnd(10)}`}${chalk.cyanBright(url)}\n`,
    )
    .join('');

  info(message);
}

async function createDevServer(options: InitConfigsOptions, port: number) {
  const { Server } = await import('@modern-js/server');
  const { applyOptionsChain } = await import('@modern-js/utils');
  const { builderConfig } = options.builderOptions;

  const compiler = await createCompiler(options);

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

  return server;
}

export async function startDevServer(options: InitConfigsOptions) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  log();
  info('Starting dev server...');

  const { builderConfig } = options.builderOptions;
  const { getPort } = await import('@modern-js/utils');
  const port = await getPort(builderConfig.dev?.port || 8080);
  const server = await createDevServer(options, port);
  const app = await server.init();

  return new Promise<void>(resolve => {
    app.listen(port, async (err: Error) => {
      if (err) {
        throw err;
      }

      await printURLs(builderConfig, port);
      resolve();
    });
  });
}
