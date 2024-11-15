import { merge } from '@modern-js/runtime-utils/merge';
import { useContext } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { helmetContext } from 'src/core/helmetContext';
import { isBrowser } from '../../common';
import type { Plugin } from '../../core';
import { RuntimeReactContext } from '../../core';

export const helmetPlugin = (): Plugin => ({
  name: '@modern-js/plugin-helmet-async',
  setup: api => {
    return {
      wrapRoot(App) {
        // debugger;
        const getHelmetApp = (props: any) => {
          const context = useContext(RuntimeReactContext);
          return (
            <HelmetProvider context={context.ssr ? helmetContext : undefined}>
              <App {...props} />
            </HelmetProvider>
          );
        };
        return getHelmetApp;
      },
    };
  },
});

export default helmetPlugin;
