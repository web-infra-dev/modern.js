import type React from 'react';
import {
  InternalRuntimeContext,
  RuntimeContext,
  type TInternalRuntimeContext,
  type TRuntimeContext,
} from '../context';

export function wrapRuntimeContextProvider(
  App: React.ReactElement,
  contextValue: TRuntimeContext,
) {
  const {
    isBrowser,
    initialData,
    routes,
    routerFramework,
    context,
    routeManifest,
    routerRuntime,
    routerInstance,
    routerHydrationScript,
    routerMatchedRouteIds,
    routerServerSnapshot,
    routerContext,
    unstable_getBlockNavState,
    ssrContext,
    _internalContext,
    _internalRouterBaseName,
    ...rest
  } = contextValue as TInternalRuntimeContext;

  const runtimeContextValue: TRuntimeContext = {
    isBrowser,
    initialData,
    routes,
    routerFramework,
    context,
    ...rest,
  };

  return (
    <InternalRuntimeContext.Provider
      value={contextValue as TInternalRuntimeContext}
    >
      <RuntimeContext.Provider value={runtimeContextValue}>
        {App}
      </RuntimeContext.Provider>
    </InternalRuntimeContext.Provider>
  );
}
