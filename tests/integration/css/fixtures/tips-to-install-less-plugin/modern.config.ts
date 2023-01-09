import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  tools: {
    less: {
      globalVars: {
        color1: 'red',
      },
    } as any,
  },
});
