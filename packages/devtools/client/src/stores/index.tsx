import _ from 'lodash';
import { FC, ReactElement, createContext, useContext } from 'react';
import createDeferPromise from 'p-defer';
import { getQuery } from 'ufo';
import {
  AppContext,
  BuilderContext,
  TransformedFrameworkConfig,
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
      config: {
        resolved: createDeferPromise<FrameworkConfig>(),
        transformed: createDeferPromise<TransformedFrameworkConfig>(),
      },
    },
    builder: {
      context: createDeferPromise<BuilderContext>(),
      config: {
        resolved: createDeferPromise<JsonValue>(),
        transformed: createDeferPromise<JsonValue>(),
      },
    },
    bundler: {
      config: {
        resolved: createDeferPromise<JsonValue[]>(),
        transformed: createDeferPromise<JsonValue[]>(),
      },
    },
  };
  const $store = useProxyFrom<StoreContextValue>(() => ({
    dataSource,
    framework: {
      context: deferred.framework.context.promise,
      fileSystemRoutes: {},
      config: {
        resolved: deferred.framework.config.resolved.promise,
        transformed: deferred.framework.config.transformed.promise,
      },
    },
    builder: {
      context: deferred.builder.context.promise,
      config: {
        resolved: deferred.builder.config.resolved.promise,
        transformed: deferred.builder.config.transformed.promise,
      },
    },
    bundler: {
      config: {
        resolved: deferred.bundler.config.resolved.promise,
        transformed: deferred.bundler.config.transformed.promise,
      },
    },
    tabs: getDefaultTabs().map(tab => ref(tab)),
  }));

  const setupTask = setupServerConnection({ url: dataSource, $store });

  setupTask.then(async ({ server }) => {
    deferred.framework.context.resolve(server.getAppContext());
    deferred.framework.config.resolved.resolve(server.getFrameworkConfig());
    deferred.framework.config.transformed.resolve(
      server.getTransformedFrameworkConfig(),
    );
    deferred.builder.context.resolve(server.getBuilderContext());
    deferred.builder.config.resolved.resolve(server.getBuilderConfig());
    deferred.builder.config.transformed.resolve(
      server.getTransformedBuilderConfig(),
    );
    deferred.bundler.config.resolved.resolve(server.getBundlerConfigs());
    deferred.bundler.config.transformed.resolve(
      server.getTransformedBundlerConfigs(),
    );
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
