import { STATUS, getCompiledPath } from '../shared';
import type {
  Context,
  NodeEnv,
  WebpackConfig,
  BuilderTarget,
  ModifyWebpackUtils,
} from '../types';

async function modifyWebpackChain(context: Context, utils: ModifyWebpackUtils) {
  context.status = STATUS.BEFORE_MODIFY_WEBPACK_CHAIN;

  const WebpackChain = (await import('@modern-js/utils/webpack-chain')).default;
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

  context.status = STATUS.AFTER_MODIFY_WEBPACK_CHAIN;

  return modifiedChain;
}

async function modifyWebpackConfig(
  context: Context,
  webpackConfig: WebpackConfig,
  utils: ModifyWebpackUtils,
) {
  context.status = STATUS.BEFORE_MODIFY_WEBPACK_CONFIG;

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

  context.status = STATUS.AFTER_MODIFY_WEBPACK_CONFIG;

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
