import type { IAppContext } from '@modern-js/core';
import { Import } from '@modern-js/utils';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const pluginNode: typeof import('@modern-js/plugin/node') = Import.lazy(
  '@modern-js/plugin/node',
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
  pluginNode.enable();
  const { appContext } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      await taskMain({ appContext });
    } catch (e: any) {
      console.error(e.message);
    }
  });
})();
