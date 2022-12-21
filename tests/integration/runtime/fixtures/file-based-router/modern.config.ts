import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import RouterLegacyPlugin from '@modern-js/plugin-router-v5';

export default defineConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
  },
  plugins: [AppToolsPlugin(), RouterLegacyPlugin()],
});
