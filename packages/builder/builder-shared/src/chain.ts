import { debug } from './logger';
import {
  BuilderContext,
  CreateAsyncHook,
  ModifyBundlerChainUtils,
  ModifyBundlerChainFn,
} from './types';

export async function modifyBundlerChain(
  context: BuilderContext & {
    hooks: {
      modifyBundlerChainHook: CreateAsyncHook<ModifyBundlerChainFn>;
    };
  },
  utils: ModifyBundlerChainUtils,
) {
  debug('modify bundler chain');

  const { default: WebpackChain } = await import('../compiled/webpack-5-chain');

  const bundlerChain = new WebpackChain();

  const [modifiedBundlerChain] =
    await context.hooks.modifyBundlerChainHook.call(bundlerChain, utils);

  debug('modify bundler chain done');

  return modifiedBundlerChain;
}
