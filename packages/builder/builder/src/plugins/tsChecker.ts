import { DefaultBuilderPlugin } from '@modern-js/builder-shared';
import { merge as deepMerge } from '@modern-js/utils/lodash';
import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@modern-js/builder-webpack-provider';

export const builderPluginTsChecker = (): DefaultBuilderPlugin => {
  return {
    name: 'builder-plugin-ts-checker',

    setup(api) {
      api.modifyBundlerChain(async (chain, { target }) => {
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
          '@modern-js/builder-shared/fork-ts-checker-webpack-plugin'
        );
        const { logger, CHAIN_ID, applyOptionsChain } = await import(
          '@modern-js/utils'
        );

        // use typescript of user project
        let typescriptPath: string;
        try {
          typescriptPath = require.resolve('typescript', {
            paths: [api.context.rootPath],
          });
        } catch (err) {
          logger.warn(
            '"typescript" is not found in current project, Type Checker will not work.',
          );
          return;
        }

        const { experiments } = (
          api as WebpackBuilderPluginAPI
        ).getNormalizedConfig();
        const enableSourceBuild = experiments?.sourceBuild ?? false;

        const tsCheckerOptions = applyOptionsChain(
          {
            typescript: {
              // avoid OOM issue
              memoryLimit: 8192,
              // use tsconfig of user project
              configFile: api.context.tsconfigPath,
              typescriptPath,
              // In source build mode, using the project reference generates a TS2307 error,
              // so additional configuration of the tsChecker is required
              ...(enableSourceBuild
                ? {
                    build: true,
                    mode: 'readonly',
                  }
                : {}),
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
          config.tools.tsChecker,
          undefined,
          deepMerge,
        );

        if (
          api.context.bundlerType === 'rspack' &&
          chain.get('mode') === 'production'
        ) {
          logger.info('ts-checker running...');
          logger.info(
            'ts-checker is running slowly and will block builds until it is complete, please be patient and wait.',
          );
        }

        chain
          .plugin(CHAIN_ID.PLUGIN.TS_CHECKER)
          .use(ForkTsCheckerWebpackPlugin, [tsCheckerOptions]);
      });
    },
  };
};
