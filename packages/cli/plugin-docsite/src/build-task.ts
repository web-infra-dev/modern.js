import type { IAppContext, CoreOptions } from '@modern-js/core';
import { Import } from '@modern-js/utils';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

interface IBuildTaskOption {
  appContext: IAppContext;
}

const taskMain = async ({ appContext }: IBuildTaskOption) => {
  const { appDirectory } = appContext;
  await features.buildDocs({ appDirectory });
};

(async () => {
  let options: CoreOptions | undefined;
  if (process.env.CORE_INIT_OPTION_FILE) {
    ({ options } = require(process.env.CORE_INIT_OPTION_FILE));
  }
  const { appContext } = await core.cli.init([], options);
  await core.manager.run(async () => {
    try {
      await taskMain({ appContext });
    } catch (e: any) {
      console.error(e.message);
    }
  });
})();
