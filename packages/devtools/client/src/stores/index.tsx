import _ from 'lodash';
import { FC, ReactElement, createContext, useContext } from 'react';
import { useSearchParams } from '@modern-js/runtime/router';
import { suspend } from 'suspend-react';
import { setupServerConnection } from '@/rpc';
import { useProxyFrom } from '@/utils/hooks';
import { StoreContextValue } from '@/types';
import { getDefaultTabs } from '@/constants';

const StoreContext = createContext<unknown>(null);

export const StoreContextProvider: FC<{ children: ReactElement }> = ({
  children,
}) => {
  const [query] = useSearchParams();

  const createStore = (): StoreContextValue => {
    const dataSource = query.get('src');
    if (!_.isString(dataSource)) {
      throw new TypeError(
        `Can't connection to data source: ${dataSource || '<EMPTY>'}`,
      );
    }
    const { server } = suspend(
      () => setupServerConnection(dataSource),
      [dataSource],
    );
    return {
      dataSource,
      router: {
        serverRoutes: server.getServerRoutes(),
      },
      config: {
        frameworkConfig: server.getFrameworkConfig(),
      },
      tabs: getDefaultTabs(),
    };
  };
  const store = useProxyFrom(createStore);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("Can't resolve the context of global store.");
  }
  return ctx as StoreContextValue;
};
