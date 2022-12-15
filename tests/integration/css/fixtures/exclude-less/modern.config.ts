import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [PluginAppTools()],
  tools: {
    less: (opts, { addExcludes }) => {
      addExcludes([/b\.less$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
});
