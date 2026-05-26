import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const require = createRequire(import.meta.url);
const reactRoot = dirname(require.resolve('react/package.json'));

export default defineConfig({
  server: {
    port: 4322,
  },
  source: {
    alias: {
      react: reactRoot,
      'react/jsx-runtime': join(reactRoot, 'jsx-runtime.js'),
      'react/jsx-dev-runtime': join(reactRoot, 'jsx-dev-runtime.js'),
    },
  },
  performance: {
    buildCache: false,
  },
  plugins: [appTools(), moduleFederationPlugin()],
});
