import { CliPlugin, ModuleToolsHooks } from '@modern-js/module-tools-v2';

export const ModuleMainFieldsPlugin = (options: {
  mainFields: string[];
  disableMerge?: boolean;
}): CliPlugin<ModuleToolsHooks> => ({
  name: 'module-main-fields',
  setup: () => ({
    modifyLibuild(config) {
      if (config.resolve) {
        config.resolve.mainFields = options.disableMerge
          ? options.mainFields
          : {
              ...(config.resolve.mainFields ?? {}),
              ...options.mainFields,
            };
      } else {
        config.resolve = {
          mainFields: options.mainFields,
        };
      }

      return config;
    },
  }),
});
