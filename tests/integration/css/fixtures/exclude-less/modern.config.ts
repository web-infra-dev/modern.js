import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [AppToolsPlugin()],
  tools: {
    less: (opts, { addExcludes }) => {
      addExcludes([/b\.less$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
});
