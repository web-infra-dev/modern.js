import { SpeedyBundler } from '@speedy-js/speedy-core';
import { CLIConfig, SpeedyPlugin } from '@speedy-js/speedy-types';
import { Import } from '@modern-js/utils';
import { Format, Target } from '../../types';
import { watchChangePlugin } from './watchPlugin';

const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const logger: typeof import('../../features/build/logger') = Import.lazy(
  '../../features/build/logger',
  require,
);
interface ITaskConfig {
  distDir: string;
  appDirectory: string;
  sourceMaps: boolean;
  watch: boolean;
  entry: string;
  format: Format;
  target: Target;
}

export const buildInBundleMode = async (config: ITaskConfig) => {
  const { watch, entry, distDir, format, target } = config;
  const plugins: SpeedyPlugin[] = [];
  watch && plugins.push(watchChangePlugin(() => {
    console.info(logger.clearFlag);
  }));
  const cliConfig: CLIConfig = {
    command: 'build',
    mode: 'production',
    preset: 'webapp',
    platform: 'node',
    watch,
    input: {
      index: entry,
    },
    target,
    output: {
      path: distDir,
      format,
      filename: '[dir]/[name]',
    },
    html: false,
    clearScreen: false,
    plugins,
  };
  console.info('speedy', 'Build start');
  const startTime = new Date().getTime();
  const compiler = await SpeedyBundler.create(cliConfig);
  await compiler.build();
  const duration = new Date().getTime() - startTime;
  console.info('speedy', `Build success in ${duration}ms`);
};
const taskMain = async () => {
  // Execution of the script's parameter handling and related required configuration acquisition
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<ITaskConfig>({} as ITaskConfig);

  await buildInBundleMode(config);
};

(async () => {
  await core.manager.run(async () => {
    try {
      await taskMain();
    } catch (e) {
      console.error(e);
    }
  });
})();
