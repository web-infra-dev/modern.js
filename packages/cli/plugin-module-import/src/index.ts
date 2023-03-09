import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import type { ImportItem } from '@modern-js/libuild-plugin-swc';

export default (options: {
  pluginImport?: ImportItem[];
}): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-import',
  setup: () => ({
    async modifyLibuild(config, next) {
      if (!options.pluginImport || options.pluginImport.length === 0) {
        return next(config);
      }

      const { transformPlugin } = await import('@modern-js/libuild-plugin-swc');
      config.plugins?.push(
        transformPlugin({
          jsc: {
            parser: {
              syntax: 'ecmascript',
              jsx: true,
            },
            target: 'es2022',
          },
          extensions: {
            pluginImport: options.pluginImport ?? [],
          },
        }),
      );

      return next(config);
    },
  }),
});
