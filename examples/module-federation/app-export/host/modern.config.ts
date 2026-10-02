import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [appTools(), moduleFederationPlugin()],
  resolve: {
    alias: {
      'react-router-dom': require.resolve('react-router-dom'),
      'react-router': require.resolve('react-router'),
    },
  },
});
