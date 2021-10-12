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

export const dev = async (option: IDevOption) => {
  const { tsconfig: tsconfigName } = option;
  const appContext = core.useAppContext();
  const modernConfig = core.useResolvedConfigContext();
  const { appDirectory } = appContext;
  const tsconfigPath = path.join(appDirectory, tsconfigName);

  dotenv.config();

  valid.valideBeforeTask({ modernConfig, tsconfigPath });

  const isTsProject = tsConfigutils.existTsConfigFile(tsconfigPath);

  // await devFeature.showMenu({ isTsProject, appDirectory });
  await devFeature.devStorybook({ isTsProject, appDirectory });
};
