import { BuilderPlugin } from '../types';
import path from 'path';

export const PluginTsChecker = (): BuilderPlugin => {
  return {
    name: 'web-builder-plugin-ts-checker',
    setup(api) {
      const config = api.getBuilderConfig();
      // Use tsChecker if tsChecker is not `false`, So there are two situations for user:
      // 1. tsLoader + transpileOnly + tschecker
      // 2. @babel/preset-typescript + tschecker
      if (config.tools?.tsChecker === false) {
        return;
      }

      api.modifyWebpackChain(async chain => {
        const { default: ForkTsCheckerWebpackPlugin } = await import(
          'fork-ts-checker-webpack-plugin'
        );
        const { CHAIN_ID, applyOptionsChain } = await import(
          '@modern-js/utils'
        );

        const tsCheckerOptions = applyOptionsChain(
          {
            typescript: {
              // avoid OOM issue
              memoryLimit: 8192,
              // use tsconfig of user project
              configFile: path.resolve(api.context.rootPath, './tsconfig.json'),
              // use typescript of user project
              typescriptPath: require.resolve('typescript'),
            },
            issue: {
              include: [{ file: `${api.context.srcPath}/**/*` }],
              exclude: [
                { file: '**/*.(spec|test).ts' },
                { file: '**/node_modules/**/*' },
              ],
            },
          },
          config.tools?.tsChecker || {},
        );
        chain
          .plugin(CHAIN_ID.PLUGIN.TS_CHECKER)
          .use(ForkTsCheckerWebpackPlugin, [tsCheckerOptions]);
      });
    },
  };
};
