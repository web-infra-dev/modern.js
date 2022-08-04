import { STATUS } from '../shared';
import type {
  InnerContext,
  WebpackConfig,
  BuilderTarget,
  ModifyWebpackUtils,
} from '../types';

async function modifyWebpackChain(
  context: InnerContext,
  utils: ModifyWebpackUtils,
) {
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
  context: InnerContext,
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
  context: InnerContext;
}) {
  const { default: webpack } = await import('webpack');
  const utils = { target, webpack };
  const chain = await modifyWebpackChain(context, utils);
  const webpackConfig = await modifyWebpackConfig(
    context,
    chain.toConfig(),
    utils,
  );

  return webpackConfig;
}
