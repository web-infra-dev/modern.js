import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [PluginAppTools()],
  tools: {
    sass: (opts, { addExcludes }) => {
      addExcludes([/b\.scss$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
});
