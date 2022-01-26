import * as path from 'path';
import { Import } from '@modern-js/utils';

const devFeature: typeof import('../features/dev') = Import.lazy(
  '../features/dev',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const dotenv: typeof import('dotenv') = Import.lazy('dotenv', require);
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

export const dev = async (option: IDevOption, subCmd = '') => {
  const { tsconfig: tsconfigName } = option;
  const appContext = core.useAppContext();
  const modernConfig = core.useResolvedConfigContext();
  const { appDirectory } = appContext;
  const tsconfigPath = path.join(appDirectory, tsconfigName);

  dotenv.config();

  valid.valideBeforeTask({ modernConfig, tsconfigPath });

  const isTsProject = tsConfigutils.existTsConfigFile(tsconfigPath);

  if (existSubCmd(subCmd)) {
    await devFeature.runSubCmd(subCmd, { isTsProject, appDirectory });
    return;
  }

  // Compatible with the use of jupiter, RUN_PLATFORM is used in jupiter
  if (process.env.RUN_PLATFORM) {
    await devFeature.showMenu({ isTsProject, appDirectory });
  } else {
    await devFeature.devStorybook({ isTsProject, appDirectory });
  }
};
