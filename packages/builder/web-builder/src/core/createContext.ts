import type { Context, WebBuilderConfig, WebBuilderContext } from '../types';
import { pick, STATUS } from '../shared';
import { performance } from 'perf_hooks';
import { initHooks } from './createHook';

export async function createContext(config: WebBuilderConfig) {
  const startTime = performance.now();
  const context: Context = {
    status: STATUS.INITIAL,
    srcPath: '',
    distPath: '',
    cachePath: '',
    // TODO should deep clone
    config: { ...config },
    originalConfig: config,

    hooks: initHooks(),

    setStatus(status: STATUS) {
      context.status = status;
      // eslint-disable-next-line no-console
      console.log(status, performance.now() - startTime);
    },
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
