import type { BuilderPlugin } from '../types';

export const PluginTsChecker = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-ts-checker',
    setup(api) {
      api.modifyWebpackChain(async chain => {
        const config = api.getNormalizedConfig();
        // Use tsChecker if tsChecker is not `false`, So there are two situations for user:
        // 1. tsLoader + transpileOnly + tsChecker
        // 2. @babel/preset-typescript + tsChecker
        if (config.tools.tsChecker === false || !api.context.tsconfigPath) {
          return;
        }

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
              configFile: api.context.tsconfigPath,
              // use typescript of user project
              typescriptPath: require.resolve('typescript'),
            },
            issue: {
              exclude: [
                { file: '**/*.(spec|test).ts' },
                { file: '**/node_modules/**/*' },
              ],
            },
            logger: {
              log() {
                // do nothing
                // we only want to display error messages
              },
              error(message: string) {
                console.error(message.replace(/ERROR/g, 'Type Error'));
              },
            },
          },
          typeof config.tools.tsChecker === 'object'
            ? config.tools.tsChecker
            : {},
        );

        chain
          .plugin(CHAIN_ID.PLUGIN.TS_CHECKER)
          .use(ForkTsCheckerWebpackPlugin, [tsCheckerOptions]);
      });
    },
  };
};
