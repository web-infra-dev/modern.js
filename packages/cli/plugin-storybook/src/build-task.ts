import { Import } from '@modern-js/utils';
import type {
  NormalizedConfig,
  IAppContext,
  CoreOptions,
} from '@modern-js/core';

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
      `./stories/**/*.stories.mdx`,
      `./stories/**/*.stories.@(js|jsx|ts|tsx)`,
    ],
  });
};

(async () => {
  let options: CoreOptions | undefined;
  if (process.env.CORE_INIT_OPTION_FILE) {
    ({ options } = require(process.env.CORE_INIT_OPTION_FILE));
  }
  const { resolved: modernConfig, appContext } = await core.cli.init(
    [],
    options,
  );
  (async () => {
    try {
      await taskMain({ modernConfig, appContext });
    } catch (e: any) {
      console.error(e);
    }
  })();
})();
