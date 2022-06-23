import type {
  IAppContext,
  CoreOptions,
  NormalizedConfig,
} from '@modern-js/core';
import { Import } from '@modern-js/utils';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

const taskMain = async (
  appContext: IAppContext,
  modernConfig: NormalizedConfig,
) => {
  await features.buildDocs({ appContext, modernConfig });
};

(async () => {
  let options: CoreOptions | undefined;
  if (process.env.CORE_INIT_OPTION_FILE) {
    ({ options } = require(process.env.CORE_INIT_OPTION_FILE));
  }
  const { appContext, resolved } = await core.cli.init([], options);
  (async () => {
    try {
      await taskMain(appContext, resolved);
    } catch (e: any) {
      console.error(e.message);
    }
  })();
})();
