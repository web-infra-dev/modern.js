import type { Plugin } from '@modern-js/runtime';
import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { useContext } from 'react';

export const DesignTokenContext = React.createContext<any>({});

export const useDesignTokens = (): IDesignTokens =>
  useContext<IDesignTokens>(DesignTokenContext);

export const designTokenPlugin = (
  options: {
    token?: Record<string, any>;
    useStyledComponentsThemeProvider?: boolean;
    useDesignTokenContext?: boolean;
  } = {},
): Plugin => ({
  name: '@modern-js/plugin-design-token',

  setup: () => ({
    hoc({ App, config }, next) {
      const DesignTokenAppWrapper = (props: any) => {
        const {
          token = {},
          useStyledComponentsThemeProvider = false,
          useDesignTokenContext = false,
        } = options;
        if (useStyledComponentsThemeProvider && useDesignTokenContext) {
          const { ThemeProvider } = require('@modern-js/runtime/styled');
          return (
            <ThemeProvider theme={token}>
              <DesignTokenContext.Provider value={token}>
                <App {...props} />
              </DesignTokenContext.Provider>
            </ThemeProvider>
          );
        } else if (useStyledComponentsThemeProvider) {
          const { ThemeProvider } = require('@modern-js/runtime/styled');
          return (
            <ThemeProvider theme={token}>
              <App {...props} />
            </ThemeProvider>
          );
        } else if (useDesignTokenContext) {
          return (
            <DesignTokenContext.Provider value={token}>
              <App {...props} />
            </DesignTokenContext.Provider>
          );
        } else {
          return <App {...props} />;
        }
      };

      return next({
        App: hoistNonReactStatics(DesignTokenAppWrapper, App),
        config,
      });
    },
  }),
});

export default designTokenPlugin;
