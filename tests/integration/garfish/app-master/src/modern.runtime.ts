import { defineRuntimeConfig } from '@modern-js/runtime';
import garfishPlugin from '@modern-js/plugin-garfish/runtime';

export default defineRuntimeConfig({
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
