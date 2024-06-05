import { defineConfig } from '@modern-js/runtime-v2';
import garfishPlugin from '@modern-js/plugin-garfish-v2/runtime';

export default defineConfig({
  router: true,
  plugins: [
    garfishPlugin({
      apps: [
        {
          name: 'Table',
          entry: 'http://localhost:8081',
          // activeWhen: '/table'
        },
        {
          name: 'Dashboard',
          entry: 'http://localhost:8082',
          // activeWhen: '/dashboard'
        },
      ],
    }),
  ],
});
