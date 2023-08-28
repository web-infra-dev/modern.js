import _ from 'lodash';
import { FC, ReactElement, createContext, useContext } from 'react';
import createDeferPromise from 'p-defer';
import { getQuery } from 'ufo';
import {
  AppContext,
  BuilderContext,
  FinalFrameworkConfig,
  FrameworkConfig,
} from '@modern-js/devtools-kit';
import { ref } from 'valtio';
import type { JsonValue } from 'type-fest';
import { setupServerConnection } from '@/rpc';
import { useProxyFrom } from '@/utils/hooks';
import { StoreContextValue } from '@/types';
import { getDefaultTabs } from '@/constants';

const StoreContext = createContext<unknown>(null);

export const StoreContextProvider: FC<{ children: ReactElement }> = ({
  children,
}) => {
  const dataSource = getQuery(location.href).src;
  if (!_.isString(dataSource)) {
    throw new TypeError(
      `Can't connection to data source: ${dataSource || '<EMPTY>'}`,
    );
  }

  const deferred = {
    framework: {
      context: createDeferPromise<AppContext>(),
      config: createDeferPromise<FrameworkConfig>(),
      finalConfig: createDeferPromise<FinalFrameworkConfig>(),
    },
    builder: {
      context: createDeferPromise<BuilderContext>(),
      config: createDeferPromise<JsonValue>(),
      finalConfig: createDeferPromise<JsonValue>(),
    },
    bundler: {
      configs: createDeferPromise<JsonValue[]>(),
      finalConfigs: createDeferPromise<JsonValue[]>(),
    },
  };
  const $store = useProxyFrom<StoreContextValue>(() => ({
    dataSource,
    framework: {
      config: deferred.framework.config.promise,
      finalConfig: deferred.framework.finalConfig.promise,
      context: deferred.framework.context.promise,
      fileSystemRoutes: {},
    },
    builder: {
      context: deferred.builder.context.promise,
      config: deferred.builder.config.promise,
      finalConfig: deferred.builder.finalConfig.promise,
    },
    bundler: {
      configs: deferred.bundler.configs.promise,
      finalConfigs: deferred.bundler.finalConfigs.promise,
    },
    tabs: getDefaultTabs().map(tab => ref(tab)),
  }));

  const setupTask = setupServerConnection({ url: dataSource, $store });

  setupTask.then(async ({ server }) => {
    deferred.framework.context.resolve(server.getAppContext());
    deferred.framework.config.resolve(server.getFrameworkConfig());
    deferred.framework.finalConfig.resolve(server.getFinalFrameworkConfig());
    deferred.builder.context.resolve(server.getBuilderContext());
    deferred.builder.config.resolve(server.getBuilderConfig());
    deferred.builder.finalConfig.resolve(server.getFinalBuilderConfig());
    deferred.bundler.configs.resolve(server.getBundlerConfigs());
    deferred.bundler.finalConfigs.resolve(server.getFinalBundlerConfigs());
    const ctx = await $store.framework.context;
    for (const { entryName } of ctx.entrypoints) {
      $store.framework.fileSystemRoutes[entryName] =
        server.getFileSystemRoutes(entryName);
    }
  });

  return (
    <StoreContext.Provider value={$store}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("Can't resolve the context of global store.");
  }
  return ctx as StoreContextValue;
};
