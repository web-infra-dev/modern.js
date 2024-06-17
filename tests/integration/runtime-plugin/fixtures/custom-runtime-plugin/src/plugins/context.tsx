import { Plugin, RuntimeReactContext } from '@modern-js/runtime';
import { createContext, useContext } from 'react';

interface ContextValue {
  test?: string;
}
export const Context = createContext<ContextValue>({});

function getValue() {
  return new Promise(resolve => {
    setTimeout(() => resolve('custom plugin'), 1000);
  });
}
export const contextPlugin = (): Plugin => {
  return {
    name: 'app-custom-plugin',
    setup: _api => {
      return {
        init: async ({ context }, next) => {
          const value = await getValue();
          context.custom = { test: value };
          return next({ context });
        },
        hoc: ({ App, config }, next) => {
          const getContextApp = () => {
            return () => {
              const context = useContext(RuntimeReactContext);
              return (
                <Context.Provider value={context.custom}>
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
