import { ensureArray } from '@modern-js/utils';
import { debug } from './logger';
import {
  BuilderContext,
  CreateAsyncHook,
  ModifyBundlerChainUtils,
  ModifyBundlerChainFn,
  BundlerChain,
  SharedBuilderConfig,
} from './types';

export async function getBundlerChain() {
  const { default: WebpackChain } = await import(
    '@modern-js/utils/webpack-chain'
  );

  const bundlerChain = new WebpackChain();

  return bundlerChain as unknown as BundlerChain;
}

export async function modifyBundlerChain(
  context: BuilderContext & {
    hooks: {
      modifyBundlerChainHook: CreateAsyncHook<ModifyBundlerChainFn>;
    };
    config: Readonly<SharedBuilderConfig>;
  },
  utils: ModifyBundlerChainUtils,
) {
  debug('modify bundler chain');

  const bundlerChain = await getBundlerChain();

  const [modifiedBundlerChain] =
    await context.hooks.modifyBundlerChainHook.call(bundlerChain, utils);

  if (context.config.tools?.bundlerChain) {
    ensureArray(context.config.tools.bundlerChain).forEach(item => {
      item(modifiedBundlerChain, utils);
    });
  }

  debug('modify bundler chain done');

  return modifiedBundlerChain;
}
