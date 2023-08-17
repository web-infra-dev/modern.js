import _ from 'lodash';
import { FC, ReactElement, createContext, useContext } from 'react';
import createDeferPromise from 'p-defer';
import { getQuery } from 'ufo';
import { AppContext, FrameworkConfig } from '@modern-js/devtools-kit';
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
    },
  };
  const $store = useProxyFrom<StoreContextValue>(() => ({
    dataSource,
    framework: {
      context: deferred.framework.context.promise,
      config: deferred.framework.config.promise,
      fileSystemRoutes: {},
    },
    tabs: getDefaultTabs(),
  }));

  const setupTask = setupServerConnection({ url: dataSource, $store });

  setupTask.then(async ({ server }) => {
    deferred.framework.context.resolve(server.getAppContext());
    deferred.framework.config.resolve(server.getFrameworkConfig());
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
