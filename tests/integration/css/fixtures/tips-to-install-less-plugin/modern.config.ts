import PluginAppTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [PluginAppTools()],
  tools: {
    less: {
      globalVars: {
        color1: 'red',
      },
    } as any,
  },
});
