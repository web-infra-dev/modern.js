import type { Context, WebBuilderContext, WebBuilderConfig } from '../types';
import { pick } from '../shared';

export async function createContext(config: WebBuilderConfig) {
  const context: Context = {
    srcPath: '',
    distPath: '',
    cachePath: '',
    // TODO should deep clone
    config: { ...config },
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
