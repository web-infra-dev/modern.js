import type {
  CliPlugin,
  ModuleTools,
  BaseBuildConfig,
} from '@modern-js/module-tools';

/**
 * use config 'transformImport' instead.
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
