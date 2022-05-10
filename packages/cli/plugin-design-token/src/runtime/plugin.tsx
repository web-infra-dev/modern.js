import type { Plugin } from '@modern-js/runtime-core';
import React, { useContext } from 'react';

export const DesignTokenContext = React.createContext<any>({});

export const useDesignTokens = (): IDesignTokens =>
  useContext<IDesignTokens>(DesignTokenContext);

export default (
  options: {
    token?: Record<string, any>;
    useStyledComponentsThemeProvider?: boolean;
    useDesignTokenContext?: boolean;
  } = {},
): Plugin => ({
  name: '@modern-js/plugin-design-token',

  setup: () => ({
    hoc({ App }, next) {
      return next({
        App: (props: any) => {
          const {
            token = {},
            useStyledComponentsThemeProvider = false,
            useDesignTokenContext = false,
          } = options;
          if (useStyledComponentsThemeProvider && useDesignTokenContext) {
            const { ThemeProvider } = require('@modern-js/runtime-core/styled');
            ThemeProvider.init =
              (App as React.ComponentType<any> & { init: () => void }).init ||
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              function () {};
            return (
              <ThemeProvider theme={token}>
                <DesignTokenContext.Provider value={token}>
                  <App {...props} />
                </DesignTokenContext.Provider>
              </ThemeProvider>
            );
          } else if (useStyledComponentsThemeProvider) {
            const { ThemeProvider } = require('@modern-js/runtime-core/styled');
            ThemeProvider.init =
              (App as React.ComponentType<any> & { init: () => void }).init ||
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              function () {};
            return (
              <ThemeProvider theme={token}>
                <App {...props} />
              </ThemeProvider>
            );
          } else if (useDesignTokenContext) {
            (
              DesignTokenContext as React.Context<any> & { init: () => void }
            ).init =
              (App as React.ComponentType<any> & { init: () => void }).init ||
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              function () {};
            return (
              <DesignTokenContext.Provider value={token}>
                <App {...props} />
              </DesignTokenContext.Provider>
            );
          } else {
            return <App {...props} />;
          }
        },
      });
    },
  }),
});
