import { resolve } from 'path';
import { chalk, CHAIN_ID } from '@modern-js/utils';
import type WebpackChain from '@modern-js/utils/webpack-chain';

export function applyTsCheckerPlugin({
  chain,
  appDirectory,
}: {
  chain: WebpackChain;
  appDirectory: string;
}) {
  const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

  chain.plugin(CHAIN_ID.PLUGIN.TS_CHECKER).use(ForkTsCheckerWebpackPlugin, [
    {
      typescript: {
        // avoid OOM issue
        memoryLimit: 8192,
        // use tsconfig of user project
        configFile: resolve(appDirectory, './tsconfig.json'),
        // use typescript of user project
        typescriptPath: require.resolve('typescript'),
      },
      // only display error messages
      logger: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        log() {},
        error(message: string) {
          console.error(chalk.red.bold('TYPE'), message);
        },
      },
      issue: {
        include: [{ file: '**/src/**/*' }],
        exclude: [
          { file: '**/*.(spec|test).ts' },
          { file: '**/node_modules/**/*' },
        ],
      },
    },
  ]);
}
