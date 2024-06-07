import { Plugin } from '@modern-js/runtime-v2';
import { RuntimeReactContext } from '@modern-js/runtime-v2/context';
import { createContext, useContext } from 'react';

interface ContextValue {
  test?: string;
}
export const Context = createContext<ContextValue>({});

function getValue() {
  return new Promise(resolve => {
    setTimeout(() => resolve('456'), 1000);
  });
}
export const contextPlugin = (): Plugin => {
  return {
    name: 'app-custom-plugin',
    setup: _api => {
      return {
        init: async ({ context }, next) => {
          const value = await getValue();
          context.custom = { value };
          return next({ context });
        },
        hoc: ({ App, config }, next) => {
          const getContextApp = () => {
            return () => {
              const vaule = useContext(RuntimeReactContext);
              return (
                <Context.Provider value={vaule.custom.value}>
                  <App />
                </Context.Provider>
              );
            };
          };
          return next({ App: getContextApp(), config });
        },
      };
    },
  };
};
