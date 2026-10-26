import { appTools, defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [appTools()],
  resolve: {
    alias: {
      'react-router-dom': require.resolve('react-router-dom'),
      'react-router': require.resolve('react-router'),
    },
  },
});
