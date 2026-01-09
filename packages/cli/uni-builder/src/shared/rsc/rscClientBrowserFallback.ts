import path from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';

export function rscClientBrowserFallbackPlugin(): RsbuildPlugin {
  return {
    name: 'uni-builder:rsc-client-browser-fallback',

    setup(api) {
      if (api.context.bundlerType === 'webpack') {
        api.modifyWebpackConfig(config => {
          config.resolve ??= {};
          config.resolve.fallback ??= {};
          (config.resolve.fallback as Record<string, string | false>)[
            'react-server-dom-webpack/client.browser'
          ] = false;
        });
      } else {
        api.modifyRspackConfig(config => {
          config.resolve ??= {};
          config.resolve.fallback ??= {};
          (config.resolve.fallback as Record<string, string | false>)[
            'react-server-dom-webpack/client.browser'
          ] = false;
        });
      }
    },
  };
}
