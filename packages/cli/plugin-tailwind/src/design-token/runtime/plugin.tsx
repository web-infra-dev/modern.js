import type { Plugin } from '@modern-js/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import React, { useContext } from 'react';

export const DesignTokenContext = React.createContext<any>({});

export const useDesignTokens = (): IDesignTokens =>
  useContext<IDesignTokens>(DesignTokenContext);

interface DesignTokenConfig {
  options?: {
    token?: Record<string, any>;
    useStyledComponentsThemeProvider?: boolean;
    useDesignTokenContext?: boolean;
  };
}
export const designTokenPlugin = (
  userConfig: DesignTokenConfig = {},
): Plugin => ({
  name: '@modern-js/plugin-design-token',

  setup: api => ({
    wrapRoot(App) {
      const pluginConfig: Record<string, any> = api.useRuntimeConfigContext();
      const { options } = merge(pluginConfig.designToken || {}, userConfig);
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

      return DesignTokenAppWrapper;
    },
  }),
});

export default designTokenPlugin;
