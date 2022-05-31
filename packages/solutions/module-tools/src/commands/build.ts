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
  // @deprecated
  // The `tsc` field has been superceded by the `dts` field.
  tsc: boolean;
  dts: boolean;
  clear: boolean;
}

export const build = async (
  api: PluginAPI,
  buildCommandOption: IBuildCommandOption,
) => {
  const {
    watch,
    tsconfig: tsconfigName,
    tsc,
    dts,
    clear = true,
    platform,
    styleOnly,
  } = buildCommandOption;

  init(api);

  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const tsconfigPath = path.join(appDirectory, tsconfigName);
  const outputPath = modernConfig.output.path ?? 'dist';
  const isTsProject = tsConfigutils.existTsConfigFile(tsconfigPath);
  // Compatible tsc option, when set --no-dts or --no-tsc, not generator dts files
  const genDts = dts && tsc;
  // If the project contains a tsconfig configuration file
  // and does not use no-tsc on the cli parameter
  // and `output.disableTsChecker` is not configured, dts generation is performed
  let enableDtsGen = isTsProject && genDts;

  // when output.disableTsChecker is true, the dts generator close.
  if (modernConfig.output.disableTsChecker) {
    enableDtsGen = false;
  }

  valid.valideBeforeTask({ modernConfig, tsconfigPath });

  await buildFeature.build(api, {
    enableWatchMode: watch,
    isTsProject,
    platform,
    sourceDir: 'src',
    tsconfigName,
    enableDtsGen,
    clear,
    outputPath,
    styleOnly,
  });
};
