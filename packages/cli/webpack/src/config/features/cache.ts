import path from 'path';
import { CACHE_DIRECTORY } from '../../utils/constants';
import type { ChainUtils } from '../shared';

export function applyFileSystemCache({
  chain,
  appContext,
  isTsProject,
}: ChainUtils & { isTsProject: boolean }) {
  chain.cache({
    type: 'filesystem',
    cacheDirectory: path.resolve(
      appContext.appDirectory,
      CACHE_DIRECTORY,
      'webpack',
    ),
    buildDependencies: {
      defaultWebpack: [require.resolve('webpack/lib')],
      config: [__filename, appContext.configFile].filter(Boolean),
      tsconfig: [
        isTsProject && path.resolve(appContext.appDirectory, './tsconfig.json'),
      ].filter(Boolean),
    },
  });
}
