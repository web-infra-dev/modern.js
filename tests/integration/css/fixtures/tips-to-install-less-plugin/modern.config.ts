import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [AppToolsPlugin()],
  tools: {
    less: {
      globalVars: {
        color1: 'red',
      },
    } as any,
  },
});
