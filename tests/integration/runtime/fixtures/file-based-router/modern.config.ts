import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import RouterLegacyPlugin from '@modern-js/plugin-router-legacy';

export default defineConfig({
  runtime: {
    router: {
      legacy: true,
    },
  },
  plugins: [AppToolsPlugin(), RouterLegacyPlugin()],
});
