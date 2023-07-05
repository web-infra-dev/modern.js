import { defineConfig } from '@modern-js/builder-cli';
import { builderPluginVue } from '@modern-js/builder-plugin-vue';

export default defineConfig({
  output: {
    disableTsChecker: true,
  },
  builderPlugins: [builderPluginVue()],
});
