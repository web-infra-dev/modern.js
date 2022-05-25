import * as path from 'path';
import { fs, Import, dotenv } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import onExit from 'signal-exit';
import { tempTsconfigName } from '../utils/constants';
import type { Platform } from '../types';

const tsConfigutils: typeof import('../utils/tsconfig') = Import.lazy(
  '../utils/tsconfig',
  require,
);

const valid: typeof import('../utils/valide') = Import.lazy(
  '../utils/valide',
  require,
);
const buildFeature: typeof import('../features/build') = Import.lazy(
  '../features/build',
  require,
);
/**
 * init work before build task.
 * @param api
 */
export const init = (api: PluginAPI): void => {
  const { appDirectory } = api.useAppContext();

  dotenv.config();

  onExit(() => {
    const tempTsconfigFileAbsPath = path.join(
      appDirectory,
      `./${tempTsconfigName}`,
    );
    fs.removeSync(tempTsconfigFileAbsPath);
  });
};

export interface IBuildCommandOption {
  watch: boolean;
  tsconfig: string;
  platform: boolean | Exclude<Platform, 'all'>;
  styleOnly: boolean;
  tsc: boolean;
  clear: boolean;
}

export const build = async (
  api: PluginAPI,
  buildCommandOption: IBuildCommandOption,
) => {
  const {
    watch = false,
    tsconfig: tsconfigName,
    tsc,
    clear = true,
    platform,
  } = buildCommandOption;

  init(api);

  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const tsconfigPath = path.join(appDirectory, tsconfigName);
  const outputPath = modernConfig.output.path ?? 'dist';
  const isTsProject = tsConfigutils.existTsConfigFile(tsconfigPath);
  const enableTscCompiler =
    isTsProject && tsc && !modernConfig.output.disableTsChecker;

  valid.valideBeforeTask({ modernConfig, tsconfigPath });

  // TODO: 一些配置只需要从modernConfig中获取
  await buildFeature.build(
    api,
    {
      appDirectory,
      enableWatchMode: watch,
      isTsProject,
      platform,
      sourceDir: 'src',
      tsconfigName,
      enableTscCompiler,
      clear,
      outputPath,
    },
    modernConfig,
  );
};
