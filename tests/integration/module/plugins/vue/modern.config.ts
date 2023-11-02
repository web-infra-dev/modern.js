import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { modulePluginVue } from '@modern-js/plugin-module-vue';

export default defineConfig({
  buildConfig: {
    input: ['support/*/index.*'],
    buildType: 'bundle',
    esbuildOptions: options => {
      return {
        ...options,
        entryNames: '[dir]/[name]',
        outbase: 'support',
      };
    },
  },
  plugins: [modulePluginVue(), moduleTools()],
});
