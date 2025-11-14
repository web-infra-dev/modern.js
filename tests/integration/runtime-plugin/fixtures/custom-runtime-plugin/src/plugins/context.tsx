import { RuntimeContext, type RuntimePlugin } from '@modern-js/runtime';
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
export const contextPlugin = (): RuntimePlugin => {
  return {
    name: 'app-custom-plugin',
    setup: _api => {
      return {
        beforeRender: async context => {
          const value = await getValue();
          context.custom = { test: value };
        },
        wrapRoot: App => {
          const getContextApp = () => {
            return () => {
              const context = useContext(RuntimeContext);
              return (
                <Context.Provider value={context.custom}>
                  <App />
                </Context.Provider>
              );
            };
          };
          return getContextApp();
        },
      };
    },
  };
};
