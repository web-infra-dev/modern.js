import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';

export const modulePluginBanner = (options: {
  banner: { js?: string; css?: string };
  footer?: { js?: string; css?: string };
}): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-banner',
  setup: () => ({
    modifyLibuild(config, next) {
      const lastEsbuildOptions = config.esbuildOptions;
      config.esbuildOptions = c => {
        let lastEsbuildConfig = {};
        if (lastEsbuildOptions) {
          lastEsbuildConfig = lastEsbuildOptions(c);
        }

        return {
          ...lastEsbuildConfig,
          footer: options.footer,
          banner: options.banner,
        };
      };
      return next(config);
    },
  }),
});

// deprecated default export
export default modulePluginBanner;
