import { STATUS } from '../shared';
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
  const chain = new WebpackChain();
  const [modified] = await context.hooks.modifyWebpackChainHook.call(
    chain,
    utils,
  );

  context.status = STATUS.AFTER_MODIFY_WEBPACK_CHAIN;

  return modified;
}

async function modifyWebpackConfig(
  context: Context,
  webpackConfig: WebpackConfig,
  utils: ModifyWebpackUtils,
) {
  context.status = STATUS.BEFORE_MODIFY_WEBPACK_CONFIG;

  const [modified] = await context.hooks.modifyWebpackConfigHook.call(
    webpackConfig,
    utils,
  );

  context.status = STATUS.AFTER_MODIFY_WEBPACK_CONFIG;

  return modified;
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
  };

  const chain = await modifyWebpackChain(context, utils);
  const webpackConfig = await modifyWebpackConfig(
    context,
    chain.toConfig(),
    utils,
  );

  return webpackConfig;
}
