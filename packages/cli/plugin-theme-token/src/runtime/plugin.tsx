/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line filenames/match-exported
import { createPlugin } from '@modern-js/runtime-core';
import React, { useContext } from 'react';

export const ThemeTokenContext = React.createContext({});

export const useThemeToken = (): ITokens =>
  useContext<ITokens>(ThemeTokenContext);

const themeToken = (
  options: {
    token?: Record<string, any>;
    useStyledComponentsThemeProvider?: boolean;
  } = {},
) =>
  createPlugin(
    () => ({
      hoc({ App }, next) {
        return next({
          App: (props: any) => {
            const { token = {}, useStyledComponentsThemeProvider = false } =
              options;
            if (useStyledComponentsThemeProvider) {
              const {
                ThemeProvider,
              } = require('@modern-js/runtime-core/styled');
              return (
                <ThemeProvider theme={token}>
                  <ThemeTokenContext.Provider value={token}>
                    <App {...props} />
                  </ThemeTokenContext.Provider>
                </ThemeProvider>
              );
            } else {
              return (
                <ThemeTokenContext.Provider value={token}>
                  <App {...props} />
                </ThemeTokenContext.Provider>
              );
            }
          },
        });
      },
    }),
    {
      name: '@modern-js/plugin-theme-token',
    },
  );

export default themeToken;

// export * from '../plugins';
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-var-requires */
