import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  tools: {
    less: (opts, { addExcludes }) => {
      addExcludes([/b\.less$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
});
