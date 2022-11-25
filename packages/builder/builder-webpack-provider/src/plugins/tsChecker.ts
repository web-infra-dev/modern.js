import type { BuilderPlugin } from '../types';

export const PluginTsChecker = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-ts-checker',

    setup(api) {
      api.modifyWebpackChain(async (chain, { target }) => {
        const config = api.getNormalizedConfig();

        // Use tsChecker if disableTsChecker is not `true`, So there are two situations for user:
        // 1. tsLoader + transpileOnly + tsChecker
        // 2. @babel/preset-typescript + tsChecker
        if (config.output.disableTsChecker || !api.context.tsconfigPath) {
          return;
        }

        // If there is multiple target, only apply tsChecker to the first target
        // to avoid multiple tsChecker running at the same time
        if (
          Array.isArray(api.context.target) &&
          target !== api.context.target[0]
        ) {
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
