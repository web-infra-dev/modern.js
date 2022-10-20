import {
  debug,
  type NodeEnv,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import { getCompiledPath } from '../shared';
import type { Context, WebpackConfig, ModifyWebpackUtils } from '../types';

async function modifyWebpackChain(context: Context, utils: ModifyWebpackUtils) {
  debug('modify webpack chain');

  const { default: WebpackChain } = await import(
    '../../compiled/webpack-5-chain'
  );
  const { ensureArray } = await import('@modern-js/utils');

  const chain = new WebpackChain();
  const [modifiedChain] = await context.hooks.modifyWebpackChainHook.call(
    chain,
    utils,
  );

  if (context.config.tools?.webpackChain) {
    ensureArray(context.config.tools.webpackChain).forEach(item => {
      item(modifiedChain, utils);
    });
  }

  debug('modify webpack chain done');

  return modifiedChain;
}

async function modifyWebpackConfig(
  context: Context,
  webpackConfig: WebpackConfig,
  utils: ModifyWebpackUtils,
) {
  debug('modify webpack config');
  const { applyOptionsChain } = await import('@modern-js/utils');
  const { merge } = await import('../../compiled/webpack-merge');

  let [modifiedConfig] = await context.hooks.modifyWebpackConfigHook.call(
    webpackConfig,
    utils,
  );

  if (context.config.tools?.webpack) {
    modifiedConfig = applyOptionsChain(
      modifiedConfig,
      context.config.tools.webpack,
      utils,
      merge,
    );
  }

  debug('modify webpack config done');
  return modifiedConfig;
}

export async function generateWebpackConfig({
  target,
  context,
}: {
  target: BuilderTarget;
  context: Context;
}) {
  const { default: webpack } = await import('webpack');
  const { CHAIN_ID } = await import('@modern-js/utils');

  const nodeEnv = process.env.NODE_ENV as NodeEnv;
  const utils: ModifyWebpackUtils = {
    env: nodeEnv,
    target,
    webpack,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    CHAIN_ID,
    getCompiledPath,
  };

  const chain = await modifyWebpackChain(context, utils);
  const webpackConfig = await modifyWebpackConfig(
    context,
    chain.toConfig(),
    utils,
  );

  return webpackConfig;
}
