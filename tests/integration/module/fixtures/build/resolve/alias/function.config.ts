import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    resolve: {
      alias: config => {
        return {
          ...config,
          react: 'react-native',
        };
      },
    },
    outDir: './dist/function',
    buildType: 'bundleless',
  },
});
