import { createAsyncHook, createAsyncPipelineHook } from '@modern-js/plugin';
import type {
  AfterMatchFn,
  AfterRenderFn,
  AfterStreamingRenderContextFn,
  FallbackFn,
  PrepareApiServerFn,
  PrepareWebServerFn,
  ServerPlugin,
} from '../../types';
import { getHookRunners } from './hooks';

export { handleSetupResult } from './hooks';
export const compatPlugin = (): ServerPlugin => ({
  name: '@modern-js/server-compat',
  registryHooks: {
    fallback: createAsyncHook<FallbackFn>(),
    prepareWebServer: createAsyncPipelineHook<PrepareWebServerFn>(),
    prepareApiServer: createAsyncPipelineHook<PrepareApiServerFn>(),
    afterMatch: createAsyncPipelineHook<AfterMatchFn>(),
    afterRender: createAsyncPipelineHook<AfterRenderFn>(),
    afterStreamingRender:
      createAsyncPipelineHook<AfterStreamingRenderContextFn>(),
  },
  _registryApi: (getServerContext, updateServerContext) => {
    const getInternalContext = () => {
      return getServerContext()._internalContext!;
    };
    return {
      useConfigContext: () => {
        return getInternalContext().config;
      },
      useAppContext: () => {
        const { _internalContext, ...serverContext } = getServerContext();
        return serverContext;
      },
      setAppContext: context => {
        return updateServerContext(context);
      },
      useHookRunners: () => {
        return getHookRunners(getInternalContext());
      },
    };
  },
  setup: () => {},
});
