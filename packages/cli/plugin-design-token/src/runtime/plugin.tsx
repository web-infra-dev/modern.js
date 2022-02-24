/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line filenames/match-exported
import { createPlugin } from '@modern-js/runtime-core';
import React, { useContext } from 'react';

export const DesignTokenContext = React.createContext<any>({});

export const useDesignTokens = (): IDesignTokens =>
  useContext<IDesignTokens>(DesignTokenContext);

const designToken = (
  options: {
    token?: Record<string, any>;
    useStyledComponentsThemeProvider?: boolean;
    useDesignTokenContext?: boolean;
  } = {},
) =>
  createPlugin(
    () => ({
      hoc({ App }, next) {
        return next({
          App: (props: any) => {
            const {
              token = {},
              useStyledComponentsThemeProvider = false,
              useDesignTokenContext = false,
            } = options;
            if (useStyledComponentsThemeProvider && useDesignTokenContext) {
              const {
                ThemeProvider,
              } = require('@modern-js/runtime-core/styled');
              return (
                <ThemeProvider theme={token}>
                  <DesignTokenContext.Provider value={token}>
                    <App {...props} />
                  </DesignTokenContext.Provider>
                </ThemeProvider>
              );
            } else if (useStyledComponentsThemeProvider) {
              const {
                ThemeProvider,
              } = require('@modern-js/runtime-core/styled');
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
          },
        });
      },
    }),
    {
      name: '@modern-js/plugin-design-token',
    },
  );

export default designToken;
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-var-requires */
