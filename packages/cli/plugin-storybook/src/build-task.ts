import { Import } from '@modern-js/utils';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const features: typeof import('./features/build') = Import.lazy(
  './features/build',
  require,
);

interface IBuildTaskOption {
  modernConfig: NormalizedConfig;
  appContext: IAppContext;
}

const taskMain = async ({ modernConfig, appContext }: IBuildTaskOption) => {
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<{ isTsProject: boolean }>({ isTsProject: false });
  await features.runBuild({
    appContext,
    modernConfig,
    ...config,
    stories: [
      `${appContext.appDirectory}/stories/**/*.stories.mdx`,
      `${appContext.appDirectory}/stories/**/*.stories.@(js|jsx|ts|tsx)`,
    ],
  });
};

(async () => {
  const { resolved: modernConfig, appContext } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      await taskMain({ modernConfig, appContext });
    } catch (e: any) {
      console.error(e.message);
    }
  });
})();
