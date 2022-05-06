import * as path from 'path';
import { dotenv, Import } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';

const devFeature: typeof import('../features/dev') = Import.lazy(
  '../features/dev',
  require,
);
const tsConfigutils: typeof import('../utils/tsconfig') = Import.lazy(
  '../utils/tsconfig',
  require,
);
const valid: typeof import('../utils/valide') = Import.lazy(
  '../utils/valide',
  require,
);

export interface IDevOption {
  tsconfig: string;
}

const existSubCmd = (subCmd: string) => subCmd.length > 0;

export const dev = async (api: PluginAPI, option: IDevOption, subCmd = '') => {
  const { tsconfig: tsconfigName } = option;
  const appContext = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const { appDirectory } = appContext;
  const tsconfigPath = path.join(appDirectory, tsconfigName);

  dotenv.config();

  valid.valideBeforeTask({ modernConfig, tsconfigPath });

  const isTsProject = tsConfigutils.existTsConfigFile(tsconfigPath);

  if (existSubCmd(subCmd)) {
    await devFeature.runSubCmd(api, subCmd, { isTsProject, appDirectory });
    return;
  }

  // Compatible with the use of jupiter, RUN_PLATFORM is used in jupiter
  if (process.env.RUN_PLATFORM) {
    await devFeature.showMenu(api, { isTsProject, appDirectory });
  } else {
    await devFeature.devStorybook(api, { isTsProject, appDirectory });
  }
};
