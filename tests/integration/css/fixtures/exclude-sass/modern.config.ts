import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  tools: {
    sass: (opts, { addExcludes }) => {
      addExcludes([/b\.scss$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
  plugins: [AppToolsPlugin()],
});
