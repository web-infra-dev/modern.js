import {
  debug,
  startDevServer as baseStartDevServer,
  StartDevServerOptions,
  getDevServerOptions,
} from '@modern-js/builder-shared';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Compiler, MultiCompiler } from 'webpack';
import { getDevMiddleware } from './devMiddleware';

export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: Exclude<StartDevServerOptions['serverOptions'], undefined>,
  customCompiler?: Compiler | MultiCompiler,
) {
  const { Server } = await import('@modern-js/server');

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
  return baseStartDevServer(options, createDevServer, startDevServerOptions);
}
