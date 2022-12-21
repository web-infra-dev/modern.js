import { debug } from './logger';
import {
  BuilderContext,
  CreateAsyncHook,
  ModifyBundlerChainUtils,
  ModifyBundlerChainFn,
  BundlerChain,
} from './types';

export async function getBundlerChain() {
  const { default: WebpackChain } = await import('../compiled/webpack-5-chain');

  const bundlerChain = new WebpackChain();

  return bundlerChain as BundlerChain;
}

export async function modifyBundlerChain(
  context: BuilderContext & {
    hooks: {
      modifyBundlerChainHook: CreateAsyncHook<ModifyBundlerChainFn>;
    };
  },
  utils: ModifyBundlerChainUtils,
) {
  debug('modify bundler chain');

  const bundlerChain = await getBundlerChain();

  const [modifiedBundlerChain] =
    await context.hooks.modifyBundlerChainHook.call(bundlerChain, utils);

  debug('modify bundler chain done');

  return modifiedBundlerChain;
}
