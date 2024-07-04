import React from 'react';
import { RuntimeReactContext, getGlobalApp } from '../context';
import { getGlobalRunner } from '../plugin/runner';

export function createRoot(
  UserApp?: React.ComponentType | null,
  config?: { router: { basename: string } },
) {
  const App = UserApp || getGlobalApp();

  const runner = getGlobalRunner();
  /**
   * when use routes entry, after running router plugin, the App will be define
   */
  const HOCApp = runner.hoc(
    { App: App!, config: config || {} },
    {
      onLast: ({ App }: any) => {
        const WrapComponent = ({ _internal_context, ...props }: any) => {
          return (
            <RuntimeReactContext.Provider value={_internal_context}>
              <App {...props} />
            </RuntimeReactContext.Provider>
          );
        };

        return WrapComponent;
      },
    },
  );
  return HOCApp;
}
