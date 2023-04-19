import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import type { ImportItem } from '@modern-js/libuild-plugin-swc';

export default (options: {
  pluginImport?: ImportItem[];
}): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-import',
  setup: () => ({
    beforeBuildTask(config) {
      config.transformImport = options.pluginImport ?? [];
      return config;
    },
  }),
});
