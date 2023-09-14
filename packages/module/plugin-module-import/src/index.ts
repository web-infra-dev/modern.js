import type {
  CliPlugin,
  ModuleTools,
  BaseBuildConfig,
} from '@modern-js/module-tools';

/**
 * deprecated named export, use config 'transformImport'.
 * @deprecated
 */
export const modulePluginImport = (options: {
  pluginImport?: BaseBuildConfig['transformImport'];
}): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-import',
  setup: () => ({
    beforeBuildTask(config) {
      config.transformImport = options.pluginImport ?? config.transformImport;
      return config;
    },
  }),
});

export default modulePluginImport;
