import path from 'path';
import { fs, Import, watch } from '@modern-js/utils';
import { generateDtsBundle } from 'dts-bundle-generator';

const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
interface ITaskConfig {
  distDir: string;
  watch: boolean;
  bundle: string;
  tsconfig: string;
  appDirectory: string;
}
const defaultConfig: ITaskConfig = {
  distDir: './dist/bundle',
  watch: false,
  bundle: './src/index.ts',
  tsconfig: 'tsconfig.json',
  appDirectory: '',
};

export const buildInBundleMode = async (config: ITaskConfig) => {
  const { watch: watchMode, bundle, tsconfig, distDir, appDirectory } = config;
  const sourceDir = path.resolve(appDirectory, 'src');
  const generate = () => {
    const start = new Date().getTime();
    console.info('dts Build start');
    generateDtsBundle(
      [
        {
          filePath: bundle,
        },
      ],
      {
        preferredConfigPath: tsconfig,
      },
    ).forEach(bundle => {
      fs.ensureDirSync(distDir);
      fs.writeFileSync(path.join(distDir, 'generator.d.ts'), bundle);
      console.info('dts Build success in', new Date().getTime() - start, 'ms');
    });
  };
  generate();
  if (watchMode) {
    watch(`${sourceDir}/**/*`, _ => {
      generate();
    });
  }
};
const taskMain = async () => {
  // Execution of the script's parameter handling and related required configuration acquisition
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<ITaskConfig>(defaultConfig);

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
