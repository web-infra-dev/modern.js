import { Import } from '@modern-js/utils';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
// const { createPlugin, usePlugins, defineConfig } = core;
const hooks: typeof import('@modern-js/module-tools-hooks') = Import.lazy(
  '@modern-js/module-tools-hooks',
  require,
);
const cli: typeof import('./cli') = Import.lazy('./cli', require);
const local: typeof import('./locale') = Import.lazy('./locale', require);
const schema: typeof import('./schema') = Import.lazy('./schema', require);
const lang: typeof import('./utils/language') = Import.lazy(
  './utils/language',
  require,
);

export const { defineConfig } = core;

core.usePlugins([
  require.resolve('@modern-js/plugin-changeset/cli'),
  require.resolve('@modern-js/plugin-analyze/cli'),
]);

export default core.createPlugin(
  (() => {
    const locale = lang.getLocaleLanguage();
    local.i18n.changeLanguage({ locale });
    hooks.lifecycle();

    return {
      validateSchema() {
        return schema.addSchema();
      },
      config() {
        return {
          output: {
            enableSourceMap: false,
            jsPath: 'js',
          },
        };
      },
      commands({ program }: any) {
        cli.devCli(program);
        cli.buildCli(program);
        cli.newCli(program, locale);
        // 便于其他插件辨别
        program.$$libraryName = 'module-tools';
      },
    };
  }) as any,
  { post: ['@modern-js/plugin-analyze', '@modern-js/plugin-changeset'] },
);
