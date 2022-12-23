import {
  debug,
  startDevServer as baseStartDevServer,
  StartDevServerOptions,
  getDevServerOptions,
} from '@modern-js/builder-shared';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Compiler } from '../types';
import { getDevMiddleware } from './devMiddleware';

type ServerOptions = Exclude<StartDevServerOptions['serverOptions'], undefined>;

export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: ServerOptions,
  customCompiler?: Compiler,
) {
  const { Server } = await import('@modern-js/server');

  let compiler: Compiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { rspackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      rspackConfigs,
    });
  }

  debug('create dev server');

  const builderConfig = options.context.config;
  const { config, devConfig } = await getDevServerOptions({
    builderConfig,
    serverOptions,
    port,
  });

  const server = new Server({
    pwd: options.context.rootPath,
    devMiddleware: getDevMiddleware(compiler),
    ...serverOptions,
    dev: devConfig,
    config,
  });

  debug('create dev server done');

  return server;
}

export async function startDevServer(
  options: InitConfigsOptions,
  startDevServerOptions: StartDevServerOptions = {},
) {
  return baseStartDevServer(
    options,
    (
      options: InitConfigsOptions,
      port: number,
      serverOptions: ServerOptions,
      compiler: StartDevServerOptions['compiler'],
    ) =>
      createDevServer(
        options,
        port,
        serverOptions,
        compiler as unknown as Compiler,
      ),
    startDevServerOptions,
  );
}
