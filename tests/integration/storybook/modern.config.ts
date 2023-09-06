import { defineConfig } from '@modern-js/storybook';
import { builderPluginSwc } from '@modern-js/builder-plugin-swc';

export default defineConfig({
  output: {},
  builderPlugins: [builderPluginSwc()],
});
