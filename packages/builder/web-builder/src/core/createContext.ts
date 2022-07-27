import type { Context, WebBuilderContext, WebBuilderConfig } from '../types';
import { pick } from '../shared';

export async function createContext(config: WebBuilderConfig) {
  const WebpackChain = (await import('@modern-js/utils/webpack-chain')).default;

  const context: Context = {
    chain: new WebpackChain(),
    srcPath: '',
    distPath: '',
    cachePath: '',
    originalConfig: config,
  };

  return context;
}

export function createPublicContext(
  context: Context,
): Readonly<WebBuilderContext> {
  return Object.freeze(
    pick(context, ['srcPath', 'distPath', 'cachePath', 'originalConfig']),
  );
}
