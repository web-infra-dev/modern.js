import path from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';

export function rscClientBrowserFallbackPlugin(): RsbuildPlugin {
  return {
    name: 'builder:rsc-client-browser-fallback',

    setup(api) {
      // Use path.resolve to handle both TypeScript source and compiled JavaScript
      // Try require.resolve first, fallback to path.resolve if it fails
      let emptyModulePath: string;
      try {
        emptyModulePath = require.resolve('./rscEmptyModule');
      } catch {
        // Fallback for test environments where require.resolve may not work with TS files
        emptyModulePath = path.resolve(__dirname, 'rscEmptyModule');
      }

      api.modifyRspackConfig(config => {
        config.resolve ??= {};
        config.resolve.fallback ??= {};
        (config.resolve.fallback as Record<string, string | false>)[
          'react-server-dom-webpack/client.browser'
        ] = emptyModulePath;
      });
    },
  };
}
