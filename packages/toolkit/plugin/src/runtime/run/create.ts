import { merge } from '@modern-js/runtime-utils/merge';
import { createPluginManager } from '../../manager';
import { initPluginAPI } from '../../runtime/api';
import {
  createRuntimeContext,
  initRuntimeContext,
} from '../../runtime/context';
import type {
  RuntimePlugin,
  RuntimePluginExtends,
} from '../../types/runtime/plugin';
import type { RuntimeRunOptions } from './types';

const isPromise = (value: unknown): value is PromiseLike<unknown> =>
  value !== null &&
  (typeof value === 'object' || typeof value === 'function') &&
  typeof (value as PromiseLike<unknown>).then === 'function';

export const createRuntime = <Extends extends RuntimePluginExtends>() => {
  function run(options: RuntimeRunOptions) {
    // Registration is local even when another runtime starts from inside setup.
    const pluginManager = createPluginManager();
    pluginManager.addPlugins(options.plugins);
    const plugins = pluginManager.getPlugins() as RuntimePlugin<Extends>[];
    const context = createRuntimeContext<Extends>({
      runtimeContext: options.runtimeContext || initRuntimeContext(),
      config: options.config,
      plugins,
    });
    const pluginAPI = initPluginAPI<Extends>({
      context,
      pluginManager,
      plugins,
    });
    context.pluginAPI = pluginAPI;

    const assertActive = () => {
      if (context.disposed)
        throw new Error('Runtime was disposed during setup');
    };
    const finish = (value: unknown) => {
      assertActive();
      return options.handleSetupResult?.(value, pluginAPI);
    };
    let index = 0;
    const setup = (): void | Promise<void> => {
      while (index < plugins.length) {
        assertActive();
        const result = plugins[index++].setup?.(pluginAPI);
        const handled = isPromise(result)
          ? Promise.resolve(result).then(finish)
          : finish(result);
        if (isPromise(handled)) return Promise.resolve(handled).then(setup);
      }
      assertActive();
      const configs = context.hooks.config
        .call()
        .filter((config): config is NonNullable<typeof config> =>
          Boolean(config),
        );
      context.config = merge({}, ...configs, context.config || {});
    };
    const fail = (error: unknown): never => {
      try {
        context.dispose(error);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Runtime setup failed');
      }
      throw error;
    };

    try {
      const pending = setup();
      if (pending) {
        context.ready = pending.catch(fail);
        // Consumers still receive the rejection through ready. Attaching a
        // handler here also makes deferred ownership of initialization safe.
        void context.ready.catch(() => {});
      }
    } catch (error) {
      fail(error);
    }
    return { runtimeContext: context };
  }
  return { run };
};
