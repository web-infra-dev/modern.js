import { Import } from '@modern-js/utils';
import { WebpackConfigTarget, getWebpackConfig } from '@modern-js/webpack';
import type { Configuration } from 'webpack';
import { MODE } from './contants';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);

const build: typeof import('./compiler') = Import.lazy('./compiler', require);

(async () => {
  const { appContext } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      const { appDirectory, internalDirectory } = appContext;
      const webpackConfig = getWebpackConfig(
        WebpackConfigTarget.CLIENT,
      ) as Configuration;
      build.default(webpackConfig, {
        appDirectory,
        internalDirectory,
        type: MODE.BLOCK,
      });
    } catch (e: any) {
      console.error(e.message);
    }
  });
})();
